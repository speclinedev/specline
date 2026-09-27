# Specline repo — agent brief

> Drop this file in at a repo's root as `CLAUDE.md`. Claude Code reads it
> automatically, so any agent you open here is briefed without you pasting
> anything. The `specline` MCP tools referenced below are available because the
> specline server is registered at user scope.

This repo uses **Specline**: spec-driven development where a machine-checkable
*spec* is the contract, humans hold the **two gates** (approve, final review),
and the record lives in four folders (`drafts/ → specs/ → knowledge/ +
archive/`). Your job is to help the product owner (PO) shape and migrate plans
into this model — collaboratively, never autonomously.

## Planning a new feature

To shape a new feature with the PO, invoke the **`/specline:shape`** prompt (or, if
your client can't, ask to adopt the Specline planning persona). It pulls the canon
and runs the shaping conversation — the PO speaks in product terms; you translate to
the spec. Migrating an existing plan? See the steps below.

## Before you write anything

1. Call **`specline_spec`** → loads the current Specline canon into your context.
   That is the authoritative methodology. Do not work from memory of it.
2. Call **`specline_rules`** → the exact checklist this repo's structure is graded
   against (every `rule_id`, its severity and scope). Write to pass these.

## How to migrate an existing plan with the PO

1. **Read the existing plan** (wherever it lives) and reflect it back to the PO
   in your own words. Confirm the *intent* and the *appetite* — how big the
   *spec* is to *review* in one sitting, **not** how big the build is. If the
   contract won't fit one sitting, decompose into a **parent-map**
   (`type: parent` — a map, not a plan; no mechanics) over buildable child
   scopes.
2. **Write the spec folder in `docs/drafts/<slug>/`** while it's still being
   shaped — it may be incomplete, and it's fine to delete it if the PO drops
   the idea. Nothing may depend on a draft yet.
   ```
   docs/drafts/<slug>/       # the folder name IS the spec's identity
     spec.md          # the contract (see anatomy below)
     relations.md     # forward edges: depends_on / part_of / supersedes / conflicts_with
     open-questions.md# unresolved decisions (optional)
   ```
   First-time setup also needs `specline.yml` at repo root (the source of truth
   for the canon pin, thresholds, and model map). (There is no id counter — a
   spec's slug is its identity, chosen when you create the folder.)
3. **Ask, don't assume.** Anything you can't derive becomes an entry in
   `open-questions.md` with *who decides*, *the options*, *a default*, and *a
   deadline*. A logged default lets the build move without blocking on the PO.
4. **Keep the PO at the gates.** You draft; the PO approves. Moving the folder
   from `docs/drafts/` to `docs/specs/` is the PO's call, never yours to make
   alone — that move, recorded in git, *is* the approval; there is no
   frontmatter field for it.

## spec.md anatomy

Frontmatter (between `---` fences) is four keys: `slug` (the folder name — a
spec's identity; must match the directory), `type` (`feature|bug|chore|parent`),
`decider`, `created`. There is no `status` field to keep in step with the
folder — **where a spec lives is its state** (`drafts/` being shaped,
`specs/` approved for build, `knowledge/` + `archive/` shipped). The canon
version is pinned once in `specline.yml`, not per spec.

## Building it

The normal shape is **one branch**: the spec lands, you build against it in the
same branch, graduation runs, one pull request carries the contract, the build,
and the knowledge doc. Its approving merge is the record — you do not need the
spec merged to main before you start building against it.

You are **attended**: the PO is reachable, and disagreement is a normal move,
not a violation. If you find a contradiction, a gap, or a cheaper cut mid-build,
say so in product terms. Once the PO agrees, edit `spec.md` in the branch
yourself — acceptance checks included, proposed before you change them — and
the diff is the record. No separate PR, no handback ceremony.

Body sections (use these names — others are tolerated but flagged):
**Intent**, **Goal**, **Non-goals**, **Behavior** (numbered, observable),
**Business rules**, **Assumptions**, **Critical files**, **Acceptance checks**,
**Out of scope**.

**Acceptance checks are one list**, each item falsifiable — settleable the
same way twice. An item only a person can settle sits under an optional
`### human` sub-heading. A `parent` spec carries no acceptance at all.

## Check your work continuously

While shaping, run **`specline_check`**, naming the files you touched:

```
specline_check(path=".", changed=["docs/drafts/<slug>/spec.md", ...])
```

- In `drafts/`, only parse-level integrity runs — incomplete is what a draft
  is for.
- Self-correct from each finding's `rule_id` + `fix_hint` until the only
  remaining items are genuine PO decisions. Then hand to the PO for the
  approval gate (the move to `specs/`).
- Before handoff, confirm the check reports zero `error` findings.

`specline_check` is deterministic and reads only structure — it never judges
meaning. Tense, sizing, and whether the spec is *right* are the PO's call at
the gates.
