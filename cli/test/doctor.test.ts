// Acceptance tests, fixture-based. Mirrors the partitioned acceptance checks in
// docs/specs/0001-doctor/spec.md. Run: node --test test/*.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { run, evaluate, exitCodeFor } from "../src/engine/run.ts";
import { loadRepo } from "../src/engine/model.ts";
import { REGISTRY, REGISTRY_BY_ID } from "../src/engine/rules.ts";
import { validate, type JsonSchema } from "../src/engine/schema.ts";

const reportSchema: JsonSchema = JSON.parse(
  readFileSync(fileURLToPath(new URL("../schema/report.schema.json", import.meta.url)), "utf8"),
);

const fx = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const changedAll = ["docs/specs/widget/spec.md", "docs/specs/widget/relations.md"];
const gate = (name: string, changed: string[] = []) =>
  run(fx(name), { mode: "gate", changed, now: "2026-06-14" });

function ruleIds(r: ReturnType<typeof gate>): string[] {
  return r.findings.map((f) => f.rule_id);
}
function errorIds(r: ReturnType<typeof gate>): string[] {
  return r.findings.filter((f) => f.severity === "error").map((f) => f.rule_id);
}

test("clean fixture: zero errors, exit 0", () => {
  const r = gate("clean");
  assert.equal(r.summary.errors, 0, JSON.stringify(r.findings, null, 2));
  assert.equal(exitCodeFor(r), 0);
});

test("repo's own docs validate with zero errors", () => {
  const r = run(fileURLToPath(new URL("..", import.meta.url)), { mode: "gate", changed: [], now: "2026-06-14" });
  assert.equal(r.summary.errors, 0, JSON.stringify(r.findings, null, 2));
});

// one malformed fixture per rule_id — expected rule fires, exit non-zero, no surprises
test("clean-0012 (the real worked example, docs-rooted): zero errors", () => {
  const r = gate("clean-0012");
  assert.equal(r.summary.errors, 0, JSON.stringify(r.findings, null, 2));
});

const repoScoped: [string, string][] = [
  ["dup-slug", "SLUG-DUPLICATE"],
  ["dangling-link", "LINK-DANGLING"],
  ["knowledge-status", "KNOWLEDGE-HAS-STATUS"],
  ["relation-dangling", "RELATION-DANGLING"],
];
for (const [name, rule] of repoScoped) {
  test(`${name} -> ${rule} (repo-scoped, errors without --changed)`, () => {
    const r = gate(name);
    assert.ok(errorIds(r).includes(rule), `expected ${rule}, got ${JSON.stringify(ruleIds(r))}`);
    assert.equal(exitCodeFor(r), 1);
  });
}

// Spec-scoped INTEGRITY errors (Layer 1) still error and quarantine to --changed.
const specScoped: [string, string][] = [
  ["slug-mismatch", "FRONTMATTER-SLUG-MISMATCH"],
  ["missing-spec", "STRUCT-MISSING-SPEC"],
];
for (const [name, rule] of specScoped) {
  test(`${name} -> ${rule} (spec-scoped integrity, errors only with --changed)`, () => {
    const r = gate(name, changedAll);
    assert.ok(errorIds(r).includes(rule), `expected ${rule}, got ${JSON.stringify(ruleIds(r))}`);
    assert.equal(exitCodeFor(r), 1);
  });
}

// Completeness gaps (Layer 2) surface as warnings and never block, with or without --changed.
test("missing-relations: STRUCT-MISSING-RELATIONS is advisory (warning, exit 0)", () => {
  const r = gate("missing-relations", changedAll);
  const f = r.findings.find((x) => x.rule_id === "STRUCT-MISSING-RELATIONS");
  assert.ok(f, `expected STRUCT-MISSING-RELATIONS, got ${JSON.stringify(ruleIds(r))}`);
  assert.equal(f!.severity, "warning");
  assert.equal(exitCodeFor(r), 0);
});

// spec.md is constitutive (integrity): blocks the spec it touches, quarantines elsewhere.
test("missing-spec: STRUCT-MISSING-SPEC blocks only when that spec is in --changed", () => {
  assert.equal(exitCodeFor(gate("missing-spec")), 0, "untouched empty spec folder quarantines to a warning");
  assert.equal(exitCodeFor(gate("missing-spec", changedAll)), 1, "touching it makes the missing spec.md block");
});

test("relation-cross-repo: repo: edge is a warning, exit 0", () => {
  const r = gate("relation-cross-repo");
  assert.ok(r.findings.some((f) => f.rule_id === "RELATION-CROSS-REPO" && f.severity === "warning"));
  assert.equal(r.summary.errors, 0);
});

test("relation-killed: edge to a killed id is a warning, exit 0", () => {
  const r = gate("relation-killed");
  assert.ok(r.findings.some((f) => f.rule_id === "RELATION-KILLED" && f.severity === "warning"));
  assert.equal(r.summary.errors, 0);
});

test("corrections-malformed: a bad ## Corrections entry warns; a well-formed one does not", () => {
  const r = gate("corrections-malformed");
  const hits = r.findings.filter((f) => f.rule_id === "CORRECTIONS-MALFORMED");
  assert.equal(hits.length, 1, `expected exactly one CORRECTIONS-MALFORMED, got ${JSON.stringify(ruleIds(r))}`);
  assert.equal(hits[0]!.severity, "warning");
  assert.equal(r.summary.errors, 0);
  assert.equal(exitCodeFor(r), 0);
});

test("archive-edited: a MODIFIED archived spec errors; an ADDED one (graduation) passes", () => {
  const run1 = (opts: { changed?: string[]; modified?: string[] }) =>
    run(fx("archive-edited"), { mode: "gate", changed: opts.changed ?? [], modified: opts.modified ?? [], now: "2026-06-15" });
  const has = (r: ReturnType<typeof run1>) => r.findings.some((f) => f.rule_id === "ARCHIVE-EDITED" && f.severity === "error");

  // modifying an archived spec → error (the audit trail is immutable)
  const mod = run1({ changed: ["docs/archive/old/spec.md"], modified: ["docs/archive/old/spec.md"] });
  assert.ok(has(mod));
  assert.equal(exitCodeFor(mod), 1);

  // adding an archived spec (graduation) → changed but NOT modified → passes
  const add = run1({ changed: ["docs/archive/old/spec.md"], modified: [] });
  assert.ok(!has(add), "graduation (add) must not trip ARCHIVE-EDITED");
  assert.equal(add.summary.errors, 0);

  // the generated archive/README.md is not the audit trail, even if modified
  assert.ok(!has(run1({ modified: ["docs/archive/README.md"] })), "archive/README.md must not trip ARCHIVE-EDITED");
});

test("every --format json report validates against the published schema", () => {
  const names = ["clean", "clean-0012", "dup-slug", "slug-mismatch", "dangling-link",
    "relation-dangling", "version-skew", "archive-edited", "canon-pin-skew", "missing-spec"];
  for (const name of names) {
    const errs = validate(reportSchema, gate(name, changedAll));
    assert.deepEqual(errs, [], `${name}: ${errs.join("; ")}`);
  }
});

test("quarantine: spec-scoped violation warns without --changed (exit 0), errors with it", () => {
  const without = gate("slug-mismatch");
  assert.equal(without.summary.errors, 0);
  assert.ok(without.findings.some((f) => f.rule_id === "FRONTMATTER-SLUG-MISMATCH" && f.severity === "warning"));
  assert.equal(exitCodeFor(without), 0);

  const withChanged = gate("slug-mismatch", changedAll);
  assert.ok(withChanged.findings.some((f) => f.rule_id === "FRONTMATTER-SLUG-MISMATCH" && f.severity === "error"));
  assert.equal(exitCodeFor(withChanged), 1);
});

test("completeness gaps never block: same warning in gate and author mode, exit 0", () => {
  // canon 2.6: a missing required element is advisory, not a gate. Author mode no
  // longer downgrades anything (distance_to_ratifiable is retired) because nothing
  // about completeness errors in the first place.
  const author = run(fx("missing-relations"), { mode: "author", changed: changedAll, now: "2026-06-14" });
  const fa = author.findings.find((x) => x.rule_id === "STRUCT-MISSING-RELATIONS");
  assert.ok(fa, "expected the missing-relations finding");
  assert.equal(fa!.severity, "warning");
  assert.equal(exitCodeFor(author), 0);

  const g = gate("missing-relations", changedAll);
  const fg = g.findings.find((x) => x.rule_id === "STRUCT-MISSING-RELATIONS");
  assert.equal(fg!.severity, "warning");
  assert.equal(exitCodeFor(g), 0);
});

test("version skew: unknown key + unknown section warn (exit 0)", () => {
  const r = gate("version-skew");
  assert.equal(r.summary.errors, 0);
  assert.ok(ruleIds(r).includes("UNKNOWN-FRONTMATTER-KEY"));
  assert.ok(ruleIds(r).includes("UNKNOWN-SECTION"));
  assert.equal(exitCodeFor(r), 0);
});

test("canon-pin-skew: a repo pinning an older canon warns (CANON-PIN-MISMATCH), exit 0", () => {
  const r = gate("canon-pin-skew");
  const f = r.findings.find((x) => x.rule_id === "CANON-PIN-MISMATCH");
  assert.ok(f, `expected CANON-PIN-MISMATCH, got ${JSON.stringify(ruleIds(r))}`);
  assert.equal(f!.severity, "warning");
  assert.equal(f!.file, "specline.yml");
  assert.equal(r.summary.errors, 0);
  assert.equal(exitCodeFor(r), 0);
});

test("canon pin matching the served canon does not warn", () => {
  assert.ok(!ruleIds(gate("clean")).includes("CANON-PIN-MISMATCH"), "no pin → no finding");
  assert.ok(!ruleIds(gate("lifecycle-gaps")).includes("CANON-PIN-MISMATCH"), "current pin → no finding");
});

test("determinism: two evaluations of the same model are byte-identical", () => {
  const repo = loadRepo(fx("dup-slug"));
  const a = JSON.stringify(evaluate(repo, { mode: "gate", changed: [], now: "2026-06-14" }));
  const b = JSON.stringify(evaluate(repo, { mode: "gate", changed: [], now: "2026-06-14" }));
  assert.equal(a, b);
});

test("catalog completeness: every emitted rule_id exists in the registry", () => {
  const names = ["clean", "slug-mismatch", "missing-relations", "building-no-ratified",
    "dup-slug", "dangling-link", "knowledge-status", "version-skew", "canon-pin-skew", "missing-spec"];
  for (const name of names) {
    for (const f of gate(name, changedAll).findings) {
      assert.ok(REGISTRY_BY_ID.has(f.rule_id), `finding rule_id ${f.rule_id} absent from registry`);
    }
  }
});

test("every finding carries a non-empty fix_hint", () => {
  for (const f of gate("dangling-link").findings) {
    assert.ok(f.fix_hint && f.fix_hint.length > 0, `${f.rule_id} missing fix_hint`);
  }
  assert.ok(REGISTRY.length > 0);
});
