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
import { join, dirname, isAbsolute } from "node:path";

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
  // Per the XDG spec a relative $XDG_CACHE_HOME is invalid and must be ignored —
  // resolving it against the cwd would scatter caches through users' repos.
  const base = process.env.XDG_CACHE_HOME;
  const dir = base !== undefined && isAbsolute(base) ? base : join(homedir(), ".cache");
  return join(dir, "specline", "latest-release.json");
}

/** The cache is a file on a user's disk: half-written, hand-edited, or from a
 *  future version. Anything that is not a well-formed entry is treated as absent
 *  (and so refetched) rather than trusted into the comparison. */
function readCache(): CacheEntry | null {
  try {
    const value: unknown = JSON.parse(readFileSync(cachePath(), "utf8"));
    if (value === null || typeof value !== "object") return null;
    const { checkedAt, tag } = value as Partial<CacheEntry>;
    if (typeof checkedAt !== "number" || !Number.isFinite(checkedAt) || checkedAt < 0 || checkedAt > Date.now()) return null;
    if (tag !== null && (typeof tag !== "string" || parse(tag) === null)) return null;
    return { checkedAt, tag };
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
  const ctl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // The budget covers the whole exchange, not just the headers: a server that
    // accepts the connection and then dribbles the body used to hang the CLI.
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        ctl.abort();
        reject(new Error("update check timed out"));
      }, FETCH_TIMEOUT_MS);
    });
    const request = async (): Promise<string | null> => {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { accept: "application/vnd.github+json", "user-agent": "specline-cli" },
        signal: ctl.signal,
      });
      // 404 = no releases yet; 403/429 = rate-limited; 5xx = their problem. Cache
      // "no tag" either way, so a failing endpoint costs one request a day rather
      // than one per run.
      if (!res.ok) return null;
      const data: unknown = await res.json();
      const tag = data !== null && typeof data === "object" ? (data as { tag_name?: unknown }).tag_name : undefined;
      if (typeof tag !== "string" || parse(tag) === null) throw new Error("invalid release tag");
      return tag;
    };
    const tag = await Promise.race([request(), deadline]);
    writeCache({ checkedAt: Date.now(), tag });
  } catch {
    // Offline / aborted / unreadable body — leave the cache as-is, try again later.
  } finally {
    clearTimeout(timer);
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
