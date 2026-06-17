# Findings from real runs

Evidence gathered by actually running Specline, to drive what changes (and what doesn't).
Dated; not canon. The point is to decide from runs, not theory.

## 2026-06 · ID allocation contends under parallel planning

**Found while:** running the `/specline:shape` planning test across branches.

**Symptom:** a new spec got the same `NNNN` id as another in-flight (unmerged) spec on
a different branch. Today's rule (later-merger renumbers; `.id-counter` is the git
tripwire; `ID-DUPLICATE`/`ID-COUNTER-GAP` catch it) is *correct* — no silent
duplicates — but it taxes parallel planning: every branch races for the next number,
and the "mechanical" renumber still means fixing the folder name, the frontmatter `id`,
and any self-references.

**Candidate (v2.5, not now):** allocate the id **at merge, not at creation.** In-flight,
a spec's identity is its **slug**; the sequential number is stamped only when it lands on
the trunk. Kills the contention (numbers assigned serially on `main`, never raced), and
fits the canon's own claim that *nothing references an unratified id* — so why hand out
the scarce number before the spec is real? Reference by slug in-flight; number on merge.
