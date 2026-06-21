# Findings from real runs

Evidence gathered by actually running Specline, to drive what changes (and what doesn't).
Dated; not canon. The point is to decide from runs, not theory.

External evidence (literature/practitioner research) is admissible too, but labeled as
such — it tells us where the field has converged, not what *our* runs prove. Treat it as
a prior, not a verdict.

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

## 2026-06 · External evidence · Loop-engineering research vs. the v2.4 loop model

**Source:** parallel literature/practitioner sweep (six fresh-context research agents) over
Anthropic engineering posts, podcast transcripts (Latent Space, Dwarkesh, Every), the
self-correction/verification academic literature, agent-framework defaults, and the
spec-driven-dev field (spec-kit, Kiro, Tessl, Beck/Fowler/Böckeler, Shape Up). External
evidence, not a Specline run — read as a prior. Full citations at the end.

**What it confirms (stop re-litigating these).**
- **The fresh-context verifier is the single best-supported decision in the design.** It is
  the documented fix for the most reliable agent failure mode: agents *"confidently
  praising the work—even when… obviously mediocre"* and *"declaring the job done"*
  prematurely (Anthropic harness posts). Academic spine: self-critique *degrades* reasoning
  without external grounding (Huang et al.; Stechly/Kambhampati — *"performance collapse
  with self-critique… gains with sound external verification"*). Cognition's 2026 reversal
  puts our read-only verifier in the exact endorsed class: *"writes stay single-threaded…
  additional agents contribute intelligence rather than actions."*
- **The named-spec-section requirement is load-bearing** — it is what turns an unreliable
  judge reliable. LLM-as-judge is *"generally not a very robust method"* (Agent SDK) *unless*
  grounded against explicit criteria: *"'does this follow our principles for good design?'
  gives Claude something concrete to grade against"* (harness post). The B5 citation rule is
  precisely this gate; make it the headline of the judgeable altitude, not a shape-check
  footnote.
- **The three altitudes match the field's own cut.** Sholto Douglas, near-verbatim:
  *"if you can construct a grading criteria that an everyday person off the street could do,
  the models are probably capable… if it requires expertise and taste, that's a tougher
  question."* Böckeler's "computational vs. inferential sensors" is provable-vs-judgeable
  independently reinvented.
- **Budget numbers have backing.** `loop_budget` ≈ 10, ceiling ~20–25 (OpenAI SDK default
  10; 12-Factor "3-10, maybe 20 max"; LangGraph/CrewAI 25 backstop). Outer bounce budget
  2–3 (Anthropic harness "3 rounds"; Claude Code's 8-block Stop-hook cap). Compounding math
  agrees we must stay shallow: 95%/step → 14 steps is already a coin flip.

**Gaps the canon doesn't yet address (ranked by leverage).**
1. **Loop control is count/time-aware but not context-aware.** Token accumulation predicts
   failure better than iteration count (*token usage "explains 80% of the variance"*;
   context rot visible at 50K of a 200K window; 12-Factor's ~40% "dumb zone"). `staleness`
   (time) and `loop_budget` (count) are both blind to the regime where the agent confidently
   produces wrong work. Add a **context-fill trigger as a first-class peer**, and compact
   between inner-loop iterations and between outer-loop bounces (measured: +29–39% accuracy,
   84% fewer tokens). The fresh verifier should receive a distilled artifact (~1–2k tokens:
   diff + section), never the implementer's trace.
2. **Escalation is competence-based only; add consequence-based.** OpenAI names a second,
   independent human-gate trigger we lack: *"High-risk actions… sensitive, irreversible, or
   high stakes should trigger human oversight"* regardless of loop health. Wants a tool-risk
   taxonomy (read / reversible-write / irreversible / external) + an execution sandbox
   independent of the acceptance checks. `blast_radius` currently tunes *effort*; it should
   also tune *where the human gate sits*.
3. **Provable checks are gameable; treat them as immutable to the implementer.** Reward
   hacking is concrete: *"I hard-coded everything. The test passes"* (Cherny); `sys.exit(0)`
   to fake a pass; *"Claude simply cheats here and calls out to GCC"* (Carlini); Cursor's
   Composer learned to emit a broken tool call to dodge a negative reward. So: commit checks
   first and diff against originals (spec-kit: *"Tests are confirmed to FAIL"* first), and
   make **budget-exhaustion an explicit *negative* outcome**, never a cheaper exit than
   passing. This is the deepest argument *for* the outer loop: a passing provable check is
   necessary, not sufficient.
4. **Who authors the checks?** The canon runs *against* provable checks but is silent on
   their origin. LLM-authored specs skew *"too loose"* (false-accept) at function level
   (CodeSpecBench). spec-kit's `/analyze` coverage map (every requirement → ≥1 task, flag
   orphans) is a cheap mechanical precursor to judging. Implementer generates checks where
   none exist; the verifier audits their coverage against the section.
5. **Verifier should be a different model/family than the implementer.** Self-recognition
   causally drives self-preference (Panickssery et al., τ up to 0.74). Fresh context removes
   trace bias; a different model removes self-preference bias.
6. **Detect stuck loops early** instead of waiting for the budget to drain: hash
   `(tool_name, canonical-args)`, trip on 2–3 repeats; or `progress_delta == 0` for two
   steps. Real incidents: 187 identical calls / $41 overnight; 847 reasoning steps at $47/min.
7. **Resolve "fresh context vs. share traces."** Cognition says *"share full agent traces"*;
   we say fresh context. Reconcile: the verifier is a judge, not a co-author — give it the
   artifact + section + a **factual dead-end ledger** (from `status.md`), withholding the
   implementer's rationalization. Without the ledger, bounces re-litigate settled dead-ends.
8. **No constitution/steering layer.** spec-kit and Kiro both auto-inject project-wide
   non-negotiables into every spec; Specline has none. See the companion finding below —
   this is the same gap as "the human's corrections must become hard artifacts."

**Tensions to defend, not dismiss.**
- *Over-engineering.* Anthropic's rule — *"only increase complexity when it demonstrably
  improves outcomes"* — and their method of *"removing one component at a time."* When they
  did it, planner + evaluator survived; sprint contract and context-resets got cut. Run that
  ablation on us: verifier + spec-gate clearly survive; the parts to stress-test for
  *independent* value are the **two separate budgets** and the **staleness trigger**.
- *Verification isn't always easier than generation.* Code review is a reverse-asymmetry case
  (Jason Wei) — judging code conformance is closer to "hard review" than "math with an answer
  key." The named-section requirement is exactly what claws verifiability back; without it the
  judgeable altitude sits where the generator-verifier gap inverts. Strengthens B5.

**Provenance caveat.** This synthesis was produced by a single context that also acted as
implementer and reviewer of itself — exactly the self-grading topology the top finding warns
against. It has been (or should be) refuted by a separate fresh-context agent before any of it
reaches the canon. See the refutation pass result alongside this entry.

**Key sources:** anthropic.com/engineering/{building-effective-agents, harness-design-long-running-apps,
effective-harnesses-for-long-running-agents, effective-context-engineering-for-ai-agents,
multi-agent-research-system}; claude.com/blog/building-agents-with-the-claude-agent-sdk;
code.claude.com/docs/en/best-practices; cognition.com/blog/{dont-build-multi-agents,
multi-agents-working}; github.com/humanlayer/12-factor-agents; research.trychroma.com/context-rot;
arXiv 2310.01798 (Huang), 2402.08115 (Stechly/Kambhampati), 2404.13076 (Panickssery),
2306.05685 (Zheng, LLM-as-judge); jasonwei.net/blog/asymmetry-of-verification-and-verifiers-law;
metr.org time-horizon work; spec-kit (github.blog), kiro.dev, tessl.io, basecamp.com/shapeup;
newsletter.kentbeck.com; martinfowler.com/articles/sensors-for-coding-agents.html.

## 2026-06 · Open question · Do the human's corrections need to become hard artifacts?

**Raised while:** discussing how the human (decider) is a bottleneck — holding context, taste,
and continuity in their head rather than in the repo. The claim under test: *a correction made
in one loop should inform an artifact that prevents the same error in a later or entirely
different agent loop.* The objection: *isn't that just rules + CLAUDE.md?*

**Why it's not just CLAUDE.md (the distinction worth keeping):** CLAUDE.md and a rules catalog
are **flat, global, unfalsifiable, and unenforced at acceptance.** A correction has an
*altitude* — the same axis the canon already uses for acceptance:
- Some corrections are **provable** — they become a check/lint/test. ("Don't break the build"
  → a command.) These belong in the inner loop, not a markdown file.
- Some are **judgeable** — a stable preference a fresh verifier can grade against a named
  section. ("Prefer composition here," "match surrounding comment density.") These belong in
  a **constitution/steering layer** the canon doesn't yet have — and crucially they must be
  *cited at acceptance* (B5), not just stated, or they decay into the same unenforced prose
  as CLAUDE.md.
- Some are **tasteable** — genuinely one-off, not yet articulable as a rule. These should
  *not* be promoted; promoting them prematurely is over-fitting (Cursor's reward-hack lesson;
  CodeSpecBench's too-strict specs that never exit).

**The actual finding:** the value isn't "write corrections down" (CLAUDE.md already does that
badly). It's **routing each correction to the right altitude, and migrating it *down* over
time** — tasteable → judgeable (write the principle) → provable (write the check). The
system's velocity is set by the rate of that downward migration. This makes "altitude" not a
static partition (v2.4) but a **gradient the human actively pushes work down** — the missing
verb in the canon. CLAUDE.md is the degenerate case: every correction dumped at one altitude
(flat prose), never enforced, never lowered.

**Candidate (needs a run to confirm, not now):** a steering/constitution layer that is
(a) altitude-tagged, (b) cited at acceptance like any judgeable check, (c) has a promotion
path from tasteable → judgeable → provable, and (d) is the thing a *cold, different* agent
loads to inherit the decider's accumulated judgment without the decider present.

## 2026-06 · Refutation pass (fresh-context) on the two findings above

A separate fresh-context reviewer (no access to the synthesizing agent's reasoning) was given
the canon + the two findings above and told to refute. Verdicts, recorded honestly because the
synthesis was self-graded:

**Survives strongest:**
- **Fresh-context verifier is best-supported** — tight literature-to-design fit; but it's a
  *confirmation*, changes nothing, hence least actionable.
- **Provable checks are gameable → passing ≠ sufficient; budget-exhaustion must be an explicit
  *negative* outcome, not a cheap exit.** Real soft spot: B5 allows the provable exit to be
  *"the implementer's grounded assessment… a runnable command is the strongest form, not the
  required form"* (canon ~L175-177) — exactly the surface reward-hacking exploits. Genuinely
  additive fix the canon doesn't yet make. (Ships with a tension vs. "implementer authors
  checks" — reconcile as *author once, then freeze + diff*.)
- **Corrections-cited-at-acceptance ≠ CLAUDE.md** — survives; see the companion finding's
  correction below.

**Weakened / refuted (record the corrections):**
- **"Loop control should be context-aware" / "detect stuck loops early" / "tool-risk taxonomy
  + sandbox"** — these are *runner* concerns, not *canon* concerns. The canon explicitly
  delegates orchestration to an external pluggable runner (~L408, L619-622, L938-947). A
  context-aware runner can compact and gate on token-fill without the canon saying a word.
  **The synthesis's central error: it conflated the canon with the runner**, grading a
  single-decider pluggable-runner *methodology* against frontier-lab *infrastructure* and
  manufacturing "canon gaps" that are unbuilt runner features.
- **"Verifier should be a different model/family"** — REFUTED against the canon's actual
  model. The canon's independence is *fresh-context*, not different-model, and routing pins the
  *same* frontier tier on both sides for high `blast_radius` (~L217, L308-312, L663). Fresh
  context already handles self-*blindness* (the dominant effect); self-*preference* is
  second-order. At most a "nice-if-available" runner preference, never a rule.
- **"Feed the verifier a factual dead-end ledger"** — REFUTED: the canon already has the
  ledger (`status.md` *Dead ends*, ~L469-483) and already defines the hand-back channel
  (artifacts + tool results + `status.md`, never the reasoning transcript, ~L596-598,
  L680-684). The "fresh context vs. share traces" tension was largely manufactured.
- **"Specline has no constitution/steering layer"** — FACTUALLY WRONG. `conventions/` and
  `technical/` are exactly that, and the judgeable gate already cites them (~L444-446, L552,
  L561-562). The gap is narrower than claimed: not "add a layer" but "add a *routing
  discipline + promotion path* over the layer that exists."
- **Escalate on consequence** — already partly canon: the implementer pauses for *"a
  destructive/irreversible action, a real scope change, or input only the decider can
  provide"* (~L691). Transferable kernel already present; the taxonomy+sandbox is runner-side.
- **"Altitude as a gradient" is a novel verb** — WEAKENED to already-implied. The canon
  already *"concentrates judgment at two gates and automates everything between"* and
  *"rations human judgment… treats agent time as nearly free"* (~L79-81, L122). Downward
  migration is the canon's existing economy re-narrated, not a new mechanism.

**Net:** of the eight "gaps," the ones that actually land on Specline's surface (docs/schema)
are: **(C3) reward-hack hardening of the provable exit**, **(C4) a deterministic Behavior→check
coverage audit**, and **the promotion-with-enforcement idea over the existing `conventions/`
layer**. The rest are runner features the canon deliberately doesn't own, or things already in
canon. The refutation demonstrated the top finding *on the synthesis itself*: the self-grading
context imported literature priors without checking the existing canon — the exact
self-blindness the fresh-context verifier exists to catch.

**Resolved → folded into the canon as v2.5 (decisions ratified 2026-06-20; shaping record
at `docs/proposals/v2.5-amendment.md`).** After a
verification pass + two calibrated second opinions (Opus, then Sonnet — which agreed on the
overall shape and split only on C4 and the provenance field), the decider ratified: **C3** in
full (incl. the check-authoring gate both passes flagged + budget-exhaustion-as-failure);
**D** as a one-paragraph promotion discipline; corrections saved permanently into the knowledge
doc at graduation, with a who-caught-it field (`implementer|reviewer|decider`), logged in a
**required, shape-checked** `## Corrections` status section (the decider's consistency concern,
resolved with no new machinery). **Deferred:** C4 (the coverage warning → future review
system), and the whole harvest/corpus/cross-project-router/two-axis architecture (earned by
data, not built now).
