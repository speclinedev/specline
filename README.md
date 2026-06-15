# Specline

The methodology contract — versioned, language-agnostic, human-decided. Specline
turns spec-driven development into an enforceable structure: a machine-checkable
shape for specs, with human judgment reserved for the two gates (ratify, final
review) and a deterministic validator (`doctor`) for everything in between.

This repo is the **contract**. It changes first; implementations follow.

## Contents

| Path | What |
|---|---|
| `specline-2.3.md` | The current canon (`2.3.0-draft`). The governing rulebook. |
| `examples/` | The worked `0012-trade-in-quote` example — one feature, end to end. |
| `history/` | Prior canon versions (`spec-flow-v2`, `v1`), kept for the audit trail. |
| `thesis/` | Positioning and rationale docs. |
| `site/` | Landing-page draft and design notes. |

## Versioning

The canon is pinned by version. Implementations declare which canon they
implement (`doctor@2.3` ↔ canon `2.3.0`). The contract moves first; tooling
tracks it.

## The validator

`doctor` — the deterministic structural validator for Specline repos — lives in
the sibling [`doctor`](../doctor) repo (`speclinedev/doctor`). It reads only
markdown, YAML, and directory structure; it makes no judgment calls.
