# Specline, explained

> The readable companion to the canon (`specline-3.1.md`). The canon is the
> precise, enforceable text. This is the version you read to *understand* it.
> If the two ever disagree, the canon wins — tell us, that's a bug here.

## Every feature gets the same shape

Specline gives every feature you design the **same shape** — the same folder, the
same sections, the same order, every time. So a plan stops being a blank page and
becomes something you and an agent produce, check, and trust the same way twice.

## A convention nobody enforces is just a suggestion

You write a plan, hand it to an agent, and it mostly does what you said. Mostly.
Next feature, a different agent, a different shape, a different set of gaps.
Nothing's wrong, exactly. Nothing's the same, either — and inconsistency is where
things go missing. A convention everyone agrees to and nobody enforces is just a
suggestion. Specline makes the shape real: a fixed structure, and a **checker**
(`specline`) that reads a plan and tells you the moment it doesn't fit.

## What you get every time: the spec folder

Every feature is a folder with the same files. That sameness *is* the benefit.

```
docs/specs/trade-in-quote/
  spec.md           # the contract — what we're building and why
  relations.md      # how this feature connects to others
  status.md         # the build's memory — required for unattended builds only (experimental)
  open-questions.md # decisions not yet made (optional)
```

`spec.md` always has the same sections, in the same order:

- **Intent** — what and why, and the *appetite* — how big the *spec* is to
  *review* (one sitting?), not how big the build is: a large atomic build can
  sit behind a tight, one-sitting spec. (Can't fit the contract in one sitting?
  Decompose: a **parent-map** — `type: parent`, a map of the territory, not a plan
  — over a handful of buildable child scopes. The parent holds no mechanics.)
- **Goal** — the one falsifiable outcome the build loop targets (see "How agents build").
- **Non-goals** — what this deliberately won't do. (Often the most useful section.)
- **Behavior** — numbered, observable statements of what it does.
- **Business rules** — the must/must-not constraints.
- **Acceptance checks** — how you know it's done: one list, each item
  **falsifiable** — settleable the same way twice. An item only a person can
  settle sits under an optional `### human` sub-heading. (Unattended builds
  — experimental — refine this into three altitudes; see below.)
- **Out of scope** — deferred for later.

That's it. Read one spec, you can read them all.

*(The folder name — `trade-in-quote` — is the *slug*, and the slug **is** the
feature's identity. Features reference each other by slug, so once a spec **lands on
your merge target** its slug is frozen by consequence: rename one others depend on and
you dangle their edges. Re-slugging before it lands is free — nothing points at it yet.
Pick a good name; the agent proposes it.)*

## One home for the whole product

Specline isn't just a folder for specs. It makes `docs/` the product's source of
truth — one structured place that holds everything determining the product. "docs"
usually means afterthought. Here it's the primary, prescriptive record the product
is built *from*, and the descriptive memory of what it became.

```
specline.yml          # repo-root config: canon pin, the unattended switch, thresholds, model map
docs/
  architecture.md     # system shape — read first
  conventions/        # standards, templates, graduation prompt
  decisions/          # repo-local ADRs — append-only (ADR > spec > knowledge)
  strategy/           # vision, roadmap, launch contracts — dated, archived
  technical/          # cross-cutting patterns — only when non-obvious
  drafts/             # BEING SHAPED — not a commitment, may be incomplete or deleted
  specs/              # APPROVED FOR BUILD — prescriptive, temporary
  knowledge/          # SHIPPED — descriptive, permanent
  archive/            # TERMINAL — contracts, read-only
  relations-index.yml # generated reverse-edge index
```

specline **enforces** the lifecycle-core — `drafts/`, `specs/`, `knowledge/`,
`archive/`, the `specline.yml` pin and thresholds, slugs, links. It leaves
`decisions/`, `strategy/`, and `technical/` to you: the canon defines them, but
they're convention, not policed. Know which is which. That's the difference
between a rule and a habit.

## A feature changes posture as it ships

A feature's documentation doesn't sit still. **Where it lives is its state**, and it
moves through four folders — from an idea, to a contract you're building
toward, to a description of what you built.

- **Being shaped** it lives in `docs/drafts/<slug>/` — may be incomplete, may
  be deleted; nothing may depend on it yet.
- **Approved for build** the decider's go moves it to `docs/specs/<slug>/` —
  prescriptive, temporary.
- **When it ships, it graduates into two permanent homes at once:**
  - `archive/<slug>/spec.md` — the contract, verbatim, `status: shipped`, acceptance
    results linked, read-only forever. *What was promised.*
  - `knowledge/<slug>/` — the living description: present-tense, what's true now. *What
    it became.*
- The in-flight spec folder is then **deleted** — the contract survives only in `archive/`.

The sequence isn't prescribed — shape, approve, build, and graduate can be one
commit or several branches; specline reads folders, not order.

Here's the test for what belongs in `knowledge/`. If a knowledge doc would lose an
argument with the code, it shouldn't exist; if it records *why* the code is the way
it is, it can't lose that argument. Keep intent, rules, rationale. Cut anything the
code already says.

**Migrating an existing repo:** already-shipped features never had a spec, so there's
no contract to archive. Populate `knowledge/<slug>/` directly from your existing
descriptive docs (usually already knowledge-shaped), give each a slug, and let `archive/`
fill as features go forward. specline permits knowledge without an archived spec, so a
migrated repo is conformant from day one.

## The loop: four moves

1. **Shape** — you and an agent talk through the feature and write the spec
   folder in `docs/drafts/` — an idea, not yet a commitment; it may be
   incomplete, and may simply be deleted if you drop it. Unknowns become
   logged open questions with a default, so nothing blocks. This is a
   conversation, not a form.
2. **Approve** — you read the whole spec *in one sitting* and give it your **go**:
   moving the folder from `docs/drafts/` to `docs/specs/`, in a commit made or
   approved by you, on whichever branch the work is on. **Where a spec lives is
   its state** — there's no `status` field to keep in step with the folder, and
   no field to maintain by hand; git records who and when. The spec does *not*
   have to merge first. This is a **human gate**: your judgment, not the
   machine's.
3. **Build** — an agent implements against the approved spec. The normal shape is **one
   branch**: spec, build, and graduation ride together and one pull request carries all
   three — its approving merge is the record. Landing the spec on its own first and
   building on a second branch is legal too; reach for it when shaping runs well ahead
   of building, or when an unattended runner needs a landed baseline.
4. **Graduate** — when it ships, the spec moves to an archive and a short
   `knowledge/` doc records *why* the code is the way it is.

## Structure is checked by a machine. Meaning is judged by you.

Specline draws one hard line, and it's narrow on purpose. **The machine blocks only
on *integrity*; whether a spec is *good* is yours to judge.** Everything follows from
which side of that line a thing falls on.

- **`specline` (the machine)** *blocks* only on **integrity** — facts that are broken
  regardless of taste: a spec folder with no `spec.md` (no spec.md, no spec), frontmatter
  that won't parse, a link or relation that doesn't resolve, a duplicate slug, an out-of-set
  value. It runs no AI, never reads your code,
  and gives the same answer every time.
- Everything else — is it sized right, complete, the mechanics kept lean, actually
  *good* — specline *surfaces as advice* (a warning), never a block.
  **You (the gates)** decide whether it's enough. The practice is too young for a tool
  to call taste for you.

So the gate is permissive by design: it stops you for a broken repo, not for a spec it
merely dislikes. You're only ever on the two ends — shaping the intent, and approving
the result by merging it. The middle runs itself.

## Start light: one system, then a switch

You do **not** adopt all of Specline at once, but there are no tiers to pick
between — it's the same system throughout.

- **Adopt Part 1 first** — write a spec in `docs/drafts/` or `docs/specs/`: one
  agent-buildable contract, in an afternoon.
- **Then adopt Part 2** — the decider's go recorded in git, the four-folder
  lifecycle, graduation, `archive/` and `knowledge/`: product memory and an
  audit trail. As a solo planner, Parts 1 and 2 are almost certainly all you
  need.
- **Part 3 is not a further stage — it's a switch.** Set `unattended: true` in
  `specline.yml` only if you run builds nobody is watching: staleness timers,
  a decider budget, the coupling ceiling. It's **experimental**, off by
  default, and `specline` neither lists nor checks any of it until you turn it
  on.

If a Part-3 rule isn't earning its keep for you, leave the switch off. That's
a setting, not a failure.

## How you actually use it, day to day

When you're ready, you do **almost nothing** to brief the agent.

1. Drop the `CLAUDE.md` brief (in `specline/templates/`) into your repo. An agent
   opened there reads it automatically.
2. Open a fresh agent chat and say, in your own words:
   - *"Let's shape a new feature: \<your idea\>."* — or —
   - *"Migrate this plan into Specline with me: \<the file\>."*
3. The agent pulls the methodology itself (via the `specline_spec` tool), asks you
   the shaping questions, and produces the spec folder. It checks its own work
   with `specline_check` as it goes.
4. You read the result in one sitting and approve it — or send it back.

You don't memorize the rules, and you don't paste the canon. The agent learns the
methodology from the tool; you bring the judgment. That's the whole point.

## What's NOT your job

- Remembering the spec structure → the agent knows it (from `specline_spec`).
- Checking the structure is right → `specline` does it.
- Knowing the rules before you start → `specline rules` lists them on demand.

Your job is the two ends: *what to build* and *is this good*. Everything between is
carried by the agent and the checker.

## How agents build (the autonomous half)

> **Experimental** — in force only when `specline.yml` sets `unattended: true`.
> Off by default; nothing in this section or the next is checked or listed
> until you turn it on.

First, the posture. A spec is **attended** unless it says otherwise: you're reachable,
the builder disagrees out loud, and when the build teaches something the spec gets
edited by agreement — a normal move, not a failure. Write `build: unattended` in the
frontmatter and you've made a promise instead: a fresh-context builder that *can't* ask
has everything it needs on the page. The canon keeps the machinery for that promise —
`status.md`, the loop, the runner contract — in one chapter that applies only when you
declare it.

"The middle runs itself" — here's that middle. The spec gives the **autonomous loop**
four things, and your two gates bracket it:

- **Goal** — the *target* it converges toward.
- **Agent-loopable acceptance checks** — runnable commands; the loop's *mechanical*
  exit. It stops when they pass. (The Goal is what they're chosen to prove.)
- **status.md** — *memory*: the last green checkpoint to resume from, and the dead
  ends not to re-walk.
- **loop_budget** — the *autonomy grant*: how long it may run unattended.

One iteration: resume from `status.md` → work toward the Goal → run the checks → if a
check goes red→green, record a new checkpoint, else burn a loop_budget cycle → repeat.

It's really **two loops**. The **inner** loop is mechanical: the implementer drives
the *provable* (`agent-loopable`) checks until they pass — no reviewer in it. That
inner loop is wrapped by an **outer** loop: a **fresh-context verifier** checks the
implementer's work against the *judgeable* partition, bouncing it back a bounded
number of times (`review_rounds_before_human`) before the work reaches you. Inner =
deterministic, outer = bounded judgment, the human gate = unbounded judgment.

The thing that runs this — **the runner** — is external and pluggable: an agent plus
a loop harness runs one spec; a fuller runner handles parallel/unattended builds.
Specline defines the loop, not the runner.

## Escalation & autonomy

An autonomous loop needs a brake — two of them, and at the *first* to trip it hands
control back to you.

- **`stale_after`** — the *time* trigger (a build left open too long; abandonment).
  Going stale doesn't *discard* the spec — it **quarantines** it for you to reshape
  or kill; that's why it's *staleness*, not a TTL.
- **`loop_budget`** — the *progress* trigger (cycles with no green-checkpoint advance;
  thrashing, which can exhaust the budget long before the clock).

They don't conflict — same outcome, different axes, first wins. `loop_budget` is your
autonomy grant, set at the decider's go like `blast_radius`. The same risk judgment also
routes *how hard* the loop runs: `blast_radius` → model effort + reviewer depth via
`target_model`. Declare the risk once; the loop spends compute in proportion. This is
the governance of the autonomous half — experimental, opt-in work, not the price of
one good spec.
