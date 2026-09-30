# Doc architecture — pin & deciders

| Field | Value |
|---|---|
| **Canon** | Specline `3.1` (governing contract: `specline-3.1.md` in repo `speclinedev/specline`) |
| **Decider** | `jonathan` (non-delegable) |
| **Deputy** | none yet — staleness/open-question deadlines park to stated defaults until one is named |
| **`specline` distribution** | See `doctor/open-questions.md`. A canon-MAJOR.MINOR-pinned package (`specline` CLI, `@vMAJOR.MINOR` on the GitHub Action) plus standalone compiled binaries built from the same source. |

This table is optional prose/rationale — `specline.yml` at the repo root is the
machine-readable source of truth for the canon pin and thresholds Specline
actually reads (`CANON-PIN-MISMATCH` compares that pin, not this file).
