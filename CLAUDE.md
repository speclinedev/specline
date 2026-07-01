# Specline — project guide for Claude

## CI cost: never use GitHub macOS runners

GitHub bills macOS runners at **~10× Linux**. **Do not add `runs-on: macos-*` to any
workflow.** Build all platform binaries by cross-compiling on `ubuntu-latest`:
`bun build --compile --target=bun-darwin-arm64 | bun-darwin-x64 | bun-linux-x64` all
work from a Linux host. Smoke-test the native linux binary (it proves the embedded
canon is served from a compiled binary — the only thing that can break); the
cross-compiled macOS binaries come from the same embed and are size-checked. See
`.github/workflows/release.yml`.

## Canon version bump — touch every one of these

A canon change does **not** reach all surfaces by itself. There are three classes of
component, and skipping the last two is what keeps biting us:

**1. Derived — auto-updates; just re-bundle.** Edit the `**Canon version:**` line in
`specline-*.md` (rename the file on a MAJOR.MINOR change), then `cd cli && npm run
sync-canon`. That regenerates the bundle **and** the embedded `canon-bundle.ts`. `CANON`
(→ CLI, MCP code, scaffolder `@v${CANON}`) and the site's `CANON_VERSION` follow
automatically. CI's `sync-canon --check` blocks drift.

**2. Hand-maintained prose mirrors — RECONCILE by hand (they do NOT auto-update).**
On any change to a rule, a section name, a principle, or a version literal:
- the canon doc's own lists (the Checks appendix, section/principle names);
- `README.md` "current canon" line;
- the site `/docs/reference/*` pages — rule catalog, spec-body, frontmatter, lifecycle, glossary, boundaries;
- **BOTH** handbook surfaces — `handbook.md` **and** `site/src/pages/handbook/*.astro`.

**3. The live MCP process — RESTART it. (This is the one that bites.)** The running
`specline` MCP is a long-lived process: it loads the canon **and the engine code
(rules)** at startup and caches both, so it keeps serving the OLD contract until
restarted — no code fix exists, a running node process doesn't reload its source. After
ANY canon or engine change, reconnect it: `/mcp` → reconnect `specline` (or restart
Claude Code). Verify with `specline_rules` — its `canon` field must match the source.
(If it's been stale a while, kill leftover processes first: `pkill -f cli/src/mcp/index.ts`.)

**Then ship it.** Cut a `vX.Y.Z` release (binaries auto-build on Linux) and move the
moving `@vX.Y` tag to the release commit.

## Canon versioning: one source, derive everywhere

The canon version lives in **exactly one place** — the `**Canon version:** X.Y.Z`
line in `specline-*.md` at the repo root. Treat that line as the single source of
truth. **Do not hardcode the full version anywhere else, and do not hunt the tree
for version strings to update.**

**To bump the canon version:**
1. Edit the `**Canon version:**` line in `specline-*.md`.
2. On a **MAJOR.MINOR** change, also rename the file to `specline-<MAJOR.MINOR>.md`
   (the bundle filename tracks MAJOR.MINOR; the glob resolves it).
3. Run `cd cli && npm run sync-canon` to re-bundle `cli/canon/`.

That's it. Everything downstream **derives** the value and updates itself:

| Deriver | What it feeds |
|---|---|
| `cli/src/version.ts` (`CANON`, parsed from the bundle) | CLI + MCP output; `specline rules`; the scaffolder's `canon:` pin |
| `cli/src/version.ts` (`CANON_MM` = MAJOR.MINOR of `CANON`) | the scaffolded workflow's `speclinedev/specline/cli@v${CANON_MM}` ref — the **moving** `@v2.7` tag, so a canon patch never breaks a consuming repo's CI on a missing exact tag |
| `cli/src/canon.ts` / `site/src/canon.ts` (parsed from the canon file) | every site page, `llms.txt`, `/spec.md` |

CI runs `sync-canon --check`, so a bundle that drifts from the source cannot merge.

## Literals that are intentional — do NOT chase these

- **Repo pins** (`specline.yml` `canon:`, `doc-architecture.md` `| **Canon** |`)
  and **test fixtures** track **MAJOR.MINOR only** — `CANON-PIN-MISMATCH` compares
  MAJOR.MINOR, so `2.6.0` vs `2.6.1` is *not* drift. Never bump a fixture/pin for a
  patch.
- Illustrative example snippets and code comments may show a sample version. Prefer
  bare `2.6` (MAJOR.MINOR) so they can't go stale. Never block on these.

## Authored prose that is NOT derived — reconcile on a contract change

These mirror the canon by hand and must be updated when the *contract* changes (not
on every patch): the canon doc's own integrity/rule lists, the README's "current
canon" line, the site `/docs/reference/*` pages, and `handbook.md`. The engine
(`cli/src/engine/`) is the source of truth for what actually fires; prose follows it.

## New code

Need the canon version? Import it — `CANON` (cli) or `CANON_VERSION` / `CANON_LABEL`
(site). Never write a version literal into new code.
