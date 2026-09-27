// Parsing boundaries: the YAML reader for frontmatter/relations.md and the
// markdown scanner for headings and links. The second half drives the engine over
// one minimal repo per reproduced parser defect — each case is an input that used
// to be read wrongly (a silent pass or a phantom finding).

import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseFlatYaml, parseFrontmatter, headings, links } from "../src/engine/parse.ts";
import { run } from "../src/engine/run.ts";

test("YAML keeps metadata as written: quotes, comments, colons, annotated edges, key lines", () => {
  const parsed = parseFlatYaml(
    ['canon: "3.0" # pin', "created: 2026-06-01", "decider: yes", "note: 'a: b # c'", "tagged: jonathan#1",
      "edges:", "  - widget: reads widget state, unchanged", "  - repo:sibling", "empty:", "inline: [a, b]"].join("\n"),
    2,
  );
  assert.equal(parsed.ok, true, parsed.error);
  assert.equal(parsed.data.canon, "3.0");
  assert.equal(parsed.data.created, "2026-06-01"); // a date is metadata, not a Date
  assert.equal(parsed.data.decider, "yes"); // ...and `yes` is a name, not a boolean
  assert.equal(parsed.data.note, "a: b # c");
  assert.equal(parsed.data.tagged, "jonathan#1");
  assert.deepEqual(parsed.data.edges, ["widget: reads widget state, unchanged", "repo:sibling"]);
  assert.deepEqual(parsed.data.empty, []); // `key:` reads as absent
  assert.deepEqual(parsed.data.inline, ["a", "b"]);
  assert.equal(parsed.lineOf.edges, 7);
});

test("YAML rejects duplicate keys, unbalanced quotes, tabs, non-mappings and nested values", () => {
  for (const text of [
    "status: draft\nstatus: shipped", // last-wins used to pass silently
    'decider: "jonathan', // an unbalanced quote used to read as a raw string
    "slug: widget\n\ttype: feature",
    "[a, b]",
    "decider:\n  name: jonathan",
  ]) {
    const parsed = parseFlatYaml(text);
    assert.equal(parsed.ok, false, text);
    assert.ok(parsed.error && !parsed.error.includes("\n"), `error should be one line: ${parsed.error}`);
  }
  assert.equal(parseFrontmatter("---\nslug: one\nslug: two\n---\n").ok, false);
  assert.equal(parseFrontmatter("---\n# a comment\nslug: widget\n---\n").data.slug, "widget");
  assert.equal(parseFrontmatter("slug: widget\n").present, false);
  assert.equal(parseFrontmatter("---\nslug: widget\n").ok, false);
});

test("headings are line-start ATX only, outside frontmatter and code", () => {
  const md = [
    "---", "slug: widget", "---", // 1-3: frontmatter is metadata, not body
    "## **Goal** ##", // 4: emphasis and the closing sequence are decoration
    "~~~", "## fenced", "~~~", // 5-7
    "> ## quoted", // 8: a blockquote is not a section
    "- item", "  ## nested", // 9-10: nor is a list item
    "<!--", "## commented", "-->", // 11-13
    "closing prose", "---", // 14-15: no setext headings
  ].join("\n");
  assert.deepEqual(headings(md), [{ level: 2, title: "Goal", line: 4 }]);
  assert.deepEqual(headings("```\n## unclosed fence swallows the rest\n"), []);
});

test("links skip code and comments, span wrapped link text, and include reference definitions", () => {
  const md = [
    "[inline](real.md)", // 1
    "`[span](code.md)`", // 2
    "~~~md", "[fenced](tilde.md)", "~~~", // 3-5
    "```", "[fenced](backtick.md)", "```", // 6-8
    "", "    [indented](code-block.md)", // 9-10
    "<!-- [one-line](comment.md) -->", // 11
    "<!--", "[multi-line](comment.md)", "-->", // 12-14
    "See [the", "thing](wrapped.md).", // 15-16
    "", "[ref]: defined.md", // 17-18
  ].join("\n");
  assert.deepEqual(links(md), [
    { target: "real.md", line: 1 },
    { target: "wrapped.md", line: 15 },
    { target: "defined.md", line: 18 },
  ]);
  // prose that merely looks like a definition is not one
  assert.deepEqual(links("[note]: fix this later\n"), []);
});

// ── the reproduced defects, end to end ──────────────────────────────────────

const FM = ["---", "slug: widget", "type: feature", "status: draft", "decider: jonathan",
  "blast_radius: medium", "created: 2026-06-01", "---", ""].join("\n");
const BODY = ["", "# Widget", "", "## Intent", "Do the thing.", "", "## Goal", "Thing done.", "",
  "## Behavior", "1. It does the thing.", "", "## Acceptance checks", "- (agent-loopable) the thing happens.", ""].join("\n");
const REL = "depends_on: none\npart_of: []\nsupersedes: []\nconflicts_with: []\n";

function repo(t: TestContext, spec: string, rel: string = REL, status: string | null = null, unattended = false): string {
  const root = mkdtempSync(join(tmpdir(), "specline-parsing-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "docs", "specs", "widget"), { recursive: true });
  writeFileSync(join(root, "docs", "specs", "widget", "spec.md"), spec);
  writeFileSync(join(root, "docs", "specs", "widget", "relations.md"), rel);
  if (status !== null) writeFileSync(join(root, "docs", "specs", "widget", "status.md"), status);
  if (unattended) writeFileSync(join(root, "specline.yml"), "unattended: true\n");
  return root;
}
const ruleIds = (root: string): string[] =>
  run(root, { mode: "gate", changed: [], now: "2026-09-27" }).findings.map((f) => f.rule_id);

const cases: [string, string, string[]][] = [
  ["a clean spec is silent", FM + BODY, []],
  ["duplicate frontmatter key", FM.replace("status: draft", "status: draft\nstatus: shipped") + BODY, ["FRONTMATTER-UNPARSEABLE"]],
  ["unbalanced quote", FM.replace("decider: jonathan", 'decider: "jonathan') + BODY, ["FRONTMATTER-UNPARSEABLE"]],
  ["tab indentation", "---\nslug: widget\n\ttype: feature\n---\n" + BODY, ["FRONTMATTER-UNPARSEABLE"]],
  ["nested map under a key", FM.replace("decider: jonathan", "decider:\n  name: jonathan") + BODY, ["FRONTMATTER-UNPARSEABLE"]],
  ["a bare key reads as absent, not as an empty enum", FM.replace("blast_radius: medium", "blast_radius:") + BODY, []],
  ["a comment line in frontmatter", FM.replace("slug: widget", "# a comment\nslug: widget") + BODY, []],
  ["a `#` inside a value is not a comment", FM.replace("decider: jonathan", "decider: jonathan#1") + BODY, []],
  ["a colon inside a quoted value", FM.replace("decider: jonathan", 'decider: "a: b"') + BODY, []],
  ["quoted values throughout", FM.replace(/: (\w[\w -]*)$/gm, ': "$1"') + BODY, []],
  ["CRLF line endings", (FM + BODY).replace(/\n/g, "\r\n"), []],
  ["a ~~~ fence hides its contents", FM + BODY + "\n~~~md\n## Fake heading\n[x](nope.md)\n~~~\n", []],
  ["an indented code block hides its contents", FM + BODY + "\nExample:\n\n    ## Fake heading\n    [x](nope.md)\n", []],
  ["an inline code span hides its contents", FM + BODY + "\nWrite `[label](nope.md)` to link.\n", []],
  ["an HTML comment hides its contents", FM + BODY + "\n<!--\n## Commented heading\n[x](nope.md)\n-->\n", []],
  ["an unclosed fence hides the rest", FM + BODY + "\n```\n## Fake heading\n[x](nope.md)\n", []],
  ["an ATX closing sequence is not part of the title", FM + BODY.replace("## Goal", "## Goal ##"), []],
  ["a paragraph over --- is not a heading", FM + BODY + "\nClosing prose\n---\n\nMore prose.\n", []],
  ["a heading inside a list item is not a section", FM + BODY + "\n- item\n  ## Nested heading\n", []],
  ["a fenced fake heading is not a section", FM + BODY + "\n```md\n## Fake heading\n```\n", []],
  ["link text wrapped across lines still resolves", FM + BODY + "\nSee [the\nthing](nope.md).\n", ["LINK-DANGLING"]],
  ["a reference definition is checked", FM + BODY + "\nSee [x][ref].\n\n[ref]: missing.md\n", ["LINK-DANGLING"]],
];

for (const [name, spec, expected] of cases) {
  test(`parser: ${name}`, (t) => {
    assert.deepEqual(ruleIds(repo(t, spec)), expected);
  });
}

test("a malformed relations.md stays silent (no edges, no finding)", (t) => {
  // v3.1: RELATION-UNPARSEABLE lands here.
  assert.deepEqual(ruleIds(repo(t, FM + BODY, "This spec has no upstream dependencies.\n" + REL)), []);
});

test("a `## ` heading inside a blockquote does not satisfy status.md's schema", (t) => {
  const status = ["State", "Done", "In progress", "Last green checkpoint", "Dead ends", "Corrections"]
    .map((s) => `## ${s}\n`).join("\n");
  // status.md is Part 3, so the schema is only checked with the switch on.
  assert.deepEqual(ruleIds(repo(t, FM + BODY, REL, status, true)), []);
  assert.deepEqual(ruleIds(repo(t, FM + BODY, REL, status.replace("## Dead ends", "> ## Dead ends"), true)), ["STATUS-SCHEMA"]);
});
