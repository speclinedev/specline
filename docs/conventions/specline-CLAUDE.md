# Specline repo — agent brief

> Drop this file in at a repo's root as `CLAUDE.md`. Claude Code reads it
> automatically, so any agent you open here is briefed without you pasting
> anything. The `specline` MCP tools referenced below are available because the
> specline server is registered at user scope.

This repo uses **Specline**: spec-driven development where a machine-checkable
*spec* is the contract, humans hold the **two gates** (ratify, final review), and
the agent runs the loop in between. Your job is to help the product owner (PO)
shape and migrate plans into this model — collaboratively, never autonomously.

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
   in your own words. Confirm the *intent* and the *appetite* — how big the *spec*
   is to *review* in one sitting, **not** how big the build is (build size is the
   separate `size: small|large` field). If the contract won't fit one sitting,
   decompose into a **parent-map** (`type: parent` — a map, not a plan; no
   mechanics) over buildable child scopes.
2. **Propose the spec folder**, don't impose it. For each feature:
   ```
   docs/specs/<slug>/        # the folder name IS the spec's identity
     spec.md          # the contract (see anatomy below)
     relations.md     # forward edges: depends_on / part_of / supersedes / conflicts_with
     status.md        # build-loop memory (once building)
     open-questions.md# unresolved decisions (optional)
   ```
   First-time setup also needs `specline.yml` at repo root (the source of truth
   for the canon pin, tier, thresholds, and model map). `doc-architecture.md` is
   now optional prose only. (There is no id counter — a spec's slug is its
   identity, chosen when you create the folder.)
3. **Ask, don't assume.** Anything you can't derive — decider, blast_radius,
   acceptance criteria — becomes an entry in `open-questions.md` with *who
   decides*, *the options*, *a default*, and *a deadline*. A logged default lets
   the build move without blocking on the PO.
4. **Keep the PO at the gates.** You draft; the PO ratifies. Never mark a spec
   `ratified` yourself — that is the PO's judgment call.

## spec.md anatomy

Frontmatter (between `---` fences):
`slug` (the folder name — a spec's identity; must match the directory), `type`
(`feature|bug|chore|parent`), `status`
(`draft|ratified|building|blocked|shipped|killed`), `decider`, `blast_radius`
(`low|medium|high`), `size` (`small|large` — declared *build* size, default
`small`), `created`. Add `ratified_by`/`ratified_at` once ratified or building,
and `stale_after` (the staleness/abandonment date) on entering `building` or
`blocked`. The canon version is pinned once in `specline.yml`, not per spec.

Body sections (use these names — others are tolerated but flagged):
**Intent**, **Non-goals**, **Behavior** (numbered, observable), **Business
rules**, **Critical files**, **Acceptance checks**, **Out of scope**.

Acceptance checks are **partitioned by altitude** — mark each one:
`(agent-loopable)` provable, leads with a runnable command; `(judgeable)`
settled by a fresh-context agent against a **named** spec section (the section
reference is mandatory — no section, not falsifiable); or `(human-gate)`
tasteable, a person decides once. A `parent` spec carries no acceptance at all.

## Check your work continuously

While shaping, run **`specline_check`** in **author** mode, naming the files you
touched:

```
specline_check(path=".", mode="author", changed=["docs/specs/0007-slug/spec.md", ...])
```

- `author` mode reports missing required elements as `distance_to_ratifiable`
  (info) rather than errors — a draft is expected to be incomplete.
- Self-correct from each finding's `rule_id` + `fix_hint` until the only
  remaining items are genuine PO decisions. Then hand to the PO for the ratify
  gate.
- Before handoff, run once in **gate** mode to confirm zero `error` findings.

specline check is deterministic and reads only structure — it never judges meaning.
Tense, sizing, and whether the spec is *right* are the PO's call at the gates.
