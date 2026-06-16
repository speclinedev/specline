# Specline, explained

> The readable companion to the canon (`specline-2.4.md`). The canon is the
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
(`doctor`) that reads a plan and tells you the moment it doesn't fit.

## What you get every time: the spec folder

Every feature is a folder with the same files. That sameness *is* the benefit.

```
docs/specs/0007-trade-in-quote/
  spec.md           # the contract — what we're building and why
  relations.md      # how this feature connects to others
  status.md         # the build's memory (only once you start building)
  open-questions.md # decisions not yet made (optional)
```

`spec.md` always has the same sections, in the same order:

- **Intent** — what and why, and the *appetite* — how big the *spec* is to
  *review* (one sitting?), not how big the build is. Build size is a separate
  frontmatter field, `size: small|large`. (Can't fit the contract in one sitting?
  Decompose: a **parent-map** — `type: parent`, a map of the territory, not a plan
  — over a handful of buildable child scopes. The parent holds no mechanics.)
- **Goal** — the one falsifiable outcome the build loop targets (see "How agents build").
- **Non-goals** — what this deliberately won't do. (Often the most useful section.)
- **Behavior** — numbered, observable statements of what it does.
- **Business rules** — the must/must-not constraints.
- **Acceptance checks** — how you know it's done. A check gets settled one of three
  ways: by running it (`agent-loopable` — a runnable command), by judgment
  (`judgeable` — a fresh-context agent ruling against a *named* spec section), or by
  taste (`human-gate` — a person decides once).
- **Out of scope** — deferred for later.

That's it. Read one spec, you can read them all.

*(Why the number `0007`? So features can reference each other by a name that never
changes even if you rename or move them. It's bookkeeping — at your scale you can
mostly ignore it; the agent assigns it.)*

## One home for the whole product

Specline isn't just a folder for specs. It makes `docs/` the product's source of
truth — one structured place that holds everything determining the product. "docs"
usually means afterthought. Here it's the primary, prescriptive record the product
is built *from*, and the descriptive memory of what it became.

```
specline.yml          # repo-root config: canon pin, tier, thresholds, model map
docs/
  architecture.md     # system shape — read first
  conventions/        # standards, templates, graduation prompt
  decisions/          # repo-local ADRs — append-only (ADR > spec > knowledge)
  strategy/           # vision, roadmap, launch contracts — dated, archived
  technical/          # cross-cutting patterns — only when non-obvious
  specs/              # IN-FLIGHT — prescriptive, temporary
  knowledge/          # SHIPPED — descriptive, permanent
  archive/            # TERMINAL — contracts, read-only
  relations-index.yml # generated reverse-edge index
```

doctor **enforces** the lifecycle-core — `specs/`, `knowledge/`, `archive/`, the
`specline.yml` pin and thresholds, ids, links. It leaves `decisions/`, `strategy/`,
and `technical/` to you: the canon defines them, but they're convention, not
policed. Know which is which. That's the difference between a rule and a habit.

## A feature changes posture as it ships

A feature's documentation doesn't sit still. It shifts *posture* as it moves through
the loop — from a contract you're building toward, to a description of what you built.

- **In flight** it lives in `docs/specs/NNNN-slug/` — prescriptive, temporary.
- **When it ships, it graduates into two permanent homes at once:**
  - `archive/NNNN/spec.md` — the contract, verbatim, `status: shipped`, acceptance
    results linked, read-only forever. *What was promised.*
  - `knowledge/NNNN/` — the living description: present-tense, what's true now. *What
    it became.*
- The in-flight spec is then **deleted** — the contract survives only in `archive/`.

Here's the test for what belongs in `knowledge/`. If a knowledge doc would lose an
argument with the code, it shouldn't exist; if it records *why* the code is the way
it is, it can't lose that argument. Keep intent, rules, rationale. Cut anything the
code already says.

**Migrating an existing repo:** already-shipped features never had a spec, so there's
no contract to archive. Populate `knowledge/NNNN-slug/` directly from your existing
descriptive docs (usually already knowledge-shaped), assign an id, and let `archive/`
fill as features go forward. doctor permits knowledge without an archived spec, so a
migrated repo is conformant from day one.

## The loop: four moves

1. **Shape** — you and an agent talk through the feature and write the spec
   folder. Unknowns become logged open questions with a default, so nothing
   blocks. This is a conversation, not a form.
2. **Sign** — you read the whole spec *in one sitting* and approve it. This is a
   **human gate**: your judgment, not the machine's. (In the files it's the
   `ratified_by` field.)
3. **Build** — the agent implements against the signed spec, keeping `status.md`
   as its memory so it can resume without re-deriving everything.
4. **Graduate** — when it ships, the spec moves to an archive and a short
   `knowledge/` doc records *why* the code is the way it is.

## Structure is checked by a machine. Meaning is judged by you.

Specline draws one hard line. **Structure is checked by a machine; meaning is judged
by you.** Everything follows from which side of that line a thing falls on.

- **`doctor` (the machine)** checks *structure only* — is the folder shaped right,
  do the links resolve, are the IDs consistent. doctor checks the shape, never your
  code. It runs no AI and makes no judgment. Same answer every time.
- **You (the two gates)** judge *meaning* — is this the right thing to build, is it
  sized right, is the spec actually good. A machine can't do that, and shouldn't try.

So you're only ever on the two ends: shaping the intent, and approving the result.
The middle runs itself.

## Start light: tiers

You do **not** adopt all of Specline at once. You pick a tier.

- **Tier 0–1 (start here)** — the consistent folder shape, the four-move loop, the
  sign gate. As a solo planner this is almost certainly all you need.
- **Tier 2 (later, maybe never)** — parallel-work governance: staleness timers,
  decision budgets, quarantine. Useful for a team running many features at once;
  noise for one person. `doctor` enforces only the tier you declare.

If a rule isn't earning its keep for you, you're at the wrong tier. That's a
setting, not a failure.

## How you actually use it, day to day

When you're ready, you do **almost nothing** to brief the agent.

1. Drop the `CLAUDE.md` brief (in `specline/templates/`) into your repo. An agent
   opened there reads it automatically.
2. Open a fresh agent chat and say, in your own words:
   - *"Let's shape a new feature: \<your idea\>."* — or —
   - *"Migrate this plan into Specline with me: \<the file\>."*
3. The agent pulls the methodology itself (via the `doctor_spec` tool), asks you
   the shaping questions, and produces the spec folder. It checks its own work
   with `doctor` as it goes.
4. You read the result in one sitting and approve it — or send it back.

You don't memorize the rules, and you don't paste the canon. The agent learns the
methodology from the tool; you bring the judgment. That's the whole point.

## What's NOT your job

- Remembering the spec structure → the agent knows it (from `doctor_spec`).
- Checking the structure is right → `doctor` does it.
- Knowing the rules before you start → `doctor rules` lists them on demand.

Your job is the two ends: *what to build* and *is this good*. Everything between is
carried by the agent and the checker.

## How agents build (the autonomous half)

"The middle runs itself" — here's the middle. The builder won't be in the room. You
shape a feature with one agent; once the spec is signed, a different agent builds it
— fresh context, never in the room, can't ask what you meant. So it builds what's on
the page. The spec gives that **autonomous loop** four things, and your two gates
bracket it:

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
autonomy grant, set at sign-off like `blast_radius`. The same risk judgment also
routes *how hard* the loop runs: `blast_radius` → model effort + reviewer depth via
`target_model`. Declare the risk once; the loop spends compute in proportion. This is
the governance of the autonomous half — tier-2 work, not the price of one good spec.
