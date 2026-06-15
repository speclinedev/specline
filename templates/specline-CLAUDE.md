# Specline repo — agent brief

> Drop this file in at a repo's root as `CLAUDE.md`. Claude Code reads it
> automatically, so any agent you open here is briefed without you pasting
> anything. The `doctor` MCP tools referenced below are available because the
> doctor server is registered at user scope.

This repo uses **Specline**: spec-driven development where a machine-checkable
*spec* is the contract, humans hold the **two gates** (ratify, final review), and
the agent runs the loop in between. Your job is to help the product owner (PO)
shape and migrate plans into this model — collaboratively, never autonomously.

## Before you write anything

1. Call **`doctor_spec`** → loads the current Specline canon into your context.
   That is the authoritative methodology. Do not work from memory of it.
2. Call **`doctor_rules`** → the exact checklist this repo's structure is graded
   against (every `rule_id`, its severity and scope). Write to pass these.

## How to migrate an existing plan with the PO

1. **Read the existing plan** (wherever it lives) and reflect it back to the PO
   in your own words. Confirm the *intent* and the *appetite* (how big — one
   sitting?) before structuring anything.
2. **Propose the spec folder**, don't impose it. For each feature:
   ```
   docs/specs/NNNN-slug/
     spec.md          # the contract (see anatomy below)
     relations.md     # forward edges: depends_on / part_of / supersedes / conflicts_with
     status.md        # build-loop memory (once building)
     open-questions.md# unresolved decisions (optional)
   ```
   First-time setup also needs `docs/conventions/doc-architecture.md` (pins the
   canon version + tier) and `docs/specs/.id-counter` (a bare integer).
3. **Ask, don't assume.** Anything you can't derive — decider, blast_radius,
   acceptance criteria — becomes an entry in `open-questions.md` with *who
   decides*, *the options*, *a default*, and *a deadline*. A logged default lets
   the build move without blocking on the PO.
4. **Keep the PO at the gates.** You draft; the PO ratifies. Never mark a spec
   `ratified` yourself — that is the PO's judgment call.

## spec.md anatomy

Frontmatter (between `---` fences):
`id`, `slug` (must match the directory `NNNN-slug`), `type`, `status`
(`draft|ratified|building|blocked|shipped|killed`), `decider`, `blast_radius`
(`low|medium|high`), `created`, `canon`. Add `ratified_by`/`ratified_at` once
ratified or building.

Body sections (use these names — others are tolerated but flagged):
**Intent**, **Non-goals**, **Behavior** (numbered, observable), **Business
rules**, **Critical files**, **Acceptance checks** (mark each `(agent-loopable)`
or `(human-gate)`), **Out of scope**.

## Check your work continuously

While shaping, run **`doctor_check`** in **author** mode, naming the files you
touched:

```
doctor_check(path=".", mode="author", changed=["docs/specs/0007-slug/spec.md", ...])
```

- `author` mode reports missing required elements as `distance_to_ratifiable`
  (info) rather than errors — a draft is expected to be incomplete.
- Self-correct from each finding's `rule_id` + `fix_hint` until the only
  remaining items are genuine PO decisions. Then hand to the PO for the ratify
  gate.
- Before handoff, run once in **gate** mode to confirm zero `error` findings.

doctor is deterministic and reads only structure — it never judges meaning.
Tense, sizing, and whether the spec is *right* are the PO's call at the gates.
