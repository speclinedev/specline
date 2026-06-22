// Staleness notice. Network + filesystem are isolated: each case writes a fake
// release cache under a temp XDG_CACHE_HOME and reads it back synchronously, so
// nothing here touches GitHub. CI sets $CI (which suppresses the check in real
// runs) — we clear it around the positive cases and assert it suppresses.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { staleness } from "../src/staleness.ts";

function withCache(tag: string | null, body: () => void): void {
  const dir = mkdtempSync(join(tmpdir(), "specline-stale-"));
  const ci = process.env.CI;
  const suppress = process.env.SPECLINE_NO_UPDATE_CHECK;
  process.env.XDG_CACHE_HOME = dir;
  delete process.env.CI;
  delete process.env.SPECLINE_NO_UPDATE_CHECK;
  try {
    mkdirSync(join(dir, "specline"), { recursive: true });
    writeFileSync(join(dir, "specline", "latest-release.json"), JSON.stringify({ checkedAt: Date.now(), tag }));
    body();
  } finally {
    if (ci !== undefined) process.env.CI = ci;
    if (suppress !== undefined) process.env.SPECLINE_NO_UPDATE_CHECK = suppress;
    delete process.env.XDG_CACHE_HOME;
    rmSync(dir, { recursive: true, force: true });
  }
}

test("staleness: a newer release marks the bundle behind", () => {
  withCache("v2.6.0", () => assert.equal(staleness("2.5.0-draft")?.latest, "2.6.0"));
});

test("staleness: same canon number is current, draft or not (no stable demotion)", () => {
  withCache("v2.5.0", () => assert.equal(staleness("2.5.0-draft"), null));
});

test("staleness: an equal prerelease is not behind", () => {
  withCache("v2.5.0-draft", () => assert.equal(staleness("2.5.0-draft"), null));
});

test("staleness: an older release is not behind", () => {
  withCache("v2.4.0", () => assert.equal(staleness("2.5.0-draft"), null));
});

test("staleness: no releases yet (cached null tag) yields no notice", () => {
  withCache(null, () => assert.equal(staleness("2.5.0-draft"), null));
});

test("staleness: suppressed when $CI is set", () => {
  withCache("v9.0.0", () => {
    process.env.CI = "1";
    assert.equal(staleness("2.5.0-draft"), null);
  });
});

test("staleness: suppressed via SPECLINE_NO_UPDATE_CHECK", () => {
  withCache("v9.0.0", () => {
    process.env.SPECLINE_NO_UPDATE_CHECK = "1";
    assert.equal(staleness("2.5.0-draft"), null);
  });
});
