// Acceptance tests for 0002-specline-init (the scaffolder). Mirrors its spec.
import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init, sync, upgrade } from "../src/init/scaffold.ts";
import { isGenerated } from "../src/init/content.ts";
import { run, exitCodeFor } from "../src/engine/run.ts";
import { loadCanon } from "../src/canon.ts";
import { CANON, CANON_MM } from "../src/version.ts";

const fresh = (t: TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), "specline-init-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const base = { tier: 1, decider: "jonathan", check: false } as const;

test("init produces a repo doctor validates with zero errors", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: true });
  const r = run(t, { changed: [], now: "2026-06-15" });
  assert.equal(r.summary.errors, 0, JSON.stringify(r.findings, null, 2));
  assert.equal(exitCodeFor(r), 0);
});

test("generated files carry the header; scaffold starters do not", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: true });
  for (const f of ["docs/specs/README.md", "docs/knowledge/README.md", "docs/archive/README.md", "docs/conventions/README.md", ".github/workflows/specline.yml"]) {
    assert.ok(isGenerated(readFileSync(join(t, f), "utf8")), `${f} should be generated`);
  }
  for (const f of ["specline.yml", "docs/conventions/doc-architecture.md", "docs/architecture.md"]) {
    assert.ok(!isGenerated(readFileSync(join(t, f), "utf8")), `${f} should be a scaffold starter`);
  }
  // the scaffolded config is the pin doctor reads — track the bundled canon version
  // dynamically so it can never drift from the canon on a version bump.
  const canonVer = loadCanon().version.replace(/\./g, "\\.");
  assert.match(readFileSync(join(t, "specline.yml"), "utf8"), new RegExp(`^canon: ${canonVer}$`, "m"));
  assert.match(readFileSync(join(t, "specline.yml"), "utf8"), /^tier: 1$/m);
});

test("scaffolded workflow pins the moving MAJOR.MINOR Action tag, not the exact patch", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: true });
  const wf = readFileSync(join(t, ".github/workflows/specline.yml"), "utf8");
  const mm = CANON_MM.replace(/\./g, "\\.");
  // consuming repos track the moving @vMAJOR.MINOR tag so a canon patch never breaks their CI
  assert.match(wf, new RegExp(`uses: speclinedev/specline/cli@v${mm}$`, "m"));
  if (CANON !== CANON_MM) assert.ok(!wf.includes(`cli@v${CANON}`), "must not pin the exact patch version");
});

test("sync is deterministic and idempotent across repos", (context) => {
  const a = fresh(context);
  const b = fresh(context);
  init(a, { ...base, githubAction: true });
  init(b, { ...base, githubAction: true });
  const read = (root: string) => readFileSync(join(root, "docs/knowledge/README.md"), "utf8");
  assert.equal(read(a), read(b)); // same canon → identical bytes
  const before = read(a);
  sync(a, { check: false });
  assert.equal(read(a), before); // re-sync is a no-op
});

test("sync never touches authored content", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: false });
  const authored = "# custom doc-architecture\nby hand\n";
  writeFileSync(join(t, "docs/conventions/doc-architecture.md"), authored);
  writeFileSync(join(t, "docs/knowledge/README.md"), "# my notes (authored, no header)\n");
  sync(t, { check: false });
  assert.equal(readFileSync(join(t, "docs/conventions/doc-architecture.md"), "utf8"), authored);
  assert.equal(readFileSync(join(t, "docs/knowledge/README.md"), "utf8"), "# my notes (authored, no header)\n");
});

test("--check writes nothing and flags a missing/stale repo", (context) => {
  const t = fresh(context);
  const dry = init(t, { ...base, githubAction: false, check: true });
  assert.equal(dry.clean, false);
  assert.equal(dry.wrote, false);
  assert.ok(!existsSync(join(t, "docs")), "check mode must not write");
  init(t, { ...base, githubAction: false });
  assert.equal(init(t, { ...base, githubAction: false, check: true }).clean, true);
});

const hasPinMismatch = (root: string) =>
  run(root, { changed: [], now: "2026-06-15" }).findings.some((f) => f.rule_id === "CANON-PIN-MISMATCH");

test("upgrade on a current repo is a no-op", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: false });
  const res = upgrade(t, { check: false });
  assert.equal(res.wrote, false);
  assert.equal(res.clean, true);
});

test("upgrade rewrites a stale pin in both files and clears CANON-PIN-MISMATCH", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: false });
  const yml = join(t, "specline.yml");
  const arch = join(t, "docs/conventions/doc-architecture.md");
  // age the repo back to an older canon
  writeFileSync(yml, readFileSync(yml, "utf8").replace(/^canon:.*$/m, "canon: 2.4.0"));
  writeFileSync(arch, readFileSync(arch, "utf8").replace(/Specline [\d.]+/, "Specline 2.4.0"));
  assert.ok(hasPinMismatch(t), "stale pin should trip CANON-PIN-MISMATCH");

  const res = upgrade(t, { check: false });
  assert.equal(res.wrote, true);
  assert.match(readFileSync(yml, "utf8"), new RegExp(`^canon: ${CANON.replace(/\./g, "\\.")}$`, "m"));
  assert.match(readFileSync(arch, "utf8"), new RegExp(`Specline ${CANON.replace(/\./g, "\\.")}`));
  assert.ok(!hasPinMismatch(t), "after upgrade the pin should match the served canon");
});

test("upgrade --check flags a stale pin without writing", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: false });
  const yml = join(t, "specline.yml");
  writeFileSync(yml, readFileSync(yml, "utf8").replace(/^canon:.*$/m, "canon: 2.4.0"));
  const dry = upgrade(t, { check: true });
  assert.equal(dry.clean, false);
  assert.equal(dry.wrote, false);
  assert.match(readFileSync(yml, "utf8"), /^canon: 2\.4\.0$/m, "check mode must not rewrite the pin");
});

test("github-action flag controls workflow generation", (context) => {
  const a = fresh(context);
  init(a, { ...base, githubAction: true });
  assert.ok(existsSync(join(a, ".github/workflows/specline.yml")));
  const b = fresh(context);
  init(b, { ...base, githubAction: false });
  assert.ok(!existsSync(join(b, ".github/workflows/specline.yml")));
});

for (const tier of [0, 1, 2]) {
  test(`init tier ${tier} validates and preserves authored starters on repeated init`, (context) => {
    const root = fresh(context);
    init(root, { ...base, tier, githubAction: true });
    const authored = "# Authored system architecture\n";
    writeFileSync(join(root, "docs/architecture.md"), authored);
    init(root, { ...base, tier, githubAction: true, decider: "someone else" });
    assert.equal(readFileSync(join(root, "docs/architecture.md"), "utf8"), authored);
    assert.match(readFileSync(join(root, "specline.yml"), "utf8"), /jonathan/);
    const report = run(root, { changed: [], now: null });
    // canon 3.1 removed tiers; while `init --tier` still exists the scaffolded
    // `tier: 2` maps onto the unattended switch, and nothing else about tier does
    // anything. The flag itself goes in the scaffolder rewrite.
    assert.equal(report.unattended, tier === 2);
    assert.equal(report.summary.errors, 0);
    assert.equal(existsSync(join(root, "docs/knowledge")), true);
    assert.equal(existsSync(join(root, "docs/decisions")), tier === 2);
  });
}

test("sync check detects aged generated content without writing, then sync repairs every artifact", (context) => {
  const root = fresh(context);
  const initial = init(root, { ...base, githubAction: true });
  const expected = new Map(initial.outcomes.map(({ rel }) => [rel, readFileSync(join(root, rel), "utf8")]));
  for (const [rel, content] of expected) {
    if (isGenerated(content)) writeFileSync(join(root, rel), content + "\nstale generated content\n");
  }
  const dry = sync(root, { check: true });
  assert.equal(dry.clean, false);
  assert.equal(dry.wrote, false);
  for (const [rel, content] of expected) {
    assert.equal(readFileSync(join(root, rel), "utf8"), isGenerated(content) ? content + "\nstale generated content\n" : content);
  }
  assert.equal(sync(root, { check: false }).wrote, true);
  for (const [rel, content] of expected) assert.equal(readFileSync(join(root, rel), "utf8"), content, rel);
  assert.equal(sync(root, { check: true }).clean, true);
});

test("generated CI runs on configuration-only changes", (context) => {
  const root = fresh(context);
  init(root, { ...base, githubAction: true });
  assert.match(readFileSync(join(root, ".github/workflows/specline.yml"), "utf8"), /paths: \["docs\/\*\*", "specline.yml"\]/);
});

test("upgrade preserves quoted pin style and comments, including dry runs", (context) => {
  for (const quote of ['"', "'"]) {
    const root = fresh(context);
    init(root, { ...base, githubAction: false });
    const path = join(root, "specline.yml");
    const original = readFileSync(path, "utf8").replace(/^canon:.*$/m, `canon: ${quote}2.4.0${quote} # deliberate pin`);
    writeFileSync(path, original);
    assert.equal(upgrade(root, { check: true }).clean, false);
    assert.equal(readFileSync(path, "utf8"), original);
    upgrade(root, { check: false });
    assert.equal(readFileSync(path, "utf8"), original.replace(`${quote}2.4.0${quote}`, `${quote}${CANON}${quote}`));
    assert.equal(hasPinMismatch(root), false);
  }
});

test("upgrade adds a canon pin that is missing entirely", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: false });
  const yml = join(t, "specline.yml");
  const withoutPin = readFileSync(yml, "utf8").replace(/^canon:.*\n/m, "");
  writeFileSync(yml, withoutPin);
  assert.equal(upgrade(t, { check: true }).clean, false, "no pin at all is not up to date");
  assert.equal(readFileSync(yml, "utf8"), withoutPin, "check mode must not write");
  assert.equal(upgrade(t, { check: false }).wrote, true);
  assert.match(readFileSync(yml, "utf8"), new RegExp(`^canon: ${CANON.replace(/\./g, "\\.")}$`, "m"));
  assert.equal(upgrade(t, { check: true }).clean, true, "and the repair converges");
});

test("init rejects an unusable tier or decider", (context) => {
  const t = fresh(context);
  for (const opts of [{ tier: 3 }, { tier: -1 }, { decider: "" }, { decider: "   " }]) {
    assert.throws(() => init(t, { ...base, githubAction: false, ...opts }), { name: "InputError" }, JSON.stringify(opts));
  }
});

test("sync and upgrade reject missing targets and malformed configuration", (context) => {
  const root = fresh(context);
  assert.throws(() => sync(root, { check: true }), /no docs/);
  assert.throws(() => upgrade(root, { check: true }), /no docs/);
  init(root, { ...base, githubAction: false });
  for (const invalid of ["scalar", "[array]", "canon: 2.0\ncanon: 3.0", "canon: []"]) {
    writeFileSync(join(root, "specline.yml"), invalid);
    assert.throws(() => upgrade(root, { check: true }), { name: "InputError" });
  }
});
