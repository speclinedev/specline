# Specline web book — design feedback round 2

Paste-ready brief for the design agent. The book is approved in direction:
A's copy + B's loop + C's palette stays, the boundary enforcement tags stay,
the claims-with-failure-modes table stays. This round is content gaps, one
new page, and handoff guidance.

## Positioning decision (context, not a task)

This site is the canonical copy *for the marketing-site repo's agents* — it
pins Canon 2.2.0 and re-reviews when the canon amends. Humans read the book;
agents consume a raw endpoint (item 1). Design accordingly.

## 1. New: the agent endpoint — `spec.md` page

The site's distinguishing feature: the methodology is consumable by the
reader's *agents*, not just the reader.

- Add a stable route serving the canon as **raw markdown** (`/spec.md`, plus
  `/llms.txt` pointing at it).
- Add a short section near the end-CTA — "Point your agent here" — with a
  copyable snippet (e.g. `curl -s specflow.dev/spec.md`) and one line:
  *"Everything your agent needs to operate Specline, in the format it
  reads best."*
- Add a persistent "For agents ↗" link in the topbar or footer.
- Style the page itself as bare markdown — deliberately undesigned; that IS
  the design.

## 2. Content fixes (fidelity to canon 2.2)

- Ch 01 meta says "the one thing it rations" — it rations three (judgment,
  context, verification). Fix the line.
- Tier 2 card says "parallel agents, no coordination" — overclaims. Match
  the claims table: "minimal coordination." The site never claims more than
  the canon does; that restraint is the brand.

## 3. Content gaps (the book must be implementable from)

The stated goal is "read it and implement." Three things a reader cannot
currently build from the book:

- **Spec folder anatomy** (Ch 07): add the file-list figure —
  `spec.md` REQUIRED, `relations.md` REQUIRED ("none" valid; absence not),
  `open-questions.md` REQUIRED while unresolved, `status.md` required for
  autonomous builds, `discovery.md`/`api.md`/`design.md` OPTIONAL. Same
  codeblock treatment as the folder tree.
- **The open-questions contract** (Ch 07): its own figure/block. Every entry
  carries *who decides, the options, the default, the deadline*; an entry
  with default + future deadline is legal during building. Teaching line:
  "indecision becomes a logged choice with an override window — agents keep
  moving."
- **Knowledge anatomy** (Ch 08, after graduation): `overview.md` /
  `behavior.md` / `api.md` and how B6 shapes them. Keep the line "if a
  knowledge doc would lose an argument with the code, it shouldn't exist; if
  it records why the code is the way it is, it can't lose that argument."

## 4. Appendix: the worked example

Add a short appendix chapter (or linked sub-page) rendering the
`0012-trade-in-quote` example: timeline (shape → ratify → reshape →
graduate), the archived spec, and the graduated knowledge docs. Strongest
teaching asset we have; it shows a mid-build amendment as *normal*.

## 5. Accessibility + structure

- Remove `aria-hidden="true"` from the cover colophon — it contains real
  content (rations, gates, the loop).
- Sub-1080px: the TOC must collapse to a reachable menu, not disappear.
- Add a print stylesheet — a web book's printable/PDF form is half the
  genre (and was already floated as next step).

## 6. Handoff guidance (so no further work is wasted)

- Production target is **static HTML/CSS + vanilla JS**. Do not invest
  further in the React/Babel tweaks panel.
- Decision: tweaks are a design-review tool, not a product feature. Ship
  **dark as default with a single dark/paper toggle** (vanilla JS,
  localStorage); drop the font switcher; load only the default pairing
  (Space Grotesk / Spectral / IBM Plex Mono).
- Scroll-spy: IntersectionObserver in production (current version fine for
  prototype).
- Footer: keep the Canon 2.2.0 pin and add "this site re-reviews when the
  canon amends."
