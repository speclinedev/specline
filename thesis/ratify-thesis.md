# Ratify

**Agents build. You ratify.**

---

## The thesis

For thirty years the scarce resource in software was construction. Every
methodology optimized for it: sprints to schedule it, standups to coordinate it,
estimates to predict it. When AI agents do the building, that scarcity inverts.
Construction becomes abundant — fast, parallel, nearly free. What stays scarce is
the one act that can't be delegated: the authoritative human decision that *this*
is worth building, stated precisely enough that an agent can build it without
smuggling in choices that were never theirs to make.

That act is ratification. Ratify is built around it.

## What ratification is

Ratification is not approval. Approval is a stamp on work already done.
Ratification is the bet — the point where intent becomes a binding contract an
agent builds from. A spec isn't real because someone wrote it; it's real the
moment a named human ratifies it. Before that it's a draft. After, it's the
contract the build conforms to.

Shape Up named its methodology after *shaping* — the human craft of defining the
work. In 2018 that was the irreducibly human part. It isn't anymore: agents shape
now, drafting intent, non-goals, and acceptance alongside you. The act that
doesn't delegate — the one still yours when the craft is automated — is the bet.
Ratify names the method after the part that stays human.

## How it holds up

A claim without a mechanism is marketing. The load-bearing ones:

**The spec is perishable; the code is sovereign.** A spec is scaffolding —
consumed during the build, then archived. Code remains the source of truth for
*what* the system does; the spec records only *why*: intent, non-goals, the
options you rejected and the reason. Nothing in Ratify competes with the code for
the truth, so nothing drifts out of sync with it.

**"Done" is falsifiable, or it isn't ratified.** Acceptance checks are
executable, and split into the ones an agent runs every loop and the ones a human
verifies once. The agent loops until the checks pass — not until the work *feels*
finished. A spec whose "done" can't be falsified stays a draft.

**Every ratification is signed.** `ratified_by`, `ratified_at` — set by the
approving human's own commit. The record is a chain: spec → ratifier →
implementation → graduated knowledge. For anything you ever shipped, you can
answer who decided it, when, and on what basis.

**Work in progress is capped at your judgment, not the machine's capacity.**
Agents are not the constraint; the queue at your gate is. Ratify limits how many
specs a decider can have in flight, because you can only ratify as fast as you can
honestly judge. The throughput governor is human attention — so that is what the
system protects.

**A validator, not an honor system.** A deterministic checker reads the structure
two ways: advisory, in your editor while you and an agent shape — so the spec
stays in shape as it's written instead of drifting and failing late — and as a
hard gate at merge. It tells the agent exactly what it is being checked against,
in the format the agent reads, before the agent writes.

**Shipped work becomes memory.** When a feature ships, its spec graduates into
permanent product knowledge and the contract is archived, never deleted. The
product remembers why it is the way it is — across staff, vendors, and model
upgrades.

## What it is not

Not Scrum: its ceremonies ration human bandwidth, and when the builders are
agents that read the whole repo, you don't need a standup. Not vibe-coding: that
fails the moment scope exceeds what a single prompt can hold. Not
spec-as-eternal-source-of-truth: that bets on regenerating code from a spec and
inherits the drift it set out to avoid. Ratify keeps the spec exactly as long as
it is useful, and keeps the decision forever.

## The shape of the work

One product owner. Many agents — of whatever skill and cost the work warrants.
A human stands in two places: the gate where intent is ratified, and the gate
where the result is accepted. Everything between is delegated, and everything
between is verifiable.

Agents build. You ratify.
