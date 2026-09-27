# Specline

Specline is, first and before anything else, **a consistent way to write a
feature spec and a consistent place to keep it** — beside the code, so anyone
(or any agent) opening the repo can hydrate on intent: what's being built,
why, what was decided before, what's still open, and what already shipped.
Two normative parts carry that: *writing a spec* (Part 1) and *keeping the
record* (Part 2) — the folder lifecycle, the decider's go, graduation,
archive. A third part, *unattended builds*, is **experimental and opt-in**: a
switch for repos that run builds nobody is watching, off by default.

This repo is the **contract**. It changes first; implementations follow.

## Contents

| Path | What |
|---|---|
| `specline-3.1.md` | The current canon (`3.1`). The governing rulebook. Stays at repo root — the site and CLI resolve it by globbing `specline-*.md` here. |
| `handbook.md` | The readable companion to the canon — the version you read to *understand* it. |
| `examples/` | The worked `0012-trade-in-quote` example — one feature, end to end. |
| `docs/` | Everything else: research, amendment records, prior versions, templates. See `docs/README.md`. |
| `site/` | The `specline.dev` site (Astro). Serves the raw canon at `/spec.md`. |
| `cli/` | The `@specline/cli` validator (`specline`) — version-locked to the canon, published to npm. |

## Versioning

The canon is pinned by version. Implementations declare which canon they
implement (`specline@3.1` ↔ canon `3.1`). The contract moves first; tooling
tracks it. Amendments are shaped as proposals in `docs/proposals/`, then folded
into the canon and retired to provenance.

## The validator

`specline` — the deterministic structural validator for Specline repos — lives
in [`cli/`](cli/) (the `@specline/cli` package), version-locked to the canon. It
reads only markdown, YAML, and directory structure; it makes no judgment calls.
