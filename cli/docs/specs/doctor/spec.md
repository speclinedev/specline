---
slug: doctor
type: feature
decider: jonathan
created: 2026-06-11
---

# doctor — the Specline validator

## Intent

Build the deterministic validator that enforces Specline's structural rules so
the methodology stops being honor-system. The product outcome is that every
consumer of a Specline repo — CI, an agent mid-shape, and the human at a gate —
can ask one question, *"is this repo structurally valid?"*, and get the same
machine-readable answer with the same exit code, every time.

**Appetite — one sitting.** This spec covers the **engine**, the **output
contract** (JSON + exit code + `rule_id`), the **repo-scoped structural and
integrity checks**, and the **local CLI** adapter. That is a coherent,
reviewable unit: *"the validator can check structure and slugs and tell every
consumer about it in one format."* The MCP and GitHub Action adapters are thin
wrappers over this same contract and are covered by their own specs (see
`cli/docs/specs/github-action/`).

## Goal

For a given repo state and `--now`, every consumer — CI, an agent, a human —
gets the same machine-readable structural verdict and exit code,
byte-identical across runs.

## Non-goals

The most important section. The validator earns its trust by what it refuses
to do.

- **No judgment.** It runs no model, makes no semantic call, and never checks
  whether a knowledge doc *matches* the code. Tense, sizing, mechanics-creep,
  and one-sitting scope live at the human gates, not here. The moment it
  decides anything subjective, it stops being deterministic.
- **No repo code.** It reads only markdown, YAML, and directory structure. It
  never executes, imports, compiles, or links the repo it validates — the
  property that lets one binary validate Rails, Flutter, and Next.js repos
  identically, and it must not be quietly broken for "just one"
  language-specific check.
- **No network, no clock-as-input beyond an injected `--now`.** Determinism
  requires that time-dependent checks (staleness) receive the reference date
  as an argument, not read the wall clock, so a run is reproducible.
- **`relations-index.yml` generation touches only that generated artifact.**
  It never edits authored content. (The generator itself is still planned —
  see Out of scope.)
- **Not the build loop, not the reviewer.** Those belong to the external,
  pluggable orchestrator (Part 3 of the canon, experimental). The validator is
  a gate they call, not a participant that reasons.

## Behavior

Observable, numbered, each verifiable from outside the process.

1. **Invocation.** `specline check [PATH] [--format json|human] [--changed
   <file>...] [--modified <file>...] [--now <iso-date>]` — `check` is the
   default command. `PATH` defaults to the current directory; the tool locates
   `docs/` beneath it. With no flags it prints human output; agents and CI pass
   `--format json`. Sibling commands: `init`, `sync`, `upgrade` (scaffold and
   maintain generated artifacts; each takes `[PATH] [--check]`), `rules`
   `[PATH] [--format json|markdown]`, and `spec [PATH]` (see item 11). `doctor`
   is kept as a silent back-compat alias for `check`.

2. **One mode.** There is no `--mode` and no `--tier`. The validator reports
   every finding it finds and exits nonzero when any of them is an error;
   completeness and quality are always advisory warnings, never a second
   severity tier to toggle.

3. **Output contract.** With `--format json`, it writes exactly one JSON
   document to stdout:

   ```json
   {
     "tool_version": "0.1.0",
     "canon": "3.1.0",
     "unattended": false,
     "summary": { "errors": 1, "warnings": 0, "info": 0 },
     "findings": [
       {
         "rule_id": "SLUG-DUPLICATE",
         "severity": "error",
         "scope": "repo",
         "file": "docs/specs/ranch-mgmt/spec.md",
         "line": 2,
         "message": "slug \"ranch-mgmt\" also names docs/archive/ranch-mgmt",
         "fix_hint": "re-slug the later-merged spec to a fresh, unique name; nothing references it yet",
         "location": "specs"
       }
     ]
   }
   ```

   `unattended` reports whether Part 3 was in force for this run (the repo's
   `specline.yml` `unattended:` switch). `--format human` renders the identical
   data as readable text. The JSON is the source of truth; the human format is
   a projection of it.

4. **Exit codes.** `0` — no `error`-severity findings (warnings allowed), or a
   clean `--check` on `init`/`sync`/`upgrade`. `1` — at least one error, or a
   stale `--check`; CI gates on this, agents parse the findings, the two never
   disagree. `2` — usage/input error (bad flag, no `docs/` found, malformed
   `--changed`/`--modified`/`--now`). `3` — internal error, written to stderr,
   never as malformed stdout.

5. **Quarantine scope.** Every finding carries `scope: "repo"` or
   `scope: "spec"`. Repo-scoped errors fail everywhere. Spec-scoped errors fail
   only when `--changed` names that spec's files; absent that, a spec-scoped
   violation is reported as a warning. `--modified` is the subset of changed
   paths that are edits or deletions (not pure additions), used only for
   archive-immutability detection. Both are inputs, never read from git by the
   engine, so every adapter (CLI, MCP, GitHub Action) computes quarantine
   identically.

6. **`drafts/` is checked lightly.** In `docs/drafts/<slug>/`, only parse-level
   integrity rules run — frontmatter parses, `slug` matches the folder, links
   and edges resolve, the slug is not already taken — and no advisory rule
   fires: incomplete is what a draft is for. Everything else in the catalog
   applies from `docs/specs/` onward.

7. **Structural and integrity checks (canon 3.1, Parts 1 and 2; per-rule
   `scope` per the registry — a spec's own well-formedness is `scope: spec`,
   cross-spec integrity is `scope: repo`).**
   - Every `docs/specs/<slug>/` contains `spec.md`; its absence is the
     constitutive integrity error (`STRUCT-MISSING-SPEC`).
   - Frontmatter parses, and its `slug` matches the directory name
     (`FRONTMATTER-UNPARSEABLE`, `FRONTMATTER-SLUG-MISMATCH`); enum fields
     (`type`, `status`, and — only when `unattended: true` — `build`,
     `blast_radius`, `size`, `target_model`) are in their allowed sets
     (`ENUM-INVALID`).
   - `relations.md` forward edges to repo-local slugs resolve at some
     lifecycle stage (`RELATION-DANGLING`); cross-repo (`repo:slug`) edges warn
     (`RELATION-CROSS-REPO`); edges to `killed` slugs warn (`RELATION-KILLED`);
     a `relations.md` that does not parse is an integrity error
     (`RELATION-UNPARSEABLE`).
   - Every relative link under `docs/**` resolves (`LINK-DANGLING`).
   - `knowledge/**` contains no `status.md` or `open-questions.md`
     (`KNOWLEDGE-HAS-STATUS`); `archive/**` is read-only — any edit after the
     archiving commit errors (`ARCHIVE-EDITED`).
   - A spec's slug is unique per feature across `drafts/` + `specs/` +
     `knowledge/` + `archive/` — the `knowledge/` + `archive/` pair left by
     graduation is one feature, not a collision (`SLUG-DUPLICATE`).
   - The frontmatter `status` field is retired from `drafts/` and `specs/` —
     where a spec lives is its state. It survives only in `archive/`
     (`shipped | killed`); a `status:` line written against an earlier canon
     (including `ratified`, `building`, `blocked`) is recognised silently,
     never an error or a warning.

8. **Part 3 (unattended builds) is experimental and opt-in.** Its rules —
   the unattended envelope (`blast_radius`, `size`, `target_model`,
   `stale_after`, `loop_budget`), `status.md`'s schema, the acceptance
   partition, staleness, the decider budget, and the coupling ceiling — run,
   and are listed by `specline rules`, only when `specline.yml` sets
   `unattended: true`. With the switch off, their keys and states are
   recognised silently: a repo that turns the switch off does not suddenly
   error.

9. **Stable rule identifiers.** Every check emits a documented, stable
   `rule_id` (e.g. `STRUCT-MISSING-RELATIONS`, `FRONTMATTER-SLUG-MISMATCH`,
   `SLUG-DUPLICATE`, `LINK-DANGLING`, `ARCHIVE-EDITED`, `KNOWLEDGE-HAS-STATUS`).
   Consumers route on `rule_id`, not on message text.

10. **Determinism.** For a given repo state and `--now`, two runs produce
    byte-identical output. Findings are sorted by `file`, then `line`, then
    `rule_id`. A finding with no inherent line (e.g. a missing-file finding)
    carries `line: null`, which sorts **before** any integer line.

11. **Self-describing subcommands.** `specline spec [PATH]` prints the pinned
    canon (for injecting into an agent's context), sliced at Part 3 unless
    `PATH`'s `specline.yml` sets `unattended: true`. `specline rules [PATH]`
    prints the rule catalog — every `rule_id`, its severity, and its
    quarantine scope — in `--format markdown` (default) or `json`; with
    `unattended` off, Part-3 rules are neither listed nor served. These let a
    planning agent learn what it will be checked against before writing, and
    need no repo to run (`PATH` defaults to `.`).

12. **Version-skew posture.** An unknown frontmatter key or unknown body
    section is preserved and reported at `severity: warning`, never error
    (`UNKNOWN-FRONTMATTER-KEY`, `UNKNOWN-SECTION`). A malformed *known* field
    (unparseable frontmatter, a slug that mismatches its directory, an
    out-of-set enum) is an integrity error, downgraded to a warning when
    quarantine applies (item 5). The principle: fail the broken,
    advise on the rest — a spec written against a newer canon must not
    hard-fail an older validator over a key it simply has not learned yet.

13. **The rule registry.** A single registry is the validator's source of
    truth for what it checks. Every check is one entry:

    ```
    { rule_id, severity (error|warning), scope (repo|spec), part (1|2|3) }
    ```

    The engine's emission and `specline rules` iterate the same registry, so a
    finding can never carry a `rule_id` absent from the catalog and the
    catalog can never drift from what the engine emits. `scope` drives
    quarantine (item 5). `part` drives item 8's filtering — Parts 1 and 2
    always run; Part 3 runs only when `unattended: true`. There is no `tier`
    and no `downgradable` flag — those belonged to a mode/tier system the
    canon retired in 3.1.

## Business rules

- The validator **must** exit non-zero if and only if at least one finding has
  `severity: error`.
- Every `error` or `warning` finding **must** carry a non-empty `fix_hint`.
  The loop-participant claim (an agent self-corrects from `rule_id` +
  `fix_hint` alone) depends on this, so it is a schema requirement, not a
  convention.
- The engine **must not** open a network connection or invoke a model. The
  human CLI adapter separately checks for a newer release; that notice does
  not affect findings, JSON output, or the exit code.
- The validator **must not** write any file except `relations-index.yml`
  under a future `--fix` (see Out of scope).
- The validator **must** emit well-formed JSON on stdout even when findings
  exist; internal failures go to stderr with a distinct non-zero code, never
  as malformed stdout.
- The validator **must** receive time via `--now`; it **must not** read the
  wall clock for rule evaluation.
- The validator **should** complete in under two seconds on a 500-spec repo
  (it sits in CI and the pre-handoff path).

## Critical files

- `cli/src/engine/rules.ts` — the rule registry and every rule body; the
  authoritative implementation this spec describes.
- `cli/src/engine/run.ts` — the orchestrator: loads the repo, runs the rules
  in force, applies quarantine, sorts, summarizes.
- `cli/src/cli/index.ts` — the local CLI adapter: argument parsing, exit
  codes, human/JSON rendering.
- `cli/fixtures/0012-clean/` — the worked example, vendored as the frozen
  fixture seed for the valid-fixture corpus.
- Specline canon `specline-3.1.md` § *Enforcement: the checks* — the
  authoritative rule list this spec implements; any divergence is a bug in
  this spec, not in the canon.

## Acceptance checks

Falsifiable, fixture-based.

- Against the valid-fixture corpus (the `0012` example plus a hand-built
  clean repo), the validator exits `0` and emits zero `error` findings.
- For a malformed fixture — one per integrity `rule_id` (missing `spec.md`,
  unparseable frontmatter, a slug mismatching its directory, an invalid enum,
  a dangling relation, an unparseable `relations.md`, a dangling link, a
  `status.md` in `knowledge/`, an edit to `archive/`, a duplicate slug) — the
  validator exits non-zero and emits **the expected `rule_id` at the expected
  `file`**, and no unexpected error findings.
- Two consecutive runs on the same input with the same `--now` produce
  byte-identical stdout (determinism).
- A real `scope: spec` violation reported without `--changed` is a warning
  and exits `0`; the same violation with `--changed` naming that file is an
  error and exits non-zero.
- `specline rules --format json` lists every `rule_id` the engine can emit,
  each with a severity and scope, and no `rule_id` appears in a finding that
  is absent from this catalog. With `unattended` off, no Part-3 `rule_id`
  appears in the list.
- A fixture carrying an unknown frontmatter key and an unknown body section
  yields `warning` findings (not errors) and exits `0`.
- A `specline.yml` pinning a canon at a different `MAJOR.MINOR` than the tool
  serves yields `CANON-PIN-MISMATCH` (warning), never an error.
- In `docs/drafts/<slug>/`, an incomplete spec (missing `relations.md`, no
  `## Goal`) produces no advisory findings; a `drafts/` spec with unparseable
  frontmatter errors when `--changed` names that draft, and warns otherwise.

### human

- `jonathan` reads five sample findings and confirms an implementer agent
  could self-correct from `rule_id` + `fix_hint` alone, without opening the
  canon. This is the "loop-participant" test — the property that keeps
  humans on only the two ends of the loop.

## Out of scope / deferred

Deferred to sibling work; IDs not yet allocated (the canon's rule: cite an ID
only once the folder exists).

- **`relations-index.yml` generation** (`specline --fix`) — the reverse-edge
  index builder.
- **`specline diff <before> <after>`** — substantive-vs-status change
  classification. Needs two file versions or commit history, which the
  working-tree-only engine cannot provide; belongs at the diff/CI layer.
- **Cross-repo edge resolution** — stays warn-only per the canon's open
  question; reading sibling-repo indexes is not built here.
- **Part 3's full `target_model`→`models` resolution** — only the fixed enum
  set is checked today; resolving against the repo's configured `models` map
  is planned.

## Changed in 3.1

This spec originally described a pre-2.6 contract: `--mode author|gate`,
`--tier`, `ratified_by`/`ratified_at` frontmatter, and a `downgradable`
registry flag. None of that shipped as described — the engine that actually
runs today implements canon 3.1 directly: one mode, no tiers, the decider's go
recorded in git (not a frontmatter field), and a `part` (not `tier`) on every
registry entry. This revision brings the spec's text in line with the shipped
engine and the current canon; it does not change what the validator does.
