// The one switch (canon 3.1): `unattended: true` in specline.yml puts Part 3 in
// force, and nothing else does. Fixtures: lifecycle-gaps/ (no switch — a spec with
// gaps that are all Part-3 concerns, plus a shipped archive with no acceptance
// link) and governance/ (a v3.0 repo still carrying `tier: 2`, which maps onto the
// switch for one MINOR). Run: node --test test/*.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { run, exitCodeFor } from "../src/engine/run.ts";
import { REGISTRY } from "../src/engine/rules.ts";
import { fx, unattendedOn, withMutatedFixture } from "./support.ts";

const ids = (r: ReturnType<typeof run>) => new Set(r.findings.map((f) => f.rule_id));
const check = (root: string) => run(root, { changed: [], modified: [], now: "2026-06-16" });

const PART3 = REGISTRY.filter((r) => r.part === 3).map((r) => r.rule_id);

test("every rule belongs to exactly one part, and the census matches the canon", () => {
  const census = { 1: 0, 2: 0, 3: 0 } as Record<number, number>;
  for (const r of REGISTRY) {
    assert.ok([1, 2, 3].includes(r.part), `${r.rule_id} has no part`);
    census[r.part]!++;
    assert.ok(!("tier" in r), `${r.rule_id} still carries a tier`);
    assert.ok(!("downgradable" in r), `${r.rule_id} still carries downgradable`);
  }
  assert.deepEqual(census, { 1: 9, 2: 12, 3: 12 });
  assert.equal(new Set(REGISTRY.map((r) => r.rule_id)).size, REGISTRY.length, "no duplicate rule_id");
  // Part 3 is advisory in full: nothing experimental may block a merge.
  for (const r of REGISTRY.filter((x) => x.part === 3)) assert.equal(r.severity, "warning", r.rule_id);
});

test("switch off (the default): Part-2 advisories fire, every Part-3 rule is silent", () => {
  const r = check(fx("lifecycle-gaps"));
  assert.equal(r.unattended, false);
  assert.ok(ids(r).has("OPEN-QUESTION-INCOMPLETE"), `expected the Part-2 advisory, got ${JSON.stringify([...ids(r)])}`);
  for (const id of PART3) assert.ok(!ids(r).has(id), `Part-3 rule ${id} must not fire with the switch off`);
  assert.equal(exitCodeFor(r), 0, JSON.stringify(r.summary));
});

test("switch off: advisory gaps never block", () => {
  const r = check(fx("lifecycle-gaps"));
  const f = r.findings.find((x) => x.rule_id === "OPEN-QUESTION-INCOMPLETE");
  assert.equal(f!.severity, "warning");
  assert.equal(exitCodeFor(r), 0);
});

test("the switch, not the fixture, decides which rules fire on one repo", () => {
  // `governance` declares `tier: 2`, so the legacy mapping already turns it on.
  const on = check(fx("governance"));
  assert.ok(on.unattended, "tier: 2 maps onto unattended for one MINOR");
  assert.ok(ids(on).has("DECIDER-OVER-BUDGET"));

  // Strip the switch and the identical tree reports only Parts 1–2.
  withMutatedFixture("governance", (yml) => yml.replace(/^tier:.*\n/m, ""), (dir) => {
    const r = check(dir);
    assert.equal(r.unattended, false, "no tier, no unattended → switch off");
    for (const id of PART3) assert.ok(!ids(r).has(id), `${id} must not fire with the switch off`);
  });
});

test("`unattended: true` is the switch; `tier: 2` is only its legacy spelling", () => {
  for (const [label, mutate] of [
    ["explicit unattended", unattendedOn],
    ["legacy tier: 2", (yml: string) => yml],
    ["quoted unattended", (yml: string) => `${yml.replace(/^tier:.*\n/m, "")}unattended: "true"\n`],
  ] as const) {
    withMutatedFixture("governance", mutate, (dir) => {
      const r = check(dir);
      assert.equal(r.unattended, true, label);
      for (const id of ["DECIDER-OVER-BUDGET", "STALE-QUARANTINE", "COUPLING-CEILING"]) {
        assert.ok(ids(r).has(id), `${label}: expected ${id}, got ${JSON.stringify([...ids(r)])}`);
      }
    });
  }
});

test("an explicit `unattended: false` wins over a legacy `tier: 2`", () => {
  withMutatedFixture("governance", (yml) => `${yml}unattended: false\n`, (dir) => {
    const r = check(dir);
    assert.equal(r.unattended, false);
    for (const id of PART3) assert.ok(!ids(r).has(id), `${id} must not fire`);
  });
});

test("`tier: 0|1` and a nonsense tier are accepted silently and gate nothing", () => {
  for (const tier of ["0", "1", "3", "banana"]) {
    withMutatedFixture("governance", (yml) => yml.replace(/^tier:.*$/m, `tier: ${tier}`), (dir) => {
      const r = check(dir);
      assert.equal(r.unattended, false, `tier: ${tier}`);
      assert.ok(!ids(r).has("ENUM-INVALID"), `tier: ${tier} must not produce a finding`);
    });
  }
});
