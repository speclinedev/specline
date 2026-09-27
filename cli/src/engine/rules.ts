// The rule registry and the rules. The registry is the single source of truth:
// the engine runs these rules and `doctor rules` prints this same catalog, so a
// finding can never carry a rule_id the catalog lacks. Each rule is a pure
// function (context) -> raw findings; severity/scope/part live in the registry,
// not in the rule body.

import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { parseFlatYaml, headings, links } from "./parse.ts";
import type { Repo, RawFinding, RuleMeta, SpecFolder } from "./model.ts";
import { CANON } from "../version.ts";

// Two axes, both in the registry (canon 3.1).
//
// SEVERITY — integrity (error, blocks) vs. advisory (warning, never blocks).
// Integrity is a fact about the repo that is true or false independent of any
// opinion about good specs; advisory is every judgment about whether a spec is
// *good*, and the decider owns "enough". *Gate integrity, advise on taste.*
//
// PART — which of the canon's three parts the rule belongs to. Parts 1 (writing a
// spec) and 2 (keeping the record) always run. Part 3 (unattended builds) is
// experimental and opt-in: it runs, and is listed by `specline rules`, only when
// specline.yml sets `unattended: true`. There is no tier — one system, one switch.
export const REGISTRY: RuleMeta[] = [
  // ── Part 1 — the spec ───────────────────────────────────────────────────────
  // spec.md is constitutive: a specs/ folder with no spec.md is not a spec at all
  // (and its dir-derived slug would let other specs' relations resolve to an empty
  // shell). The auxiliary files — relations.md, status.md — are advisory.
  { rule_id: "STRUCT-MISSING-SPEC", severity: "error", scope: "spec", part: 1 },
  { rule_id: "FRONTMATTER-UNPARSEABLE", severity: "error", scope: "spec", part: 1 },
  { rule_id: "FRONTMATTER-SLUG-MISMATCH", severity: "error", scope: "spec", part: 1 },
  { rule_id: "ENUM-INVALID", severity: "error", scope: "spec", part: 1 },
  { rule_id: "UNKNOWN-FRONTMATTER-KEY", severity: "warning", scope: "spec", part: 1 },
  { rule_id: "UNKNOWN-SECTION", severity: "warning", scope: "spec", part: 1 },
  { rule_id: "GOAL-MISSING", severity: "warning", scope: "spec", part: 1 },
  { rule_id: "PARENT-HAS-MECHANICS", severity: "warning", scope: "spec", part: 1 },
  { rule_id: "PARENT-NO-SCOPES", severity: "warning", scope: "spec", part: 1 },
  // ── Part 2 — the record ─────────────────────────────────────────────────────
  { rule_id: "SLUG-DUPLICATE", severity: "error", scope: "repo", part: 2 },
  { rule_id: "RELATION-DANGLING", severity: "error", scope: "repo", part: 2 },
  { rule_id: "RELATION-UNPARSEABLE", severity: "error", scope: "repo", part: 2 },
  { rule_id: "LINK-DANGLING", severity: "error", scope: "repo", part: 2 },
  { rule_id: "KNOWLEDGE-HAS-STATUS", severity: "error", scope: "repo", part: 2 },
  { rule_id: "ARCHIVE-EDITED", severity: "error", scope: "repo", part: 2 },
  { rule_id: "STRUCT-MISSING-RELATIONS", severity: "warning", scope: "spec", part: 2 },
  { rule_id: "RELATION-CROSS-REPO", severity: "warning", scope: "repo", part: 2 },
  { rule_id: "RELATION-KILLED", severity: "warning", scope: "repo", part: 2 },
  { rule_id: "OPEN-QUESTION-INCOMPLETE", severity: "warning", scope: "spec", part: 2 },
  { rule_id: "OPEN-QUESTION-OVERDUE", severity: "warning", scope: "spec", part: 2 },
  { rule_id: "CANON-PIN-MISMATCH", severity: "warning", scope: "repo", part: 2 },
  // ── Part 3 — unattended builds (experimental, opt-in) ───────────────────────
  // Every one of these reads a key, a state, a heading, or a file that belongs to
  // the unattended machinery. With the switch off they neither run nor are listed,
  // so nothing advertises a rule that will not fire.
  { rule_id: "UNATTENDED-INCOMPLETE", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "STATUS-SCHEMA", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "CORRECTIONS-MALFORMED", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "LOOP-BUDGET-INVALID", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "JUDGEABLE-NO-SECTION", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "CHECK-RUN-MALFORMED", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "SCOPE-EXCEEDS-SIZE", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "ACCEPTANCE-UNPARTITIONED", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "ARCHIVE-NO-ACCEPTANCE", severity: "warning", scope: "repo", part: 3 },
  { rule_id: "STALE-QUARANTINE", severity: "warning", scope: "spec", part: 3 },
  { rule_id: "DECIDER-OVER-BUDGET", severity: "warning", scope: "repo", part: 3 },
  { rule_id: "COUPLING-CEILING", severity: "warning", scope: "spec", part: 3 },
];

export const REGISTRY_BY_ID: Map<string, RuleMeta> = new Map(REGISTRY.map((r) => [r.rule_id, r]));

// The envelope keys (`build`, `blast_radius`, `size`, `target_model`, `stale_after`,
// `loop_budget`) are *known* whatever the switch says — a repo that turns the switch
// off must not start warning about keys its specs already carry. What the switch
// changes is whether their values are checked, not whether they are recognised.
const KNOWN_FRONTMATTER_KEYS = new Set([
  "slug", "type", "status", "decider", "build", "blast_radius", "size", "target_model",
  "ratified_by", "ratified_at", "created", "canon", "shipped", "stale_after",
  "acceptance_results", "deputy", "killed_reason", "loop_budget",
]);

const KNOWN_SECTIONS = new Set([
  "Intent", "Goal", "Non-goals", "Non goals", "Behavior", "Business rules", "Critical files",
  "Acceptance checks", "Out of scope", "Out of scope / deferred", "Assumptions",
  "Open questions", "Status", "Context",
]);

const ALLOWED_BLAST_RADIUS = new Set(["low", "medium", "high"]);
const ALLOWED_SIZE = new Set(["small", "large"]);
const ALLOWED_TYPE = new Set(["feature", "bug", "chore", "parent"]);
const ALLOWED_TARGET_MODEL = new Set(["light", "standard", "frontier"]);
const ALLOWED_BUILD = new Set(["attended", "unattended"]);
// Status is descriptive (canon 3.1 Part 1): `draft | building | shipped | killed`.
// `blocked` belongs to Part 3 and is allowed once the switch is on.
const ALLOWED_STATUS = ["draft", "building", "shipped", "killed"];
const STATUS_REQUIRED_SECTIONS = ["State", "Done", "In progress", "Last green checkpoint", "Dead ends", "Corrections"];
const RELATION_KEYS = ["depends_on", "part_of", "supersedes", "conflicts_with"];

export interface RuleContext {
  repo: Repo;
  /** repo-root-relative POSIX paths the caller declared changed (added or modified). */
  changed: Set<string>;
  /** the subset that are modifications/deletions, not pure adds — for edit detection
   *  on otherwise-immutable files (e.g. archive/). Empty unless the caller supplies it. */
  modified: Set<string>;
  now: string | null;
}

export type Rule = (ctx: RuleContext) => RawFinding[];

function fmString(f: SpecFolder, key: string): string | null {
  const v = f.frontmatter?.data[key];
  return typeof v === "string" ? v : null;
}

/** The status every rule reads. `ratified` was v3.0's gate state; canon 3.1 makes
 *  status descriptive and drops it, so it is recognised silently — never an error,
 *  never a warning — and read as `building`. A v3.0 spec keeps producing exactly the
 *  findings it produced before. */
function statusOf(f: SpecFolder): string | null {
  const s = fmString(f, "status");
  return s === "ratified" ? "building" : s;
}

function asEdges(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const arr = Array.isArray(value) ? value : [value];
  // edges may be annotated (`slug: rationale`, per canon); the slug is the part
  // before the first `: `. `repo:slug` has no space after the colon and survives.
  return arr.map((s) => s.trim().split(/:\s/, 1)[0]!.trim()).filter((s) => s !== "" && s !== "none");
}

// ── structural, spec-scoped ──────────────────────────────────────────────────

const structMissing: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (!f.hasSpec) {
      out.push({ rule_id: "STRUCT-MISSING-SPEC", file: `${f.rel}/spec.md`, line: null, specDir: f.dirName,
        message: `spec folder ${f.dirName} has no spec.md`,
        fix_hint: "add spec.md with frontmatter (slug, type, status) and an Intent section" });
    }
    if (!f.hasRelations) {
      out.push({ rule_id: "STRUCT-MISSING-RELATIONS", file: `${f.rel}/relations.md`, line: null, specDir: f.dirName,
        message: `spec folder ${f.dirName} has no relations.md`,
        fix_hint: "add relations.md; use `depends_on: none` if it is the first spec" });
    }
  }
  return out;
};

const frontmatterWellFormed: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of [...repo.specs, ...repo.archive]) {
    if (f.specContent === null || f.frontmatter === null) continue;
    const fm = f.frontmatter;
    if (!fm.present || !fm.ok) {
      out.push({ rule_id: "FRONTMATTER-UNPARSEABLE", file: `${f.rel}/spec.md`, line: 1, specDir: f.dirName,
        message: `frontmatter does not parse: ${fm.error ?? "missing --- block"}`,
        fix_hint: "wrap frontmatter in `---` fences; one `key: value` per line" });
      continue;
    }
    const slugVal = fmString(f, "slug");
    if (slugVal !== null && slugVal !== f.slug) {
      out.push({ rule_id: "FRONTMATTER-SLUG-MISMATCH", file: `${f.rel}/spec.md`, line: fm.lineOf["slug"] ?? 1, specDir: f.dirName,
        message: `frontmatter slug "${slugVal}" does not match directory "${f.slug}"`,
        fix_hint: `set slug to ${f.slug} or rename the directory to match` });
    }
  }
  return out;
};

// Ratification attestation (ratified_by/ratified_at) is no longer modelled: the
// approving merge to the main branch is the ratification record, and git owns the
// author + timestamp. Specline does not duplicate or check it (canon 2.6).

const statusSchema: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.allFolders) {
    if (f.statusContent === null) continue;
    const h2 = headings(f.statusContent).filter((h) => h.level === 2);
    for (const req of STATUS_REQUIRED_SECTIONS) {
      // The canon's schema is literal headings, so the match is exact: a prefix match
      // let "## Done thinking about it" satisfy "## Done".
      const matches = h2.filter((h) => h.title.toLowerCase() === req.toLowerCase());
      if (matches.length === 0) {
        out.push({ rule_id: "STATUS-SCHEMA", file: `${f.rel}/status.md`, line: null, specDir: f.dirName,
          message: `status.md missing required section "${req}"`,
          fix_hint: `add a "## ${req}" section (shape only; Specline never reads its prose)` });
      } else if (matches.length > 1) {
        out.push({ rule_id: "STATUS-SCHEMA", file: `${f.rel}/status.md`, line: matches[1]!.line, specDir: f.dirName,
          message: `status.md has a duplicated required section "${req}"`,
          fix_hint: `merge the duplicate "## ${req}" sections into one` });
      }
    }
  }
  return out;
};

/** An enum check: `allowed` is what the canon says to write, `recognised` is what is
 *  read without complaint. They differ only where a value belongs to a part that is
 *  not in force — a spec written against the other switch position must not error. */
interface EnumCheck { key: string; allowed: string[]; recognised?: string[] }

const enumValues: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  const checks: EnumCheck[] = [
    { key: "type", allowed: [...ALLOWED_TYPE] },
    // `ratified` is always read silently. `blocked` is Part 3's state: checked when
    // the switch is on, recognised silently when it is off.
    repo.unattended
      ? { key: "status", allowed: [...ALLOWED_STATUS, "blocked"], recognised: [...ALLOWED_STATUS, "blocked", "ratified"] }
      : { key: "status", allowed: ALLOWED_STATUS, recognised: [...ALLOWED_STATUS, "blocked", "ratified"] },
  ];
  // The envelope is legal on any spec but only *checked* when Part 3 is in force.
  if (repo.unattended) {
    checks.push(
      { key: "build", allowed: [...ALLOWED_BUILD] },
      { key: "blast_radius", allowed: [...ALLOWED_BLAST_RADIUS] },
      { key: "size", allowed: [...ALLOWED_SIZE] },
      { key: "target_model", allowed: [...ALLOWED_TARGET_MODEL] },
    );
  }
  for (const f of [...repo.specs, ...repo.archive]) {
    if (f.frontmatter === null || !f.frontmatter.ok) continue;
    for (const { key, allowed, recognised } of checks) {
      const v = fmString(f, key);
      if (v === null || (recognised ?? allowed).includes(v)) continue;
      out.push({ rule_id: "ENUM-INVALID", file: `${f.rel}/spec.md`, line: f.frontmatter.lineOf[key] ?? 1, specDir: f.dirName,
        message: `${key} "${v}" is not one of ${allowed.join("|")}`,
        fix_hint: `set ${key} to one of: ${allowed.join(", ")}` });
    }
  }
  return out;
};

const loopBudgetValid: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of [...repo.specs, ...repo.archive]) {
    if (f.frontmatter === null || !f.frontmatter.ok) continue;
    const v = fmString(f, "loop_budget");
    if (v !== null && !/^[1-9]\d*$/.test(v)) {
      out.push({ rule_id: "LOOP-BUDGET-INVALID", file: `${f.rel}/spec.md`, line: f.frontmatter.lineOf["loop_budget"] ?? 1, specDir: f.dirName,
        message: `loop_budget "${v}" is not a positive integer`,
        fix_hint: "loop_budget is the autonomy grant — a positive integer of build cycles before escalating to a human gate" });
    }
  }
  return out;
};

const unknownFrontmatterKeys: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of [...repo.specs, ...repo.archive]) {
    if (f.frontmatter === null || !f.frontmatter.ok) continue;
    for (const key of Object.keys(f.frontmatter.data)) {
      if (!KNOWN_FRONTMATTER_KEYS.has(key)) {
        out.push({ rule_id: "UNKNOWN-FRONTMATTER-KEY", file: `${f.rel}/spec.md`, line: f.frontmatter.lineOf[key] ?? 1, specDir: f.dirName,
          message: `unknown frontmatter key "${key}" (preserved, not an error)`,
          fix_hint: "likely a newer-canon key; safe to leave, or remove if a typo" });
      }
    }
  }
  return out;
};

const unknownSections: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.specContent === null) continue;
    for (const h of headings(f.specContent).filter((x) => x.level === 2)) {
      if (!KNOWN_SECTIONS.has(h.title)) {
        out.push({ rule_id: "UNKNOWN-SECTION", file: `${f.rel}/spec.md`, line: h.line, specDir: f.dirName,
          message: `unknown body section "## ${h.title}" (preserved, not an error)`,
          fix_hint: "likely a newer-canon section; safe to leave, or rename to a known section" });
      }
    }
  }
  return out;
};

// ── loop-orientation (warn-only nudges) ──────────────────────────────────────

const goalMissing: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.specContent === null) continue;
    const has = headings(f.specContent).some((h) => h.level === 2 && h.title === "Goal");
    if (!has) {
      out.push({ rule_id: "GOAL-MISSING", file: `${f.rel}/spec.md`, line: null, specDir: f.dirName,
        message: "spec has no `## Goal` section — the build loop has no single falsifiable target",
        fix_hint: "add a one-line falsifiable Goal: the observable outcome that means done" });
    }
  }
  return out;
};


// ── v2.4 cluster: altitude + parent-map (warn-only nudges) ───────────────────

/** Body of the level-2 section whose title starts with `prefix`, up to the next
 *  level-2 heading. Empty string if absent. */
function sectionBody(specContent: string, prefix: string): string {
  const lines = specContent.split(/\r?\n/);
  const heads = headings(specContent).filter((h) => h.level === 2);
  const start = heads.find((h) => h.title.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!start) return "";
  const next = heads.find((h) => h.line > start.line);
  return lines.slice(start.line, next ? next.line - 1 : undefined).join("\n");
}

function hasSection(specContent: string, prefix: string): boolean {
  return headings(specContent).some((h) => h.level === 2 && h.title.toLowerCase().startsWith(prefix.toLowerCase()));
}

function countListItems(body: string): number {
  return body.split(/\r?\n/).filter((l) => /^\s*(\d+[.)]|[-*])\s+\S/.test(l)).length;
}

// Acceptance sub-headings are `###` under `## Acceptance checks`. Part 1 keeps one
// optional marker — `### human`, for items only a person can settle, with
// `### human-gate` recognised silently as its pre-3.1 spelling. Part 3 refines the
// same list into `### agent-loopable` / `### judgeable` / `### human-gate`. All of
// them are level-3 headings, which UNKNOWN-SECTION does not look at, so every one is
// recognised silently whichever way the switch is set.
const AGENT_LOOPABLE_PARTITION = /^ {0,3}###\s+`?agent-loopable`?\s*#*\s*$/im;

const judgeableNoSection: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.specContent === null) continue;
    const acc = sectionBody(f.specContent, "acceptance");
    if (acc === "" || !/judgeable/i.test(acc)) continue;
    // judgeable's falsifiability gate is a named section — a `§` or the word "section".
    if (!/§|\bsection\b/i.test(acc)) {
      const head = headings(f.specContent).find((h) => h.level === 2 && h.title.toLowerCase().startsWith("acceptance"));
      out.push({ rule_id: "JUDGEABLE-NO-SECTION", file: `${f.rel}/spec.md`, line: head?.line ?? null, specDir: f.dirName,
        message: "a judgeable acceptance item cites no spec section to verify against — it is not falsifiable (B5)",
        fix_hint: 'name the section each judgeable item is judged against (e.g. "matches §4.3"); that reference is judgeable\'s falsifiability gate' });
    }
  }
  return out;
};

// v2.8: the runnable-command entry shape is opt-in — only acceptance items
// carrying the literal marker are shape-checked; absence never fires anything.
// The `--` fallback separator is accepted alongside the em dash, as with the
// status.md machine entries.
const checkRunMalformed: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  const marker = /(?:\u2014|--)\s*run:/;
  const wellFormed = /(?:\u2014|--)\s*run:\s*`[^`\n]+`\s*$/;
  for (const f of repo.specs) {
    if (f.specContent === null) continue;
    const acc = sectionBody(f.specContent, "acceptance");
    if (acc === "") continue;
    for (const line of acc.split("\n")) {
      const item = line.trim();
      if (!/^[-*]\s/.test(item) || !marker.test(item)) continue;
      if (!wellFormed.test(item)) {
        const head = headings(f.specContent).find((h) => h.level === 2 && h.title.toLowerCase().startsWith("acceptance"));
        out.push({ rule_id: "CHECK-RUN-MALFORMED", file: `${f.rel}/spec.md`, line: head?.line ?? null, specDir: f.dirName,
          message: `an acceptance item carries "\u2014 run:" but not a single backtick-fenced command: "${item.slice(0, 80)}"`,
          fix_hint: "shape: <claim> \u2014 run: `<command>` \u2014 one backtick-fenced shell invocation; exit 0 settles the claim" });
      }
    }
  }
  return out;
};

const scopeExceedsSize: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  const threshold = repo.config.suggestSlicingPast;
  for (const f of repo.specs) {
    if (f.specContent === null) continue;
    const size = fmString(f, "size");
    if (size === "large") continue; // declared atomic — doctor respects the answer
    const count = countListItems(sectionBody(f.specContent, "behavior")) +
      countListItems(sectionBody(f.specContent, "acceptance"));
    if (count > threshold) {
      out.push({ rule_id: "SCOPE-EXCEEDS-SIZE", file: `${f.rel}/spec.md`, line: null, specDir: f.dirName,
        message: `${count} Behavior + Acceptance items (over ${threshold}) while size is ${size ?? "small (default)"}`,
        fix_hint: "slice it into smaller scopes, or declare size: large if this is a genuinely atomic build" });
    }
  }
  return out;
};

const parentHasMechanics: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.specContent === null || fmString(f, "type") !== "parent") continue;
    if (hasSection(f.specContent, "behavior") || hasSection(f.specContent, "acceptance")) {
      out.push({ rule_id: "PARENT-HAS-MECHANICS", file: `${f.rel}/spec.md`, line: null, specDir: f.dirName,
        message: "a parent-map carries Behavior/Acceptance — it is regressing into a plan",
        fix_hint: "a parent stays a map: intent, shared non-goals, invariants, and a child-scope index. Push mechanics down into child scopes" });
    }
  }
  return out;
};

const parentNoScopes: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  // child scopes declare `part_of: <parent-slug>` — collect every slug referenced that way.
  const parented = new Set<string>();
  for (const f of repo.specs) {
    if (f.relationsContent === null) continue;
    const parsed = parseFlatYaml(f.relationsContent);
    for (const edge of asEdges(parsed.data["part_of"])) parented.add(edge);
  }
  for (const f of repo.specs) {
    if (f.specContent === null || fmString(f, "type") !== "parent") continue;
    if (!parented.has(f.slug)) {
      out.push({ rule_id: "PARENT-NO-SCOPES", file: `${f.rel}/spec.md`, line: null, specDir: f.dirName,
        message: `parent-map ${f.slug} has no child scopes (nothing declares part_of: ${f.slug}) — it is a misfiled scope`,
        fix_hint: "give the parent child scopes (each an ordinary spec with part_of: this id), or make this an ordinary scope (type: feature)" });
    }
  }
  return out;
};

// ── v2.5 cluster: corrections-log entry shape (warn-only nudge) ──────────────

// A corrections entry is "<what> — <altitude> — <who caught it>", altitude and
// source from fixed vocabularies. Only list-item lines under ## Corrections are
// checked; prose and a blank section are legal (shape, never content). Tolerant
// of em/en/hyphen dashes as the separator.
const CORRECTION_TAIL = /[—–-]\s+(provable|judgeable|tasteable)\s+[—–-]\s+(implementer|reviewer|decider)\s*$/i;

const correctionsMalformed: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.allFolders) {
    if (f.statusContent === null) continue;
    const lines = f.statusContent.split(/\r?\n/);
    const heads = headings(f.statusContent).filter((h) => h.level === 2);
    const start = heads.find((h) => h.title.toLowerCase().startsWith("corrections"));
    if (!start) continue;
    const next = heads.find((h) => h.line > start.line);
    const end = next ? next.line - 1 : lines.length;
    for (let i = start.line; i < end; i++) {
      const item = (lines[i] ?? "").match(/^\s*(?:[-*]|\d+[.)])\s+(.*\S)\s*$/);
      if (!item) continue; // only list-item entries are checked
      if (!CORRECTION_TAIL.test(item[1]!)) {
        out.push({ rule_id: "CORRECTIONS-MALFORMED", file: `${f.rel}/status.md`, line: i + 1, specDir: f.dirName,
          message: "corrections entry does not match \"<what> — <altitude> — <who caught it>\" (altitude: provable|judgeable|tasteable; who: implementer|reviewer|decider)",
          fix_hint: 'one entry per line, e.g. "- default limit too high — tasteable — decider"' });
      }
    }
  }
  return out;
};

// ── lifecycle completeness + the Part-3 envelope ──────────────────────────────

const ACTIVE_STATES = new Set(["building", "blocked"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Part 3: the distance to unattended-ready, reported the moment the promise is made.
// Absence of the `build` key never fires anything — only a spec that has *declared*
// it will be built by a builder who cannot ask is held to the envelope. `stale_after`
// is required once building OR blocked, as the canon body says (the Checks appendix
// used to say "once building", which was the narrower of the two).
const unattendedIncomplete: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (fmString(f, "build") !== "unattended") continue;
    const required = ["blast_radius", "loop_budget"];
    if (ACTIVE_STATES.has(statusOf(f) ?? "")) required.push("stale_after");
    const missing = required.filter((key) => (fmString(f, key) ?? "").trim() === "");
    if (f.statusContent === null) missing.push("status.md");
    if (missing.length === 0) continue;
    out.push({ rule_id: "UNATTENDED-INCOMPLETE", file: `${f.rel}/spec.md`, line: f.frontmatter?.lineOf["build"] ?? null, specDir: f.dirName,
      message: `build: unattended, but the envelope is missing ${missing.join(", ")}`,
      fix_hint: "complete the unattended envelope before handing the build to a builder who cannot ask, or drop `build: unattended`" });
  }
  return out;
};

// Part 3: unattended, the one acceptance list is refined into altitudes, and the
// implementer needs its own labelled set. No longer keyed to a status — the promise
// that matters is `build: unattended`, not how far along the spec is.
const acceptanceUnpartitioned: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.specContent === null) continue;
    if (fmString(f, "build") !== "unattended") continue;
    const acc = sectionBody(f.specContent, "acceptance");
    if (AGENT_LOOPABLE_PARTITION.test(acc)) continue;
    out.push({ rule_id: "ACCEPTANCE-UNPARTITIONED", file: `${f.rel}/spec.md`, line: null, specDir: f.dirName,
      message: "an unattended spec has no `### agent-loopable` acceptance partition — the build loop has no labelled exit condition",
      fix_hint: "partition Acceptance checks under `### agent-loopable` / `### judgeable` / `### human-gate`; the implementer loops on the first set" });
  }
  return out;
};

const archiveNeedsAcceptance: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.archive) {
    if (f.frontmatter === null || !f.frontmatter.ok) continue;
    if (statusOf(f) !== "shipped" || fmString(f, "type") === "bug") continue;
    if (fmString(f, "acceptance_results") === null) {
      out.push({ rule_id: "ARCHIVE-NO-ACCEPTANCE", file: `${f.rel}/spec.md`, line: f.frontmatter.lineOf["status"] ?? 1, specDir: f.dirName,
        message: `shipped spec ${f.dirName} was archived without a linked acceptance_results (B5)`,
        fix_hint: "graduation executes the agent-loopable checks and links the run; add acceptance_results: <link> before archiving" });
    }
  }
  return out;
};

interface OQEntry { title: string; line: number; hasDecider: boolean; hasDefault: boolean; deadline: string | null; }
function openQuestionEntries(content: string): OQEntry[] {
  const heads = headings(content).filter((h) => h.level === 2);
  const lines = content.split(/\r?\n/);
  return heads.map((h, i) => {
    const next = heads[i + 1];
    const body = lines.slice(h.line, next ? next.line - 1 : undefined).join("\n");
    const deadline = body.match(/(?:^|\n)[^\S\r\n]*deadline:[^\S\r\n]*(\d{4}-\d{2}-\d{2})/i);
    // `\s` matches a newline, so `decider:\ndefault: keep` used to read as a decider
    // of "default:" — an empty field counted as present. The field ends at its line.
    return {
      title: h.title, line: h.line,
      hasDecider: /(?:^|\n)[^\S\r\n]*decider:[^\S\r\n]*\S/i.test(body),
      hasDefault: /(?:^|\n)[^\S\r\n]*default:[^\S\r\n]*\S/i.test(body),
      deadline: deadline ? deadline[1]! : null,
    };
  });
}

const openQuestionIncomplete: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.openQuestionsContent === null || f.frontmatter === null || !f.frontmatter.ok) continue;
    const status = statusOf(f);
    if (status !== "building") continue; // build-readiness only
    for (const q of openQuestionEntries(f.openQuestionsContent)) {
      if (!q.hasDecider || !q.hasDefault) {
        out.push({ rule_id: "OPEN-QUESTION-INCOMPLETE", file: `${f.rel}/open-questions.md`, line: q.line, specDir: f.dirName,
          message: `open question "${q.title}" lacks a ${!q.hasDecider ? "decider" : "default"} — a ${status} spec can't carry an undecidable question`,
          fix_hint: "each entry needs a decider, options, a default, and a deadline; the default is what keeps the build moving" });
      }
    }
  }
  return out;
};

const openQuestionOverdue: Rule = ({ repo, now }) => {
  if (now === null) return [];
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.openQuestionsContent === null || f.frontmatter === null || !f.frontmatter.ok) continue;
    const status = statusOf(f);
    if (status === null || !ACTIVE_STATES.has(status)) continue;
    for (const q of openQuestionEntries(f.openQuestionsContent)) {
      if (q.deadline !== null && q.deadline < now) {
        out.push({ rule_id: "OPEN-QUESTION-OVERDUE", file: `${f.rel}/open-questions.md`, line: q.line, specDir: f.dirName,
          message: `open question "${q.title}" is past its deadline ${q.deadline} (now ${now})`,
          fix_hint: "decide it, or take the stated default and remove the entry; an overdue question is a stalled decision" });
      }
    }
  }
  return out;
};

const staleQuarantine: Rule = ({ repo, now }) => {
  if (now === null) return [];
  const out: RawFinding[] = [];
  for (const f of repo.specs) {
    if (f.frontmatter === null || !f.frontmatter.ok) continue;
    const status = statusOf(f);
    if (status === null || !ACTIVE_STATES.has(status)) continue;
    const stale = fmString(f, "stale_after");
    if (stale !== null && ISO_DATE.test(stale) && stale < now) {
      out.push({ rule_id: "STALE-QUARANTINE", file: `${f.rel}/spec.md`, line: f.frontmatter.lineOf["stale_after"] ?? 1, specDir: f.dirName,
        message: `${status} spec is past stale_after ${stale} (now ${now}) — quarantined (B4)`,
        fix_hint: "reshape (re-ratify, which resets stale_after) or kill it; staleness hands an abandoned build back to a human" });
    }
  }
  return out;
};

const deciderOverBudget: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  const building = new Map<string, number>();
  const active = new Map<string, number>();
  for (const f of repo.specs) {
    if (f.frontmatter === null || !f.frontmatter.ok) continue;
    const d = fmString(f, "decider");
    const s = statusOf(f);
    if (d === null || s === null) continue;
    if (s === "building") building.set(d, (building.get(d) ?? 0) + 1);
    if (ACTIVE_STATES.has(s)) active.set(d, (active.get(d) ?? 0) + 1);
  }
  const bMax = repo.config.focusLimitBuilding;
  const aMax = repo.config.focusLimitActive;
  for (const [d, n] of [...building.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (n > bMax) out.push({ rule_id: "DECIDER-OVER-BUDGET", file: null, line: null, specDir: null,
      message: `decider ${d} has ${n} specs in building, over the focus limit of ${bMax} (B7)`,
      fix_hint: "WIP limits apply to the human, not the machine; ship or park one before starting another" });
  }
  for (const [d, n] of [...active.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (n > aMax) out.push({ rule_id: "DECIDER-OVER-BUDGET", file: null, line: null, specDir: null,
      message: `decider ${d} has ${n} active specs (building|blocked), over the focus limit of ${aMax} (B7)`,
      fix_hint: "the decider's queue is the constraint, not agent capacity; close some before opening more" });
  }
  return out;
};

/** spec.md + relations.md of the spec and every spec transitively reachable via
 *  depends_on / part_of — the "forced loads" the coupling-ceiling proxy measures. */
function forcedLoadChars(repo: Repo, start: SpecFolder): number {
  const bySlug = new Map<string, SpecFolder>();
  for (const f of repo.allFolders) bySlug.set(f.slug, f);
  const seen = new Set<string>();
  const queue: SpecFolder[] = [start];
  let total = 0;
  while (queue.length > 0) {
    const f = queue.shift()!;
    if (seen.has(f.slug)) continue;
    seen.add(f.slug);
    total += (f.specContent?.length ?? 0) + (f.relationsContent?.length ?? 0);
    if (f.relationsContent === null) continue;
    const parsed = parseFlatYaml(f.relationsContent);
    for (const key of ["depends_on", "part_of"]) {
      for (const edge of asEdges(parsed.data[key])) {
        const target = bySlug.get(edge);
        if (target !== undefined && !seen.has(target.slug)) queue.push(target);
      }
    }
  }
  return total;
}

const couplingCeiling: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  const budget = Math.floor((repo.config.contextWindowChars * repo.config.couplingCeilingPct) / 100);
  if (budget <= 0) return out;
  for (const f of repo.specs) {
    if (f.specContent === null) continue;
    const chars = forcedLoadChars(repo, f);
    if (chars > budget) {
      out.push({ rule_id: "COUPLING-CEILING", file: `${f.rel}/spec.md`, line: null, specDir: f.dirName,
        message: `spec + forced loads is ~${chars} chars, over the coupling ceiling of ${budget} (${repo.config.couplingCeilingPct}% of ${repo.config.contextWindowChars}) (B2)`,
        fix_hint: "too entangled — slice the feature or cut relations; if reading the spec already fills the window, the model has no room left to work" });
    }
  }
  return out;
};

// ── integrity, repo-scoped ───────────────────────────────────────────────────

const relationEdges: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  const knownSlugs = new Set(repo.allFolders.map((f) => f.slug));
  const killedSlugs = new Set(
    repo.allFolders.filter((f) => statusOf(f) === "killed").map((f) => f.slug),
  );
  // Every repo-local edge must resolve at some lifecycle stage, and knowledge folders
  // carry a relations.md too — so the graph is read from specs/ *and* knowledge/.
  for (const f of [...repo.specs, ...repo.knowledge]) {
    if (f.relationsContent === null) continue;
    const parsed = parseFlatYaml(f.relationsContent);
    // A malformed *known* file is integrity, the same class as unparseable
    // frontmatter. It used to produce nothing at all: the edges silently vanished and
    // the file read as "no dependencies", which is the one answer it cannot mean.
    if (!parsed.ok) {
      out.push({ rule_id: "RELATION-UNPARSEABLE", file: `${f.rel}/relations.md`, line: null, specDir: null,
        message: `relations.md does not parse: ${parsed.error}`,
        fix_hint: "relations.md is flat YAML: `depends_on: slug`, a `- slug` list, or `none`. Quote an annotated edge as `- \"slug: why\"`" });
      continue;
    }
    for (const key of RELATION_KEYS) {
      for (const edge of asEdges(parsed.data[key])) {
        const line = parsed.lineOf[key] ?? null;
        if (edge.startsWith("repo:")) {
          out.push({ rule_id: "RELATION-CROSS-REPO", file: `${f.rel}/relations.md`, line, specDir: null,
            message: `cross-repo edge ${edge} (${key}) is validated weakly`,
            fix_hint: "cross-repo edges are warn-only; ensure the sibling repo/slug exists out of band" });
          continue;
        }
        // the edge value is a slug (canon 2.7); it resolves to a folder name directly.
        if (!knownSlugs.has(edge)) {
          out.push({ rule_id: "RELATION-DANGLING", file: `${f.rel}/relations.md`, line, specDir: null,
            message: `${key} edge ${edge} points to a slug that exists nowhere in specs/, knowledge/, or archive/`,
            fix_hint: "fix the slug, or remove the edge if the target was never created" });
        } else if (killedSlugs.has(edge)) {
          out.push({ rule_id: "RELATION-KILLED", file: `${f.rel}/relations.md`, line, specDir: null,
            message: `${key} edge ${edge} points to killed spec ${edge}`,
            fix_hint: "edges to killed specs are warn-only; drop the edge if it is no longer meaningful" });
        }
      }
    }
  }
  return out;
};

const danglingLinks: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const md of repo.mdFiles) {
    for (const lk of links(md.content)) {
      const target = lk.target.split("#")[0]!.trim();
      if (target === "") continue;
      if (/^(https?:|mailto:|tel:|\/)/.test(target)) continue;
      const resolved = resolve(dirname(md.abs), target);
      if (!existsSync(resolved)) {
        out.push({ rule_id: "LINK-DANGLING", file: md.rel, line: lk.line, specDir: null,
          message: `relative link "${lk.target}" does not resolve`,
          fix_hint: "fix the path; for a cross-repo reference, cite it by name instead of a relative link" });
      }
    }
  }
  return out;
};

const knowledgeHasStatus: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  for (const f of repo.knowledge) {
    for (const bad of ["status.md", "open-questions.md"]) {
      if (f.files.includes(bad)) {
        out.push({ rule_id: "KNOWLEDGE-HAS-STATUS", file: `${f.rel}/${bad}`, line: null, specDir: null,
          message: `knowledge/ must not contain ${bad} (lifecycle artifact)`,
          fix_hint: `delete ${bad} from knowledge/; knowledge records rules and rationale, not lifecycle state` });
      }
    }
  }
  return out;
};

const archiveEdited: Rule = ({ modified }) => {
  const out: RawFinding[] = [];
  // Only a *modification* of an archived spec is a violation — adding one is
  // graduation, which is allowed. So this reads `modified`, not `changed`. And only
  // archived specs (archive/<slug>/...) count; the generated archive/README.md does not.
  const archivedSpec = /^docs\/archive\/[^/]+\//;
  for (const path of [...modified].sort()) {
    if (archivedSpec.test(path)) {
      out.push({ rule_id: "ARCHIVE-EDITED", file: path, line: null, specDir: null,
        message: `archive/ is read-only; ${path} was reported changed`,
        fix_hint: "revert the edit; archived specs are an immutable audit trail" });
    }
  }
  return out;
};

const slugIntegrity: Rule = ({ repo }) => {
  const out: RawFinding[] = [];
  // A slug is the identity of one feature and is never reused for a different one, so
  // the comparison is specs/ against knowledge/ ∪ archive/. The same slug in
  // knowledge/ AND archive/ is the normal end state of graduation, not a collision —
  // which is why the pair itself is never compared. Two in-flight specs cannot
  // collide: the same folder name is a filesystem impossibility. What this catches is
  // a new spec reusing a slug already spent. (`main` compared specs ∪ archive only,
  // so a spec reusing a *graduated* slug — knowledge/ with no archive/ — slipped past.)
  const landed = new Map<string, SpecFolder>();
  for (const f of [...repo.knowledge, ...repo.archive]) {
    if (!landed.has(f.slug)) landed.set(f.slug, f);
  }
  for (const f of [...repo.specs].sort((a, b) => a.rel.localeCompare(b.rel))) {
    const previous = landed.get(f.slug);
    if (previous === undefined) continue;
    out.push({ rule_id: "SLUG-DUPLICATE", file: `${f.rel}/spec.md`, line: f.frontmatter?.lineOf["slug"] ?? null, specDir: f.dirName,
      message: `slug "${f.slug}" also names ${previous.rel}`,
      fix_hint: "slugs are permanent and never reused for a different feature; re-slug the new spec to a fresh name while nothing references it" });
  }
  return out;
};

/** "2.4.0-draft" -> "2.4"; null if unparseable. The canon contract is tracked at
 *  MAJOR.MINOR (doctor@MAJOR.MINOR ↔ canon MAJOR.MINOR), so patch/prerelease
 *  differences are not skew. */
function majorMinor(v: string): string | null {
  const m = v.trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)/);
  return m ? `${m[1]}.${m[2]}` : null;
}

// CANON-PIN-MISMATCH: the repo's declared canon pin must track the canon this
// tool actually serves. A drift means the repo is being gated by a different
// contract than it claims to follow — warn-only, since the fix is a pin bump,
// not a structural defect.
const canonPinMismatch: Rule = (ctx) => {
  const pin = ctx.repo.canonPin;
  if (pin === null) return [];
  const want = majorMinor(CANON);
  const got = majorMinor(pin.version);
  if (want === null || got === null || want === got) return [];
  return [{
    rule_id: "CANON-PIN-MISMATCH", file: pin.file, line: pin.line, specDir: null,
    message: `repo pins canon ${pin.version} but this tool serves canon ${CANON}`,
    fix_hint: `bump the pin to ${CANON} (run: specline upgrade), or run a tool pinned to canon ${got}` }];
};

export const RULES: Rule[] = [
  structMissing,
  frontmatterWellFormed,
  statusSchema,
  enumValues,
  loopBudgetValid,
  unknownFrontmatterKeys,
  unknownSections,
  goalMissing,
  judgeableNoSection,
  checkRunMalformed,
  scopeExceedsSize,
  parentHasMechanics,
  parentNoScopes,
  correctionsMalformed,
  unattendedIncomplete,
  acceptanceUnpartitioned,
  archiveNeedsAcceptance,
  openQuestionIncomplete,
  openQuestionOverdue,
  staleQuarantine,
  deciderOverBudget,
  couplingCeiling,
  relationEdges,
  danglingLinks,
  knowledgeHasStatus,
  archiveEdited,
  slugIntegrity,
  canonPinMismatch,
];
