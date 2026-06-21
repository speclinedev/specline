# Specline

**Status:** DRAFT — convention defined; both repos need to adopt
`docs/product/features/` for shipped specs.

> **Positioning.** This document describes the **canonical TaskSource**
> consumed by the orchestrator: a feature spec living in the repo at
> `docs/features/<id>/spec.md`. It's the recommended task shape for
> substantial work because the spec sits inside the repo's knowledge graph
> (adjacent specs, ADRs, conventions) and the implementer gets that context
> for free. Lighter task shapes (issue-triggered, free prompt, failing
> test) are tracked in `contracts/proposals/orchestrator-growth.md` and
> ADR `decisions/0005-orchestrator-task-source-abstraction.md`. They exist
> for bounded work that doesn't warrant spec ceremony — not as equivalents
> to specs.

## Lifecycle

| Stage | Path | Status |
|---|---|---|
| In-flight feature | `docs/features/<id>/spec.md` (+ `status.md`, `relations.md`) | Spec under review or implementation in progress. |
| Shipped feature | `docs/product/features/<id>/spec.md` | Spec PR merged + implementation PR merged. |
| In-flight bug | `docs/bugs/<id>/spec.md` | Bug spec under review. |
| Shipped bug | `docs/product/bugs/<id>/spec.md` | Bug fix shipped. |

When a feature ships, the `docs/features/<id>/` directory is **moved** (not
copied) to `docs/product/features/<id>/` as part of the implementation PR.

## File contract

### `spec.md`

What to build. The contract the builder consumes. Format:

```markdown
# Feature <id>: <short title>

## Context
Why this is being built. What user pain or product motivation.

## Goal
The one-sentence outcome.

## Behavior
Numbered list or table of observable behaviors. Each one verifiable from
outside.

## Non-goals
Explicit list of things this spec does NOT include.

## Critical files
Pointers to existing code the builder should read first.

## Acceptance
A bullet list of "done means…" criteria. Falsifiable.
```

Each repo MAY extend this template; both repos provide a
`docs/conventions/templates/spec-template.md` they keep canonical.

### `status.md` (in-flight only)

Current state of work. Updated as the implementation progresses. When the
feature ships, this file is deleted (information either stays in spec.md or
gets folded into commit messages / PR description).

### `relations.md`

Cross-references — which other features this depends on, which it relates to,
which this supersedes.

## Two-PR pattern

Standard flow for autonomous-mode work:

1. **Spec PR:** adds `docs/features/<id>/{spec,status,relations}.md`.
   Reviewed for clarity, completeness, scope. Optionally reviewed by a
   `spec_critic` AgentConfig before merge.
2. **Implementation PR:** the builder's diff. References the spec.

Same pattern works for interactive-mode work, just with humans driving
instead of agents. Recommended even for solo work — forces you to articulate
the target before grinding on the diff.

## ID convention

Four-digit zero-padded incrementing integer per repo (`0001`, `0027`, etc.).
IDs are repo-local; the same ID can exist in multiple repos referring to
different features. Cross-repo references use full paths
(`treeline/docs/features/0027/`).

## What goes in this repo's `docs/` vs. a working repo's `docs/`

| Doc | Lives in |
|---|---|
| Feature spec for a Mac app feature | `treeline/docs/features/<id>/` |
| Feature spec for an orchestrator feature | `orchestrator/docs/features/<id>/` |
| Cross-system protocol (e.g., claim handoff) | `git-treeline/docs/contracts/` |
| Cross-system ADR | `git-treeline/docs/decisions/` |
| Repo-local ADR (e.g., "Mac uses SwiftData") | That repo's `docs/product/decisions/` |
| Glossary entry for a cross-cutting term | `git-treeline/docs/glossary.md` |
| Term that's only used in one repo | That repo's docs |

When in doubt: does another repo's agent need to read it to do their job? If
yes → here.
