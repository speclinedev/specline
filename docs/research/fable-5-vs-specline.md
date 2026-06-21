# Specline against a Fable-class planner

*Research + analysis · June 11, 2026 · sources at end*

## The question

Does Specline limit a model as capable as Claude Fable 5 in the planning
stage, or help it? And why does the "one-shot" capability everyone talks about
keep failing to show up in practice?

Short answer: Specline helps, and the help gets *larger* as the model gets
stronger — because the thing Specline rations (judgment, context,
verification) is exactly what a Fable-class model still cannot supply for
itself. One-shot is real, but it is a property of the *(model × specification)*
pair, not of the model alone. Specline is the machine that manufactures the
precondition one-shot needs.

---

## What Fable 5 actually is

Anthropic released **Claude Fable 5** on June 9, 2026 — its first publicly
available "Mythos-class" model, a tier explicitly above the Opus class. `claude-fable-5`,
1M-token context, up to 128k output tokens, $10/$50 per million in/out. Mythos 5
is the same model with cyber safeguards lifted, limited to Project Glasswing.

The capability profile that matters for planning:

- **"The longer and more complex the task, the larger Fable 5's lead over our
  other models."** Built for "long-horizon agentic work" — multi-day,
  goal-directed runs with strong instruction retention.
- **Long-horizon autonomy is the headline.** Stripe compressed a 50-million-line
  Ruby codebase-wide migration — a two-month team effort — into a single day.
  Individual requests can run many minutes; autonomous runs extend for hours.
- **Memory compounds.** It "improves its outputs using its own notes."
  File-based persistent memory helped Fable three times more than it helped
  Opus 4.8 (the *Slay the Spire* result). It is built to carry lessons across
  runs.
- **Self-verification is a real behavior.** "At the highest effort, Fable 5
  reflects on and validates its own work" (Sakana). Anthropic recommends
  *fresh-context verifier subagents against the specification* over
  self-critique.
- **It dispatches parallel subagents dependably** and manages long-running
  peer agents — the one-PO-many-agents premise is now a supported pattern, not
  an aspiration.
- **It navigates ambiguity** — "performs well when given complex,
  multi-threaded requests and asked to determine next steps" — and can scope a
  task, ask clarifying questions, and execute.

Two operational notes that bear on the orchestrator: thinking is
**summarized-only / never raw** (and instructing an agent to echo its reasoning
can trip the `reasoning_extraction` refusal and fall back to Opus 4.8), and
**effort** (`low`→`xhigh`) is the primary intelligence/cost dial.

---

## The reframe: what a Fable-class model still can't do for itself

A weaker model needed a spec partly as a *crutch for capability* — tell it the
steps because it couldn't find them. Fable 5 doesn't need that crutch; it can
find the steps, scope the ambiguity, and run for a day. So the naive worry is
that the spec is now scaffolding a strong model has outgrown.

That worry is wrong, because it confuses two different things a spec carries:

| What a spec carries | Does Fable 5 still need it from a human? |
|---|---|
| **Mechanics** — the steps, the how | **No.** It infers these better than the spec can state them. Over-stating them *hurts* (see risk below). |
| **Intent** — the product outcome, the why | **Yes.** It cannot read your mind, only your repo. |
| **Non-goals** — what to deliberately *not* build | **Yes — more than ever.** Its capability is what makes unrequested over-building expensive. |
| **Decisions reserved to a human** — margin floors, compliance posture, which trade-off is acceptable | **Yes.** These are judgment, not inference. |
| **A falsifiable definition of done** | **Yes.** "Feels complete" is unsafe over a multi-hour unattended run. |

Everything in the right column is precisely what Specline's boundaries protect,
and none of it gets cheaper as the model improves. The model's planning power
changes *who drafts* the spec (it can co-author it now), not *whether the spec's
judgment content needs to exist*.

---

## Anthropic's Fable 5 guidance is, line for line, Specline's boundaries

This is the strongest evidence that the methodology is aimed correctly. The
official "Prompting Claude Fable 5" guide was written to get the most out of the
model, with no knowledge of Specline — and it independently prescribes the same
moves:

- **"Give the reason, not only the request… Fable 5 performs better when it
  understands the intent behind a request."**
  → This is **B6, Intent Over Description**, verbatim in spirit.

- **"State the boundaries… define explicit constraints on what Fable 5 should
  and should not do"** and *"Don't add features, refactor, or introduce
  abstractions beyond what the task requires."*
  → This is the **Non-goals** section — the canon's "most valuable section for
  strong models." Anthropic now says the same thing for the same reason:
  capability plus helpfulness produces expensive over-building unless you fence
  it.

- **"Make self-verification explicit… fresh-context verifier subagents tend to
  outperform self-critique… verifying your work against the specification."**
  → This is **acceptance checks (B5)** plus the **reviewer agent**, and it names
  the spec as the verification anchor. It also validates the proposed
  *agent-loopable vs. human-gate* partition: the verifier subagent needs a
  machine-checkable target.

- **"Ground progress claims… audit each claim against a tool result."**
  → This is **B5's "checks actually executed in the implementation PR,"** and
  the instrumentation rule that a status claim must point to evidence.

- **"Construct a memory system… a place to write notes, as simple as a Markdown
  file… one lesson per file… delete notes that turn out to be wrong."**
  → This is **`status.md` and the graduated `knowledge/` docs**, and it
  endorses the proposed v2.3 `status.md` schema (state, done, last-green,
  dead-ends).

- **"Pause for the user only when the work genuinely requires them: a
  destructive action, a real scope change, or input only they can provide."**
  → This is **the two human gates** and the **open-questions decider** primitive
  — humans on the ends, defaults-with-deadline in the middle.

- **"Fable 5 dispatches parallel subagents more dependably… prefer asynchronous
  communication."**
  → This is what makes **the whole "one PO directing many agents" premise**
  real, and it's the load-bearing assumption behind **B7, the decider budget**.

When the model vendor's own tuning guide converges on your methodology without
having seen it, the methodology is tracking something real about how these
models work — not repackaging Scrum.

---

## Where Specline *could* limit Fable 5 — the one real risk

The same guide contains the warning that matters most:

> **"Skills developed for prior models are often too prescriptive for Claude
> Fable 5 and can degrade output quality. Review and consider removing older
> instructions if default performance is better."**

And: *"a one-shot operation usually doesn't need a helper… don't design for
hypothetical future requirements."*

This is the failure mode Specline has to actively avoid. A spec that drifts
toward **mechanics** — restating what the code will do, enumerating steps,
prescribing structure the model would choose better itself — doesn't just waste
context; it **measurably lowers Fable 5's output quality**. For a Fable-class
model, an over-specified spec is worse than a terse one.

Specline already has the antibodies, but this raises their priority:

- **B6** (intent over description) is no longer a tidiness preference — it's a
  performance requirement. Mechanics in a spec are now a *defect*, not just
  noise.
- **B2** (the context budget) is protecting throughput *and* quality, not just
  load time.
- **B1** (one-sitting appetite) keeps specs from accreting the prescriptive bulk
  that degrades the model.

The practical adjustment: the spec template and the spec-critic agent should
treat "this sentence tells the model *how* rather than *what* or *why*" as a
finding to cut, the same way doctor treats an unfalsifiable acceptance check.
Specline helps Fable 5 exactly to the degree it stays intent-heavy and
mechanics-sparse; it starts to limit Fable 5 the moment it doesn't.

---

## The one-shot question, directly

The claim you keep hearing is grounded — Anthropic states it plainly:

> **"First-shot correctness on complex, well-specified problems. Early testers
> reported single-pass implementations of systems that previously took days of
> iteration."**

Read the qualifier: **complex, *well-specified* problems.** One-shot is not the
model waking up one morning able to read your mind. It is the model, *given a
problem specified well enough that the answer is determined*, producing that
answer in one pass instead of ten.

That is why you haven't seen it. The bottleneck didn't disappear when the model
got better — **it moved.** It moved out of the model's reasoning and into the
quality of the specification handed to it. A vague prompt to Fable 5 doesn't
one-shot; it produces a confident, well-built version of *the wrong thing*, or
it over-builds (accounts, caches, abstractions you didn't ask for) because
nothing told it not to. The capability is there; the precondition usually isn't.

So one-shot is a property of the **pair** — `(model, spec)` — not of the model.
You manufacture it on the spec side:

1. **Intent stated, mechanics omitted** — so the model's own strength does the
   building (B6).
2. **Non-goals explicit** — so "well-specified" includes the negative space,
   which is where over-building hides (Non-goals).
3. **Reserved decisions made by a human up front** — so the model isn't forced
   to guess product judgment mid-run (open-questions / decider).
4. **A falsifiable done** — so "one pass" can be *known* to be correct rather
   than *hoped* to be (acceptance checks, B5).

That list is the spec body. **Specline is not an alternative to one-shot; it is
the discipline that produces the "well-specified" half of it.** The methodology's
entire premise — agent time is free, so spend human effort on judgment,
context, and verification — is the same bet as one-shot, stated as an operating
system instead of a benchmark line.

---

## Concrete payoffs for the build you're designing

Three places where Fable 5's actual control surface meets the methodology:

- **Blast-radius → effort routing.** The v2.3 blast-radius frontmatter field
  proposed in the working sessions maps directly onto Fable 5's **effort**
  parameter: low-risk specs run at `medium`, high-blast-radius specs at `xhigh`
  with a fresh-context verifier subagent. The spec format and the cost-routing
  architecture become one decision, as the transcript wanted.

- **The reviewer should be a fresh-context subagent, not the implementer
  self-critiquing.** Anthropic's testing says fresh-context verifiers beat
  self-critique. That's an argument for the orchestrator's reviewer being a
  *separate* agent loaded with acceptance + non-goals + reverse-edges — exactly
  the "reviewer context recipe" from the working notes.

- **Don't make agents echo reasoning.** Because raw thinking is never returned
  and "explain your reasoning as text" can trigger a refusal + Opus fallback,
  the orchestrator's hand-back protocol between implementer and reviewer should
  pass *artifacts and tool results*, not "explain why you did this." `status.md`
  (evidence, dead-ends) is the right channel; a reasoning transcript is not.

- **The 1M context window changes B2's math.** The context-budget proxy was
  framed against "the weakest model's window." With Fable at 1M tokens, the
  binding constraint is no longer fitting the spec — it's *quality degradation
  from irrelevant loaded context*. B2 should be read as protecting signal, not
  capacity.

---

## Verdict

Specline helps a Fable-class model, and the margin widens with capability,
because it supplies the three things the model still can't self-source —
reserved judgment, the right context, and a falsifiable definition of done —
and stays out of the way on mechanics, which the model now does better than any
spec could dictate. The single way it could *limit* Fable 5 is by violating its
own B6: a mechanics-heavy spec actively degrades this model, so the methodology's
"intent over description" rule is now a performance constraint, not a style note.

And one-shot is not a rival to this methodology. It is the same claim from the
other side: the model can do it in one pass *once the problem is specified well
enough*, and producing that specification — cheaply, with the model co-drafting,
with judgment fenced and done made falsifiable — is precisely what Specline is
for. You haven't seen one-shot in practice because the industry keeps improving
the model and feeding it vague prompts. Specline fixes the half that actually
moved.

---

## Sources

- [Claude Fable 5 and Claude Mythos 5 — Anthropic announcement](https://www.anthropic.com/news/claude-fable-5-mythos-5)
- [Introducing Claude Fable 5 and Claude Mythos 5 — Claude API docs](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
- [Prompting Claude Fable 5 — Claude API docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)
- [Anthropic releases Claude Fable 5, its most powerful model publicly — TechCrunch](https://techcrunch.com/2026/06/09/anthropic-released-claude-fable-5-its-most-powerful-model-publicly-days-after-warning-ai-is-getting-too-dangerous/)
- [Anthropic releases Mythos-like AI model to the public, Claude Fable 5 — CNBC](https://www.cnbc.com/2026/06/09/anthropic-mythos-claude-fable-5.html)
