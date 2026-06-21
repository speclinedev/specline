# Specline — Canon Proposal v2.2

**Status:** PROPOSAL — supersedes `contracts/spec-flow.md` when ratified.
**Canon version:** 2.2.0-draft. Repos pin a canon version in their
`docs/conventions/doc-architecture.md` header; this contract changes first,
repo conventions follow.

"Specline" is the working name. Branding is an open question; the rules are
not.

---

## What this is

Specline is an operating system for product delivery by one product owner
directing many AI agents. Plans live inside the repo as versioned, validated
artifacts; agents build from them; shipped work graduates into a permanent
product memory; the full contract for every shipped feature is archived,
never deleted. The methodology rations the three resources that are scarce
in agent-driven delivery — **human judgment, context, and verification** —
and treats agent time as nearly free.

The loop:

```
SHAPE ──► RATIFY ──► BUILD ──► GRADUATE (+ ARCHIVE)
(agent+PO)  (PO)    (agent)        (agent)
   ▲___________________│
     reshape is normal
```

### Claims, mechanisms, failure modes

Every claim below names the mechanism that produces it and the condition
under which it fails. A claim without a failure mode is marketing.

- **Cycle time in hours, not sprints.** Mechanism: specs sized to one review
  sitting (B1) and no ceremony calendar. Fails when: the decider budget (B7)
  is breached — cycle time is gated by PO queue depth, which is why B7
  exists.
- **Parallel delivery with minimal coordination.** Mechanism: the relations
  graph plus deterministic ID allocation replace standups. Fails when:
  cross-repo edges are involved (validated weakly in v2 — see Doctor) or
  the graph itself is stale (doctor on main prevents this).
- **Rework caught at the cheapest moment.** Mechanism: acceptance checks are
  executed inside the implementation PR (B5), not at a demo. Fails when:
  checks are written unfalsifiably — which is why unfalsifiable specs cannot
  ratify.
- **Product memory that survives staff, vendors, and model upgrades.**
  Mechanism: graduation produces descriptive knowledge docs; archive
  preserves contracts. Fails when: graduation is skipped — which is why it
  is wired to the implementation PR, not to memory.
- **Audit trail.** Mechanism: every shipped ID resolves to an archived spec
  (with its acceptance results) and a knowledge doc, traceable
  spec → ratifier → implementation PR → graduation. Fails when: archive
  integrity breaks — a doctor error.

What it does not claim: that structure substitutes for product judgment. The
system concentrates judgment at two gates and automates everything between.

---

## The Boundaries

Scrum rations human time (sprints). Shape Up rations risk (appetite, the
six-week circuit breaker). Specline rations judgment, context, and
verification. These seven rules are the system; everything after them is
implementation. Each is either doctor-enforced or names its gate.

**1. The One-Sitting Rule.** A spec must be small enough that the product
owner can verify its acceptance checks in a single review sitting. Human
attention is the appetite unit. If you cannot review it in one pass, split
it; IDs are cheap. *(Gate: ratification. Judgment-only.)*

**2. The Context Budget.** A spec plus everything its relations force an
agent to load must fit the repo's pinned budget with room left to think.
Doctor computes the proxy — total size of `spec.md` + transitively forced
loads — and warns on breach. Blowing the budget is a design smell (the
feature is too entangled), not a loading problem. *(Doctor: warn.)*

**3. The Human Gate.** Humans ratify and humans accept. Ratification is
recorded — `ratified_by` + `ratified_at` in frontmatter, set by the named
human's approving commit — so a rubber stamp at least has a name on it.
Everything else is delegable to agents. A spec no human read before
ratification did not need to exist. *(Doctor: `ratified` without
`ratified_by` is an error. Whether the human actually read it remains
judgment — no system detects attention, only accountability.)*

**4. The TTL.** `building` and `blocked` each carry an expiry. Expiry
**quarantines the spec**: doctor errors on that spec's own PRs and warns
repo-wide — it never blocks unrelated work. Exit from quarantine is an
explicit reshape (re-ratification) or kill (archive with tombstone). Moving
`ttl_expires` without a same-commit `ratified_at` update is an error: no
silent extension. *(Doctor: enforced.)*

**5. Falsifiable or Draft.** A spec is not `ratified` until its acceptance
checks can be executed by an agent or verified by a person in one sitting —
and they are *actually executed* in the implementation PR, results linked,
before graduation. "Improve the dashboard" stays draft forever. *(Doctor:
graduation without a linked acceptance run is an error.)*

**6. Intent Over Description.** Documentation records what code cannot say:
goals, non-goals, rejected options, evidence, business rules, boundaries.
Code is the source of truth for mechanics; never compete with it. Strong
models read code — what they cannot read is your mind. *(Gate: graduation
review. Judgment-only.)*

**7. The Decider Budget.** A named decider may have at most **3 specs in
`building`** and **6 in active states** (`ratified|building|blocked`) at
once, per-repo override allowed. Agent capacity is not the constraint; the
decider's queue is. WIP limits on humans, not on machines. *(Doctor:
enforced.)*

---

## Roles and continuity

| Work | Owner |
|---|---|
| Deciding what to build, and that it's done | Decider (PO) — non-delegable |
| Answering `open-questions.md` | Named decider per entry |
| Drafting and critiquing specs | Agent; PO edits |
| Building, testing, status upkeep | Agent |
| Acceptance check execution | Agent, in the implementation PR |
| Graduation editing pass | Agent, triggered by PR |
| Structure validation | `doctor`, in CI |
| Meaning validation (tense, scope, sizing) | Human, at the two gates |

Each repo's conventions name the deciders and one **deputy**. If a TTL
expires or an open-question deadline passes while the decider is
unavailable, the deputy decides; with no deputy, the agent applies the
entry's stated default (that is what defaults are for) and the spec flips
to `blocked` with TTL set to the decider's stated return. The system
degrades to paused, never to improvised.

---

## Repository layout

```
docs/
├── architecture.md       # System shape, core areas, agent guidance. Read first.
├── conventions/          # Doc + code standards, templates, graduation prompt,
│   └── templates/        #   deciders + canon pin
├── decisions/            # Repo-local ADRs. NNNN-slug.md. Append-only once accepted.
├── strategy/             # Vision, roadmap snapshots, launch contracts. Dated; archived, not deleted.
├── technical/            # Cross-cutting implementation patterns. Only when non-obvious.
├── specs/                # IN-FLIGHT work. Prescriptive. Temporary by design.
│   ├── .id-counter       # Single source for ID allocation
│   └── NNNN-slug/
├── knowledge/            # SHIPPED reality. Descriptive. Permanent.
│   ├── NNNN-slug/        # Graduated features (ID retained)
│   └── topic.md          # Domain docs that map to no single feature
├── archive/              # Terminal contracts. Permanent, read-only.
│   └── NNNN-slug/        # Final spec.md (+ acceptance results link) of shipped,
│                         #   killed, and bug specs
└── relations-index.yml   # GENERATED by doctor --fix. Reverse edges. Never hand-edited.
```

Changes from v1: `docs/features/` → `docs/specs/`; `docs/product/features/`
→ `docs/knowledge/`; `docs/product/` is retired (contents disperse to
`strategy/`, `technical/`, `architecture.md`, `decisions/`). The word
"features" is retired entirely — across four repos it meant four different
things, and a word that ambiguous cannot carry a lifecycle. Separate `bugs/`
trees are retired: a bug is a spec with `type: bug`.

---

## IDs and references

Four-digit zero-padded integer, repo-local, never reused, never renumbered.
Abandoned IDs stay burned.

**Allocation protocol.** `docs/specs/.id-counter` holds the last allocated
ID. Allocating = increment the counter and create the folder **in the same
commit**. Parallel worktrees that collide discover it at merge like any
conflict; the rule is **later-merger renumbers** — mechanical before
ratification, because nothing may reference an unratified ID. Doctor errors
on any ID ≤ counter that is missing from `specs/`, `knowledge/`, and
`archive/`, and on duplicates.

**References cite IDs, never lifecycle-managed paths.** Write `spec 0007`
or `0007-ranch-mgmt`. Resolution is
`glob docs/{specs,knowledge,archive}/0007-*` — every allocated-and-ratified
ID resolves *forever*, because terminal states land in `archive/`.
Cross-repo references use `repo:NNNN-slug`. In v2, doctor validates
repo-local edges as errors and cross-repo edges as **warnings only** —
claiming more requires doctor to read sibling-repo indexes, which is an
open question, and we do not claim validation we cannot perform. Literal
paths are legal only for non-lifecycle docs (`docs/technical/...`,
`docs/decisions/...`) and doctor verifies them.

---

## Spec folder anatomy

```
docs/specs/NNNN-slug/
├── spec.md               # REQUIRED. The build contract.
├── relations.md          # REQUIRED. Forward edges only. "none" is valid; absence is not.
├── open-questions.md     # REQUIRED while unresolved decisions exist.
├── status.md             # REQUIRED for autonomous builds; optional otherwise.
├── discovery.md          # OPTIONAL. Customer evidence, research, rationale.
├── api.md                # OPTIONAL. Feature-specific API contract.
└── design.md             # OPTIONAL. Non-obvious layout/component decisions.
```

### Frontmatter (required, in `spec.md`)

```yaml
---
id: 0007
slug: ranch-mgmt
type: feature        # feature | bug | chore
status: building     # draft | ratified | building | blocked | shipped | killed
decider: jonathan
ratified_by: jonathan        # set by the ratifying human's commit
ratified_at: 2026-06-11
created: 2026-06-10
ttl_expires: 2026-06-18      # set on entering building or blocked
---
```

Frontmatter is identity and state, nothing else. The graph lives only in
`relations.md`. An agent triages any spec from its first ten lines.
`shipped` and `killed` are set during archiving and exist only in
`archive/`.

`status` replaces presence-semantics: agents reliably miss the *absence* of
a file, so build-readiness is `status: ratified` plus a clean
`open-questions.md` (see below).

### `spec.md` body

1. **Intent** — the product outcome in plain language, and the appetite:
   what one-sitting scope this spec deliberately fits.
2. **Non-goals** — explicit. The most valuable section for strong models.
3. **Behavior** — observable, numbered, each verifiable from outside.
4. **Business rules** — `Must` / `Should` / `May`.
5. **Critical files** — pointers into existing code, not restatements of it.
6. **Acceptance checks** — falsifiable; executed in the implementation PR
   (B5).
7. **Out of scope / deferred** — with IDs if already allocated.

Write intent and rules richly; write mechanics sparsely. The builder can
read code — the spec's job is everything code can't say (B6).

### `open-questions.md`

Each entry is doctor-parsed and must carry: **who decides**, **the
options**, **the default**, and **the deadline**. An entry with a stated
default and a future deadline is **legal during `building`** — that is the
point: indecision becomes a logged choice with an override window, and
agents keep moving. Doctor errors only on entries past deadline (the default
should have been applied and the entry resolved) or missing a default. A
spec cannot *ratify* with entries lacking deciders or defaults.

### `relations.md`

```yaml
depends_on:
  - 0004-people-management: person records provide candidate identity
part_of: []            # parent module, if this is a sub-feature
supersedes: []
conflicts_with: []
```

Forward edges only, authored. Reverse edges (`depended_on_by`) live in the
generated `docs/relations-index.yml`, maintained by `doctor --fix` — never
written into authored files, because two parallel PRs rewriting third-party
`relations.md` files is a merge conflict baked into the happy path. Every
edge carries a one-line *why* — the why is what lets an agent decide whether
the related doc is worth its context budget.

### No recursion

Sub-folders inside a spec folder are prohibited. A module needing sub-specs
gives each its own ID with `part_of: NNNN`. Flat folders with explicit
edges beat nested trees: agents traverse a declared graph reliably and
discover hierarchies unreliably, and recursion breaks ID resolution,
relation scoping, and the context budget.

### Selective loading

The file split exists for context economy, not tidiness:

| Task | Load |
|---|---|
| Build | `spec.md`, `relations.md`, `open-questions.md`; related docs per edge whys |
| Product thinking / reshape | `discovery.md`, `open-questions.md`, spec Intent + Non-goals |
| Review PR against spec | Acceptance checks, `relations.md` |
| Resume / triage | frontmatter + `status.md` |

Context construction order for build work: conventions → `architecture.md`
and named cross-cutting docs → the spec folder per the table → related
specs/knowledge (`overview.md` first, deeper only if the edge's why warrants
it) → ADRs citing this spec's ID.

---

## Knowledge folder anatomy

```
docs/knowledge/NNNN-slug/
├── overview.md       # What, who, why it exists, why it is shaped this way. Entry point.
├── behavior.md       # Business rules, invariants, edge-case intent. Present tense.
└── api.md            # OPTIONAL. Contract surface worth separating.
```

Knowledge docs obey B6. `behavior.md` records rules and invariants —
*"credits never expire while a subscription is active"* — not
screen-by-screen restatement of what code visibly does. A schema dump is
justified only when the data shape encodes decisions the schema file can't
explain. If a knowledge doc would lose an argument with the code, it
shouldn't exist; if it records why the code is the way it is, it can't lose
that argument.

Flat `topic.md` files are legal for domain knowledge that maps to no single
feature. Rule: graduated features are ID-bearing folders; cross-feature
domain knowledge is a flat named file. Two shapes, one declared rule.

---

## Lifecycle

### Two-PR pattern

1. **Spec PR** — adds the spec folder. Optionally critiqued by a spec-critic
   agent; ratified by the named human, whose approving commit sets
   `ratified_by`/`ratified_at` (B3). Merge to main is the ratification
   event.
2. **Implementation PR** — the diff, referencing the spec ID, executing the
   acceptance checks (results linked from `status.md` or the PR), and
   containing graduation.

### Amendment (reshape) mechanics

The merged spec on main is canonical, always. Mid-build reshaping:

1. Builder hits a contradiction → flips `status: blocked` (TTL per B4).
2. The amendment lands as a **spec-amendment commit/PR to main** touching
   only the spec folder — approved by the decider, whose approval updates
   `ratified_at` and resets `ttl_expires` in the same commit.
3. `status: building` resumes. The implementation branch rebases on the
   amended contract.

Re-ratification therefore leaves a trace doctor can read: `ratified_at`
newer than spec-body changes, or it didn't happen. Reshaping is a normal
transition, not a failure.

### Graduation

An **agent-executed editing pass wired to the implementation PR** — the
trigger is structural, because v1 proved an unowned graduation step never
happens (every v1 repo's shipped directory: empty). The prompt lives at
`docs/conventions/graduation.md` and implements:

1. Create `docs/knowledge/NNNN-slug/` — same ID, same slug.
2. Move the final `spec.md` (with acceptance-results link, frontmatter
   `status: shipped`) to `docs/archive/NNNN-slug/`. The contract is
   preserved verbatim; nothing about the audit trail requires git
   archaeology.
3. Write knowledge docs: imperative → present descriptive, corrected to
   what actually shipped; apply B6 — keep intent, rules, rationale; cut
   anything code already says.
4. Fold in ADRs accepted during the build that changed behavior.
5. Carry forward edges into the knowledge folder's `relations.md`; run
   `doctor --fix` to regenerate `relations-index.yml`.
6. Delete the spec folder (the contract now lives in `archive/`).

The result must read shorter and more confident than the spec. The human
acceptance gate reviews the graduated knowledge doc *with the archived
checks one click away* — "is this what I decided?" is a one-sitting
question.

**Bugs** (`type: bug`): the implementation PR updates the corrected
knowledge doc (adding the bug ID to a `corrected_by` line in its
frontmatter) and archives the bug spec as `shipped`. No knowledge folder is
created; the ID resolves in `archive/` forever.

**Kills**: spec moves to `archive/` with `status: killed` and a one-line
tombstone (why, decided by whom). IDs stay burned; edges pointing at a
killed ID are doctor *warnings* prompting the referrer to re-route or
absorb.

### Precedence

ADR > spec > knowledge doc. ADRs cite affected IDs in their header so
conflicts are findable; graduation folds accepted ADRs into knowledge docs,
so a standing conflict should be rare and temporary. Archive is historical
record and outranks nothing.

---

## Enforcement: the doctor

A convention without a validator is a suggestion. `doctor` runs in CI and
before any agent handoff. **Quarantine semantics:** spec-scoped violations
(TTL expiry, that spec's structure) error only on PRs touching that spec
and warn repo-wide; repo-scoped violations (ID integrity, dangling edges,
broken links, stale index) error everywhere.

Checks:

- Every `specs/NNNN-*` has `spec.md` + `relations.md`; frontmatter parses
  and matches directory ID and slug.
- ID integrity: unique across `specs/` + `knowledge/` + `archive/`; no ID ≤
  `.id-counter` unaccounted for.
- `ratified|building` requires `ratified_by`/`ratified_at` (B3).
- Every repo-local edge resolves at some lifecycle stage (error);
  cross-repo edges warn-only; edges to `killed` IDs warn.
- `relations-index.yml` consistent with authored forward edges (`--fix`
  regenerates).
- `open-questions.md` entries parse (decider, options, default, deadline);
  past-deadline entries error; `ratified` with default-less entries errors.
- `building|blocked` past `ttl_expires` → quarantine. `ttl_expires` changed
  without same-commit `ratified_at` update → error (B4).
- Decider budget: > 3 `building` or > 6 active per decider → error (B7).
- Context-budget proxy: size of `spec.md` + transitively forced loads vs.
  the repo's pinned budget → warn (B2).
- Graduation PR without linked acceptance-check results → error (B5).
- Every relative path link under `docs/**` resolves.
- No `status.md`, open questions, or acceptance checks in `knowledge/`;
  `archive/` is exempt (it preserves contracts verbatim) and read-only
  (edits to `archive/**` after the archiving commit → error).

Judgment-only rules (one-sitting sizing, B6 compliance, tense, confidence)
are explicitly out of doctor's scope and live at the two human gates.

---

## Instrumentation

All computable from frontmatter + `archive/` + git — archiving is what makes
them cheap. Diagnostic instruments, never targets; the moment one becomes a
goal it stops measuring (Goodhart).

- **Lead time** — `created` → `shipped`, read from archived frontmatter.
- **Mid-build revision rate** — % of shipped specs whose ratified sections
  (Behavior, Business rules, Acceptance) changed between first ratification
  and archive. A *substantive* amendment is a diff to those sections, not to
  status fields. Expected band: roughly 10–40%. Near zero → specs aren't
  being renegotiated: waterfall. Far above → shaping is too thin to build
  from. Read it; don't chase it.
- **TTL outcomes** — breach count and the reshape/kill split.
- **Graduation latency** — implementation merge → knowledge doc. Target:
  same PR, so the metric is really "violations of the same-PR rule."
- **Doctor pass rate on main** — should be 100%; the CI-caught violation
  trend is the system paying for itself.

---

## Adoption

Tiered so the smallest viable adoption is one afternoon:

- **Tier 0 — one spec.** Create `docs/specs/`, `.id-counter`, and a single
  spec folder for the next piece of work. Run doctor. No lifecycle, no
  knowledge, no archive. Value: one validated, agent-buildable contract.
- **Tier 1 — the loop.** Add ratification frontmatter, the two-PR pattern,
  graduation + `archive/`, `knowledge/`. Value: product memory and audit
  trail.
- **Tier 2 — the full system.** TTLs, decider budget, relations index,
  context budget, instrumentation. Value: parallel agents without
  coordination meetings.

A repo states its tier in `docs/conventions/doc-architecture.md`; doctor
checks only the rules of the declared tier. The worked end-to-end example
(spec → amendment → graduated knowledge doc → archived contract) lives
beside this proposal at `contracts/proposals/spec-flow-v2-example/`.

## When a rule is broken

Breaches are expected; the system defines recovery, not blame:

| Breach | Recovery |
|---|---|
| Doctor red on main | Fix-forward immediately; structural reds are always small. If recurring, the rule or the tier is wrong — amend the canon, don't route around it. |
| Graduation skipped (merged without it) | Run the graduation prompt retroactively; doctor's archive-integrity check finds the gap. |
| TTL quarantine | Decider chooses reshape or kill within one sitting. Quarantine never blocks unrelated work, so there is no pressure to cheat the date. |
| Gate bypassed (`ratified` without a human) | Revert the status flip; the spec returns to draft. `ratified_by` makes the bypass attributable. |
| Decider absent | Deputy decides; no deputy → defaults apply and the spec parks `blocked` with TTL at the decider's return. |

---

## Scope of this contract

Cross-system contracts, cross-system ADRs, and the glossary live in this
repo; repo-local specs, knowledge, and ADRs live in their repos. Test: does
another repo's agent need it to do its job?

## Migration map

| Repo | Moves |
|---|---|
| orchestrator | `features/`→`specs/`; `product/features/`→`knowledge/` (IDs kept); `product/decisions/`→`decisions/`; `product/architecture.md`→`architecture.md`; bugs fold into `specs/` as `type: bug` |
| assessment-platform | `features/`→`knowledge/`; add frontmatter; fix stale `docs/product/*` references; backfill 0090's missing `spec.md` or mark it discovery-stage |
| club_value | live `product/NN-*.md`→`specs/NNNN-slug/spec.md`; `features/*.md`→`knowledge/` flat files |
| salt | lowest priority: `*_prd.md`→`specs/`; remainder→`knowledge/` flat files; delete hand-maintained `index.md` |

Each migration is one agent run against this contract at Tier 0, verified by
doctor; tiers ratchet up per repo afterward.

## Open questions for ratification

- Permanent name. "Specline" is the working title.
- TTL defaults (proposed: `building` 7 days, `blocked` 14; per-repo
  override).
- Context budget number (proposed: spec + forced loads ≤ 50% of the
  weakest model's window in use, measured by doctor's byte proxy).
- Decider budget defaults (proposed: 3 building / 6 active).
- `doctor` distribution: vendored script per repo vs. single tool here.
- Cross-repo edge validation: doctor reading sibling-repo
  `relations-index.yml` files.
- Whether `strategy/` stays per-repo or centralizes here.
