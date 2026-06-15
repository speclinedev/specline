# Specline

**From intent to shipped to remembered — one unbroken line.**
*A spec-driven discipline for building with agents.*

---

## The problem

Every feature runs on a line. It starts as a decision — *we should build this,
and here's why.* It becomes a spec. The spec becomes code. The code ships. And
months later someone asks why it works the way it does. When that line stays
intact, a team moves at the speed of its agents. When it breaks — the *why* is
lost, the code drifts from the intent, no one can say who decided what — you get
the thing every fast team eventually drowns in: software no one understands,
built by a swarm no one can audit.

Agents make this worse before they make it better. They build fast, in parallel,
from whatever context they're handed. Point a capable model at a vague prompt and
it will confidently build the wrong thing, or over-build, or invent decisions
that were never yours to delegate — across ten branches at once. Construction
stops being the bottleneck. *Keeping the line of intent intact across a swarm*
becomes the bottleneck.

Specline is the discipline of keeping that line unbroken — and traceable end to
end.

## What Specline is

Specline is spec-driven: a versioned spec, living in the repo, is the contract an
agent builds from. That much it shares with the rest of spec-driven development.
It diverges on the bet most of the field makes — that the spec is the eternal
source of truth and code is regenerated from it. That bet inherits the drift it's
trying to escape, because updating code is always easier than updating a spec, so
the two fall out of sync.

Specline makes the opposite bet. **The spec is perishable; the code is
sovereign.** A spec is scaffolding — it exists to get a feature built correctly,
then it graduates. Code stays the source of truth for *what* the system does. The
spec keeps only what code can't say: intent, non-goals, the options you rejected
and why. Nothing competes with the code for the truth, so nothing drifts.

## The line

A spec travels a defined line, and each stage is a mechanism, not a ceremony:

**Shape.** You and an agent draft the contract — intent, non-goals, and
acceptance checks that can actually be run. Agents are good at this now; shaping
is shared work.

**Ratify.** A named human makes the bet: *yes, build this.* The approval is
recorded — who ratified, and when — because a decision no one will sign is a
decision no one is accountable for. This is the one act on the line that does not
delegate.

**Build.** Agents loop until the acceptance checks pass — not until the work
*feels* done. A deterministic validator watches the spec the whole way: advisory
while you shape, a hard gate at merge.

**Graduate.** When the feature ships, its spec graduates into permanent product
knowledge and the contract is archived, never deleted. The line doesn't end at
the merge — it terminates in memory the product keeps across staff, vendors, and
model upgrades.

End to end, the line is traceable: spec → ratifier → implementation → graduated
knowledge. For anything you ever shipped, you can walk it backward and answer
who, when, and why.

## What keeps the line from breaking

A claim without a mechanism is marketing, so — three load-bearing ones. "Done" is
falsifiable, or the spec can't be ratified. Work in progress is capped at the
human's judgment, not the machine's capacity: you can only ratify as fast as you
can honestly judge. And a deterministic checker enforces the structure, so the
convention is never merely honor-system. Each exists to keep one part of the line
from snapping.

## What it is not

Not Scrum: its ceremonies ration human bandwidth, and agents that read the whole
repo don't need a standup. Not vibe-coding: that breaks the moment scope exceeds
one prompt. Not spec-as-eternal-source-of-truth: that's the drift bet Specline
refuses. Specline keeps the spec exactly as long as it's useful — and keeps the
line forever.

## The shape of the work

One product owner. Many agents, of whatever skill and cost the work warrants. A
human stands at two points on the line: the gate where intent is **ratified**,
and the gate where the result is **accepted**. Everything between is delegated,
and everything between is verifiable.

One product owner. Many agents. One unbroken line.
