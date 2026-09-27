// canon 3.1: `docs/drafts/` is the fourth lifecycle folder — "state is location."
// Drafts are checked lightly: only parse-level integrity runs there (frontmatter
// parses, slug matches the folder, links and edges resolve, the slug is not already
// taken). No advisory rule fires, and no Part-3 rule fires even when `unattended` is
// on — incomplete is what a draft is for.

import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { run } from "../src/engine/run.ts";

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "specline-drafts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path: string, content: string): void => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  };
  const unattended = (on: boolean): void => put("specline.yml", `unattended: ${on}\n`);
  const check = () => run(root, { changed: [], now: "2026-06-14" });
  return { root, put, unattended, check };
}
const matching = (report: ReturnType<typeof run>, id: string) => report.findings.filter((f) => f.rule_id === id);
const ids = (report: ReturnType<typeof run>) => new Set(report.findings.map((f) => f.rule_id));

test("a draft may be just a discovery.md — no spec.md, no findings at all", (t) => {
  const f = fixture(t);
  f.put("docs/drafts/idea/discovery.md", "# Idea\nSome early notes.\n");
  const r = f.check();
  assert.equal(r.summary.errors, 0, JSON.stringify(r.findings, null, 2));
  assert.equal(r.findings.length, 0, JSON.stringify(r.findings, null, 2));
});

test("drafts/: FRONTMATTER-UNPARSEABLE and FRONTMATTER-SLUG-MISMATCH fire", (t) => {
  const f = fixture(t);
  f.put("docs/drafts/bad-fm/spec.md", "no frontmatter here\n");
  assert.ok(ids(f.check()).has("FRONTMATTER-UNPARSEABLE"));

  const g = fixture(t);
  g.put("docs/drafts/idea/spec.md", "---\nslug: not-idea\ntype: feature\n---\n");
  assert.ok(ids(g.check()).has("FRONTMATTER-SLUG-MISMATCH"));
});

test("drafts/: ENUM-INVALID fires for `type`, and for the Part-3 envelope only when unattended is on", (t) => {
  const f = fixture(t);
  f.put("docs/drafts/idea/spec.md", "---\nslug: idea\ntype: nonsense\n---\n");
  assert.equal(matching(f.check(), "ENUM-INVALID").length, 1, "type is checked off");

  f.put("docs/drafts/idea/spec.md", "---\nslug: idea\ntype: feature\nblast_radius: nonsense\n---\n");
  assert.deepEqual(matching(f.check(), "ENUM-INVALID"), [], "envelope not checked with the switch off");
  f.unattended(true);
  assert.equal(matching(f.check(), "ENUM-INVALID").length, 1, "envelope checked in drafts/ once unattended is on");
});

test("drafts/: RELATION-DANGLING and RELATION-UNPARSEABLE fire; RELATION-CROSS-REPO and RELATION-KILLED do not", (t) => {
  const f = fixture(t);
  f.put("docs/drafts/idea/spec.md", "---\nslug: idea\ntype: feature\n---\n");
  f.put("docs/drafts/idea/relations.md", "depends_on: nowhere\n");
  assert.ok(ids(f.check()).has("RELATION-DANGLING"));

  const g = fixture(t);
  g.put("docs/drafts/idea/spec.md", "---\nslug: idea\ntype: feature\n---\n");
  g.put("docs/drafts/idea/relations.md", "depends_on: [this is not valid yaml: : :\n");
  assert.ok(ids(g.check()).has("RELATION-UNPARSEABLE"));

  const h = fixture(t);
  h.put("docs/drafts/idea/spec.md", "---\nslug: idea\ntype: feature\n---\n");
  h.put("docs/drafts/idea/relations.md", "depends_on: repo:other-repo:slug\n");
  assert.deepEqual(matching(h.check(), "RELATION-CROSS-REPO"), [], "drafts are checked lightly — no RELATION-CROSS-REPO");

  const k = fixture(t);
  k.put("docs/archive/dead/spec.md", "---\nslug: dead\ntype: feature\nstatus: killed\n---\n");
  k.put("docs/drafts/idea/spec.md", "---\nslug: idea\ntype: feature\n---\n");
  k.put("docs/drafts/idea/relations.md", "depends_on: dead\n");
  assert.deepEqual(matching(k.check(), "RELATION-KILLED"), [], "drafts are checked lightly — no RELATION-KILLED");
});

test("drafts/: LINK-DANGLING resolves like any other doc under docs/", (t) => {
  const f = fixture(t);
  f.put("docs/drafts/idea/discovery.md", "See [context](missing.md).\n");
  assert.ok(ids(f.check()).has("LINK-DANGLING"));
});

// Every advisory (and every Part-3) rule that would fire on this exact content in
// specs/ must not fire on the identical content in drafts/.
test("no advisory rule fires in drafts/, though the identical content fires it in specs/", (t) => {
  const f = fixture(t);
  const spec = [
    "---",
    "slug: idea",
    "type: parent",
    "bogus_key: x",
    "---",
    "# Idea",
    "",
    "## Nonsense Section",
    "not a known heading",
  ].join("\n");
  f.put("docs/drafts/idea/spec.md", spec);
  f.put("docs/drafts/idea/open-questions.md", "## Q\ndecider:\n"); // incomplete, if it were checked
  const draft = f.check();
  for (const rule of [
    "STRUCT-MISSING-SPEC", "STRUCT-MISSING-RELATIONS", "GOAL-MISSING",
    "UNKNOWN-FRONTMATTER-KEY", "UNKNOWN-SECTION",
    "PARENT-HAS-MECHANICS", "PARENT-NO-SCOPES",
    "OPEN-QUESTION-INCOMPLETE", "OPEN-QUESTION-OVERDUE",
  ]) {
    assert.deepEqual(matching(draft, rule), [], `${rule} must not fire in drafts/`);
  }

  const g = fixture(t);
  g.put("docs/specs/idea/spec.md", spec);
  g.put("docs/specs/idea/open-questions.md", "## Q\ndecider:\n");
  const specReport = g.check();
  assert.ok(matching(specReport, "UNKNOWN-FRONTMATTER-KEY").length > 0, "sanity: the same content DOES warn in specs/");
  assert.ok(matching(specReport, "UNKNOWN-SECTION").length > 0, "sanity: the same content DOES warn in specs/");
  assert.ok(matching(specReport, "STRUCT-MISSING-RELATIONS").length > 0, "sanity: the same content DOES warn in specs/");
  assert.ok(matching(specReport, "OPEN-QUESTION-INCOMPLETE").length > 0, "sanity: the same content DOES warn in specs/");
});

test("no Part-3 rule fires in drafts/ even with `unattended: true` and Part-3 content present", (t) => {
  const f = fixture(t);
  f.unattended(true);
  f.put("docs/drafts/idea/spec.md", "---\nslug: idea\ntype: feature\nbuild: unattended\n---\n## Goal\nx\n\n## Acceptance checks\n- a check\n");
  f.put("docs/drafts/idea/status.md", "## State\nbuilding\n"); // missing required sections, if checked
  const r = f.check();
  for (const rule of [
    "UNATTENDED-INCOMPLETE", "STATUS-SCHEMA", "CORRECTIONS-MALFORMED", "LOOP-BUDGET-INVALID",
    "JUDGEABLE-NO-SECTION", "CHECK-RUN-MALFORMED", "SCOPE-EXCEEDS-SIZE", "ACCEPTANCE-UNPARTITIONED",
    "ARCHIVE-NO-ACCEPTANCE", "STALE-QUARANTINE", "DECIDER-OVER-BUDGET", "COUPLING-CEILING",
  ]) {
    assert.deepEqual(matching(r, rule), [], `${rule} must not fire in drafts/, even with unattended: true`);
  }
});

test("SLUG-DUPLICATE: drafts/ vs specs/ collide; a draft reusing a graduated slug collides too", (t) => {
  const f = fixture(t);
  f.put("docs/drafts/widget/spec.md", "---\nslug: widget\ntype: feature\n---\n");
  f.put("docs/specs/widget/spec.md", "---\nslug: widget\ntype: feature\n---\n");
  const r = f.check();
  const hits = matching(r, "SLUG-DUPLICATE");
  assert.equal(hits.length, 1, JSON.stringify(r.findings, null, 2));
  assert.equal(hits[0]!.file, "docs/specs/widget/spec.md");

  const g = fixture(t);
  g.put("docs/knowledge/shipped/overview.md", "# Shipped\n");
  g.put("docs/archive/shipped/spec.md", "---\nslug: shipped\ntype: feature\nstatus: shipped\n---\n");
  g.put("docs/drafts/shipped/spec.md", "---\nslug: shipped\ntype: feature\n---\n");
  const hits2 = matching(g.check(), "SLUG-DUPLICATE");
  assert.equal(hits2.length, 1, "a draft reusing an already-graduated slug is a collision");
  assert.equal(hits2[0]!.file, "docs/drafts/shipped/spec.md");
});

test("SLUG-DUPLICATE never fires for the knowledge/ + archive/ graduation pair on its own", (t) => {
  const f = fixture(t);
  f.put("docs/knowledge/shipped/overview.md", "# Shipped\n");
  f.put("docs/archive/shipped/spec.md", "---\nslug: shipped\ntype: feature\nstatus: shipped\n---\n");
  assert.deepEqual(matching(f.check(), "SLUG-DUPLICATE"), []);
});
