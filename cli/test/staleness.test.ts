// Staleness notice. Network + filesystem are isolated: each case writes a fake
// release cache under a temp XDG_CACHE_HOME and reads it back synchronously, so
// nothing here touches GitHub. CI sets $CI (which suppresses the check in real
// runs) — we clear it around the positive cases and assert it suppresses.

import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { staleness, refreshLatest } from "../src/staleness.ts";

const ENV_KEYS = ["CI", "SPECLINE_NO_UPDATE_CHECK", "XDG_CACHE_HOME", "HOME"] as const;

function withCache(tag: string | null, body: () => void): void {
  const dir = mkdtempSync(join(tmpdir(), "specline-stale-"));
  const original = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.XDG_CACHE_HOME = dir;
  delete process.env.CI;
  delete process.env.SPECLINE_NO_UPDATE_CHECK;
  try {
    mkdirSync(join(dir, "specline"), { recursive: true });
    writeFileSync(join(dir, "specline", "latest-release.json"), JSON.stringify({ checkedAt: Date.now(), tag }));
    body();
  } finally {
    restore(original);
    rmSync(dir, { recursive: true, force: true });
  }
}

function restore(original: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
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

function isolated(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), "specline-refresh-"));
  const original = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  delete process.env.CI;
  delete process.env.SPECLINE_NO_UPDATE_CHECK;
  process.env.XDG_CACHE_HOME = dir;
  t.after(() => {
    restore(original);
    rmSync(dir, { recursive: true, force: true });
  });
  mkdirSync(join(dir, "specline"));
  return join(dir, "specline/latest-release.json");
}

test("a malformed cache is not trusted — it is replaced", async (t) => {
  const path = isolated(t);
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ tag_name: "v9.0.0" })));
  for (const data of ["{", "null", "[]", "{}", '"v9.0.0"',
    JSON.stringify({ checkedAt: Date.now(), tag: 42 }),
    JSON.stringify({ checkedAt: Date.now(), tag: "not-a-version" }),
    JSON.stringify({ checkedAt: Date.now() + 86_400_000, tag: "v9.0.0" }), // a clock from the future
    JSON.stringify({ checkedAt: "today", tag: "v9.0.0" })]) {
    writeFileSync(path, data);
    assert.equal(staleness("3.0.0"), null, data);
    await refreshLatest();
    assert.equal(staleness("3.0.0")?.latest, "9.0.0", data);
  }
  const calls = fetchMock.mock.callCount();
  await refreshLatest();
  assert.equal(fetchMock.mock.callCount(), calls, "a fresh, valid cache skips the network");
});

test("refresh caches a failing endpoint, keeps the old cache on a transport failure, survives unwritable storage", async (t) => {
  const path = isolated(t);
  let response = async (): Promise<Response> => new Response(JSON.stringify({ tag_name: "v9.0.0" }));
  t.mock.method(globalThis, "fetch", () => response());
  await refreshLatest();
  assert.equal(staleness("3.0.0")?.latest, "9.0.0");

  const stale = JSON.stringify({ checkedAt: 0, tag: "v8.0.0" });
  // No releases (404), rate-limited (429), broken (500): all cache "no tag", so a
  // throttled user asks once a day instead of once per invocation.
  for (const status of [404, 429, 500]) {
    writeFileSync(path, stale);
    response = async () => new Response("", { status });
    await refreshLatest();
    assert.equal(JSON.parse(readFileSync(path, "utf8")).tag, null, String(status));
  }
  // A transport failure or an unusable body says nothing about the release — keep
  // whatever we last knew.
  for (const failure of [
    async () => { throw new Error("offline"); },
    async () => new Response("broken json"),
    async () => new Response(JSON.stringify({ tag_name: 42 })),
    async () => new Response(JSON.stringify({ tag_name: "not-a-version" })),
  ]) {
    writeFileSync(path, stale);
    response = failure;
    await refreshLatest();
    assert.equal(readFileSync(path, "utf8"), stale);
  }

  rmSync(path);
  mkdirSync(path); // the cache file's own path is now a directory
  response = async () => new Response(JSON.stringify({ tag_name: "v9.0.0" }));
  await assert.doesNotReject(refreshLatest());
});

test("refresh times out on a hanging request and on a hanging body", { timeout: 10_000 }, async (t) => {
  const path = isolated(t);
  let signal: AbortSignal | null | undefined;
  let body = false;
  t.mock.method(globalThis, "fetch", async (_url: unknown, options?: RequestInit) => {
    signal = options?.signal;
    if (!body) return new Promise<Response>(() => {}); // never answers
    return { ok: true, status: 200, json: () => new Promise(() => {}) } as Response; // answers, never finishes
  });
  await refreshLatest();
  assert.equal(signal?.aborted, true);
  assert.equal(existsSync(path), false);
  body = true;
  await refreshLatest();
  assert.equal(signal?.aborted, true);
  assert.equal(existsSync(path), false);
});

test("a relative XDG_CACHE_HOME is ignored, never resolved against the cwd", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "specline-xdg-"));
  const original = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  const cwd = process.cwd();
  t.after(() => {
    process.chdir(cwd);
    restore(original);
    rmSync(dir, { recursive: true, force: true });
  });
  delete process.env.CI;
  delete process.env.SPECLINE_NO_UPDATE_CHECK;
  process.env.HOME = join(dir, "home");
  process.env.XDG_CACHE_HOME = "cache"; // relative: invalid, so ignored
  const entry = JSON.stringify({ checkedAt: Date.now(), tag: "v9.0.0" });
  for (const base of [join(dir, "cache"), join(dir, "home", ".cache")]) {
    mkdirSync(join(base, "specline"), { recursive: true });
  }
  writeFileSync(join(dir, "cache", "specline", "latest-release.json"), entry);
  process.chdir(dir);
  assert.equal(staleness("3.0.0"), null, "the cwd-relative cache must not be read");
  writeFileSync(join(dir, "home", ".cache", "specline", "latest-release.json"), entry);
  assert.equal(staleness("3.0.0")?.latest, "9.0.0", "the default cache location is the fallback");
});
