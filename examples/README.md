# Specline v2 — Worked Example

One feature, end to end, exactly as the canon prescribes. The feature is
`0012-trade-in-quote` (a customer-facing trade-in quote form, borrowed from
the club_value domain).

## Timeline

1. **Shape** (Jun 11) — agent drafts the spec folder from the PO's notes
   plus `discovery.md` evidence. One open question logged with a decider,
   a default, and a deadline.
2. **Ratify** (Jun 11) — Spec PR: this walkthrough uses the two-branch shape,
   the spec landing ahead of the build. PO reads it in one sitting (B1) and
   gives the go — the commit flipping `status: ratified`, made or approved by
   the decider. Git records who and when; ratification has no frontmatter
   field. Landing the spec PR freezes the slug.
3. **Build** (Jun 12) — `status: building`, `stale_after` set +7d.
4. **Reshape** (Jun 13) — builder discovers the pricing API can't quote
   discontinued SKUs. `status: blocked`. A decider-approved spec-amendment
   commit narrows Behavior 4, adds a non-goal, and resets `stale_after` in the
   same commit. Building resumes against the amended contract. *This is the
   mid-build revision the instrumentation wants to see — it is normal.*
5. **Graduate** (Jun 15) — implementation PR runs the acceptance checks
   (results linked), writes `knowledge/0012-trade-in-quote/`, moves the
   final spec to `archive/0012-trade-in-quote/` with `status: shipped`,
   deletes the spec folder, regenerates `relations-index.yml`.

## What to notice

- The archived spec (in `archive/`) still carries its acceptance checks and
  results link — the audit trail needs no git archaeology.
- The knowledge docs are shorter and more confident than the spec, record
  rules and rationale, and restate nothing the code already says (B6).
- The open question never blocked the build: its default applied at
  deadline and the resolution is recorded in the archived spec.
- Every reference in these files is by ID, never by lifecycle path.

Files here mirror their final resting places:

```
archive/0012-trade-in-quote/spec.md       # the preserved contract
knowledge/0012-trade-in-quote/overview.md
knowledge/0012-trade-in-quote/behavior.md
```
