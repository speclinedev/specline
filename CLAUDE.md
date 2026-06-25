# Specline — project guide for Claude

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
| `cli/src/version.ts` (`CANON`, parsed from the bundle) | CLI + MCP output; `specline rules`; the scaffolder's `canon:` pin and `speclinedev/specline/cli@v${CANON}` workflow ref |
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
