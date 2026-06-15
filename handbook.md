# Specline, explained

> The readable companion to the canon (`specline-2.3.md`). The canon is the
> precise, enforceable text. This is the version you read to *understand* it.
> If the two ever disagree, the canon wins — tell us, that's a bug here.

## The one-sentence version

Specline gives every feature you design the **same shape**, so a plan is something
you (and an agent) can produce, check, and trust the same way every time — instead
of a fresh blank page and a different structure each time.

## The problem it solves

You write a plan, hand it to a model, it more or less follows it. Next feature,
different shape, different gaps. Nothing is *wrong*, but nothing is *consistent* —
and inconsistency is where things get missed. A convention everyone agrees to but
nothing enforces is just a suggestion. Specline makes the structure real: a fixed
shape, and a checker (`doctor`) that tells you when a plan doesn't fit it.

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

- **Intent** — what and why, and the *appetite* (how big — one sitting? a week?).
- **Non-goals** — what this deliberately won't do. (Often the most useful section.)
- **Behavior** — numbered, observable statements of what it does.
- **Business rules** — the must/must-not constraints.
- **Acceptance checks** — how you know it's done.
- **Out of scope** — deferred for later.

That's it. Read one spec, you can read them all.

*(Why the number `0007`? So features can reference each other by a name that never
changes even if you rename or move them. It's bookkeeping — at your scale you can
mostly ignore it; the agent assigns it.)*

## The product record: one home for the whole product

Specline isn't just a folder for specs. It defines `docs/` as the product's source of
truth — one structured place holding everything that determines the product. "docs"
usually means afterthought; here it's the primary, prescriptive record the product is
built *from*, and the descriptive memory of what it became.

```
docs/
  architecture.md     # system shape — read first
  conventions/        # standards, templates, the canon + tier pin
  decisions/          # repo-local ADRs — append-only (ADR > spec > knowledge)
  strategy/           # vision, roadmap, launch contracts — dated, archived
  technical/          # cross-cutting patterns — only when non-obvious
  specs/              # IN-FLIGHT — prescriptive, temporary
  knowledge/          # SHIPPED — descriptive, permanent
  archive/            # TERMINAL — contracts, read-only
  relations-index.yml # generated reverse-edge index
```

doctor **enforces** the lifecycle-core — `specs/`, `knowledge/`, `archive/`, the pin,
ids, links. `decisions/`, `strategy/`, and `technical/` are defined by the canon but
maintained by you: convention, not policed. Knowing which is which is the difference
between a rule and a habit.

## How a feature is documented

A feature's documentation changes *posture* as it moves through the loop — from a
contract you're building toward, to a description of what you built.

- **In flight** it lives in `docs/specs/NNNN-slug/` — prescriptive, temporary.
- **When it ships, it graduates into two permanent homes at once:**
  - `archive/NNNN/spec.md` — the contract, verbatim, `status: shipped`, acceptance
    results linked, read-only forever. *What was promised.*
  - `knowledge/NNNN/` — the living description: present-tense, what's true now. *What
    it became.*
- The in-flight spec is then **deleted** — the contract survives only in `archive/`.

The test for what belongs in `knowledge/`: *if a knowledge doc would lose an argument
with the code, it shouldn't exist; if it records why the code is the way it is, it
can't lose that argument.* Keep intent, rules, rationale; cut anything the code says.

**Migrating an existing repo:** already-shipped features never had a spec, so there's
no contract to archive. Populate `knowledge/NNNN-slug/` directly from your existing
descriptive docs (usually already knowledge-shaped), assign an id, and let `archive/`
fill as features go forward. doctor permits knowledge without an archived spec, so a
migrated repo is conformant from day one.

## The loop: four moves

1. **Shape** — you and an agent talk through the feature and write the spec
   folder. Unknowns become logged open questions with a default, so nothing
   blocks. This is a conversation, not a form.
2. **Ratify** — you read the whole spec *in one sitting* and approve it. This is
   a **human gate**: your judgment, not the machine's.
3. **Build** — the agent implements against the ratified spec, keeping `status.md`
   as its memory so it can resume without re-deriving everything.
4. **Graduate** — when it ships, the spec moves to an archive and a short
   `knowledge/` doc records *why* the code is the way it is.

## The split that makes it work: two gates vs. the machine

Specline draws one hard line: **structure is checked by a machine; meaning is
judged by you.**

- **`doctor` (the machine)** checks *structure only* — is the folder shaped right,
  do the links resolve, are the IDs consistent. It's deterministic, runs no AI,
  makes no judgment. Same answer every time.
- **You (the two gates)** judge *meaning* — is this the right thing to build, is
  it sized right, is the spec actually good. A machine can't and shouldn't do that.

So you're only ever on the two ends: shaping the intent, and approving the result.
The middle runs itself.

## Start light: tiers

You do **not** adopt all of Specline at once. You pick a tier:

- **Tier 0–1 (start here)** — the consistent folder shape, the four-move loop, the
  ratify gate. This is almost certainly all you need as a solo planner.
- **Tier 2 (later, maybe never)** — parallel-work governance: expiry timers,
  decision budgets, quarantine. Useful for a team running many features at once;
  noise for one person. `doctor` enforces only the tier you declare.

If a rule isn't earning its keep for you, you're at the wrong tier. That's a
setting, not a failure.

## How you actually use it, day to day

When you're ready, you do **almost nothing** to brief the agent:

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
