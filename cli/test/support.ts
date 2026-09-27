// Shared test helpers. Not a `*.test.ts`, so the runner's glob skips it.

import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const fx = (name: string): string => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

/** Copy a fixture to a temp dir with its `specline.yml` rewritten, run `fn` against
 *  the copy, then delete it. The config is the one input that decides which parts
 *  are in force, so most switch coverage is a one-line mutation of a real fixture
 *  rather than a near-duplicate fixture tree. */
export function withMutatedFixture<T>(fixtureName: string, mutate: (yml: string) => string, fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "specline-fixture-"));
  try {
    cpSync(fx(fixtureName), dir, { recursive: true });
    const ymlPath = join(dir, "specline.yml");
    writeFileSync(ymlPath, mutate(existsSync(ymlPath) ? readFileSync(ymlPath, "utf8") : ""));
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The same fixture with the unattended switch forced on: `tier:` (canon 3.0) is
 *  dropped and replaced by the one switch canon 3.1 defines. */
export const unattendedOn = (yml: string): string =>
  `${yml.replace(/^tier:.*\n/m, "")}unattended: true\n`;
