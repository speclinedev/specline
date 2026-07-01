// The tool version, and the canon version it serves. The canon version is read
// FROM the bundled canon (see canon.ts) — never hand-typed — so it cannot drift
// from the file doctor actually serves. doctor@MAJOR.MINOR tracks canon
// MAJOR.MINOR (see open-questions Q1); bump the tool version on a cli release.
import { loadCanon } from "./canon.ts";

export const TOOL_VERSION = "0.1.0";
export const CANON = loadCanon().version;
/** MAJOR.MINOR of the canon version. Consuming workflows pin the Action by this
 *  moving tag (`speclinedev/specline/cli@v2.7`), never the exact patch — so a canon
 *  patch bump can't break their CI on a not-yet-created exact tag. The `v2.7` tag is
 *  moved forward on each patch release. */
export const CANON_MM = CANON.match(/^v?(\d+)\.(\d+)/)?.slice(1, 3).join(".") ?? CANON;
