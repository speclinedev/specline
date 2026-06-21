#!/usr/bin/env node
// Regenerate the bundled canon (cli/canon/) from the source canon at the monorepo
// root. The bundle is a BUILD ARTIFACT — never hand-edited — so this script is the
// only sanctioned way to update it.
//
//   node scripts/sync-canon.mjs           # copy source -> bundle
//   node scripts/sync-canon.mjs --check   # exit 1 if bundle != source (release/CI gate)
//   node scripts/sync-canon.mjs --source <dir>   # override the source repo dir
//
// Canon and cli now live in one repo, so the --check gate runs in normal CI: the
// source canon is always at the repo root, one level above cli/.

import { readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const args = process.argv.slice(2);
const check = args.includes("--check");
const srcIdx = args.indexOf("--source");
const bundleDir = fileURLToPath(new URL("../canon/", import.meta.url));
const sourceDir = srcIdx !== -1 && args[srcIdx + 1]
  ? args[srcIdx + 1]
  : fileURLToPath(new URL("../../", import.meta.url));

const onlyCanon = (dir) => readdirSync(dir).filter((f) => /^specline-.*\.md$/.test(f));

const sourceFiles = onlyCanon(sourceDir);
if (sourceFiles.length !== 1) {
  console.error(`sync-canon: expected exactly one specline-*.md in ${sourceDir}, found ${sourceFiles.length}`);
  process.exit(2);
}
const sourceName = sourceFiles[0];
const sourceText = readFileSync(join(sourceDir, sourceName), "utf8");

if (check) {
  const bundled = onlyCanon(bundleDir);
  const ok = bundled.length === 1 && bundled[0] === sourceName
    && readFileSync(join(bundleDir, bundled[0]), "utf8") === sourceText;
  if (!ok) {
    console.error(`sync-canon: DRIFT — bundle (${bundled.join(", ") || "none"}) != source (${sourceName}). Run: npm run sync-canon`);
    process.exit(1);
  }
  console.log(`sync-canon: bundle matches source (${sourceName}) ✓`);
  process.exit(0);
}

for (const f of onlyCanon(bundleDir)) rmSync(join(bundleDir, f));
writeFileSync(join(bundleDir, sourceName), sourceText);
console.log(`sync-canon: bundled ${sourceName} (${sourceText.length} bytes) from ${sourceDir}`);
