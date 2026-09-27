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
    put(`docs/specs/${slug}/spec.md`, `---\nslug: ${slug}\ntype: feature\n${fields}---\n${body}`);
    put(`docs/specs/${slug}/relations.md`, "depends_on: []\n");
  };
  /** The status.md `## State` token — canon 3.1's only source of build state. */
  const setState = (token: string, slug = "widget"): void =>
    put(`docs/specs/${slug}/status.md`, `## State\n${token}\n## Done\n## In progress\n## Last green checkpoint\nnone — pre-green\n## Dead ends\n## Corrections\n`);
  spec();
  /** Flip the repo's one switch. Part-3 rules do not run without it. */
  const unattended = (on: boolean): void => put("specline.yml", `unattended: ${on}\n`);
  const check = (changed = ["docs/specs/widget/spec.md"]) => run(root, { changed, now: "2026-06-14" });
  return { root, put, spec, setState, unattended, check };
}
const matching = (report: ReturnType<typeof run>, id: string) => report.findings.filter((f) => f.rule_id === id);
const options: RunOptions = { changed: [], now: null };

test("enums reject unknown values and accept every member", (t) => {
  const f = fixture(t);
  f.unattended(true); // the envelope enums are only checked with Part 3 in force
  const enums = {
    type: "feature", build: "unattended",
    blast_radius: "low", size: "small", target_model: "standard",
  };
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

// canon 3.1: "state is location." `status` carries no meaning in drafts/ or specs/ —
// any value, valid-looking or not, is recognised silently and never checked there.
// It survives only in archive/, where location alone can't distinguish shipped from
// killed.
test("status is ignored entirely in specs/, whatever the switch, and checked only in archive/", (t) => {
  const f = fixture(t);
  for (const on of [false, true]) {
    f.unattended(on);
    for (const status of ["draft", "building", "ratified", "nonsense", "shipped", "killed"]) {
      f.put("docs/specs/widget/spec.md", `---\nslug: widget\ntype: feature\nstatus: ${status}\n---\n`);
      assert.deepEqual(matching(f.check(), "ENUM-INVALID"), [], `status: ${status} (switch ${on})`);
      assert.deepEqual(matching(f.check(), "UNKNOWN-FRONTMATTER-KEY"), [], `status: ${status} (switch ${on})`);
    }
  }

  const archiveStatus = (status: string) => f.put("docs/archive/widget/spec.md", `---\nslug: widget\ntype: feature\nstatus: ${status}\n---\n`);
  for (const status of ["shipped", "killed", "ratified"]) {
    archiveStatus(status);
    assert.deepEqual(matching(f.check(), "ENUM-INVALID"), [], `archive status: ${status}`);
  }
  for (const status of ["draft", "building", "blocked", "nonsense"]) {
    archiveStatus(status);
    const found = matching(f.check(), "ENUM-INVALID");
    assert.equal(found.length, 1, `archive status: ${status}`);
    assert.match(found[0]!.message, /shipped\|killed$/);
  }
  // archive/ is the one place status is required: location alone can't tell shipped
  // from killed apart, so a missing status is itself a violation there.
  f.put("docs/archive/widget/spec.md", "---\nslug: widget\ntype: feature\n---\n");
  assert.equal(matching(f.check(), "ENUM-INVALID").length, 1, "archive status missing entirely");
});

test("a specs/ spec with no status line at all, or `status: draft`/`ratified`, is clean", (t) => {
  const f = fixture(t);
  for (const fields of ["", "status: draft\n", "status: ratified\n"]) {
    f.put("docs/specs/widget/spec.md", `---\nslug: widget\ntype: feature\ndecider: jonathan\ncreated: 2026-01-01\n${fields}---\n## Goal\nx\n`);
    const r = f.check();
    assert.equal(r.summary.errors, 0, `${JSON.stringify(fields)}: ${JSON.stringify(r.findings, null, 2)}`);
    assert.deepEqual(matching(r, "ENUM-INVALID"), []);
  }
});

// A v3.0 spec is a valid v3.1 spec: the envelope keys, `ratified` and `blocked` are
// recognised silently when the switch is off, so flipping it off cannot make a
// previously-clean repo start erroring.
test("the envelope is checked with the switch on and recognised silently with it off", (t) => {
  const f = fixture(t);
  const envelope = "build: nonsense\nblast_radius: nonsense\nsize: nonsense\ntarget_model: nonsense\nloop_budget: nonsense\n";
  f.put("docs/specs/widget/spec.md", `---\nslug: widget\ntype: feature\nstatus: draft\n${envelope}---\n`);

  f.unattended(false);
  assert.deepEqual(matching(f.check(), "ENUM-INVALID"), []);
  assert.deepEqual(matching(f.check(), "LOOP-BUDGET-INVALID"), []);
  assert.deepEqual(matching(f.check(), "UNKNOWN-FRONTMATTER-KEY"), [], "an envelope key is never unknown");

  f.unattended(true);
  assert.equal(matching(f.check(), "ENUM-INVALID").length, 4, "build, blast_radius, size, target_model");
  assert.equal(matching(f.check(), "LOOP-BUDGET-INVALID").length, 1);
});

// canon 3.1: build state (`building | blocked: <why> | ...`) lives only in
// status.md's `## State` token — never in frontmatter, so STALE-QUARANTINE reads it
// there, whatever the (now-ignored) frontmatter `status` says.
test("STALE-QUARANTINE and OPEN-QUESTION-INCOMPLETE fire off the status.md State token, not frontmatter status", (t) => {
  const f = fixture(t);
  f.unattended(true);
  const fm = "type: feature\ndecider: owner\nstale_after: 2026-01-01\n";
  f.put("docs/specs/widget/open-questions.md", "## Decision\ndecider: owner\n");
  for (const frontmatterStatus of ["ratified", "building", "draft", "nonsense"]) {
    f.put("docs/specs/widget/spec.md", `---\nslug: widget\nstatus: ${frontmatterStatus}\n${fm}---\n`);
    f.setState("building");
    assert.equal(matching(f.check(), "STALE-QUARANTINE").length, 1, `${frontmatterStatus}: stale`);
    assert.equal(matching(f.check(), "OPEN-QUESTION-INCOMPLETE").length, 1, `${frontmatterStatus}: no default`);
  }
  // no status.md at all — not building, not stale (UNATTENDED-INCOMPLETE covers the
  // missing file on its own); the open-question rule is unconditional regardless.
  f.put("docs/specs/widget/status.md", "");
  assert.deepEqual(matching(f.check(), "STALE-QUARANTINE"), [], "no State token is not-building");
  assert.equal(matching(f.check(), "OPEN-QUESTION-INCOMPLETE").length, 1, "unconditional in specs/");

  // ...and with no frontmatter `status` line at all — OPEN-QUESTION-INCOMPLETE never
  // read frontmatter status to begin with, but this nails down that it needs none.
  f.put("docs/specs/widget/spec.md", `---\nslug: widget\n${fm}---\n`);
  assert.equal(matching(f.check(), "OPEN-QUESTION-INCOMPLETE").length, 1, "fires with no status field present");
});

test("an empty `decider:` line counts as missing, not as present", (t) => {
  const f = fixture(t);
  f.put("docs/specs/widget/spec.md", "---\nslug: widget\nstatus: building\n---\n");
  // `decider:\s*\S` used to span the newline and match "default:" on the next line.
  f.put("docs/specs/widget/open-questions.md", "## Decision\ndecider:\ndefault: keep\ndeadline: 2026-12-01\n");
  assert.equal(matching(f.check(), "OPEN-QUESTION-INCOMPLETE").length, 1);
  f.put("docs/specs/widget/open-questions.md", "## Decision\ndecider: owner\ndefault:\ndeadline: 2026-12-01\n");
  assert.equal(matching(f.check(), "OPEN-QUESTION-INCOMPLETE").length, 1);
  f.put("docs/specs/widget/open-questions.md", "## Decision\ndecider: owner\ndefault: keep\ndeadline: 2026-12-01\n");
  assert.deepEqual(matching(f.check(), "OPEN-QUESTION-INCOMPLETE"), []);
});

// Part 3's envelope completeness, and the things that are NOT triggers: the
// absence of the `build` key, `build: attended`, and (canon 3.1) frontmatter
// `status` — stale_after is only required once status.md's `## State` token itself
// reads building or blocked.
test("UNATTENDED-INCOMPLETE reports the distance to unattended-ready", (t) => {
  const f = fixture(t);
  f.unattended(true);
  const spec = (fields: string) =>
    f.put("docs/specs/widget/spec.md", `---\nslug: widget\ntype: feature\n${fields}---\n## Goal\nDone.\n\n## Acceptance checks\n\n### agent-loopable\n- it works\n`);

  spec("build: unattended\n");
  assert.equal(matching(f.check(), "UNATTENDED-INCOMPLETE").length, 1);
  assert.match(matching(f.check(), "UNATTENDED-INCOMPLETE")[0]!.message, /blast_radius, loop_budget, status\.md/);

  // a status.md whose State is neither building nor blocked needs no stale_after
  f.setState("ready-for-review");
  spec("build: unattended\nblast_radius: low\nloop_budget: 5\n");
  assert.deepEqual(matching(f.check(), "UNATTENDED-INCOMPLETE"), [], "ready-for-review needs no stale_after");

  for (const token of ["building", "blocked: waiting on the decider"]) {
    f.setState(token);
    spec("build: unattended\nblast_radius: low\nloop_budget: 5\n");
    assert.match(matching(f.check(), "UNATTENDED-INCOMPLETE")[0]!.message, /stale_after/, token);
    spec("build: unattended\nblast_radius: low\nloop_budget: 5\nstale_after: 2027-01-01\n");
    assert.deepEqual(matching(f.check(), "UNATTENDED-INCOMPLETE"), [], token);
  }

  // absence of `build` never fires anything, and neither does an attended build
  for (const fields of ["", "build: attended\n"]) {
    spec(fields);
    assert.deepEqual(matching(f.check(), "UNATTENDED-INCOMPLETE"), [], fields);
  }
  // ...and with the switch off, none of it is checked
  spec("build: unattended\n");
  f.unattended(false);
  assert.deepEqual(matching(f.check(), "UNATTENDED-INCOMPLETE"), []);
});

test("ACCEPTANCE-UNPARTITIONED keys off `build: unattended`, not off a status", (t) => {
  const f = fixture(t);
  f.unattended(true);
  const spec = (fields: string, acceptance: string) =>
    f.put("docs/specs/widget/spec.md",
      `---\nslug: widget\ntype: feature\nstatus: draft\n${fields}---\n## Goal\nDone.\n\n## Acceptance checks\n${acceptance}`);

  spec("build: unattended\n", "- the thing happens\n");
  assert.equal(matching(f.check(), "ACCEPTANCE-UNPARTITIONED").length, 1);
  spec("build: unattended\n", "\n### agent-loopable\n- the thing happens\n");
  assert.deepEqual(matching(f.check(), "ACCEPTANCE-UNPARTITIONED"), []);
  // an attended spec is one plain list, which is Part 1's whole contract
  spec("", "- the thing happens\n");
  assert.deepEqual(matching(f.check(), "ACCEPTANCE-UNPARTITIONED"), []);
  // ...and with the switch off it never fires at all
  spec("build: unattended\n", "- the thing happens\n");
  f.unattended(false);
  assert.deepEqual(matching(f.check(), "ACCEPTANCE-UNPARTITIONED"), []);
});

// The three altitude headings and Part 1's `### human` are `###` sub-headings, which
// UNKNOWN-SECTION never looks at — so they are silent whichever way the switch is set.
test("acceptance sub-headings are recognised silently, both switch positions", (t) => {
  const f = fixture(t);
  for (const sub of ["### human", "### human-gate", "### agent-loopable", "### judgeable"]) {
    for (const on of [false, true]) {
      f.unattended(on);
      f.put("docs/specs/widget/spec.md",
        `---\nslug: widget\ntype: feature\nstatus: draft\n---\n## Goal\nDone.\n\n## Acceptance checks\n- a check\n\n${sub}\n- the empty state reads as calm (see §4)\n`);
      assert.deepEqual(matching(f.check(), "UNKNOWN-SECTION"), [], `${sub} (switch ${on})`);
    }
  }
});

// `main` compared specs ∪ archive only, so reusing a *graduated* slug slipped past.
test("SLUG-DUPLICATE spans knowledge/ and archive/; the graduation pair is legal", (t) => {
  const f = fixture(t);
  const landed = (dir: string) => {
    f.put(`docs/${dir}/widget/overview.md`, "# Widget\nShipped.\n");
    if (dir === "archive") f.put("docs/archive/widget/spec.md", "---\nslug: widget\ntype: feature\nstatus: shipped\n---\n");
  };

  landed("knowledge");
  assert.equal(matching(f.check(), "SLUG-DUPLICATE").length, 1, "a spec reusing a graduated slug collides");
  landed("archive");
  assert.equal(matching(f.check(), "SLUG-DUPLICATE").length, 1, "still one finding, on the in-flight spec");
  assert.equal(matching(f.check(), "SLUG-DUPLICATE")[0]!.file, "docs/specs/widget/spec.md");

  // the knowledge+archive pair on its own is the normal end state of graduation
  const g = fixture(t);
  g.put("docs/knowledge/graduated/overview.md", "# Graduated\n");
  g.put("docs/archive/graduated/spec.md", "---\nslug: graduated\ntype: feature\nstatus: shipped\n---\n");
  assert.deepEqual(matching(g.check(), "SLUG-DUPLICATE"), [], "one slug in knowledge/ AND archive/ is the shipped state");
});

test("STATUS-SCHEMA matches headings exactly, and is not checked with the switch off", (t) => {
  const f = fixture(t);
  const required = ["State", "Done", "In progress", "Last green checkpoint", "Dead ends", "Corrections"];
  f.put("docs/specs/widget/status.md", required.map((s) => `## ${s}\n`).join("\n"));
  f.unattended(true);
  assert.deepEqual(matching(f.check(), "STATUS-SCHEMA"), []);

  // a prefix match let "## Done thinking about it" satisfy "## Done"
  f.put("docs/specs/widget/status.md", required.map((s) => `## ${s === "Done" ? "Done thinking about it" : s}\n`).join("\n"));
  assert.equal(matching(f.check(), "STATUS-SCHEMA").length, 1);

  f.unattended(false);
  assert.deepEqual(matching(f.check(), "STATUS-SCHEMA"), [], "a status.md in specs/ is ignored entirely when off");
  // ...but KNOWLEDGE-HAS-STATUS is Part 2 and still fires
  f.put("docs/knowledge/shipped/status.md", "## State\nbuilding\n");
  assert.equal(matching(f.check(), "KNOWLEDGE-HAS-STATUS").length, 1);
});

test("loop_budget accepts positive integers only", (t) => {
  const f = fixture(t);
  f.unattended(true); // LOOP-BUDGET-INVALID is Part 3
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
  f.unattended(true); // SCOPE-EXCEEDS-SIZE and DECIDER-OVER-BUDGET are Part 3
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

  f.put("docs/specs/widget/spec.md", "---\nslug: widget\ndecider: owner\n---\n");
  f.setState("building"); // "building" is read from status.md, never frontmatter
  repo = loadRepo(f.root);
  repo.unattended = true; // DECIDER-OVER-BUDGET is Part 3
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
  const repo = loadRepo(f.root);
  repo.unattended = true; // COUPLING-CEILING is Part 3
  const total = repo.specs.reduce((sum, s) => sum + s.specContent!.length + s.relationsContent!.length, 0);
  repo.config.couplingCeilingPct = 100;
  repo.config.contextWindowChars = total;
  assert.equal(matching(evaluate(repo, options), "COUPLING-CEILING").length, 0);
  repo.config.contextWindowChars = total - 1;
  const findings = matching(evaluate(repo, options), "COUPLING-CEILING");
  assert.equal(findings.length, 2);
  assert.ok(findings.every((finding) => finding.message.includes(`~${total} chars`)));
});
