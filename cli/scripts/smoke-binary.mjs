import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

const binary = resolve(process.argv[2]);

// Read straight from the SOURCE canon file (repo root, one level above cli/) rather
// than the embedded bundle, so a green smoke proves the compiled binary serves the
// same canon as the source of truth — independent of the sync-canon bundle-integrity
// check.
const sourceDir = fileURLToPath(new URL("../../", import.meta.url));
const canonFiles = readdirSync(sourceDir).filter((f) => /^specline-.*\.md$/.test(f));
assert.equal(canonFiles.length, 1, `expected exactly one specline-*.md in ${sourceDir}, found ${canonFiles.length}`);
const sourceCanonText = readFileSync(join(sourceDir, canonFiles[0]), "utf8");

const root = mkdtempSync(join(tmpdir(), "specline-binary-"));
const run = (args, status = 0) => {
  const result = spawnSync(binary, args, { encoding: "utf8", timeout: 10000, env: { ...process.env, SPECLINE_NO_UPDATE_CHECK: "1" } });
  assert.equal(result.status, status, result.stderr || result.stdout);
  return result.stdout;
};
try {
  assert.equal(run(["spec"]), sourceCanonText.endsWith("\n") ? sourceCanonText : `${sourceCanonText}\n`);
  assert.match(run(["rules"]), /STRUCT-MISSING-SPEC/);
  mkdirSync(join(root, "docs"));
  const report = JSON.parse(run(["check", root, "--format", "json"]));
  assert.equal(report.summary.errors, 0);
  mkdirSync(join(root, "docs/specs/broken"), { recursive: true });
  const invalid = JSON.parse(run(["check", root, "--format", "json", "--changed", "docs/specs/broken/spec.md"], 1));
  assert.ok(invalid.findings.some((finding) => finding.rule_id === "STRUCT-MISSING-SPEC"));
  run(["init", root, "--tier", "1", "--yes", "--no-github-action", "--check"], 1);
  assert.deepEqual(readdirSync(root), ["docs"]);
  assert.deepEqual(readdirSync(join(root, "docs")), ["specs"]);
  assert.deepEqual(readdirSync(join(root, "docs/specs/broken")), []);
  console.log("Compiled canon (vs. source), validation, and init dry run passed.");
} finally {
  rmSync(root, { recursive: true, force: true });
}
