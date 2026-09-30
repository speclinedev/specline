// Acceptance tests for 0002-specline-init (the scaffolder). Mirrors its spec.
import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init, sync, upgrade } from "../src/init/scaffold.ts";
import { isGenerated } from "../src/init/content.ts";
import { run, exitCodeFor } from "../src/engine/run.ts";
import { loadCanon } from "../src/canon.ts";
import { CANON, CANON_MM } from "../src/version.ts";

/** Every file the scaffold produced, repo-relative. */
function walk(root: string, prefix = ""): string[] {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(root, join(prefix, e.name)) : [join(prefix, e.name)]);
}

const fresh = (t: TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), "specline-init-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const base = { decider: "jonathan", check: false } as const;

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
  for (const f of ["docs/drafts/README.md", "docs/specs/README.md", "docs/knowledge/README.md", "docs/archive/README.md", "docs/conventions/README.md", ".github/workflows/specline.yml"]) {
    assert.ok(isGenerated(readFileSync(join(t, f), "utf8")), `${f} should be generated`);
  }
  for (const f of ["specline.yml", "docs/conventions/doc-architecture.md", "docs/architecture.md"]) {
    assert.ok(!isGenerated(readFileSync(join(t, f), "utf8")), `${f} should be a scaffold starter`);
  }
  // the scaffolded config is the pin doctor reads — track the bundled canon version
  // dynamically so it can never drift from the canon on a version bump.
  // The pin tracks MAJOR.MINOR: that is the grain CANON-PIN-MISMATCH compares at, so
  // a canon patch must not churn every consuming repo's config.
  const yml = readFileSync(join(t, "specline.yml"), "utf8");
  assert.match(yml, new RegExp(`^canon: ${CANON_MM.replace(/\./g, "\\.")}$`, "m"));
  assert.equal(CANON_MM, loadCanon().version.split(".").slice(0, 2).join("."));
  // the switch is scaffolded commented out: off by default, and discoverable
  assert.match(yml, /^# unattended: false {3}# experimental — see Part 3 of the canon$/m);
});

test("the scaffold carries no tier anywhere — the concept is gone", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: true });
  const offenders: string[] = [];
  for (const rel of walk(t)) {
    const text = readFileSync(join(t, rel), "utf8");
    for (const [i, line] of text.split("\n").entries()) {
      // `\b` so "frontier" (a capability name under `models:`) is not a false hit
      if (!/\btier/i.test(line)) continue;
      // the one legitimate survivor: `models:` maps a *capability* tier to a real model
      if (rel === "specline.yml" && line.includes("capability tier")) continue;
      offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("init scaffolds the four-key spec template, one acceptance list, and every folder", (context) => {
  const t = fresh(context);
  init(t, { ...base, githubAction: false });
  const tpl = readFileSync(join(t, "docs/conventions/spec-template.md"), "utf8");
  const fm = tpl.split("---")[1]!;
  assert.deepEqual(fm.split("\n").filter((l) => l.trim() !== "").map((l) => l.split(":")[0]!.trim()),
    ["slug", "type", "decider", "created"], "exactly the four Part-1 keys — no status (canon 3.1: state is location)");
  for (const key of ["status", "blast_radius", "size", "target_model", "stale_after", "loop_budget", "build"]) {
    assert.ok(!new RegExp(`^${key}:`, "m").test(fm), `${key} must not be scaffolded`);
  }
  assert.match(tpl, /^## Acceptance checks$/m);
  // the `### human` marker ships commented out: optional, and discoverable
  assert.ok(/<!--[\s\S]*### human\n[\s\S]*-->/.test(tpl), "### human is offered, not imposed");
  assert.ok(!/### (agent-loopable|judgeable|human-gate)/.test(tpl), "no Part-3 altitudes in the template");
  for (const dir of ["drafts", "specs", "knowledge", "archive", "conventions", "decisions", "strategy", "technical"]) {
    assert.ok(existsSync(join(t, "docs", dir, "README.md")), `docs/${dir}/README.md`);
  }
  // ...and the scaffolded repo still validates clean
  assert.equal(run(t, { changed: [], now: "2026-06-15" }).summary.errors, 0);
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
  assert.match(readFileSync(yml, "utf8"), new RegExp(`^canon: ${CANON_MM.replace(/\./g, "\\.")}$`, "m"));
  assert.match(readFileSync(arch, "utf8"), new RegExp(`Specline ${CANON_MM.replace(/\./g, "\\.")}`));
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

test("upgrade migrates a v3.0 config: tier: 2 becomes the switch, tier: 0|1 is dropped", (context) => {
  for (const [tier, expect] of [["2", true], ["1", false], ["0", false]] as const) {
    const root = fresh(context);
    init(root, { ...base, githubAction: false });
    const yml = join(root, "specline.yml");
    const arch = join(root, "docs/conventions/doc-architecture.md");
    // age the repo back to a v3.0 scaffold: an older pin, a tier, and the Tier row
    writeFileSync(yml, readFileSync(yml, "utf8")
      .replace(/^canon:.*$/m, "canon: 3.0.0")
      .replace(/^# unattended.*$/m, `tier: ${tier}    # governance tier`));
    writeFileSync(arch, readFileSync(arch, "utf8")
      .replace(/^(\| \*\*Decider\*\*.*)$/m, `| **Tier** | **${tier} — the loop.** |\n$1`));
    assert.ok(readFileSync(arch, "utf8").includes("**Tier**"));
    assert.equal(upgrade(root, { check: true }).clean, false, `tier ${tier}: stale before`);
    assert.match(readFileSync(yml, "utf8"), /^tier:/m, "check mode must not rewrite");

    assert.equal(upgrade(root, { check: false }).wrote, true);
    const after = readFileSync(yml, "utf8");
    assert.ok(!/^tier:/m.test(after), `tier ${tier}: the key is gone`);
    assert.equal(/^unattended: true/m.test(after), expect, `tier ${tier} -> unattended ${expect}`);
    if (expect) assert.match(after, /^unattended: true {4}# governance tier$/m, "the inline comment survives");
    assert.match(after, new RegExp(`^canon: ${CANON_MM.replace(/\./g, "\\.")}$`, "m"));
    assert.ok(!readFileSync(arch, "utf8").includes("**Tier**"), "the Tier row is removed");
    assert.equal(run(root, { changed: [], now: null }).unattended, expect);

    assert.equal(upgrade(root, { check: true }).clean, true, `tier ${tier}: clean after`);
    assert.equal(hasPinMismatch(root), false);
  }
});

test("upgrade moves a `status: draft` spec and a `ratified` one back to drafts/; `building` and no-status stay", (context) => {
  const root = fresh(context);
  init(root, { ...base, githubAction: false });
  const spec = (slug: string, fields: string) =>
    writeFileSync(join(root, "docs", "specs", slug, "spec.md"),
      `---\nslug: ${slug}\ntype: feature\n${fields}decider: jonathan\ncreated: 2026-06-01\n---\n\n## Goal\nx\n`, { flag: "wx" });
  for (const [slug, fields] of [
    ["shaping", "status: draft\n"],
    ["gate-state", "status: ratified\n"],
    ["under-way", "status: building\n"],
    ["untagged", ""],
  ] as const) {
    mkdirSync(join(root, "docs", "specs", slug), { recursive: true });
    spec(slug, fields);
    writeFileSync(join(root, "docs", "specs", slug, "relations.md"), "depends_on: []\n");
  }

  const dry = upgrade(root, { check: true });
  assert.equal(dry.clean, false, "two pending moves");
  const moved = dry.outcomes.filter((o) => o.action === "move").map((o) => o.rel).sort();
  assert.deepEqual(moved, [
    "docs/specs/gate-state -> docs/drafts/gate-state",
    "docs/specs/shaping -> docs/drafts/shaping",
  ]);
  assert.ok(existsSync(join(root, "docs/specs/shaping")), "--check must not write");
  assert.ok(!existsSync(join(root, "docs/drafts/shaping")), "--check must not write");

  const res = upgrade(root, { check: false });
  assert.equal(res.wrote, true);
  for (const slug of ["shaping", "gate-state"]) {
    assert.ok(!existsSync(join(root, "docs/specs", slug)), `${slug} left specs/`);
    assert.ok(existsSync(join(root, "docs/drafts", slug, "spec.md")), `${slug} landed in drafts/`);
    assert.ok(existsSync(join(root, "docs/drafts", slug, "relations.md")), `${slug}'s relations.md moved with it`);
    // the frontmatter status line itself is never stripped — churn buys nothing
    assert.match(readFileSync(join(root, "docs/drafts", slug, "spec.md"), "utf8"), /^status: (draft|ratified)$/m);
  }
  for (const slug of ["under-way", "untagged"]) {
    assert.ok(existsSync(join(root, "docs/specs", slug, "spec.md")), `${slug} must stay in specs/`);
  }
  assert.ok(existsSync(join(root, "docs/drafts/README.md")), "the new drafts/ folder gets its README in the same pass");

  assert.equal(upgrade(root, { check: true }).clean, true, "no more pending moves");
  assert.equal(run(root, { changed: [], now: "2026-06-15" }).summary.errors, 0);
});

test("repeated init preserves authored starters", (context) => {
  const root = fresh(context);
  init(root, { ...base, githubAction: true });
  const authored = "# Authored system architecture\n";
  writeFileSync(join(root, "docs/architecture.md"), authored);
  writeFileSync(join(root, "docs/conventions/spec-template.md"), "# my own template\n");
  init(root, { ...base, githubAction: true, decider: "someone else" });
  assert.equal(readFileSync(join(root, "docs/architecture.md"), "utf8"), authored);
  assert.equal(readFileSync(join(root, "docs/conventions/spec-template.md"), "utf8"), "# my own template\n");
  assert.match(readFileSync(join(root, "specline.yml"), "utf8"), /jonathan/);
  const report = run(root, { changed: [], now: null });
  assert.equal(report.unattended, false, "a scaffolded repo is attended by default");
  assert.equal(report.summary.errors, 0);
});

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
    assert.equal(readFileSync(path, "utf8"), original.replace(`${quote}2.4.0${quote}`, `${quote}${CANON_MM}${quote}`));
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
  assert.match(readFileSync(yml, "utf8"), new RegExp(`^canon: ${CANON_MM.replace(/\./g, "\\.")}$`, "m"));
  assert.equal(upgrade(t, { check: true }).clean, true, "and the repair converges");
});

test("init rejects an unusable decider", (context) => {
  const t = fresh(context);
  for (const opts of [{ decider: "" }, { decider: "   " }]) {
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
