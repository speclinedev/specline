# Status — doctor

## State

Implemented against canon 3.1 on `chore/principal-repo-review`; awaiting
human review. The spec lives in `docs/specs/`; this file records implementation
progress, not a separate lifecycle state.

## Done

- Shared deterministic engine and JSON report contract, with CLI, MCP, and
  GitHub Action adapters.
- YAML parsing for frontmatter and relations, with malformed-input and
  adapter-option validation.
- One validation mode, rule ownership by canon part, and explicit
  `unattended: true` opt-in for Part 3 checks.
- Folder-based lifecycle: `drafts/`, `specs/`, `archive/`, and `knowledge/`;
  draft advisories are suppressed while integrity checks remain active.
- Relation integrity, archive-edit detection using `--modified`, changed-spec
  quarantine, and canon-pin checks.
- Canon bundle synchronization, JSON schema, compiled-binary smoke check,
  and regression coverage for parsing, rules, lifecycle, and adapters.

## In progress

- PR review, including the human acceptance check in `spec.md`: confirm that
  sample findings give an implementer enough information to self-correct.
- Deferred capabilities remain listed in `spec.md`; they are not claimed as
  implemented here.

## Last green checkpoint

- 2026-09-30, Node 22.21.0: `npm test` — 132 passed, zero failures.
- `npm run typecheck` and `npm run sync-canon:check` passed.
- Compiled-binary validation is a required CLI CI step; these local results
  do not attest to that check.

## Dead ends

- The earlier flat-YAML parser and author/gate modes no longer describe the
  implementation. The engine uses the `yaml` dependency and one mode.
- Node 16 cannot run the source tests. Use Node 22.18 or later; Bun is used
  for compiling the standalone binary, not required for source execution.

## Corrections

- 2026-09-30: Replaced the obsolete pre-build checkpoint and proposed canon
  2.3 schema with the implemented 3.1 state. The former next-slice list
  incorrectly described existing schema, fixtures, and MCP support as absent.
