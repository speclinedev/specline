// Canon-derived content for the scaffolder. The per-folder definitions here are the
// source the generated READMEs render from (a projection of the canon's Repository
// layout). Generated files carry a header; authored starters do not.

import { CANON, CANON_MM } from "../version.ts";

export const GENERATED_HEADER = `<!-- generated · canon ${CANON} · do not edit · run: specline sync -->`;
export const GENERATED_YAML_HEADER = `# generated · canon ${CANON} · do not edit · run: specline sync`;
const MARKER = "generated · canon"; // presence on the first non-empty line ⇒ regenerable

export function isGenerated(content: string): boolean {
  const first = content.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  return first.includes(MARKER);
}

interface FolderDoc {
  purpose: string;
  whatsHere: string;
  howToWrite: string;
  howToRead: string;
  notHere: string;
}

// Keyed by directory name. `init` scaffolds all of them; `sync` regenerates the
// README of every one that exists.
export const FOLDER_DOCS: Record<string, FolderDoc> = {
  drafts: {
    purpose: "being shaped",
    whatsHere: "A folder per feature being shaped, named by its slug (`docs/drafts/<slug>/`) — the same anatomy as a spec. Not a commitment; may be incomplete, may be deleted.",
    howToWrite: "Whatever is known — a `discovery.md`, a partial `spec.md`, or both. Only parse-level integrity is checked here: frontmatter parses, the slug matches the folder, edges resolve, the slug isn't already taken.",
    howToRead: "An idea taking shape, not yet approved. Moving it to `specs/` is the decider's go.",
    notHere: "Nothing anything else may depend on — a draft may be deleted outright, or archived as `killed` if it's worth a tombstone.",
  },
  specs: {
    purpose: "approved for build",
    whatsHere: "A folder per approved feature, named by its slug (`docs/specs/<slug>/`). The folder name is the spec's identity. Prescriptive, temporary.",
    howToWrite: "A `spec.md` — four frontmatter keys (`slug`, `type`, `decider`, `created`) and the body sections: Intent, Goal, Non-goals, Behavior, Business rules, Assumptions, Critical files, Acceptance checks, Out of scope — plus a `relations.md`. Copy `conventions/spec-template.md`. Shape it in `drafts/` first if it isn't ready; log unknowns in `open-questions.md`.",
    howToRead: "The contract a feature is being built toward — what we intend, not yet what exists. Being here at all is the decider's go.",
    notHere: "No shipped descriptions — those graduate to `knowledge/` and `archive/`.",
  },
  knowledge: {
    purpose: "shipped reality",
    whatsHere: "A folder per shipped feature (`<slug>/`, the slug retained from its spec): how it works now and why. Permanent.",
    howToWrite: "Present tense, descriptive. Keep intent, rules, and rationale; cut anything the code already says. Start with `overview.md`; add files only if a topic earns it.",
    howToRead: '"What\'s true now," not a contract. The original promise lives in `archive/<slug>`.',
    notHere: "No specs, status, or open questions — those live in `specs/`.",
  },
  archive: {
    purpose: "terminal contracts",
    whatsHere: "The final `spec.md` of every shipped, killed, or bug feature, with acceptance results linked. Permanent, read-only.",
    howToWrite: "Nothing by hand — graduation moves the final spec here verbatim. Never edit an archived file.",
    howToRead: "What was promised, and the approving merge is who agreed to it — the audit trail. For current behavior, read `knowledge/<slug>`.",
    notHere: "No living docs — those are `knowledge/`.",
  },
  conventions: {
    purpose: "standards & pins",
    whatsHere: "`doc-architecture.md` (the canon pin + deciders), `spec-template.md`, and the capability\u2192model map.",
    howToWrite: "Authored by the repo owner. The pin is what Specline reads to know which canon version this repo follows.",
    howToRead: "How this repo configures Specline.",
    notHere: "No feature work — that's `specs/`/`knowledge/`.",
  },
  decisions: {
    purpose: "repo-local ADRs",
    whatsHere: "Architecture decision records (`<slug>.md`), append-only once accepted.",
    howToWrite: "One decision per file; cite the spec slugs it affects in the header. Precedence: ADR > spec > knowledge.",
    howToRead: "Why a cross-cutting choice was made, when a spec or knowledge doc isn't the right home.",
    notHere: "No feature contracts — those are `specs/`.",
  },
  strategy: {
    purpose: "direction",
    whatsHere: "Vision, roadmap snapshots, launch contracts. Dated; archived, never deleted.",
    howToWrite: "Date each artifact. Supersede by adding a newer dated one, not by editing in place.",
    howToRead: "Where the product is headed and why — the context above any single feature.",
    notHere: "No implementation detail — that's `technical/` or a spec.",
  },
  technical: {
    purpose: "cross-cutting patterns",
    whatsHere: "Implementation patterns that span features — only when non-obvious.",
    howToWrite: "Document a pattern only if the code doesn't already make it clear (B6 applies here too).",
    howToRead: "How recurring technical concerns are handled across the repo.",
    notHere: "No per-feature docs — those are `knowledge/`.",
  },
};

export function renderReadme(dir: string): string {
  const d = FOLDER_DOCS[dir];
  if (!d) throw new Error(`no folder definition for ${dir}`);
  return [
    GENERATED_HEADER,
    `# ${dir}/ — ${d.purpose}`,
    "",
    `**What's here**  ${d.whatsHere}`,
    "",
    `**How to write**  ${d.howToWrite}`,
    "",
    `**How to read**  ${d.howToRead}`,
    "",
    `**What's not here**  ${d.notHere}`,
    "",
  ].join("\n");
}

// Every directory a Specline repo has. There are no tiers to choose between (canon
// 3.1), and the record's rules only fire on folders that exist — so a repo that
// never writes an ADR simply has an empty `decisions/`, which costs nothing.
export const SCAFFOLD_FOLDERS: string[] = [
  "drafts", "specs", "knowledge", "archive", "conventions", "decisions", "strategy", "technical",
];

// The docs/ root README — the map. Distinct from architecture.md (which is authored
// content about the *system*; this is generated meta about the *docs structure*).
export function renderDocsReadme(folders: string[]): string {
  const rows = folders
    .filter((f) => FOLDER_DOCS[f])
    .map((f) => `| \`${f}/\` | ${FOLDER_DOCS[f]!.purpose} — see its \`README.md\` |`)
    .join("\n");
  return [
    GENERATED_HEADER,
    "# docs/ — the product record",
    "",
    "This is a Specline repo. `docs/` is the product's source of truth: prescriptive",
    "while in-flight, descriptive once shipped. **Start with `architecture.md`.** Each",
    "directory explains itself in its own `README.md`.",
    "",
    "| Directory | What |",
    "|---|---|",
    rows,
    "",
    "`architecture.md` is a sibling of this file, not a README: it orients you to the",
    "*system itself* (what it is), while this file maps how the *docs* are organized.",
    "",
  ].join("\n");
}

// ── authored starters (scaffolded once, never regenerated by sync) ──────────────

export function docArchitecture(decider: string): string {
  return [
    "# Doc architecture — pin & deciders",
    "",
    "| Field | Value |",
    "|---|---|",
    `| **Canon** | Specline ${CANON_MM} |`,
    `| **Decider** | ${decider} |`,
    "",
    "<!-- scaffolded by `specline init` — edit freely; not regenerated. -->",
    "",
  ].join("\n");
}

export function speclineYml(decider: string): string {
  return [
    "# specline.yml — repo config: the pins and thresholds Specline reads.",
    "# Scaffolded by `specline init` — edit freely; this is the source of truth.",
    `canon: ${CANON_MM}`,
    "# unattended: false   # experimental — see Part 3 of the canon",
    `deciders: [${JSON.stringify(decider)}]`,
    "deputy: null",
    "staleness:            # how long before an untouched build is presumed abandoned",
    "  building: 30 days",
    "  blocked:  14 days",
    "focus_limit:          # decider WIP ceiling (B7)",
    "  building: 3",
    "  active:   6",
    "coupling_ceiling: 50%        # spec + forced loads, as % of context_window (B2)",
    "context_window: 400000       # chars in the weakest in-use model's window (the coupling denominator)",
    "suggest_slicing_past: 6      # Behavior+Acceptance count that nudges to slice while size: small",
    "review_rounds_before_human: 2  # outer-loop verifier↔implementer bounce budget",
    "models:               # capability tier → real model",
    "  light:    claude-haiku",
    "  standard: claude-sonnet",
    "  frontier: claude-opus",
    "",
  ].join("\n");
}

/** The spec a new repo copies. Part 1 of the canon, in the smallest form that is
 *  still a whole contract: four frontmatter keys, the body sections, and one
 *  acceptance list. No `status` key — canon 3.1: state is location, not a
 *  frontmatter value. The `### human` sub-heading is the one optional marker Part 1
 *  keeps — items only a person can settle — so it ships commented out rather than
 *  as a partition the author has to fill. */
export function specTemplate(decider: string): string {
  return [
    "<!-- scaffolded by `specline init` — copy to docs/drafts/<slug>/spec.md while it's",
    "     being shaped, or straight to docs/specs/<slug>/spec.md once it's approved. -->",
    "",
    "---",
    "slug: your-slug         # the folder name; a spec's identity. must match the directory",
    "type: feature           # feature | bug | chore | parent",
    `decider: ${decider}`,
    "created: YYYY-MM-DD     # the decider's go is recorded in git — no ratified_by/at field",
    "---",
    "",
    "# Your feature",
    "",
    "## Intent",
    "The product outcome in plain language, and the appetite: what one-sitting scope",
    "this spec deliberately fits.",
    "",
    "## Goal",
    "One falsifiable sentence: the observable outcome that means done.",
    "",
    "## Non-goals",
    "- What this deliberately does not do, so nobody has to guess.",
    "",
    "## Behavior",
    "1. Observable, numbered, each verifiable from outside.",
    "",
    "## Business rules",
    "- **Must** …",
    "- **Should** …",
    "- **May** …",
    "",
    "## Assumptions",
    "- What this takes as given about systems it does not control — and what to do at a",
    "  contradiction. Name the seams so whoever builds it escalates instead of working around.",
    "",
    "## Critical files",
    "- Pointers into existing code, not restatements of it.",
    "",
    "## Acceptance checks",
    "One list. Every item falsifiable: settleable the same way twice.",
    "",
    "- …",
    "",
    "<!-- Items only a person can settle — taste, product-fit — go under `### human`:",
    "",
    "### human",
    "- The empty state reads as calm, not broken.",
    "-->",
    "",
    "## Out of scope / deferred",
    "- With slugs, if already created.",
    "",
  ].join("\n");
}

export function architectureMd(): string {
  return [
    "# Architecture",
    "",
    "> Read first. One or two paragraphs: what this system is, its core areas, and any",
    "> guidance an agent needs before touching the code.",
    "",
    "<!-- scaffolded by `specline init` — edit freely; not regenerated. -->",
    "",
  ].join("\n");
}

// ── the GitHub Action workflow (0003) that init optionally generates ────────────

export function githubWorkflow(): string {
  return `${GENERATED_YAML_HEADER}
name: specline
on:
  pull_request:
    paths: ["docs/**", "specline.yml"]
jobs:
  specline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: speclinedev/specline/cli@v${CANON_MM}
`;
}
