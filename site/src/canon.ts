import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// Single source for the canon version shown across the site. Parsed at build time
// from the one specline-*.md at the repo root (the same glob /spec.md uses), so the
// displayed version can never drift from the canon itself — bump the canon and the
// site follows automatically.
function canonVersion(): string {
  const dir = resolve(process.cwd(), "..");
  const files = readdirSync(dir).filter((f) => /^specline-.*\.md$/.test(f));
  if (files.length !== 1) {
    throw new Error(`expected exactly one specline-*.md in ${dir}, found ${files.length} (${files.join(", ") || "none"})`);
  }
  const text = readFileSync(resolve(dir, files[0]!), "utf8");
  const m = text.match(/\*\*Canon version:\*\*\s*(\d+\.\d+\.\d+(?:-[a-z0-9.]+)?)/i);
  if (m === null) throw new Error(`no "**Canon version:**" line in ${files[0]}`);
  return m[1]!;
}

export const CANON_VERSION = canonVersion();
export const CANON_LABEL = `canon ${CANON_VERSION}`;
