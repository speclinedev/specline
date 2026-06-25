# Specline

The methodology contract — versioned, language-agnostic, human-decided. Specline
turns spec-driven development into an enforceable structure: a machine-checkable
shape for specs, with human judgment reserved for the two gates (ratify, final
review) and a deterministic validator (`doctor`) for everything in between.

This repo is the **contract**. It changes first; implementations follow.

## Contents

| Path | What |
|---|---|
| `specline-2.6.md` | The current canon (`2.6.1`). The governing rulebook. Stays at repo root — the site and CLI resolve it by globbing `specline-*.md` here. |
| `handbook.md` | The readable companion to the canon — the version you read to *understand* it. |
| `examples/` | The worked `0012-trade-in-quote` example — one feature, end to end. |
| `docs/` | Everything else: research, amendment records, prior versions, templates. See `docs/README.md`. |
| `site/` | The `specline.dev` site (Astro). Serves the raw canon at `/spec.md`. |
| `cli/` | The `@specline/cli` validator (`doctor`) — version-locked to the canon, published to npm. |

## Versioning

The canon is pinned by version. Implementations declare which canon they
implement (`doctor@2.6` ↔ canon `2.6.1`). The contract moves first; tooling
tracks it. Amendments are shaped as proposals in `docs/proposals/`, then folded
into the canon and retired to provenance.

## The validator

`doctor` — the deterministic structural validator for Specline repos — lives in
[`cli/`](cli/) (the `@specline/cli` package), version-locked to the canon. It reads
only markdown, YAML, and directory structure; it makes no judgment calls.
