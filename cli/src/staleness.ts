// Staleness notice. The canon is pinned into the binary (see canon.ts) for
// offline, deterministic gating — but a pinned artifact silently rots as canon
// moves on. This module compares the bundled canon version against the latest
// tagged release of the source repo and reports when the binary is behind.
//
// It is advisory only: it NEVER blocks, throws, or changes what gets served.
// Distribution is by git ref (the composite Action is pinned `@vX.Y`), so the
// latest release tag — not npm, not a mirror — is the authoritative "what canon
// exists" signal. The network call is cached on disk and time-boxed; any
// failure (offline, rate-limited, no releases yet) degrades to "no notice".

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

const REPO = process.env.SPECLINE_REPO ?? "speclinedev/specline";
const TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 1500;

export interface Staleness {
  /** the bundled canon version, e.g. "2.6.0". */
  current: string;
  /** the latest released canon version, e.g. "2.6.0". */
  latest: string;
  /** true when the bundle is behind the latest release. */
  behind: boolean;
}

interface CacheEntry {
  checkedAt: number;
  /** latest release tag, or null when the repo has no releases yet. */
  tag: string | null;
}

/** Honour the update check unless explicitly suppressed or running in CI, where
 *  the network call is pure noise/latency on a gate that already pins its ref. */
export function checkSuppressed(): boolean {
  return process.env.SPECLINE_NO_UPDATE_CHECK === "1" || process.env.CI !== undefined;
}

function cachePath(): string {
  const base = process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache");
  return join(base, "specline", "latest-release.json");
}

function readCache(): CacheEntry | null {
  try {
    return JSON.parse(readFileSync(cachePath(), "utf8")) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    const path = cachePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(entry));
  } catch {
    // A non-writable cache dir just means we re-fetch next time — not an error.
  }
}

/** Parse "v2.6.0" / "2.6.0-draft" into its numeric MAJOR.MINOR.PATCH. The "-draft"
 *  suffix is ignored: the current canon — draft and all — is the release, so we
 *  don't demote it against a hypothetical "stable" of the same number. */
function parse(version: string): number[] | null {
  const m = version.trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);
  return m === null ? null : [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** True when `latest` is a strictly higher canon number than `current`. */
function isNewer(current: string, latest: string): boolean {
  const c = parse(current);
  const l = parse(latest);
  if (c === null || l === null) return false;
  for (let i = 0; i < 3; i++) {
    if (l[i]! > c[i]!) return true;
    if (l[i]! < c[i]!) return false;
  }
  return false;
}

/** Refresh the cached latest-release tag if the cache is missing or stale.
 *  Fire-and-forget safe: resolves to void and never rejects. */
export async function refreshLatest(): Promise<void> {
  if (checkSuppressed()) return;
  const cached = readCache();
  if (cached !== null && Date.now() - cached.checkedAt < TTL_MS) return;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "specline-cli" },
      signal: ctl.signal,
    });
    clearTimeout(timer);
    // 404 = no releases yet; cache that as "no tag" so we don't refetch for a day.
    const tag = res.ok ? String(((await res.json()) as { tag_name?: string }).tag_name ?? "") || null : null;
    writeCache({ checkedAt: Date.now(), tag });
  } catch {
    // Offline / rate-limited / aborted — leave the cache as-is, try again later.
  }
}

/** Compare the bundled canon against the last cached release. Pure + synchronous:
 *  reads only the on-disk cache, so it is safe in the MCP request path. Returns
 *  null when suppressed, uncached, releaseless, or already current. */
export function staleness(current: string): Staleness | null {
  if (checkSuppressed()) return null;
  const cached = readCache();
  if (cached === null || cached.tag === null) return null;
  const latest = cached.tag.replace(/^v/i, "");
  if (!isNewer(current, latest)) return null;
  return { current, latest, behind: true };
}
