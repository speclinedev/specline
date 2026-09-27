# Specline — Canon v3.1

**Status:** CURRENT — supersedes Canon v3.0.
**Canon version:** 3.1.0. Repos pin a canon version in `specline.yml` at
repo root; this contract changes first, repo conventions follow.

> **v3.1 — two normative parts, and one opt-in part.** *Part 1 — Writing a
> spec* is the contract a person writes and judges in one sitting. *Part 2 —
> Keeping the record* is the folder system, and the part the validator blocks on.
> *Part 3 — Unattended builds* is **experimental and opt-in**: in force only when
> `specline.yml` sets `unattended: true`. A spec is *attended* unless it says
> otherwise: a person, or an agent with the decider reachable, builds it, and the
> spec is edited by agreement as the build teaches. No spec has to merge before
> work begins: one branch may carry shaping, building, and graduation, and its
> approving merge is the record. Where a spec lives is its state: `drafts/` while
> shaping, `specs/` once approved. There are no tiers — one system, and one switch.
>
> **v2.6 — gate integrity, advise on taste** (still the law). Specline blocks only on *integrity*
> (facts that are false regardless of any opinion about good specs: a `specs/`
> folder with no `spec.md` — the constitutive file, so the spec doesn't exist —
> plus parse errors, dangling references, slug collisions, malformed/invalid
> frontmatter, archive edits). Every judgment about whether a spec is *good* —
> completeness, an auxiliary file like `relations.md`, sizing, mechanics (*Intent
> over description*),
> build-readiness — is **advisory**: it warns, never blocks, and the decider owns
> "enough." The practice is too young for taste to be law.
> Corollary — **Specline never models what another source of truth already owns:
> code owns mechanics, git owns history and approval.** So ratification is the
> decider's go recorded in git, not a frontmatter field.

"Specline" is the working name. Branding is an open question; the rules are
not.

**Versioning policy.** The canon version is `MAJOR.MINOR.PATCH`. **PATCH** —
prose only; no rule, key, state, or severity changes. **MINOR** — every spec
valid under X.Y stays valid; no previously-clean repo gains an integrity error.
Catching invalidity that was already there (a file that never parsed) is a fix,
not a break. **MAJOR** — a valid spec can become invalid.

---

> **Reading this document.** The *Changes from* sections below are history — the
> shaping record of each version, kept so a rule's origin is traceable. Where a
> changelog entry and the body of this document disagree, **the body governs**.

## Changes from v2.2

v2.3 keeps every v2.2 rule and adds the operating detail that came out of
running the methodology against a frontier, long-horizon model (Fable-class).
The amendments are concentrated where the model is most capable and therefore
most expensive to misdirect.

1. **Acceptance checks are partitioned** into `agent-loopable` and `human-gate`
   (§ B5, Spec body). The build loop's exit condition must be mechanically
   executable by the implementer at every iteration; an undifferentiated list
   hides it.
2. **`status.md` has a defined schema** (Spec folder anatomy). It is the agent's
   cross-iteration memory in a fresh-context loop.
3. **Spec body gains an Assumptions section** (assumptions + external dependencies).
   Contradictions live at the seams with systems the agent does not control.
4. **The reviewer has its own context recipe and is a fresh-context subagent**
   (Selective loading; Roles). Fresh-context verifiers outperform implementer
   self-critique.
5. **`blast_radius` frontmatter field** drives reviewer routing, implementer
   effort, and model selection (Frontmatter; Routing). The spec format and the
   cost-routing architecture are one decision.
6. **B6 is an advisory indicator, not a hard line.** Prescribed mechanics can
   anchor a strong implementer and go stale once code exists, so Specline flags
   them — but it warns; it never blocks. The right amount of mechanical detail is
   the decider's call (and depends on the target model), not the tool's. This is
   not yet measured; we hold it as a heuristic, not a law.
7. **Optional `target_model` / capability tier** (Frontmatter; Routing). Spec
   difficulty selects the planner; build difficulty selects the implementer.
8. **Agent-execution notes** (new short section). Operational constraints for
   the orchestrator loop with summarized-thinking, refusal-aware models.
9. **B2 is reframed for million-token windows** — it protects signal quality,
   not just capacity.

## Changes from v2.3

A refinement at one seam — between *shaped* and *built/verified* — all
**additive and non-breaking** (a v2.3 spec stays valid):

10. **Acceptance has three altitudes, not two.** `judgeable` joins `agent-loopable`
    and `human-gate` — settled by a fresh-context agent against a **named section**.
    Falsifiable (B5) is sharpened to *settleable-the-same-way-twice*, in three forms.
11. **The build loop is two loops.** A mechanical **inner** loop (implementer ↔
    provable checks) wrapped by a bounded-judgment **outer** loop (verifier ↔
    `judgeable` partition, with its own bounce budget). The reviewer finally has a
    home without holding the inner loop.
12. **One-Sitting is re-scoped** to the spec's *reviewability* (`appetite`), not the
    build's size. **`size: small|large`** is the new build-size axis; Specline nudges
    only on the *mismatch* (`size: small` over threshold), never on size itself.
13. **The parent-map** (`type: parent`) — decomposition into buildable scopes plus a
    parent that is a *map, not a plan*. Not a "bet."
14. **`specline.yml`** at repo root — the tunables (pins, thresholds, model map) move
    out of a fragile markdown table into machine-readable config.
15. **Vocabulary paid down.** TTL → **staleness** (`stale_after`) — TTL meant
    *discard on expiry*; we *escalate*. Context Budget → **coupling ceiling** — it is
    a structural ceiling measured at shaping, not a runtime budget. `blast_radius`,
    `ratify`, `quarantine`, `deputy`, `tombstone` stay: honest borrows.

## Changes from v2.4

Three changes at the *shaped → built* seam, all **additive and non-breaking** (a
v2.4 spec stays valid). Shaped against loop-engineering research and three
independent review passes; deliberately *small* — runner concerns and an
unearned learning-corpus were cut. (Shaping record: `docs/proposals/v2.5-amendment.md`.)

16. **The provable exit can't be self-gamed.** Acceptance checks are authored at
    ratification and **frozen relative to the implementer** for the build run — the
    builder never weakens the ruler it's measured by; a mid-build check change is
    legitimate **only** via re-ratification (since v3.0: a decider-approved change, not a field). And `loop_budget`
    exhaustion is an explicit **failure**, never a passing exit — the cheapest way out
    of the inner loop must be a real pass, not a drained budget.
17. **Corrections graduate into house rules.** A correction that **recurs across
    distinct specs** may be promoted one altitude — tasteable → a cited convention
    (judgeable) → a check (provable) — gated by recurrence + decider ratification,
    never automatic; one-off taste stays taste. Recorded in a required, shape-checked
    `## Corrections` section of `status.md` (with *who caught it*), folded into the
    permanent knowledge doc at graduation so the record survives the spec.
18. **Operator-scope fence.** Cross-project learnings about the *operator* (the
    decider's own taste across repos) are out of scope — they live in the operator's
    own memory, not any repo's `conventions/`.

---

## Changes from v2.8

v3.0 changes what the canon assumes about who is building, what it tells the
builder, and what it requires of the branch. The spec body does not change; a
v2.8 spec is a valid v3.0 spec with the same findings. Shaped from a run — the
decider authoring specs for an attended builder and finding it combative — and
revised after two independent fresh-context reviews. (Shaping record:
`docs/proposals/v3.0-amendment.md`.)

19. **A spec is attended unless it says otherwise.** One optional frontmatter
    key, `build: attended | unattended`; absence means attended. The key is a
    declaration the format carries, so nobody has to be asked, and it changes
    no rule's severity. It drives one advisory rule (`UNATTENDED-INCOMPLETE`)
    and tells a builder which posture and which chapter applies.
20. **Merge-first is not a rule.** No spec has to land on the merge target
    before work begins. One branch may carry shaping, building, and
    graduation; its approving merge is the record. Ratification is the
    decider's go recorded in git (B3). The slug freeze is tied to landing on
    the merge target, not to ratification.
21. **Amendment is a normal move.** Attended, the builder disagrees out loud,
    edits the spec in the branch once the decider agrees, and the diff is the
    record. The handback (blocked → amendment commit → resume) is for
    unattended builds only.
22. **The builder gets a brief.** A `build` prompt beside the `shape` prompt (both served by the Specline MCP, not part of this document),
    in the same partnership register.
23. **The canon reads attended-first.** The attended spec is described as the
    whole thing; the runner material — `status.md` schema, Promotion, the build
    loop, Routing, Agent-execution notes, the runner contract — is one later
    chapter, text unchanged.
24. **Contradictions removed.** Every remaining instruction to set
    `ratified_by`/`ratified_at` (abolished in v2.6), and the
    `distance_to_ratifiable` prose for an author-mode downgrade the engine
    retired.

---

## Changes from v3.0

v3.1 finishes the separation v3.0 started. It re-segments the canon into two
normative parts — *writing a spec* and *keeping the record* — plus one **opt-in**
part, *unattended builds*, in force only when a repo turns it on. Nothing is
deleted from the methodology: every v3.0 spec stays valid and produces the same
findings, so this is a MINOR under the versioning policy above. (Shaping record:
`docs/proposals/v3.1-amendment.md`.)

25. **Two normative parts.** Part 1, *Writing a spec*, is readable in one
    sitting. Part 2, *Keeping the record*, is the folder system and the part the
    validator blocks on. Ceremony that leaked from the third part into the first
    two is moved back.
26. **Unattended builds become opt-in.** One switch — `unattended: true` in
    `specline.yml`, default off. When off, Part 3's rules are not listed, its
    keys and states are recognised silently, and its chapter is not injected;
    every surface labels it **experimental**. When on, it is the same testable
    contract it was.
27. **Tiers are removed.** One system. The validator checks what is present;
    `unattended` is the only switch. `--mode` and `--tier` go with it.
28. **Approval is a folder move, and the lifecycle is location.** A spec being
    shaped lives in `docs/drafts/`; moving it to `docs/specs/` is the decider's
    go, recorded by git like any other change; graduation moves it on to
    `knowledge/` + `archive/`. The frontmatter `status` field is retired from
    `drafts/` and `specs/` — where a spec lives is its state — and survives only
    in `archive/` (`shipped | killed`), where location cannot tell the two apart.
    Existing `status:` lines (including `ratified`) are recognised silently. The
    sequence is not prescribed: shape, approve, build, and graduate may be one
    commit or several branches; Specline reads folders, not order.
29. **Acceptance is one list of falsifiable checks.** The three altitudes stop
    being required vocabulary in Part 1; an optional `### human` sub-heading
    marks the items only a person can settle (`### human-gate` in existing specs
    is recognised silently). The altitudes survive in Part 3 as a refinement.
30. **The Boundaries shrink to what governs writing and record-keeping.** Three
    writing rules — *One sitting*, *Falsifiable or draft*, *Intent over
    description* — and one record rule, *never delete a decision*. The coupling
    ceiling, staleness, the decider budget, and ratification's ceremony move to
    Part 3. The numbered seven-list is retired; body text cites rules by name.
31. **Contradictions removed, and a versioning policy added.** Author mode /
    gate mode collapse to one mode; slug uniqueness is per *feature*, so the
    `knowledge/` + `archive/` pair is the normal end state, not a collision;
    integrity always runs; the `stale_after` trigger is *building or blocked*
    everywhere. `RATIFIED-NO-BLAST-RADIUS` is retired (`UNATTENDED-INCOMPLETE`
    already checks `blast_radius`) and `RATIFIED-ACCEPTANCE-UNPARTITIONED`
    becomes `ACCEPTANCE-UNPARTITIONED`.

---

# Part 1 — Writing a spec

## What this is

A spec carries the decision so that whoever builds it — a person, an agent
beside you, or an agent alone overnight — builds what you meant. A spec is
**attended** unless it says otherwise: the builder can reach the decider, so the
spec need not anticipate every question, and it is edited by agreement as the
build teaches. Marking a spec **unattended** is a promise that a builder who
cannot ask has everything it needs; *Part 3 — Unattended builds* holds what
that promise requires. Either way the spec's job is what code can't say:
intent, non-goals, the decisions reserved to a human, and a falsifiable done.

Specline is, first and before anything else, a consistent way to write a feature
spec and a consistent place to keep it — beside the code, so whoever opens the
repo can hydrate on intent: what is being built, why, what was decided before,
what is still open, and what already shipped. Plans live inside the repo as
versioned, validated artifacts; work is built from them; shipped work graduates
into a permanent product memory; the full contract for every shipped feature is
archived, never deleted.

**Where a spec lives is its state.** Four folders under `docs/` carry the whole
lifecycle, and a spec is in exactly one of them:

| Location | Meaning |
|---|---|
| `drafts/<slug>/` | being shaped — an idea, not a commitment; may be incomplete, may be deleted |
| `specs/<slug>/` | approved for build — the decider's go was the move here |
| `knowledge/<slug>/` | shipped — what actually exists, written descriptively |
| `archive/<slug>/` | the contract as built, verbatim, read-only — `shipped` or `killed` |

How a spec moves between them — in one commit or several, on one branch or
many, shaped and approved and built in a single pull request or across weeks —
is yours. Specline reads folders, not order. Reshaping mid-build is normal.

### Claims, mechanisms, failure modes

Every claim below names the mechanism that produces it and the condition under
which it fails. A claim without a failure mode is marketing.

- **Cycle time in hours, not sprints.** Mechanism: specs sized to one review
  sitting (*One sitting*) and no ceremony calendar. Fails when: the decider's own
  queue is the bottleneck — cycle time is gated by PO queue depth.
- **Parallel delivery with minimal coordination.** Mechanism: the relations
  graph plus coordination-free slug allocation replace standups. Fails when:
  cross-repo edges are involved (validated weakly — see Specline) or the graph is
  stale (Specline on main prevents this).
- **Rework caught at the cheapest moment.** Mechanism: acceptance checks are
  settled inside the implementation PR (*Falsifiable or draft*), not at a demo.
  Fails when: checks are written unfalsifiably — which is why Specline
  flags an unfalsifiable acceptance for the decider before they merge.
- **Product memory that survives staff, vendors, and model upgrades.**
  Mechanism: graduation produces descriptive knowledge docs; archive preserves
  contracts. Fails when: graduation is skipped — which is why it is wired to the
  implementation PR.
- **Audit trail.** Mechanism: every shipped slug resolves to an archived spec
  (with its acceptance results) and a knowledge doc, traceable spec → decider →
  implementation PR → graduation. Fails when: archive integrity breaks — a
  Specline error.

What it does not claim: that structure substitutes for product judgment. The
system concentrates judgment at two gates and automates everything between.

---

## Writing rules

Scrum rations human time (sprints). Shape Up rations risk (appetite, the
six-week circuit breaker). Specline rations judgment. Three rules govern writing
a spec; everything after them is implementation.

**One sitting.** A spec must be small enough that the product owner
can read and judge the *contract* in a single review sitting. Human attention is
the **appetite** unit — appetite governs the spec's reviewability, **not the
build's size**. A large atomic build with a tight, one-sitting spec is eligible.
If you cannot review the spec in one pass, split it or decompose it
(parent-map); slugs are cheap. *(Judgment-only.)*

**Falsifiable or draft.** Every acceptance check must be **settleable the same
way twice**; "Improve the dashboard" names nothing anyone can settle. An item only a person can settle is
marked as such (see *Acceptance checks*). Specline surfaces an unfalsifiable or
absent acceptance as advisory — it is the decider's call, not a block. *(Specline
guarantees the spec is answerable; the people and agents building it answer it.)*

**Intent over description.** Documentation records what code cannot say:
goals, non-goals, rejected options, evidence, business rules, boundaries. Once
code exists it is the source of truth for mechanics, and prescribed mechanics in
a spec then both compete with it and go stale — the same reason ratification
belongs to git, not frontmatter: don't model what another source of truth owns.
**But this is a tradeoff, not a law, and it is not yet measured.** A spec
written before any code exists may legitimately carry worked mechanical detail —
there it is load-bearing scaffolding, not noise. So this rule is an **advisory
indicator**: Specline flags "this prescribes mechanics" the way it flags a thin
acceptance, and the decider — who knows whether code exists — decides.
*(Advisory only; never blocks. The heavier mechanical detail is best kept in
`knowledge/`/`technical/` and referenced, so the spec's own contract does not go
stale.)*

---

## Spec folder anatomy

```
docs/specs/slug/
├── spec.md               # REQUIRED. The build contract.
├── relations.md          # REQUIRED. Plain YAML, forward edges only. Empty lists are valid; absence is not.
├── open-questions.md      # REQUIRED while unresolved decisions exist.
├── discovery.md          # OPTIONAL. Customer evidence, research, rationale.
├── api.md                # OPTIONAL. Feature-specific API contract.
└── implementation.md     # OPTIONAL. The build-scratch: the "how" kept out of spec.md —
                          #   implementation proposals, mechanics, and suggested UI approach.
                          #   Advisory; does not graduate. (Adopts an engineering design-doc format.)
```

A repo's **design system / UI standards** are not a spec file — they are a
repo-level convention (alongside `architecture.md`, or under `conventions/`),
descriptive and ungated, the same shape as `architecture.md`. A spec proposes
*how* in `implementation.md`; it never carries the repo's design system.

### Frontmatter (in `spec.md`)

Required on every spec: `slug`, `type`, `decider`, `created`. A draft carries
only what is known.

```yaml
---
slug: ranch-mgmt        # the folder name; a spec's identity. must match the directory
type: feature           # feature | bug | chore | parent
decider: jonathan
created: 2026-06-10     # NOTE: the decider's go is recorded in git — no ratified_by/at field
---
```

Frontmatter is identity — nothing else. State is where the spec lives (see
*Where a spec lives*), so there is no `status` field to keep in step with the
folder; the one exception is `archive/`, where `status: shipped | killed` records
what location cannot. The graph lives only in `relations.md`. An agent triages
any spec from its path and its first ten lines. A `status:` line written against
an earlier canon is recognised silently.

### `spec.md` body

1. **Intent** — the product outcome in plain language, and the appetite: what
   one-sitting scope this spec deliberately fits.
2. **Goal** *(new in v2.3)* — a single falsifiable sentence: the observable
   outcome that means *done*. Intent is the *why*; the Goal is the one sentence
   that tells a reader whether the work is done. The acceptance checks (§8) are
   how it is settled; the Goal is what they are chosen to prove. If you can't
   state it falsifiably in one line, the feature isn't shaped yet.
3. **Non-goals** — explicit. This is where over-building is fenced off: what the
   work deliberately does not do, so nobody has to guess.
4. **Behavior** — observable, numbered, each verifiable from outside.
5. **Business rules** — `Must` / `Should` / `May`.
6. **Assumptions** *(new in v2.3)* — assumptions and external dependencies: what this spec
   takes as given about systems it does not control (APIs, upstream services,
   data shapes), and what to do at a contradiction. Contradictions live at
   seams; naming them tells whoever builds it where to **escalate fast** instead
   of working around a system it cannot change. Example: *"the
   pricing API cannot quote discontinued SKUs — render the no-quote state; do
   not synthesize a price."*
7. **Critical files** — pointers into existing code, not restatements of it.
8. **Acceptance checks** — one list, each item falsifiable: settleable the same
   way twice (*Falsifiable or draft*). Items only a person can settle — taste,
   product-fit, anything no check can falsify — sit under an optional `### human`
   sub-heading:

   ```markdown
   ## Acceptance checks
   - Composer renders the disabled state under a simulated 429
   - Limit tests pass for the provider ceiling

   ### human
   - The empty state reads as calm, not broken.
   ```

   `### human-gate` in a spec written against an earlier canon means the same
   thing and is recognised silently.
9. **Out of scope / deferred** — with slugs if already created.

Body sections are `##` headings carrying these names (the validator recognizes them
by name); `### human`, when present, is a `###` sub-heading under Acceptance
checks.

Write intent and rules richly; write mechanics sparsely (*Intent over
description*): once code exists it is the source of truth for mechanics, and the
spec's job is everything code can't say.

### Decomposition — the parent-map

When a feature is too big for one scope, it decomposes into buildable **scopes**
(ordinary specs) plus a **parent** that is a **map, not a plan** (`type: parent`).
Decomposition is the answer to one shaping question — *can this ship in
independently-valuable increments?* **Yes → decompose** into a parent-map plus
sequential scopes. **No → one large scope** (a tight spec over one big atomic
build) — correctly large, not ineligible.

- **The parent holds, once:** intent, shared non-goals, the load-bearing
  invariant(s), external dependencies, and an index of its child scopes (with
  status rollup — the parent ships when its scopes ship).
- **The parent forbids:** Goal-as-single-check, Behavior, acceptance — any
  mechanics. Its balloon-guard is symmetric to *One sitting*: **stay a map.** Specline
  flags a parent that grows mechanics (`PARENT-HAS-MECHANICS` — "decompose into
  scopes") or a parent with no children (`PARENT-NO-SCOPES` — "misfiled scope").
- **Work targets the scopes, never the parent.** A shared external dependency
  is declared once on the parent and **materialized as the first child scope**;
  downstream scopes `depend_on` it.

This is *committed* planning, so it lives in `specs/` like any spec — not a "bet,"
no wager or exploratory connotation. Scopes remain the default and the gravity
well; the parent appears only when a feature genuinely splits. A solo planner
doing one scope never writes one.

### No recursion

Sub-folders inside a spec folder are prohibited. A module needing sub-specs gives
each its own slug with `part_of: <slug>`. Flat folders with explicit edges beat
nested trees.

---

# Part 2 — Keeping the record

## Repository layout

```
docs/
├── architecture.md       # System shape, core areas, agent guidance. Read first.
├── conventions/          # Doc + code standards, templates, graduation prompt,
│   └── templates/        #   deciders + canon pin + model map
├── decisions/            # Repo-local ADRs. slug.md. Append-only once accepted.
├── strategy/             # Vision, roadmap snapshots, launch contracts. Dated; archived, not deleted.
├── technical/            # Cross-cutting implementation patterns. Only when non-obvious.
├── drafts/               # BEING SHAPED. Not a commitment. May be incomplete or deleted.
│   └── slug/             # Same anatomy as a spec; moving it to specs/ is the decider's go
├── specs/                # APPROVED FOR BUILD. Prescriptive. Temporary by design.
│   └── slug/             # One folder per feature; the folder name IS its identity
├── knowledge/            # SHIPPED reality. Descriptive. Permanent.
│   ├── slug/             # Graduated features (slug retained)
│   └── topic.md          # Domain docs that map to no single feature
├── archive/              # Terminal contracts. Permanent, read-only.
│   └── slug/             # Final spec.md (+ acceptance results link) of shipped,
│                         #   killed, and bug specs
└── relations-index.yml   # GENERATED by Specline --fix. Reverse edges. Never hand-edited.
```

The word "features" is retired (it meant four different things across four
repos); a bug is a spec with `type: bug`, and a decomposition parent is a spec
with `type: parent` (see Decomposition).

**Self-documenting folders.** Each recommended directory carries a `README.md` at
its root, so the structure explains itself in place — to a human reading it and to
an agent writing in it — without loading the full canon. The file uses one fixed
skeleton:

    # <folder>/ — <one-line purpose>
    What's here     what this directory holds
    How to write    the posture and the rule for authoring here
    How to read     how to interpret these docs; where the alternative lives
    What's not here what belongs in another directory instead

These READMEs are **generated from this canon, never hand-edited** — the
per-directory definitions in the layout above are their source. Each carries a
header marking it a generated artifact (`<!-- generated · canon 2.4 · do not edit ·
run: specline sync -->`), in the same class as `relations-index.yml`. `specline
init` writes them when a repo adopts Specline; `specline sync` (or `Specline --fix`)
regenerates them on a canon-version bump. Specline checks **drift** — a README that
no longer matches what the current canon would generate is a finding — but never
writes them: generation is the writer's job, the drift check is the validator's.

### Configuration — `specline.yml`

A repo's **tunables** — the numbers and names it calibrates to its own scale —
live in `specline.yml` at repo root, read deterministically by Specline (it
previously regexed a value out of a markdown table — fragile). It is the source
of truth for pins and thresholds; `docs/conventions/doc-architecture.md` is
demoted to optional prose/rationale. Absent → Specline falls back to canon defaults.

```yaml
# specline.yml
canon: 2.4.0-draft
unattended: false     # experimental — Part 3. default false
deciders: [jonathan]
deputy: null
staleness:            # the staleness windows (durations), per state
  building: 30 days   # frontmatter stale_after is computed from these
  blocked:  14 days
focus_limit:          # decider WIP — the decider-budget ceiling (per decider)
  building: 3
  active:   6
coupling_ceiling: 50%        # spec + forced loads, as % of context_window
context_window: 400000       # chars in the weakest in-use model's window (the coupling denominator)
suggest_slicing_past: 6      # acceptance/Behavior count above which Specline nudges to slice (while size: small)
review_rounds_before_human: 2  # outer-loop verifier↔implementer bounce budget
models:               # capability tier → real model
  light:    claude-haiku
  standard: claude-sonnet
  frontier: claude-opus
merge_target: main    # (v2.8, optional) the branch impl PRs merge into and
                      # graduation lands on; absent → the repo's default branch
```

*(v2.8)* `merge_target` is repo-level on purpose: a spec does not choose its
integration branch — the repo's process does. Per-spec targets would drift; the
runner and every graduation link read one truth here, falling back to the repo's
default branch when the key is absent.

**The boundary:** `specline.yml` tunes **thresholds and pins** — the *grain*, not
the *methodology*. It does **not** configure rules, schema, or partitions. Tune
the numbers; the rules are the canon's.

---

## Slugs and references

**A spec's identity is its slug — the folder name.** Lowercase-kebab,
descriptive, and **never reused for a different feature**. The same slug in
`knowledge/` and `archive/` is the normal end state of graduation, not a
collision; two *different* features wearing one slug is the collision the
validator blocks. There is no separate numeric id and no allocation counter:
the slug *is* the identifier, chosen by whoever creates the spec and carried
unchanged through graduation into `knowledge/` and `archive/`. Frontmatter
`slug:` must equal the folder name; the folder name is authoritative.

**Allocation needs no coordination.** Creating a spec is picking a descriptive
slug and making the folder — a purely local act, no shared counter to increment,
so parallel branches never contend on allocation. Two branches that pick
*different* slugs never collide. Two branches that pick the *same* slug collide
the way real conflicts should: a git add/add conflict on
`docs/specs/<slug>/spec.md` at merge — visible, blocking, and semantic ("these
are two different features; one renames"). The rule is **later-merger re-slugs**
— mechanical before the spec lands, because nothing may reference a slug that
has not landed yet. (Contrast the retired four-digit scheme, whose collisions
merged *silently*
— two `0006-*` folders are different paths — and surfaced only as a post-merge
lint, after edges may already have resolved to the wrong shell.)

**A landed slug is frozen.** Once a spec lands on the merge target its slug is
immutable — the sibling of "never renumbered" — because from then on other work
can reference it. The freeze is self-enforcing, not a dedicated
rule: renaming a spec that anything depends on dangles every inbound edge
(`RELATION-DANGLING`, an integrity error), and renaming an archived spec trips
`ARCHIVE-EDITED` — so a rename that would break a reference cannot pass the gate.
(Re-slugging *is* legal before the spec lands, precisely because nothing
references it yet.) Abandoning an approved spec does not free its slug: it moves
to `archive/` with `status: killed` and reason "abandoned", exactly like a kill,
so every approved slug resolves in `specs/ ∪ knowledge/ ∪ archive/` forever. A
draft is different: nothing may depend on it, so an unpursued draft may simply
be deleted — and a draft rejected for a reason worth keeping may be archived as
`killed` with its tombstone, at the decider's discretion.

**References cite slugs, never lifecycle-managed paths.** Write `spec ranch-mgmt`
or `depends_on: ranch-mgmt`. Resolution is
`glob docs/{drafts,specs,knowledge,archive}/ranch-mgmt/` — every approved slug resolves
*forever*, because terminal states land in `archive/`. The edge is
self-describing: a reader knows what `depends_on: ranch-mgmt` means without
dereferencing it. Cross-repo references use `repo:slug`; Specline validates
repo-local edges as errors and cross-repo edges as **warnings only**. Literal
paths are legal only for non-lifecycle docs (`docs/technical/...`,
`docs/decisions/...`) and Specline verifies them.

---

## `relations.md`

```yaml
depends_on:
  - people-management: person records provide candidate identity
part_of: []            # parent module, if this is a sub-feature
supersedes: []
conflicts_with: []
```

Forward edges only, authored. Reverse edges (`depended_on_by`) live in the
generated `docs/relations-index.yml`, maintained by `Specline --fix`. Every edge
carries a one-line *why* — the why is what lets a reader decide whether the
related doc is worth the context it costs to load.

## `open-questions.md`

Each entry is Specline-parsed and must carry: **who decides**, **the options**,
**the default**, and **the deadline**. An entry with a stated default and a
future deadline is **legal during `building`**: indecision becomes a logged
choice with an override window, and agents keep moving. Specline *warns* on
entries past deadline or missing a default or decider — advice the decider weighs
before merging, never a block.

## Selective loading

The file split exists for context economy and signal quality, not tidiness:

| Task | Load |
|---|---|
| Build | `spec.md`, `relations.md`, `open-questions.md`; related docs per edge whys |
| Product thinking / reshape | `discovery.md`, `open-questions.md`, spec Intent + Non-goals |
| **Review / verify** | **Acceptance checks, Non-goals, Business rules, Assumptions, and reverse edges from `relations-index.yml`** |
| Resume / triage | frontmatter, and `status.md` where one exists |

Context construction order for build work: conventions → `architecture.md` and
named cross-cutting docs → the spec folder per the table → related
specs/knowledge (`overview.md` first, deeper only if the edge's why warrants it)
→ ADRs citing this spec's slug.

---

## Roles and continuity

| Work | Owner |
|---|---|
| Deciding what to build, and that it's done | Decider (PO) — non-delegable |
| Answering `open-questions.md` | Named decider per entry |
| Drafting and critiquing specs | Agent (planner); PO edits |
| Building, testing, status upkeep | Whoever builds it — a person or an agent |
| Settling the acceptance checks | The builder, in the implementation PR |
| Graduation editing pass | Agent, triggered by PR |
| Structure validation | `Specline`, in CI |
| Meaning validation (tense, scope, sizing, prescribed mechanics) | Human |

Each repo's conventions name the deciders and one **deputy**. If a spec goes stale
or an open-question deadline passes while the decider is unavailable, the deputy
decides; with no deputy, whoever is building applies the entry's stated
default (that is what defaults are for) and the spec parks until the decider
returns. The system degrades to paused, never to improvised.

---

## Lifecycle

### One branch, or many

The folders fix what a spec *is*; git records how it got there, and the shape of
that is yours. One branch may carry all of it: the folder is created in
`drafts/`, moved to `specs/` when the decider says go, built against, graduated
into `knowledge/` + `archive/`, and one pull request's approving merge is the
record of contract, build, and graduation — traceable spec → decider → diff →
knowledge. Or the pieces land separately: a draft pushed to be shaped in the
open; a move to `specs/` merged on its own so a slug is claimed early or a build
can start later; the implementation and graduation in a following PR (the shape
an unattended runner needs — see Part 3). Every shape is legal; none is the rule.

What does not vary: the decider's go is the move into `specs/`, recorded by git
like any other change, and the approving merge of whatever carries the build is
the record. No frontmatter field records either. Humans decide and humans
accept; everything else is delegable. A spec no human approved did not need to
exist.

### Amendment (reshape) mechanics

The spec on the branch being built is the contract, and it changes as the build
teaches. The builder finds a contradiction, a gap, or a cheaper cut, and says so
in product terms. The decider agrees or not in the conversation. On
agreement the builder edits `spec.md` in the branch — acceptance checks included,
proposed before they are changed, never silently — and the diff is the record.
The approving merge ratifies the amended contract with the code. No folder move,
no separate PR, no re-approval ceremony: reshaping is a normal move.

Reshaping is a normal transition, not a failure; Specline's own
instrumentation expects a meaningful share of specs to change mid-build.

### Graduation

An **agent-executed editing pass wired to the implementation PR** — the trigger
is structural, because an unowned graduation step never happens. The prompt lives
at `docs/conventions/graduation.md` and:

1. Creates `docs/knowledge/slug/` — same slug, retained.
2. Moves the final `spec.md` (with acceptance-results link, frontmatter
   `status: shipped`) to `docs/archive/slug/`, preserved verbatim.
3. Writes knowledge docs: imperative → present descriptive, corrected to what
   actually shipped; applies *Intent over description* — keep intent, rules,
   rationale; cut anything
   code already says.
4. Folds in ADRs accepted during the build that changed behavior.
5. Carries forward edges into the knowledge folder's `relations.md`; runs
   `Specline --fix` to regenerate `relations-index.yml`.
6. Deletes the spec folder (the contract now lives in `archive/`).

When a `status.md` exists, its `## Corrections` records are carried forward too —
see *Corrections and promotion* in Part 3.

The result must read shorter and more confident than the spec. The human
acceptance gate reviews the graduated knowledge doc with the archived checks and
the `### human` acceptance items one click away — "is this what I decided?" is a
one-sitting question.

**Bugs** (`type: bug`): the implementation PR updates the corrected knowledge doc
(adding the bug slug to a `corrected_by` line) and archives the bug spec as
`shipped`. No knowledge folder is created; the slug resolves in `archive/` forever.

**Kills (and abandonment)**: an approved spec moves to `archive/` with
`status: killed` and a one-line tombstone stating why (a deliberate kill, or
"abandoned" for work dropped before ship). There is no bare-delete of an approved
spec — this is what makes every approved slug resolve forever. Slugs stay burned;
edges to a killed slug are Specline *warnings*. A draft may be deleted (see *Slugs
and references*).

### Precedence

ADR > spec > knowledge doc. ADRs cite affected slugs in their header. Archive is
historical record and outranks nothing.

### The record rule

**Never delete a decision.** An approved slug is permanent and archive is immutable: when
something ships, a knowledge doc lands and the spec is archived; when it is
killed, it is archived with a one-line tombstone. Nothing is bare-deleted. This
is the one rule the integrity checks exist to protect, and the reason every
approved slug resolves forever.

---

## Enforcement: the checks

The schema stands on its own: an agent can operate Specline from this canon
alone, and a PO can author conforming specs by hand. `Specline` adds **assurance,
not validity** — and its highest-value job is not the merge gate but watching a
spec stay in shape while a PO and an agent write it. It is deterministic — no
model, no judgment — and is specced in the `doctor` spec.

*Gate integrity, advise on taste* is the law, and this is where it is applied.
Specline runs in **one mode**: it reports every finding and exits nonzero when
any of them is an error. Integrity always runs — there is no switch that turns
it off. It blocks only on a `specs/` folder without `spec.md`, unparseable
frontmatter or `relations.md`, a slug that mismatches its folder, an out-of-set
enum, a dangling reference, a slug collision, a `status.md` in `knowledge/`, and
an edit to `archive/`. Everything else warns.

**Quarantine semantics.** Spec-scoped violations error only on PRs touching
that spec and warn repo-wide; repo-scoped violations error everywhere.

**Drafts are checked lightly.** In `drafts/` only the parse-level integrity
rules run — frontmatter parses, `slug` matches the folder, links and edges
resolve, the slug is not already taken — and no advisory rule fires: incomplete
is what a draft is for. Everything else in this catalog applies from `specs/`
onward.

**Self-describing.** Specline emits its own contract for agents: `Specline spec`
prints the pinned canon (for prompt injection), and `Specline rules` prints the
rule catalog — every `rule_id`, its severity, and its quarantine scope — as JSON
or markdown. An agent reads `Specline rules` to know exactly what it will be
checked against *before* it writes, not after. With `unattended` off the catalog
lists Parts 1 and 2 only, so nothing advertises a rule that will not fire.

**Version skew and unknown content.** The canon is versioned and will keep
changing, so Specline's posture toward content it does not recognize is defined,
not incidental: an unknown frontmatter key or unknown body section is
**preserved and warned**, never an error; a malformed *known* field
(unparseable frontmatter, a `slug` that mismatches its directory, an out-of-set
enum) is always an error — that is integrity; a *missing or incomplete* element —
an absent section, an unpartitioned acceptance — is an **advisory warning**, never
a block. The rule is: **fail the broken, advise on the rest** — a spec authored
against a newer canon must not hard-fail an older Specline over a key it simply has
not learned yet.

Every rule belongs to a part. Parts 1 and 2 always run; the Part-3 rules are
listed and run only when `unattended: true` (see Part 3). Checks — **(I)** =
integrity, blocks; **(A)** = advisory, warns only.

**Part 1 — the spec.**

- **(I)** Frontmatter parses (`FRONTMATTER-UNPARSEABLE`) and its `slug` matches
  the directory (`FRONTMATTER-SLUG-MISMATCH`); enum fields are in their allowed sets
  (`ENUM-INVALID`).
- **(I)** Every `specs/<slug>/` has a `spec.md` (`STRUCT-MISSING-SPEC`) — it is the
  constitutive file; without it the folder is not a spec (and its dir-derived slug
  would let other specs resolve relations to an empty shell). Quarantined: it blocks
  the spec it's on only when that spec is in `--changed`.
- **(A)** A spec with no **Goal** section (`GOAL-MISSING`) — one line carries the
  highest hydration value per character in the format, so its absence is advice.
- **(A)** `type: parent` carrying Behavior/acceptance → warn (`PARENT-HAS-MECHANICS`);
  `type: parent` listing no child scopes → warn (`PARENT-NO-SCOPES`).
- Unknown frontmatter key or body section → warn and preserve
  (`UNKNOWN-FRONTMATTER-KEY`, `UNKNOWN-SECTION`). **(A)**

**Part 2 — the record.**

- **(I)** Slug integrity: one feature per slug across `drafts/` + `specs/` +
  `knowledge/` + `archive/` — the `knowledge/` + `archive/` pair left by
  graduation is one feature, not a collision (`SLUG-DUPLICATE`). A landed slug is frozen by consequence, not a
  dedicated rule — renaming a referenced spec dangles its inbound edges
  (`RELATION-DANGLING`) and renaming an archived one trips `ARCHIVE-EDITED`. No
  counter, so no counter-gap check.
- **(A)** A `specs/<slug>/` also has `relations.md` (`STRUCT-MISSING-RELATIONS`) — an
  auxiliary file; its absence is completeness advice, not a gate.
- Every repo-local edge resolves at some lifecycle stage (`RELATION-DANGLING`,
  error); cross-repo edges warn-only (`RELATION-CROSS-REPO`); edges to `killed`
  slugs warn (`RELATION-KILLED`).
- **(I)** A `relations.md` that does not parse (`RELATION-UNPARSEABLE`) — a
  malformed *known* file is integrity, the same class as unparseable frontmatter.
- **(I)** Every relative path link under `docs/**` resolves (`LINK-DANGLING`);
  repo-local relation edges resolve (`RELATION-DANGLING`).
- **(I)** No `status.md` in `knowledge/` (`KNOWLEDGE-HAS-STATUS`); `archive/` is
  read-only (`ARCHIVE-EDITED`).
- `open-questions.md` entries parse (each a `##` heading carrying `decider:` /
  `options:` / `default:` / `deadline:` lines); an entry missing a decider or
  default warns (`OPEN-QUESTION-INCOMPLETE`); an entry past its `deadline` warns
  (`OPEN-QUESTION-OVERDUE`). **(A)**
- **(A)** The `canon:` pin in `specline.yml` disagreeing with the canon the
  validator carries, compared at MAJOR.MINOR (`CANON-PIN-MISMATCH`).
- `relations-index.yml` consistent with authored forward edges; `Specline --fix`
  regenerates it. *(planned — not yet enforced or generated.)*
- The decider's go is **not** modelled here: it is recorded in git, and git owns
  who and when (no `ratified_by`/`ratified_at` check).

Judgment-only rules (one-sitting sizing, prescribed mechanics, tense,
confidence) are out of Specline's scope and live with the decider.

**Enforcement status (honest).** Everything above without a *(planned)* tag is
implemented and tested. The deliberate gaps, and *why* they're deferred: items
needing **two file versions or commit history** — `Specline diff`, and the
"checks changed without a decider commit" check — can't run in Specline's
working-tree-only engine, so they belong at the diff/CI layer; `relations-index`
generation + `--fix` and full `target_model`→`models` resolution are simply not
built yet. The canon describes the whole contract; this note is the line between
what runs and what's promised.

---

## Adoption

Adopt **Part 1** first: `docs/drafts/` or `docs/specs/` and one spec folder, validated — one
agent-buildable contract, in an afternoon. Then adopt **Part 2**: the decider's
go in git, one branch or two, graduation, `archive/` and `knowledge/` — product
memory and an audit trail. **Part 3** is not a further stage but a switch — set
`unattended: true` in `specline.yml` if you run builds nobody is watching.

## When a rule is broken

| Breach | Recovery |
|---|---|
| Specline red on main | Fix-forward; structural reds are small. If recurring, amend the canon, don't route around it. |
| Graduation skipped | Run the graduation prompt retroactively; the archive-integrity check finds the gap. |
| Staleness quarantine | Decider chooses reshape or kill within one sitting. |
| **`loop_budget` exhausted** | The build loop escalated without converging. The decider reads the `status.md` Dead ends, then reshapes the spec (clearer Goal / better-specified checks) or takes the build over by hand. |
| Gate bypassed | Move the spec back to `drafts/`. |
| Decider absent | Deputy decides; no deputy → defaults apply, spec parks `blocked`. |
| **Blast-radius under-declared (found mid-build)** | **Re-ratify with the corrected value; the orchestrator re-routes effort/model. Logged to routing-accuracy instrumentation.** |

---

## Open questions for ratification

- Permanent name. "Specline" is the working title.
- Staleness defaults (proposed: `building` 30 days, `blocked` 14 — tied to sprint
  cadence; set in `specline.yml`).
- Coupling-ceiling number (proposed: spec + forced loads ≤ 50% of the weakest
  in-use model's window, by Specline's byte proxy).
- Decider focus-limit defaults (proposed: 3 building / 6 active).
- `suggest_slicing_past` (proposed: 6) and `review_rounds_before_human` (proposed:
  2) defaults.
- **`blast_radius` → effort/model mapping defaults, and the capability-tier
  vocabulary (`light|standard|frontier` vs. explicit model names).**
- **Whether `target_model` is authored or always derived.**
- `Specline` distribution and implementation language (tracked in the `doctor` spec).
- Cross-repo edge validation.

---

<!-- specline:unattended -->

# Part 3 — Unattended builds — experimental, opt-in

> **Experimental — in force only when `specline.yml` sets `unattended: true`.**
> Everything in this part is recognised silently and never checked when the
> switch is off.

Parts 1 and 2 are the whole of Specline for an attended build. This part is what
`build: unattended` adds in a repo that has set `unattended: true`: the promise
that a fresh-context builder who cannot ask has everything it needs, and the
contract an external runner runs against. None of it is required of an attended
spec. All of it was designed for a builder that is never in the room, and it is
kept here — text unchanged from v2.8 — for that builder. *The coupling ceiling*,
*Staleness*, and *The decider budget* below are the rules that govern unattended
and parallel builds.

An unattended spec carries the **envelope**: `blast_radius` (routing), `size`,
optional `target_model`, `stale_after` once building, `loop_budget`, and a
`status.md` in the schema below. `UNATTENDED-INCOMPLETE` reports what is missing.
The builder brief for this posture is the v2.8 one: frozen checks, status memory,
escalate at a boundary, never improvise past a contradiction. Two rules under
*Agent-execution notes* are hygiene for any builder, attended too: ground every
progress claim in a tool result, and pause only on a true gate.

## The rules that govern an unattended build

**The coupling ceiling.** A spec plus everything its relations force an agent to
load must fit under the repo's pinned ceiling with room left to think. This is
measured **once, at shaping time** — it is a structural property of the spec, not
a runtime budget the agent spends down. With million-token context windows the
binding constraint is no longer *fitting* the spec — it is **signal quality**:
irrelevant forced loads measurably degrade a frontier model's output, not just its
latency. Specline computes the proxy (total size of `spec.md` + transitively forced
loads) and warns on breach; read a breach as "this feature is too entangled," a
design smell, not a loading problem — slice it or decouple it. *(Specline: warn.)*

**Staleness.** `building` and `blocked` each carry a `stale_after` date — the
point past which an untouched build is presumed abandoned, not the point it is
discarded. Going stale **flags the spec**: Specline warns (it never blocks) so a
human notices an abandoned build. Exit is an explicit
reshape (a fresh approving merge) or kill (archive with tombstone).
Staleness is the *time* trigger of build-loop escalation; its *progress* twin is
`loop_budget` (see The build loop), which escalates on no convergence rather than
on elapsed time. *(Specline: advisory — staleness warns, it never blocks.)*

**The decider budget.** A named decider may have at most **3 specs in
`building`** and **6 in active states** (`building|blocked`) at once,
per-repo override allowed. Agent capacity is not the constraint; the decider's
queue is. WIP limits on humans, not on machines. *(Specline: advisory — warns over
the ceiling, never blocks.)*

**Frozen checks, and the envelope set once.** Unattended, there is nobody to ask,
so two things are settled before the run and not by the builder. The provable
acceptance checks are authored before the build and **frozen relative to the
implementer** for its duration — the builder never weakens the ruler it is
measured by, and a mid-build check change is legitimate only as a
decider-approved amendment commit (see *the unattended handback* below). The
envelope — `blast_radius`, `size`, optional `target_model`, `loop_budget` — is
the decider's judgment, proposed by the planner and confirmed at the same moment,
not a default the builder picks for itself.

## The `build` key and the unattended envelope

Set at the decider's go, proposed by the planner and confirmed by the decider:
`blast_radius`, `size` (default `small`). Optional, and written whenever the
posture is known: `build`. The **unattended envelope** — `target_model`,
`stale_after`, `loop_budget` — is checked only when `build: unattended`.

```yaml
---
slug: ranch-mgmt        # the folder name; a spec's identity. must match the directory
type: feature            # feature | bug | chore | parent
decider: jonathan
build: unattended        # OPTIONAL (v3.0): attended | unattended. Absent means attended; write it when known.
blast_radius: medium     # low | medium | high — declared risk; set at the decider's go (planner proposes, decider confirms)
size: small              # small | large — declared BUILD size; set at the decider's go. default small
target_model: standard   # OPTIONAL (unattended envelope): light | standard | frontier (mapped in conventions)
created: 2026-06-10      # NOTE: the decider's go is recorded in git — no ratified_by/at field
stale_after: 2026-06-18  # unattended envelope: set on entering building or blocked — see Staleness
loop_budget: 5           # OPTIONAL (unattended envelope): autonomy grant — see The build loop
---
```

**`build`** *(v3.0)* declares the build posture and is the only frontmatter key
that is a promise rather than a fact. Absent means **attended**: the builder can
reach the decider. `unattended` means a fresh-context builder who cannot ask has
everything it needs. `blast_radius`, `size`, `target_model`, `stale_after`, and
`loop_budget` are the **unattended envelope** — legal on any spec, checked for
completeness only when `build: unattended` (`UNATTENDED-INCOMPLETE`, advisory).
The key changes no rule's severity; it tells a builder or a runner which posture
and which part of this canon applies.

**`blocked`** belongs to this part alone: an unattended build that hits a
contradiction parks there — the `## State` token in `status.md` reads
`blocked: <why>` — until the amendment lands (see *the unattended handback*).
The build state of an unattended spec lives in `status.md`, never in
frontmatter; a `status: building|blocked` frontmatter line written against an
earlier canon is recognised silently.

**`blast_radius`** is the spec's declared risk surface — how much breaks if
this is wrong. It is the decider's judgment, not a default — the planner may
propose a value on a draft; it becomes the decider's at their go — and it drives
Routing (below): reviewer depth, implementer effort, and model tier. **`size`**
is the declared *build* size, set at the decider's go the way `blast_radius` declares
risk: `small` (default — one slice) or `large` (an atomic batch). It is the **build**
axis; `appetite` (*One sitting*) is the **review** axis — a spec can have a small
appetite and a large size at once (a tight contract over a big atomic build).
**`target_model`** optionally pins a capability tier; if absent, the orchestrator
derives one from `blast_radius` and the coupling-ceiling proxy.

**Escalation — `loop_budget` and `stale_after` coexist.** A build escalates
from autonomous back to a human gate at the **first** of two independent triggers,
so they never conflict:
- **`stale_after`** is the *time* trigger — wall-clock staleness (a build left open
  too long; catches abandonment).
- **`loop_budget`** is the *progress* trigger — the cap on autonomous build cycles
  with no green-checkpoint advance (catches thrashing, which can exhaust the budget
  long before the spec goes stale).
`loop_budget` is the PO's autonomy grant, set at the decider's go like
`blast_radius`.
The orchestrator defines what a "cycle" is and enforces both; Specline only validates
they are well-formed. Do not merge them — one measures time, the other progress.

## `status.md`

An unattended spec folder carries one more file:

    docs/specs/slug/
    └── status.md          # REQUIRED for unattended builds; optional otherwise.

### The schema *(new in v2.3)*

Required for unattended builds — it is the agent's memory across fresh-context
iterations, the thing a stateless re-entry cannot reconstruct from the diff.
Fixed sections, in order:

```markdown
## State          — first line: a handoff token (building|ready-for-review|blocked|escalated); then the one thing blocking forward motion
## Done           — completed, verifiable units
## In progress    — the unit being worked now, if any
## Last green checkpoint — most recent state known to pass its checks; the resume point
## Dead ends      — approaches tried and rejected, with the reason
## Corrections    — corrections made this build, each tagged by altitude and who caught it
```

Specline checks the **shape** (sections present and parseable), never the prose —
content is judgment. *Last green checkpoint* and *Dead ends* are the load-bearing
sections: they stop a fresh-context iteration from re-deriving history and
re-walking abandoned paths. *Corrections* is the promotion substrate (see Promotion):
it is **required and shape-checked** like the other load-bearing sections, so the
record a promotion reads from is never left to goodwill — and it **graduates into the
permanent knowledge doc** so it survives the spec folder's deletion.

**Machine-parseable entries.** Four sections carry a fixed *entry* convention so a
fresh-context loop (or an external runner) reads handoff state, the resume point, and
dead ends without interpreting prose:
- **State** *(token new in v2.7)* — the first line is a machine token from a fixed
  vocabulary — `building | ready-for-review | blocked: <why> | escalated: loop_budget
  | escalated: stale` — followed by the one thing blocking forward motion, in prose.
  This is the loop's **handoff signal**: it lets a fresh context — a different runner,
  or a human — tell "done, ready for review" apart from a crash without the runner's
  own process or side database.
- **Last green checkpoint** *(v2.3)* — one entry: `<ref> — <what passes here>`, where
  `<ref>` is a commit, tag, or check id (`none — <reason>` while still pre-green).
- **Dead ends** *(v2.3)* — one entry per line: `<approach> — <why it failed>`.
- **Corrections** *(v2.3)* — one entry per line:
  `<what was corrected> — <altitude: provable|judgeable|tasteable> — <who caught it: implementer|reviewer|decider>`.

It stays **markdown** — one human-readable file, no second data format. The
convention is enough for a tool to parse *and* a person to glance at; Specline checks
the entry shape, never the prose.

## Acceptance altitudes — an optional refinement

*Falsifiable or draft* (Part 1) asks only that every acceptance check be
**settleable the same way twice**. Unattended, that one list is refined into
three **altitudes** — the **handoffs between who certifies *done***, not three
flavors of test:

- **provable** (`agent-loopable`) — the **implementer's** exit condition. The goal is
  met, established by a runnable command where one fits, **or by the implementer's
  grounded assessment** against the code and its own tool results (evidence, not
  opinion). A runnable command is the strongest form, not the required form. *(v2.8)*
  An item MAY carry its command in a fixed entry shape — `<claim> — run:
  `​`<command>`​`` — one shell invocation whose exit 0 settles the claim true, so a
  runner, a fresh-context verifier, or a cockpit can settle it without interpreting
  prose. The suffix is never required; an item without it is the implementer's
  grounded assessment, unchanged. Provable
  checks are the ruler the builder is measured by, so the builder does not quietly
  weaken them. **Attended**, a check changes only by agreement: the builder proposes
  the change to the decider before making it, and the diff is the record.
  **Unattended**, checks are authored before the build and frozen relative to the
  implementer for the run (see *Frozen checks* above).
- **judgeable** — the **reviewer's** gate. A fresh-context agent judges the
  implementer's *interpretation* against a named spec section and the repo's
  standards. The named section is its falsifiability gate.
- **tasteable** (`human-gate`) — the **decider's** gate. Settled once, by a person.

```markdown
### agent-loopable
- Limit tests pass — run: `swift test --filter ProviderLimitTests`
- Composer renders the disabled state under a simulated 429
```

Grammar: `<claim> — run: `​`<command>`​`` — a single backtick-fenced shell
invocation; exit 0 settles the claim. A malformed `— run:` warns
(`CHECK-RUN-MALFORMED`, advisory); absence never fires anything.

The altitudes are layered judgment, on purpose: the implementer asserts done, the
reviewer independently checks the interpretation, the human accepts. Provable is
the implementer's word (grounded); judgeable is the check on it; tasteable is
final.

Partitioning acceptance this way is what makes a spec buildable unattended;
"Improve the dashboard" names nothing any of the three can settle. The partitions
are `###` sub-headings under Acceptance checks — `agent-loopable`, `judgeable`,
and `human-gate`, which is Part 1's `### human` set under its unattended name.
Specline surfaces an unpartitioned acceptance as advisory
(`ACCEPTANCE-UNPARTITIONED`) — it is the decider's call, not a block.
*(Specline, in the planning phase, warns when the partition is absent or a
`judgeable` item names no section. It does **not** — and cannot — check that the
implementer's grounded assessment was sound, or that the reviewer was right. That
judgment is the reviewer's, then the human's. Specline guarantees the spec is
*answerable*; the actors answer it.)*

## Amendment (reshape) — the unattended handback

There is no conversation to have, so an amendment is a handback:

1. Builder hits a contradiction → sets `status.md ## State` to `blocked: <why>`
   (`stale_after` per *Staleness*) and records it under *Dead ends* if an
   approach was abandoned.
2. The amendment lands as a **spec-amendment commit** touching only the spec
   folder. The builder may draft it; the decider (or deputy, per Roles) approves it
   and resets `stale_after` in the same commit. Nothing resumes on an unapproved draft.
3. `## State` returns to `building` and the build resumes against the amended
   contract.

## Corrections and promotion

Graduation (Part 2) carries the `## Corrections` records, when a `status.md`
exists, into the knowledge doc as the permanent promotion record — the cross-spec
recurrence signal Promotion reads from, which would otherwise die with the spec
folder when it is deleted.

### Promotion — corrections become house rules

A correction has an altitude. A correction that **recurs across distinct specs** may
be promoted down one altitude — tasteable → a cited convention (judgeable, in
`conventions/`) → a check (provable) — **gated by recurrence + the decider's
go**. Promotion is human-decided at the gate, never automatic; Specline does not
adjudicate it. A one-off correction **stays a one-off** — promoting it early buys
rigidity, not leverage. What separates a promoted rule from a flat note in a
project's agent file: it is **cited at acceptance** (*Falsifiable or draft*) and
**graded by the fresh verifier** — enforced, not merely written down. Recurrence
is observed by reading the
graduated `## Corrections` records across knowledge docs; a tool may assist once there
is data, but the canon names only the discipline, not the harvester.

Cross-project learnings about the **operator** — the decider's own taste and decision
patterns that recur across repos, independent of any one domain — are **out of
Specline's scope**. They belong in the operator's own memory layer (e.g. a global
agent file), **not** any repo's `conventions/`.

## The build loop *(new in v2.3)*

Between the two human gates, a feature is built by an **autonomous loop**, not a
single pass. This loop is what the deferred **orchestrator** runs (see Open
questions); the spec's whole job on the build side is to give the loop everything
it needs to run *without a human in each turn*. Drawn as a circle:

1. **Resume from memory.** Load `status.md` — the loop's cross-iteration memory.
   Start from the **Last green checkpoint** (the resume point) and read **Dead
   ends** so this iteration does not re-walk them.
2. **Work toward the Goal.** The **Goal** is the loop's *target* — the one
   falsifiable outcome it converges toward. Intent is the *why* (for the human);
   the Goal is the *destination* (for the loop).
3. **Establish the goal is met.** Work toward the Goal, then show it's met: run the
   **provable** (`agent-loopable`) checks where they are commands, and otherwise
   assess against the code and the session's tool results. The implementer's exit is
   *the goal is met, grounded in evidence* — a runnable suite going green is the
   strongest form of that evidence, not the only one. When the implementer judges the
   goal met, it stops and hands to review.
4. **Advance, or burn a cycle.** If an iteration moves a check from red to green,
   it records a new **Last green checkpoint** — that *is* a green-checkpoint
   advance. An iteration that makes no such advance spends one cycle of the
   **`loop_budget`**.
5. **Escalate at a boundary.** The loop runs autonomously until the **first** of
   two triggers fires: `loop_budget` exhausted (no progress) or `stale_after`
   reached (too much time). Either hands control back to a **human gate** — the
   gates are the loop's *boundary conditions*, not interruptions to it. Exhaustion
   is an explicit **failure handback** (the work is unconverged), never a passing
   exit: the cheapest way out of the loop must be a real pass, not a drained budget.
6. **Hand back via artifacts.** Across iterations and at handback, the loop
   communicates through **artifacts, tool results, and `status.md`** — never a
   reasoning transcript (see Agent-execution notes).

So the spec carries the loop's four inputs — **target** (Goal), **exit condition**
(the implementer's grounded judgment that the goal is met, provable checks where
they fit), **memory** (`status.md`), and **autonomy grant** (`loop_budget`, bounded
in time by `stale_after`) — and the two gates bracket it. Specline's role here is
**planning-phase only**: it checks the spec carries these inputs and is answerable.
It does not run the loop, and it cannot judge whether the build is good — that's the
reviewer, then the human.

**Two loops, not one.** The build loop above is really an *inner* loop wrapped by
an *outer* one:
- **Inner loop** — the **implementer** ↔ the Goal. It works until it can establish
  the goal is met — by a provable command where one fits, or by grounded assessment
  against the code — bounded by `loop_budget` / `stale_after`. The reviewer is
  correctly *absent* here; this is the implementer's own word, grounded in evidence.
- **Outer loop** — when the implementer asserts done, a **fresh-context reviewer**
  judges the **judgeable** partition: the implementer's *interpretation* against the
  named spec sections and the repo's standards (`conventions/`, `technical/`),
  including the nuanced bars — performance, security — the Goal can't state. Its own
  **bounce budget** (`review_rounds_before_human`); it gates the transition *to the
  human*, never the inner loop. This is the check on the implementer's self-assessment.

Both loops and their budgets are **named** here for the runner contract; the
orchestrator is external and pluggable, so the canon names them but does not
implement them.

A note on the word *loop*: it does double duty here. The **lifecycle loop**
(shape → ratify → build → graduate) is the feature's journey *across* the gates;
the **build loop** above is the autonomous run *inside* the build step. Unqualified,
"the loop" means the build loop.

---

## Routing: effort and model selection *(new in v2.3)*

The spec is the routing table. Agent time is nearly free, but agent *cost* is
not, and capability is not uniform across the models a repo uses. Two
independent axes decide who does the work:

- **Spec difficulty** — how much ambiguity and product judgment must be resolved
  to make the work buildable — selects the **planner**.
- **Build difficulty** — how long-horizon, how many compounding steps, how high
  the blast radius — selects the **implementer**.

|  | Easy to build | Hard to build (long-horizon) |
|---|---|---|
| **Easy to spec** | standard planner → light implementer | standard planner → frontier implementer |
| **Hard to spec** | frontier planner → light implementer | frontier planner → frontier implementer |

The leverage point is the spec: it is small, so premium tokens spent there are
cheap, and a high-quality spec is what lets a cheaper implementer one-shot work
it would otherwise botch — *provided the build is short-horizon*. Long-horizon
builds need a frontier implementer regardless of spec quality, because
sustained autonomy is a capability, not a specification.

**Cost estimation.** Specline's coupling-ceiling proxy (*The coupling ceiling*)
already computes the
dominant input to build cost. Combined with the agent-loopable acceptance count
and `blast_radius`, it yields a rough `expected_build_tokens`, which × the tier's
price gives a pre-build cost estimate at ratify time. This is an instrument, not
a gate.

**`blast_radius` → effort, and `judgeable` depth.** `low` → routine effort, no
separate verifier subagent required, and the `judgeable` partition may be empty
(like `human-gate` — the outer loop collapses); `medium` → high effort, verifier
subagent runs the agent-loopable checks and the `judgeable` partition; `high` →
maximum effort, fresh-context verifier mandatory, frontier tier unless overridden.
`blast_radius` gates the *depth* of the `judgeable` partition, not its existence;
it also sets the expectation for `size` (a `high` blast radius rarely fits
`size: small`).

Routing is convention the orchestrator reads; specs name capability tiers
(`light|standard|frontier`), and the per-repo model-tier map binds tiers to real
models, so the canon stays agent-agnostic.

---

## Agent-execution notes *(new in v2.3)*

Operational constraints for an orchestrator looping a summarized-thinking,
refusal-aware frontier model:

- **Do not ask agents to echo their reasoning.** Frontier models return
  summarized, not raw, thinking, and an instruction to transcribe or explain
  internal reasoning as response text can trigger a refusal and a fallback to a
  weaker model. The hand-back channel between implementer and verifier/reviewer
  is **artifacts and tool results**, plus `status.md` — never "explain why you
  did this."
- **Ground progress against tool results.** A status or acceptance claim must
  point to a tool result from the session; unverified work is reported as
  unverified. This is *Falsifiable or draft* applied to the loop, and it is what keeps a long
  unattended run from fabricating "done."
- **Pause only on a true gate.** The implementer ends its turn to ask the human
  (unattended: the deputy, or the entry's stated default — see Roles and continuity)
  only for a destructive/irreversible action, a real scope change, or input only
  the decider can provide (an `open-questions` entry with no usable default).
  Everything else proceeds on the stated default. This is the loop-level
  expression of the two human gates.

## The runner contract

**The orchestrator (build-loop runner) is external and pluggable.** Specline
defines the *contract* the loop runs against — Goal, agent-loopable checks,
`status.md`, `loop_budget`/`stale_after`, the inner/outer loop budgets, routing —
and does **not** build the
*runner*. A capable model self-orchestrates a single spec (e.g. an agent + a thin
loop harness); a fuller external orchestrator adds what one model can't do for
itself: fresh-context re-entry, parallel scheduling across the decider budget,
model-tier routing, and fresh-context verifier subagents.

**The runner contract is file-observable state, not a wire format.** A runner may
signal internally however it likes — exit codes, a queue, a database — but to be
Specline-compliant it must externalize three things into the spec folder, so the
work survives the runner and a fresh context, a *different* runner, or a human can
resume from the folder alone:
1. **Handoff state** — `status.md ## State`'s machine token
   (`building | ready-for-review | blocked | escalated`), so "done, ready for
   review" is distinguishable from a crash without consulting the runner's process.
2. **Bounce verdict** — when the reviewer bounces, its blocking findings land in
   `status.md` (a `## Review` block, or folded into `## Corrections`) *before*
   handback, so the next implementer iteration reads them from the folder, not a
   side channel or an injected prompt.
3. **Escalation reason** — on `loop_budget` / `stale_after` / `review_rounds_before_human`
   exhaustion, the reason is written to `## State` and `## Dead ends` before the
   work parks as blocked.

*(v2.8, non-normative)* A runner executing the runnable subset of
`agent-loopable` checks (the `— run:` entry shape) SHOULD record results against
the item text in its own state and reflect advances in `status.md`'s Last green
checkpoint. Guidance on using the signal well — not a fourth MUST-item; the three
above are about handoff survivability.

*(v3.0, non-normative)* No spec has to land on the merge target before a build
begins (Lifecycle), so a runner that executes frozen checks has no third-party-
witnessed baseline by default. A runner SHOULD declare in its own contract doc
how it obtains one — for example by requiring the spec landed before it starts,
or by pinning the spec folder's commit at build start and diffing `spec.md`
against it before accepting a pass. The canon names the concern and requires
neither mechanism; Specline's working-tree engine can verify neither.

Everything else — the transport, the on-the-wire finding schema, scheduling,
model routing — is the runner's own business and belongs in *its* runner-contract
doc, not here. That split is what keeps a runner interoperably Specline-compliant
rather than the only runner that can read its own state.

## Roles in an unattended build

| Work | Owner |
|---|---|
| Agent-loopable acceptance execution | Implementer, in the implementation PR |
| Verification against the spec (the `judgeable` partition, outer loop) | **Fresh-context verifier subagent**, not the implementer self-critiquing |

The **verifier is a separate, fresh-context subagent**: in testing, fresh-context
verification outperforms self-critique, because the agent that wrote the code
shares its blind spots. The implementer loops on the agent-loopable checks; the
verifier independently confirms them — loading reverse edges as well as forward
ones, so it catches integration breakage a *sibling* spec depends on, the failure
the implementer cannot see — before the human acceptance gate.

## Enforcement: the Part-3 checks

These are listed by `Specline rules` and run only when `specline.yml` sets
`unattended: true`; they are tagged `experimental`. With the switch off, the keys,
states, and partition headings they read are recognised silently — a repo that
turns the switch off does not suddenly error.

- **(A)** Acceptance that is not partitioned — the `agent-loopable` set present
  and labeled (`ACCEPTANCE-UNPARTITIONED`, renamed from
  `RATIFIED-ACCEPTANCE-UNPARTITIONED` and no longer keyed to a status) — is
  *warned*: build-readiness advice, not a block. `RATIFIED-NO-BLAST-RADIUS` is
  retired; `UNATTENDED-INCOMPLETE` already checks `blast_radius`.
- **(A)** *(v3.0)* `build: unattended` with the unattended envelope incomplete —
  `blast_radius`, `loop_budget`, or (once building) `stale_after` absent, or no
  `status.md` — warns (`UNATTENDED-INCOMPLETE`): the distance to unattended-ready,
  reported the moment the promise is made. Absence of the `build` key never fires
  anything; a `build` value outside `attended|unattended` is `ENUM-INVALID` (I).
- **A `judgeable` acceptance item cites a spec section to verify against
  (`JUDGEABLE-NO-SECTION`); else it is not falsifiable
  (*Falsifiable or draft*).**
- **(A)** *(v2.8)* an `agent-loopable` item containing `— run:` whose remainder is
  not a single backtick-fenced command → warn (`CHECK-RUN-MALFORMED`): the shape is
  opt-in, so its malformation can only ever be advice; absence of the suffix never
  fires anything.
- **`size: small` with measured size (acceptance/Behavior count) over
  `suggest_slicing_past` → warn (`SCOPE-EXCEEDS-SIZE`): slice it, or declare
  `size: large` if it's atomic. Specline raises the question; the human answers.**
- **`status.md`, when present, conforms to the schema (required sections present
  and parseable). Shape only; never prose.** This now includes a `## Corrections`
  section whose entries carry the fixed `<what> — <altitude> — <who caught it>` shape
  (`CORRECTIONS-MALFORMED`); a graduating unattended spec missing it is flagged so the promotion
  record survives into `knowledge/`.
- **(A)** `loop_budget`, if present, is a well-formed autonomy grant
  (`LOOP-BUDGET-INVALID`).
- **`target_model`/`blast_radius` values, if present, are from the allowed sets
  (`ENUM-INVALID`).** Resolving `target_model` against the repo's configured
  `models` map is *(planned — only the fixed set is checked today).*
- **(A)** `building` or `blocked` past `stale_after` → warn
  (`STALE-QUARANTINE`, *Staleness*): an untouched build is presumed stale —
  advice to a human, never a block.
- **(A)** Decider focus limit: over the configured `building`/`active` ceiling per
  decider → warn (`DECIDER-OVER-BUDGET`, *The decider budget*).
- Coupling-ceiling proxy (`spec.md` + transitively forced loads) vs.
  `coupling_ceiling`% of `context_window` → warn (`COUPLING-CEILING`, *The
  coupling ceiling*).
- **(A)** A shipped, archived spec without a linked `acceptance_results` is warned
  (`ARCHIVE-NO-ACCEPTANCE`, *Falsifiable or draft*) — the structural proxy for
  "graduation ran the acceptance checks."
- A duplicated required `status.md` section → warn (`STATUS-SCHEMA`). **(A)**

**Amendment diff** *(planned — needs two file versions, so it sits at the diff/CI
layer, not the working-tree engine).* `Specline diff <before> <after>` classifies what changed
between two versions of a spec — substantive (Behavior, Business rules,
Acceptance) vs. status-only. This is what makes the mid-build revision-rate
instrument mechanical rather than a manual read — and, for an unattended build, it
is the rule that enforces the **frozen provable checks**: an acceptance-check
change no decider-approved commit accompanies is flagged, since the builder must
not weaken the ruler it is measured by.

## Instrumentation

All computable from frontmatter + `archive/` + git. Diagnostic instruments,
never targets (Goodhart).

- **Lead time** — `created` → `shipped`.
- **Mid-build revision rate** — % of shipped specs whose contract sections
  changed between the decider's go and archive (computed by `Specline diff`).
  Expected band ~10–40%. Near zero → waterfall; far above → shaping too thin.
  Read it; don't chase it.
- **Staleness outcomes** — breach count and the reshape/kill split.
- **Graduation latency** — implementation merge → knowledge doc. Target: same PR.
- **Specline pass rate on main** — should be 100%.
- **Routing accuracy** *(new)* — predicted vs. actual build cost by tier, and the
  rate of `blast_radius` upgrades discovered mid-build. A persistent gap means
  the routing heuristic, not the spec, is wrong.
