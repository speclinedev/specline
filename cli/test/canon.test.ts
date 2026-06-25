// Bundle integrity. The canon under canon/ is a build artifact synced from the
// source repo (scripts/sync-canon.mjs); these guard that it stays internally
// consistent — exactly one file, a parseable version, and the served version
// matching what doctor reports. The cross-repo source-equality check lives in the
// sync script (--check), which needs the sibling repo and runs at release time.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCanon } from "../src/canon.ts";
import { CANON } from "../src/version.ts";
import { BUNDLED_CANON_FILE, BUNDLED_CANON_TEXT } from "../src/canon-bundle.ts";

test("exactly one canon is bundled, with a parseable version", () => {
  const c = loadCanon();
  assert.match(c.version, /^\d+\.\d+\.\d+(-[a-z0-9]+(\.[a-z0-9]+)*)?$/);
  assert.ok(c.text.length > 1000, "bundled canon looks empty");
});

test("served canon version matches the version doctor reports", () => {
  const c = loadCanon();
  assert.equal(c.version, CANON);
  // the parsed version must actually be the one printed in the document body
  assert.ok(c.text.includes(`**Canon version:** ${c.version}`), "version line not found verbatim in canon");
});

// The embedded copy (canon-bundle.ts) is what a compiled single-file binary serves
// when there is no canon/ on disk. It must be byte-identical to the on-disk bundle,
// or the binary would drift from `node`/the Action. (sync-canon --check also guards this.)
test("embedded canon-bundle matches the on-disk bundle (compiled-binary fallback)", () => {
  const c = loadCanon();
  assert.equal(BUNDLED_CANON_TEXT, c.text, "embedded canon text drifted from canon/");
  assert.ok(c.path.endsWith(BUNDLED_CANON_FILE), "embedded filename drifted from the bundle");
});
