# Specline — Canon v2.6

**Status:** CURRENT — supersedes Canon v2.5.
**Canon version:** 2.7.0. Repos pin a canon version in `specline.yml` at
repo root; this contract changes first, repo conventions follow.

> **v2.6 — gate integrity, advise on taste.** Specline blocks only on *integrity*
> (facts that are false regardless of any opinion about good specs: a `specs/`
> folder with no `spec.md` — the constitutive file, so the spec doesn't exist —
> plus parse errors, dangling references, ID collisions, malformed/invalid
> frontmatter, archive edits). Every judgment about whether a spec is *good* —
> completeness, an auxiliary file like `relations.md`, sizing, mechanics (B6),
> build-readiness — is **advisory**: it warns, never blocks, and the decider owns
> "enough." The practice is too young for taste to be law.
> Corollary — **Specline never models what another source of truth already owns:
> code owns mechanics, git owns history and approval.** So ratification is the
> approving merge to main (git's record), not a frontmatter field.

"Specline" is the working name. Branding is an open question; the rules are
not.

---

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
    legitimate **only** via re-ratification (a `ratified_at` bump). And `loop_budget`
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

## What this is

You shape a feature with one agent, and a different agent builds it — fresh
context, never in the room, unable to ask what you meant. So the spec has to carry
the whole decision. That single constraint shapes everything below.

Specline is a methodology for documenting product work so AI agents can build
from it — used by one product owner directing many AI agents of varying skill
and cost. Plans live inside the repo as versioned, validated artifacts; agents
build from them; shipped work graduates into a permanent product memory; the
full contract for every shipped feature is archived, never deleted. The
methodology rations the three resources that are scarce in agent-driven delivery
— **human judgment, context, and verification** — and treats agent time as
nearly free.

The loop:

```
SHAPE ──► RATIFY ──► BUILD ──► GRADUATE (+ ARCHIVE)
(agent+PO)  (PO)    (agent)        (agent)
   ▲___________________│
     reshape is normal
```

### Claims, mechanisms, failure modes

Every claim below names the mechanism that produces it and the condition under
which it fails. A claim without a failure mode is marketing.

- **Cycle time in hours, not sprints.** Mechanism: specs sized to one review
  sitting (B1) and no ceremony calendar. Fails when: the decider budget (B7) is
  breached — cycle time is gated by PO queue depth, which is why B7 exists.
- **Parallel delivery with minimal coordination.** Mechanism: the relations
  graph plus deterministic ID allocation replace standups. Fails when:
  cross-repo edges are involved (validated weakly — see Specline) or the graph is
  stale (Specline on main prevents this).
- **Rework caught at the cheapest moment.** Mechanism: agent-loopable
  acceptance checks are executed inside the implementation PR (B5), not at a
  demo. Fails when: checks are written unfalsifiably — which is why Specline
  flags an unfalsifiable acceptance for the decider before they merge.
- **Right model on the right work.** Mechanism: `blast_radius` and the
  coupling-ceiling proxy let the orchestrator route effort and model per spec.
  Fails when: the spec under-declares its risk — which is why blast_radius is a
  ratification-time judgment, not a default.
- **Product memory that survives staff, vendors, and model upgrades.**
  Mechanism: graduation produces descriptive knowledge docs; archive preserves
  contracts. Fails when: graduation is skipped — which is why it is wired to the
  implementation PR.
- **Audit trail.** Mechanism: every shipped ID resolves to an archived spec
  (with its acceptance results) and a knowledge doc, traceable spec → ratifier →
  implementation PR → graduation. Fails when: archive integrity breaks — a
  Specline error.

What it does not claim: that structure substitutes for product judgment. The
system concentrates judgment at two gates and automates everything between.

---

## The Boundaries

Scrum rations human time (sprints). Shape Up rations risk (appetite, the
six-week circuit breaker). Specline rations judgment, context, and
verification. These seven rules are the system; everything after them is
implementation. Each is either Specline-enforced or names its gate.

**1. The One-Sitting Rule.** A spec must be small enough that the product owner
can read and judge the *contract* in a single review sitting. Human attention is
the **appetite** unit — appetite governs the spec's reviewability, **not the
build's size**. A large atomic build with a tight, one-sitting spec is eligible;
build size is governed by `size`, `blast_radius`, and `loop_budget`, not by this
rule. If you cannot review the spec in one pass, split it or decompose it
(parent-map); IDs are cheap. *(Gate: ratification. Judgment-only.)*

**2. The Coupling Ceiling.** A spec plus everything its relations force an agent
to load must fit under the repo's pinned ceiling with room left to think. This is
measured **once, at shaping time** — it is a structural property of the spec, not
a runtime budget the agent spends down. With million-token context windows the
binding constraint is no longer *fitting* the spec — it is **signal quality**:
irrelevant forced loads measurably degrade a frontier model's output, not just its
latency. Specline computes the proxy (total size of `spec.md` + transitively forced
loads) and warns on breach; read a breach as "this feature is too entangled," a
design smell, not a loading problem — slice it or decouple it. *(Specline: warn.)*

**3. The Human Gate.** Humans ratify and humans accept. Ratification is the named
human's **approving merge to the main branch** — git records who and when, so the
stamp already has a name on it; Specline does not duplicate that in frontmatter.
Everything else is delegable to agents. A spec no human approved into the main
tree did not need to exist. *(Specline: advisory only — ratification is a git
fact, not a doc field. Whether the human actually read it remains judgment — no
system detects attention, only the merge record.)*

**4. Staleness.** `building` and `blocked` each carry a `stale_after` date — the
point past which an untouched build is presumed abandoned, not the point it is
discarded. Going stale **flags the spec**: Specline warns (it never blocks) so a
human notices an abandoned build. Exit is an explicit
reshape (a fresh approving merge) or kill (archive with tombstone).
Staleness is the *time* trigger of build-loop escalation; its *progress* twin is
`loop_budget` (see The build loop), which escalates on no convergence rather than
on elapsed time. *(Specline: advisory — staleness warns, it never blocks.)*

**5. Falsifiable or Draft.** Falsifiable means **settleable the same way twice** —
and the three altitudes are the **handoffs between who certifies *done***, not three
flavors of test:

- **provable** (`agent-loopable`) — the **implementer's** exit condition. The goal is
  met, established by a runnable command where one fits, **or by the implementer's
  grounded assessment** against the code and its own tool results (evidence, not
  opinion). A runnable command is the strongest form, not the required form. Provable
  checks are **authored before the build and frozen relative to the implementer** for
  the build run: the builder does not weaken the ruler it is measured by. Changing a
  check mid-build is legitimate only as a fresh decider-approved change (a new merge),
  not a unilateral implementer edit.
- **judgeable** — the **reviewer's** gate. A fresh-context agent judges the
  implementer's *interpretation* against a named spec section and the repo's
  standards. The named section is its falsifiability gate.
- **tasteable** (`human-gate`) — the **decider's** gate. Settled once, by a person.

Partitioning acceptance this way is what makes a spec buildable; "Improve the
dashboard" names nothing any of the three can settle. Specline surfaces an
unpartitioned acceptance as advisory — it is the decider's call, not a block.
*(Specline, in the planning phase, warns when the partition is absent or a
`judgeable` item names a section. It does **not** — and cannot — check that the
implementer's grounded assessment was sound, or that the reviewer was right. That
judgment is the reviewer's, then the human's. Specline guarantees the spec is
*answerable*; the actors answer it.)*

**6. Intent Over Description.** Documentation records what code cannot say:
goals, non-goals, rejected options, evidence, business rules, boundaries. Once
code exists it is the source of truth for mechanics, and prescribed mechanics in
a spec then both compete with it and go stale — the same reason ratification
belongs to git, not frontmatter: don't model what another source of truth owns.
A frontier implementer reads code better than a spec can describe it, so for that
target, mechanics in the spec tend to anchor and bloat rather than help. **But
this is a tradeoff, not a law, and it is not yet measured.** A weaker target model,
or a pre-build spec where no code exists yet, may legitimately carry worked
mechanical detail — there it is load-bearing scaffolding, not noise. So B6 is an
**advisory indicator**: the spec-critic flags "this prescribes mechanics" the way
it flags a thin acceptance, and the decider — who knows the target model and
whether code exists — decides. *(Advisory only; never blocks. The heavier
mechanical detail is best kept in `knowledge/`/`technical/` and referenced, so a
weak model still gets it in context without the ratified contract going stale.)*

**7. The Decider Budget.** A named decider may have at most **3 specs in
`building`** and **6 in active states** (`ratified|building|blocked`) at once,
per-repo override allowed. Agent capacity is not the constraint; the decider's
queue is. WIP limits on humans, not on machines. *(Specline: advisory — warns over
the ceiling, never blocks.)*

---

## Roles and continuity

| Work | Owner |
|---|---|
| Deciding what to build, and that it's done | Decider (PO) — non-delegable |
| Answering `open-questions.md` | Named decider per entry |
| Drafting and critiquing specs | Agent (planner); PO edits |
| Building, testing, status upkeep | Agent (implementer) |
| Agent-loopable acceptance execution | Implementer, in the implementation PR |
| Verification against the spec (the `judgeable` partition, outer loop) | **Fresh-context verifier subagent**, not the implementer self-critiquing |
| Graduation editing pass | Agent, triggered by PR |
| Structure validation | `Specline`, in CI |
| Meaning validation (tense, scope, sizing, B6) | Human, at the two gates |

The **verifier is a separate, fresh-context subagent**: in testing, fresh-context
verification outperforms self-critique, because the agent that wrote the code
shares its blind spots. The implementer loops on the agent-loopable checks; the
verifier independently confirms them and the reviewer-recipe context (below)
before the human acceptance gate.

Each repo's conventions name the deciders and one **deputy**. If a spec goes stale
or an open-question deadline passes while the decider is unavailable, the deputy
decides; with no deputy, the agent applies the entry's stated default (that is
what defaults are for) and the spec flips to `blocked` with `stale_after` set to the
decider's stated return. The system degrades to paused, never to improvised.

---

## Repository layout

```
docs/
├── architecture.md       # System shape, core areas, agent guidance. Read first.
├── conventions/          # Doc + code standards, templates, graduation prompt,
│   └── templates/        #   deciders + canon pin + model-tier map
├── decisions/            # Repo-local ADRs. slug.md. Append-only once accepted.
├── strategy/             # Vision, roadmap snapshots, launch contracts. Dated; archived, not deleted.
├── technical/            # Cross-cutting implementation patterns. Only when non-obvious.
├── specs/                # IN-FLIGHT work. Prescriptive. Temporary by design.
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
with `type: parent` (see Decomposition). The model-tier map (new in v2.3) lives
in conventions: it maps capability tiers named in specs (`light|standard|frontier`)
to the actual models a repo uses, so specs stay agent-agnostic.

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
live in `specline.yml` at repo root, read deterministically by Specline (which
previously regexed the tier out of a markdown table — fragile). It is the source
of truth for pins and thresholds; `docs/conventions/doc-architecture.md` is
demoted to optional prose/rationale. Absent → Specline falls back to canon defaults.

```yaml
# specline.yml
canon: 2.4.0-draft
tier: 1
deciders: [jonathan]
deputy: null
staleness:            # the staleness windows (durations), per state
  building: 30 days   # frontmatter stale_after is computed from these
  blocked:  14 days
focus_limit:          # decider WIP — the B7 ceiling (per decider)
  building: 3
  active:   6
coupling_ceiling: 50%        # B2 — spec + forced loads, as % of context_window
context_window: 400000       # chars in the weakest in-use model's window (the coupling denominator)
suggest_slicing_past: 6      # acceptance/Behavior count above which Specline nudges to slice (while size: small)
review_rounds_before_human: 2  # outer-loop verifier↔implementer bounce budget
models:               # capability tier → real model
  light:    claude-haiku
  standard: claude-sonnet
  frontier: claude-opus
```

**The boundary:** `specline.yml` tunes **thresholds and pins** — the *grain*, not
the *methodology*. It does **not** configure rules, schema, or partitions. Tune
the numbers; the rules are the canon's.

---

## IDs and references

**A spec's identity is its slug — the folder name.** Lowercase-kebab,
descriptive, repo-unique across `specs/ ∪ knowledge/ ∪ archive/`, never reused.
There is no separate numeric id and no allocation counter: the slug *is* the
identifier, chosen by whoever creates the spec and carried unchanged through
graduation into `knowledge/` and `archive/`. Frontmatter `slug:` must equal the
folder name; the folder name is authoritative.

**Allocation needs no coordination.** Creating a spec is picking a descriptive
slug and making the folder — a purely local act, no shared counter to increment,
so parallel branches never contend on allocation. Two branches that pick
*different* slugs never collide. Two branches that pick the *same* slug collide
the way real conflicts should: a git add/add conflict on
`docs/specs/<slug>/spec.md` at merge — visible, blocking, and semantic ("these
are two different features; one renames"). The rule is **later-merger re-slugs**
— mechanical before ratification, because nothing may reference an unratified
slug. (Contrast the retired four-digit scheme, whose collisions merged *silently*
— two `0006-*` folders are different paths — and surfaced only as a post-merge
lint, after edges may already have resolved to the wrong shell.)

**A ratified slug is frozen.** Once a spec merges to main its slug is immutable —
the sibling of "never renumbered." The freeze is self-enforcing, not a dedicated
rule: renaming a spec that anything depends on dangles every inbound edge
(`RELATION-DANGLING`, an integrity error), and renaming an archived spec trips
`ARCHIVE-EDITED` — so a rename that would break a reference cannot pass the gate.
(Re-slugging *is* legal before ratification, precisely because nothing references
it yet.) Abandoning a spec does not free its slug: it moves to `archive/` with
`status: killed` and reason "abandoned", exactly like a kill, so every ratified
slug resolves in `specs/ ∪ knowledge/ ∪ archive/` forever.

**References cite slugs, never lifecycle-managed paths.** Write `spec ranch-mgmt`
or `depends_on: ranch-mgmt`. Resolution is
`glob docs/{specs,knowledge,archive}/ranch-mgmt/` — every ratified slug resolves
*forever*, because terminal states land in `archive/`. The edge is
self-describing: a reader knows what `depends_on: ranch-mgmt` means without
dereferencing it. Cross-repo references use `repo:slug`; Specline validates
repo-local edges as errors and cross-repo edges as **warnings only**. Literal
paths are legal only for non-lifecycle docs (`docs/technical/...`,
`docs/decisions/...`) and Specline verifies them.

---

## Spec folder anatomy

```
docs/specs/slug/
├── spec.md               # REQUIRED. The build contract.
├── relations.md          # REQUIRED. Forward edges only. "none" is valid; absence is not.
├── open-questions.md      # REQUIRED while unresolved decisions exist.
├── status.md             # REQUIRED for autonomous builds; defined schema below.
├── discovery.md          # OPTIONAL. Customer evidence, research, rationale.
├── api.md                # OPTIONAL. Feature-specific API contract.
└── implementation.md     # OPTIONAL. The build-scratch: the "how" B6 keeps out of spec.md —
                          #   implementation proposals, mechanics, and suggested UI approach.
                          #   Advisory; does not graduate. (Adopts an engineering design-doc format.)
```

A repo's **design system / UI standards** are not a spec file — they are a
repo-level convention (alongside `architecture.md`, or under `conventions/`),
descriptive and ungated, the same shape as `architecture.md`. A spec proposes
*how* in `implementation.md`; it never carries the repo's design system.

### Frontmatter (required, in `spec.md`)

```yaml
---
slug: ranch-mgmt        # the folder name; a spec's identity. must match the directory
type: feature            # feature | bug | chore | parent
status: building         # draft | ratified | building | blocked | shipped | killed
decider: jonathan
blast_radius: medium     # low | medium | high — declared risk; advised before build (routing)
size: small              # small | large — declared BUILD size (small = one slice; large = an atomic batch). default small
target_model: standard   # OPTIONAL: light | standard | frontier (capability tier, mapped in conventions)
created: 2026-06-10       # NOTE: ratification is the approving merge to main — git owns who/when; no ratified_by/at field
stale_after: 2026-06-18  # set on entering building or blocked — staleness/abandonment trigger
loop_budget: 5           # OPTIONAL: autonomy grant — see Escalation
---
```

Frontmatter is identity, state, and routing — nothing else. The graph lives only
in `relations.md`. An agent triages any spec from its first ten lines. `shipped`
and `killed` are set during archiving and exist only in `archive/`.

`status` replaces presence-semantics: agents reliably miss the *absence* of a
file, so build-readiness is `status: ratified` plus a clean `open-questions.md`.

**`blast_radius`** is the spec's declared risk surface — how much breaks if
this is wrong. It is a ratification-time judgment, not a default, and it drives
Routing (below): reviewer depth, implementer effort, and model tier. **`size`**
is the declared *build* size, set at ratification the way `blast_radius` declares
risk: `small` (default — one slice) or `large` (an atomic batch). It is the **build**
axis; `appetite` (One-Sitting) is the **review** axis — a spec can have a small
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
`loop_budget` is the PO's autonomy grant, set at ratification like `blast_radius`.
The orchestrator defines what a "cycle" is and enforces both; Specline only validates
they are well-formed. Do not merge them — one measures time, the other progress.

### `spec.md` body

1. **Intent** — the product outcome in plain language, and the appetite: what
   one-sitting scope this spec deliberately fits.
2. **Goal** *(new in v2.3)* — a single falsifiable sentence: the observable
   outcome that means *done*. Intent is the *why* (for the human); the Goal is
   the *target* (for the build loop) — the one statement an autonomous run
   converges toward. The agent-loopable acceptance checks (§8) are the loop's
   *mechanical* exit; the Goal is what they are chosen to prove (see The build
   loop). If you can't state it falsifiably in one line, the feature isn't shaped
   yet.
3. **Non-goals** — explicit. The most valuable section for strong models: it is
   where over-building is fenced off.
4. **Behavior** — observable, numbered, each verifiable from outside.
5. **Business rules** — `Must` / `Should` / `May`.
6. **Assumptions** *(new in v2.3)* — assumptions and external dependencies: what this spec
   takes as given about systems it does not control (APIs, upstream services,
   data shapes), and what to do at a contradiction. Contradictions live at
   seams; naming them tells the agent where to **escalate fast** instead of
   cleverly hacking around a system it cannot change. Example (0012): *"the
   pricing API cannot quote discontinued SKUs — render the no-quote state; do
   not synthesize a price."*
7. **Critical files** — pointers into existing code, not restatements of it.
8. **Acceptance checks** — falsifiable, **partitioned by altitude** (B5). The
   partition names the **handoff** each check belongs to — who certifies it — not
   how it happens to be verified:
   - `agent-loopable` (**provable**) — the **implementer's** exit condition. The goal
     is met, shown by a runnable command where one fits (`e.g. `npm test -- trade-in`
     — exits 0`), **or by the implementer's grounded assessment** against the code and
     its tool results. A command is the strongest evidence, not a requirement; what is
     required is that the implementer can establish the goal is met before handing off.
     These checks are **frozen relative to the implementer** once ratified (B5): the
     builder does not author or weaken the checks it is measured by.
   - `judgeable` — the **reviewer's** gate. A fresh-context agent judges the
     implementer's *interpretation* against a **named spec section** and the repo's
     standards (`conventions/`, `technical/`) — including nuanced bars the goal
     can't state, like performance and security. The named section is its
     falsifiability gate. *(e.g. "matches the empty-state behavior in §4.3.")*
   - `human-gate` (**tasteable**) — the **decider's** gate. Verified once, by a person
     (taste, product-fit, anything no check or review can falsify).
   The altitudes are layered judgment, on purpose: the implementer asserts done, the
   reviewer independently checks the interpretation, the human accepts. Provable is
   the implementer's word (grounded); judgeable is the check on it; tasteable is final.
9. **Out of scope / deferred** — with IDs if already allocated.

Write intent and rules richly; write mechanics sparsely (B6). The builder reads
code; the spec's job is everything code can't say, and over-specified mechanics
actively degrade frontier output.

### `status.md` schema *(new in v2.3)*

Required for autonomous builds — it is the agent's memory across fresh-context
iterations, the thing a stateless re-entry cannot reconstruct from the diff.
Fixed sections, in order:

```markdown
## State          — lifecycle status + the one thing blocking forward motion
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

**Machine-parseable entries** *(new in v2.3)*. The two load-bearing sections carry a
fixed *entry* convention so a fresh-context loop (or the orchestrator) reads the
resume point and skips dead ends without interpreting prose:
- **Last green checkpoint** — one entry: `<ref> — <what passes here>`, where `<ref>`
  is a commit, tag, or check id (`none — <reason>` while still pre-green).
- **Dead ends** — one entry per line: `<approach> — <why it failed>`.
- **Corrections** — one entry per line:
  `<what was corrected> — <altitude: provable|judgeable|tasteable> — <who caught it: implementer|reviewer|decider>`.

It stays **markdown** — one human-readable file, no second data format. The
convention is enough for a tool to parse *and* a person to glance at; Specline checks
the entry shape, never the prose.

### Promotion — corrections become house rules

A correction has an altitude. A correction that **recurs across distinct specs** may
be promoted down one altitude — tasteable → a cited convention (judgeable, in
`conventions/`) → a check (provable) — **gated by recurrence + decider ratification
(B3)**. Promotion is human-decided at the gate, never automatic; Specline does not
adjudicate it. A one-off correction **stays a one-off** — promoting it early buys
rigidity, not leverage. What separates a promoted rule from a flat note in a
project's agent file: it is **cited at acceptance** (B5) and **graded by the fresh
verifier** — enforced, not merely written down. Recurrence is observed by reading the
graduated `## Corrections` records across knowledge docs; a tool may assist once there
is data, but the canon names only the discipline, not the harvester.

Cross-project learnings about the **operator** — the decider's own taste and decision
patterns that recur across repos, independent of any one domain — are **out of
Specline's scope**. They belong in the operator's own memory layer (e.g. a global
agent file), **not** any repo's `conventions/`.

### `open-questions.md`

Each entry is Specline-parsed and must carry: **who decides**, **the options**,
**the default**, and **the deadline**. An entry with a stated default and a
future deadline is **legal during `building`**: indecision becomes a logged
choice with an override window, and agents keep moving. Specline *warns* on
entries past deadline or missing a default or decider — advice the decider weighs
before merging, never a block.

### `relations.md`

```yaml
depends_on:
  - 0004-people-management: person records provide candidate identity
part_of: []            # parent module, if this is a sub-feature
supersedes: []
conflicts_with: []
```

Forward edges only, authored. Reverse edges (`depended_on_by`) live in the
generated `docs/relations-index.yml`, maintained by `Specline --fix`. Every edge
carries a one-line *why* — the why is what lets an agent decide whether the
related doc is worth the context it costs to load, and what the reviewer reads to compute
blast radius.

### No recursion

Sub-folders inside a spec folder are prohibited. A module needing sub-specs gives
each its own slug with `part_of: <slug>`. Flat folders with explicit edges beat
nested trees.

### Decomposition — the parent-map

When a feature is too big for one scope, it decomposes into buildable **scopes**
(ordinary specs) plus a **parent** that is a **map, not a plan** (`type: parent`).
Decomposition is the answer to one shaping question — *can this ship in
independently-valuable increments?* **Yes → decompose** into a parent-map plus
sequential scopes. **No → one large scope** (`size: large`, tight spec, big budget,
high `blast_radius` + verifier) — correctly large, not ineligible.

- **The parent holds, once:** intent, shared non-goals, the load-bearing
  invariant(s), external dependencies, and an index of its child scopes (with
  status rollup — the parent ships when its scopes ship).
- **The parent forbids:** Goal-as-single-check, Behavior, acceptance — any
  mechanics. Its balloon-guard is symmetric to One-Sitting: **stay a map.** Specline
  flags a parent that grows mechanics (`PARENT-HAS-MECHANICS` — "decompose into
  scopes") or a parent with no children (`PARENT-NO-SCOPES` — "misfiled scope").
- **The loop targets the scopes, never the parent.** A shared external dependency
  is declared once on the parent and **materialized as the first child scope**;
  downstream scopes `depend_on` it.

This is *committed* planning, so it lives in `specs/` like any spec — not a "bet,"
no wager or exploratory connotation. Scopes remain the default and the gravity
well; the parent appears only when a feature genuinely splits. A solo planner
doing one scope never writes one.

### Selective loading

The file split exists for context economy and signal quality, not tidiness:

| Task | Load |
|---|---|
| Build | `spec.md`, `relations.md`, `open-questions.md`, `status.md`; related docs per edge whys |
| Product thinking / reshape | `discovery.md`, `open-questions.md`, spec Intent + Non-goals |
| **Review / verify** | **Acceptance checks (both partitions), Non-goals, Business rules, Assumptions, and reverse edges / blast-radius from `relations-index.yml`** |
| Resume / triage | frontmatter + `status.md` |

The **reviewer context recipe** (new in v2.3) is deliberately wider than the
implementer's on the relational axis: the reviewer loads reverse edges so it can
catch integration breakage a *sibling* spec depends on — the failure the
implementer, looking only at forward edges, cannot see — before it reaches human
QA.

Context construction order for build work: conventions → `architecture.md` and
named cross-cutting docs → the spec folder per the table → related
specs/knowledge (`overview.md` first, deeper only if the edge's why warrants it)
→ ADRs citing this spec's ID.

---

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

**Cost estimation.** Specline's coupling-ceiling proxy (B2) already computes the
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
  unverified. This is B5 applied to the loop, and it is what keeps a long
  unattended run from fabricating "done."
- **Pause only on a true gate.** The implementer ends its turn to ask the human
  only for a destructive/irreversible action, a real scope change, or input only
  the decider can provide (an `open-questions` entry with no usable default).
  Everything else proceeds on the stated default. This is the loop-level
  expression of the two human gates.

---

## Lifecycle

### Two-PR pattern

1. **Spec PR** — adds the spec folder. Optionally critiqued by a spec-critic
   agent (which now also flags B6 mechanics-creep); ratified by the named human,
   whose approving commit sets `ratified_by`/`ratified_at` (B3). Merge to main is
   the ratification event.
2. **Implementation PR** — the diff, referencing the spec ID, executing the
   agent-loopable acceptance checks (results linked from `status.md` or the PR),
   and containing graduation.

### Amendment (reshape) mechanics

The merged spec on main is canonical, always. Mid-build reshaping:

1. Builder hits a contradiction → flips `status: blocked` (`stale_after` per B4) and
   records it under `status.md` *Dead ends* if an approach was abandoned.
2. The amendment lands as a **spec-amendment commit/PR to main** touching only
   the spec folder — approved by the decider, whose approval updates
   `ratified_at` and resets `stale_after` in the same commit.
3. `status: building` resumes. The implementation branch rebases on the amended
   contract.

Re-ratification leaves a trace Specline can read: `ratified_at` newer than
spec-body changes, or it didn't happen. Reshaping is a normal transition, not a
failure.

### Graduation

An **agent-executed editing pass wired to the implementation PR** — the trigger
is structural, because an unowned graduation step never happens. The prompt lives
at `docs/conventions/graduation.md` and:

1. Creates `docs/knowledge/slug/` — same slug, retained.
2. Moves the final `spec.md` (with acceptance-results link, frontmatter
   `status: shipped`) to `docs/archive/slug/`, preserved verbatim.
3. Writes knowledge docs: imperative → present descriptive, corrected to what
   actually shipped; applies B6 — keep intent, rules, rationale; cut anything
   code already says.
4. Carries the `## Corrections` records into the knowledge doc as the permanent
   promotion record — the cross-spec recurrence signal Promotion reads from, which
   would otherwise die with the spec folder (step 7).
5. Folds in ADRs accepted during the build that changed behavior.
6. Carries forward edges into the knowledge folder's `relations.md`; runs
   `Specline --fix` to regenerate `relations-index.yml`.
7. Deletes the spec folder (the contract now lives in `archive/`).

The result must read shorter and more confident than the spec. The human
acceptance gate reviews the graduated knowledge doc with the archived checks and
the `human-gate` acceptance items one click away — "is this what I decided?" is a
one-sitting question.

**Bugs** (`type: bug`): the implementation PR updates the corrected knowledge doc
(adding the bug ID to a `corrected_by` line) and archives the bug spec as
`shipped`. No knowledge folder is created; the ID resolves in `archive/` forever.

**Kills (and abandonment)**: spec moves to `archive/` with `status: killed` and a
one-line tombstone stating why (a deliberate kill, or "abandoned" for a draft
dropped before ship). There is no bare-delete of an allocated spec — this is what
makes every ID resolve forever. IDs stay burned; edges to a killed ID are Specline
*warnings*.

### Precedence

ADR > spec > knowledge doc. ADRs cite affected IDs in their header. Archive is
historical record and outranks nothing.

---

## Enforcement: the checks

The schema stands on its own: an agent can operate Specline from this canon
alone, and a PO can author conforming specs by hand. `Specline` adds **assurance,
not validity** — and its highest-value job is not the merge gate but watching a
spec stay in shape while a PO and an agent write it. It is deterministic — no
model, no judgment — and is specced in `0001-doctor`.

Specline serves two callers over one engine and one rule set, differing only in
severity posture:

- **author mode** — advisory and continuous, invoked by the planning agent
  during a shaping session. It reports conformance and the *distance to
  ratifiable* (what a draft still needs) as guidance, not failure; a
  work-in-progress spec is expected to be incomplete, and the run still exits
  clean. This is what keeps a long collaborative planning session from drifting
  out of the methodology as it's written.
- **gate mode** — strict, exit-code, in CI and before any agent handoff. The
  same checks, but lifecycle requirements are now errors.

**Quarantine semantics** (gate mode): spec-scoped violations error only on PRs
touching that spec and warn repo-wide; repo-scoped violations error everywhere.

**Self-describing.** Specline emits its own contract for agents: `Specline spec`
prints the pinned canon (for prompt injection), and `Specline rules` prints the
rule catalog — every `rule_id`, its severity, and its quarantine scope — as JSON
or markdown. An agent in author mode reads `Specline rules` to know exactly what it
will be checked against *before* it writes, not after.

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

**Amendment diff** *(planned — needs two file versions, so it sits at the diff/CI
layer, not the working-tree engine).* `Specline diff <before> <after>` classifies what changed
between two versions of a spec — substantive (Behavior, Business rules,
Acceptance) vs. status-only — and flags a behavior change unaccompanied by a
`ratified_at` bump. This is what makes the mid-build revision-rate instrument
mechanical rather than a manual read — and it is the same rule that enforces the
**frozen provable checks** (B5): an acceptance-check change the decider did not
approve (a fresh merge) is flagged, since the builder must not weaken the ruler it
is measured by.

Checks — **(I)** = integrity, blocks; **(A)** = advisory, warns only:

- **(I)** Frontmatter parses and its `slug` matches the directory
  (`FRONTMATTER-SLUG-MISMATCH`); enum fields are in their allowed sets
  (`ENUM-INVALID`).
- **(I)** Slug integrity: each slug is unique across `specs/` + `knowledge/` +
  `archive/` (`SLUG-DUPLICATE`). A ratified slug is frozen by consequence, not a
  dedicated rule — renaming a referenced spec dangles its inbound edges
  (`RELATION-DANGLING`) and renaming an archived one trips `ARCHIVE-EDITED`. No
  counter, so no counter-gap check.
- **(I)** Every `specs/<slug>/` has a `spec.md` (`STRUCT-MISSING-SPEC`) — it is the
  constitutive file; without it the folder is not a spec (and its dir-derived slug
  would let other specs resolve relations to an empty shell). Quarantined: it blocks
  the spec it's on only when that spec is in `--changed`.
- **(A)** A `specs/<slug>/` also has `relations.md` (`STRUCT-MISSING-RELATIONS`) — an
  auxiliary file; its absence is completeness advice, not a gate.
- Ratification is **not** modelled here: the approving merge to main is the record,
  and git owns who/when (no `ratified_by`/`ratified_at` check).
- **(A)** A spec marked building/ratified lacking a `blast_radius` value
  (`RATIFIED-NO-BLAST-RADIUS`) or partitioned acceptance — the `agent-loopable`
  set present and labeled (`RATIFIED-ACCEPTANCE-UNPARTITIONED`) — is *warned*:
  build-readiness advice, not a block.
- **A `judgeable` acceptance item cites a spec section to verify against
  (`JUDGEABLE-NO-SECTION`); else it is not falsifiable (B5).**
- **`size: small` with measured size (acceptance/Behavior count) over
  `suggest_slicing_past` → warn (`SCOPE-EXCEEDS-SIZE`): slice it, or declare
  `size: large` if it's atomic. Specline raises the question; the human answers.**
- **(A)** `type: parent` carrying Behavior/acceptance → warn (`PARENT-HAS-MECHANICS`);
  `type: parent` listing no child scopes → warn (`PARENT-NO-SCOPES`).
- **`status.md`, when present, conforms to the schema (required sections present
  and parseable). Shape only; never prose.** This now includes a `## Corrections`
  section whose entries carry the fixed `<what> — <altitude> — <who caught it>` shape
  (`CORRECTIONS-MALFORMED`); a graduating spec missing it is flagged so the promotion
  record survives into `knowledge/`.
- **`target_model`/`blast_radius` values, if present, are from the allowed sets
  (`ENUM-INVALID`).** Resolving `target_model` against the repo's configured
  `models` map is *(planned — only the fixed set is checked today).*
- Every repo-local edge resolves at some lifecycle stage (error); cross-repo
  edges warn-only; edges to `killed` IDs warn.
- `relations-index.yml` consistent with authored forward edges; `Specline --fix`
  regenerates it. *(planned — not yet enforced or generated.)*
- `open-questions.md` entries parse (each a `##` heading carrying `decider:` /
  `options:` / `default:` / `deadline:` lines); an entry missing a decider or
  default warns (`OPEN-QUESTION-INCOMPLETE`); an entry past its `deadline` warns
  (`OPEN-QUESTION-OVERDUE`). **(A)**
- **(A)** `building|blocked` past `stale_after` → warn (`STALE-QUARANTINE`, tier 2,
  B4): an untouched build is presumed stale — advice to a human, never a block.
- **(A)** Decider focus limit: over the configured `building`/`active` ceiling per
  decider → warn (`DECIDER-OVER-BUDGET`, tier 2, B7).
- Coupling-ceiling proxy (`spec.md` + transitively forced loads) vs.
  `coupling_ceiling`% of `context_window` → warn (`COUPLING-CEILING`, tier 2, B2).
- **(A)** A shipped, archived spec without a linked `acceptance_results` is warned
  (`ARCHIVE-NO-ACCEPTANCE`, B5) — the structural proxy for "graduation ran the
  acceptance checks."
- **(I)** Every relative path link under `docs/**` resolves (`LINK-DANGLING`);
  repo-local relation edges resolve (`RELATION-DANGLING`).
- **(I)** No `status.md` in `knowledge/` (`KNOWLEDGE-HAS-STATUS`); `archive/` is
  read-only (`ARCHIVE-EDITED`).
- Unknown frontmatter key or body section → warn and preserve; a duplicated
  required `status.md` section → warn (`STATUS-SCHEMA`). **(A)**

Judgment-only rules (one-sitting sizing, B6 compliance, tense, confidence,
blast-radius *correctness*) are out of Specline's scope and live at the two human
gates.

**Enforcement status (honest).** Everything above without a *(planned)* tag is
implemented and tested. The deliberate gaps, and *why* they're deferred: items
needing **two file versions or commit history** — `Specline diff`, and the
"`stale_after` moved without `ratified_at`" check — can't run in Specline's
working-tree-only engine, so they belong at the diff/CI layer; `relations-index`
generation + `--fix` and full `target_model`→`models` resolution are simply not
built yet. Tier-2 governance (`STALE-QUARANTINE`, `DECIDER-OVER-BUDGET`,
`COUPLING-CEILING`) only fires when a repo declares `tier: 2`. The canon describes
the whole contract; this note is the line between what runs and what's promised.

---

## Instrumentation

All computable from frontmatter + `archive/` + git. Diagnostic instruments,
never targets (Goodhart).

- **Lead time** — `created` → `shipped`.
- **Mid-build revision rate** — % of shipped specs whose ratified sections
  changed between first ratification and archive (computed by `Specline diff`).
  Expected band ~10–40%. Near zero → waterfall; far above → shaping too thin.
  Read it; don't chase it.
- **Staleness outcomes** — breach count and the reshape/kill split.
- **Graduation latency** — implementation merge → knowledge doc. Target: same PR.
- **Specline pass rate on main** — should be 100%.
- **Routing accuracy** *(new)* — predicted vs. actual build cost by tier, and the
  rate of `blast_radius` upgrades discovered mid-build. A persistent gap means
  the routing heuristic, not the spec, is wrong.

---

## Adoption

Tiered so the smallest viable adoption is one afternoon:

- **Tier 0 — one spec.** `docs/specs/` and one spec folder. Run
  Specline. Value: one validated, agent-buildable contract.
- **Tier 1 — the loop.** Ratification frontmatter, the two-PR pattern,
  graduation + `archive/`, `knowledge/`. Value: product memory and audit trail.
- **Tier 2 — the full system.** Staleness windows, decider focus limit, relations
  index, coupling ceiling, **blast-radius routing and model tiering**,
  inner/outer loops, instrumentation. Value:
  parallel agents of varying cost without coordination meetings.

A repo states its tier in `docs/conventions/doc-architecture.md`; Specline checks
only the rules of the declared tier.

## When a rule is broken

| Breach | Recovery |
|---|---|
| Specline red on main | Fix-forward; structural reds are small. If recurring, amend the canon, don't route around it. |
| Graduation skipped | Run the graduation prompt retroactively; the archive-integrity check finds the gap. |
| Staleness quarantine | Decider chooses reshape or kill within one sitting. |
| **`loop_budget` exhausted** | The build loop escalated without converging. The decider reads the `status.md` Dead ends, then reshapes the spec (clearer Goal / better-specified checks) or takes the build over by hand. |
| Gate bypassed | Revert the status flip; the spec returns to draft. |
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
- `Specline` distribution and implementation language (tracked in `0001-doctor`).
- Cross-repo edge validation.
- **The orchestrator (build-loop runner) is external and pluggable.** Specline
  defines the *contract* the loop runs against — Goal, agent-loopable checks,
  `status.md`, `loop_budget`/`stale_after`, the inner/outer loop budgets, routing —
  and does **not** build the
  *runner*. A capable model self-orchestrates a single spec (e.g. an agent + a thin
  loop harness); a fuller external orchestrator adds what one model can't do for
  itself: fresh-context re-entry, parallel scheduling across the decider budget,
  model-tier routing, and fresh-context verifier subagents. The open question is
  only the **runner contract** — the minimal behaviors a runner must satisfy to be
  Specline-compliant — not an orchestrator implementation owned here.
