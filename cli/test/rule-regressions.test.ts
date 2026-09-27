// Boundary coverage for rules the fixture suite exercises only in the middle of
// their range: enum membership, the loop-budget shape, and the three thresholds
// (slicing, decider focus, coupling) that must fire above the limit and never at it.

import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { evaluate, run, type RunOptions } from "../src/engine/run.ts";
import { loadRepo } from "../src/engine/model.ts";

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "specline-rules-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path: string, content: string): void => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  };
  const spec = (fields = "", body = "## Goal\nObservable outcome\n", slug = "widget"): void => {
    put(`docs/specs/${slug}/spec.md`, `---\nslug: ${slug}\ntype: feature\nstatus: draft\n${fields}---\n${body}`);
    put(`docs/specs/${slug}/relations.md`, "depends_on: []\n");
  };
  spec();
  const check = (changed = ["docs/specs/widget/spec.md"]) => run(root, { mode: "gate", changed, now: "2026-06-14" });
  return { root, put, spec, check };
}
const matching = (report: ReturnType<typeof run>, id: string) => report.findings.filter((f) => f.rule_id === id);
const options: RunOptions = { mode: "gate", changed: [], now: null };

test("enums reject unknown values and accept every member", (t) => {
  const f = fixture(t);
  const enums = { type: "feature", blast_radius: "low", size: "small", target_model: "standard" };
  for (const [key, good] of Object.entries(enums)) {
    f.put("docs/specs/widget/spec.md", `---\nslug: widget\n${key}: nonsense\n---\n`);
    const found = matching(f.check(), "ENUM-INVALID");
    assert.equal(found.length, 1, key);
    assert.equal(found[0]!.severity, "error");
    assert.equal(found[0]!.line, 3);
    f.put("docs/specs/widget/spec.md", `---\nslug: widget\n${key}: ${good}\n---\n`);
    assert.equal(matching(f.check(), "ENUM-INVALID").length, 0, key);
  }
});

test("loop_budget accepts positive integers only", (t) => {
  const f = fixture(t);
  for (const value of ["0", "-1", "1.5", "01.5", "two"]) {
    f.spec(`loop_budget: ${value}\n`);
    assert.equal(matching(f.check(), "LOOP-BUDGET-INVALID").length, 1, value);
  }
  for (const value of ["1", "12"]) {
    f.spec(`loop_budget: ${value}\n`);
    assert.equal(matching(f.check(), "LOOP-BUDGET-INVALID").length, 0, value);
  }
});

test("scope and focus limits fire above their threshold, never at it", (t) => {
  const f = fixture(t);
  f.spec("", "## Behavior\n- first\n- second\n");
  let repo = loadRepo(f.root);
  repo.config.suggestSlicingPast = 2;
  assert.equal(matching(evaluate(repo, options), "SCOPE-EXCEEDS-SIZE").length, 0);
  repo.config.suggestSlicingPast = 1;
  assert.equal(matching(evaluate(repo, options), "SCOPE-EXCEEDS-SIZE").length, 1);
  f.spec("size: large\n", "## Behavior\n- first\n- second\n"); // declared atomic — respected
  repo = loadRepo(f.root);
  repo.config.suggestSlicingPast = 1;
  assert.equal(matching(evaluate(repo, options), "SCOPE-EXCEEDS-SIZE").length, 0);

  f.put("docs/specs/widget/spec.md", "---\nslug: widget\nstatus: building\ndecider: owner\n---\n");
  repo = loadRepo(f.root, { tierOverride: 2 });
  repo.config.focusLimitBuilding = 1;
  repo.config.focusLimitActive = 1;
  assert.equal(matching(evaluate(repo, options), "DECIDER-OVER-BUDGET").length, 0);
  repo.config.focusLimitBuilding = 0;
  repo.config.focusLimitActive = 0;
  assert.equal(matching(evaluate(repo, options), "DECIDER-OVER-BUDGET").length, 2);
});

test("an open question is overdue strictly after its deadline", (t) => {
  const f = fixture(t);
  f.put("docs/specs/widget/spec.md", "---\nslug: widget\nstatus: building\n---\n");
  for (const date of ["2026-06-13", "2026-06-14", "2026-06-15"]) {
    f.put("docs/specs/widget/open-questions.md", `## Decision\ndecider: owner\ndefault: keep\ndeadline: ${date}\n`);
    assert.equal(matching(f.check(), "OPEN-QUESTION-INCOMPLETE").length, 0, date);
    assert.equal(matching(f.check(), "OPEN-QUESTION-OVERDUE").length, date < "2026-06-14" ? 1 : 0, date);
  }
  f.put("docs/specs/widget/open-questions.md", "## Decision\ndefault: keep\n");
  assert.equal(matching(f.check(), "OPEN-QUESTION-INCOMPLETE").length, 1);
});

test("coupling sums transitively, dedupes cycles, and fires only over the ceiling", (t) => {
  const f = fixture(t);
  f.spec("", "## Goal\nB\n", "child");
  f.put("docs/specs/widget/relations.md", "depends_on: [child, child]\n");
  f.put("docs/specs/child/relations.md", "part_of: widget\n");
  const repo = loadRepo(f.root, { tierOverride: 2 });
  const total = repo.specs.reduce((sum, s) => sum + s.specContent!.length + s.relationsContent!.length, 0);
  repo.config.couplingCeilingPct = 100;
  repo.config.contextWindowChars = total;
  assert.equal(matching(evaluate(repo, options), "COUPLING-CEILING").length, 0);
  repo.config.contextWindowChars = total - 1;
  const findings = matching(evaluate(repo, options), "COUPLING-CEILING");
  assert.equal(findings.length, 2);
  assert.ok(findings.every((finding) => finding.message.includes(`~${total} chars`)));
});
