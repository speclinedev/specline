// The repo model: doctor's read-only view of a Specline repo. Walks `docs/`,
// parses frontmatter and structure, and exposes a plain data model that the rule
// functions consume. It never executes, imports, or compiles repo code.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { parseFrontmatter, type Frontmatter } from "./parse.ts";

/** Bad input from a caller (CLI flag, MCP argument, API option) — never a bug in
 *  the engine. Adapters map it to their own "you asked for something invalid"
 *  channel; nothing else in the engine throws. */
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validatePaths(key: string, value: unknown): void {
  const bad = (p: unknown): boolean =>
    typeof p !== "string" || p === "" || p.includes("\0") ||
    /^(?:[A-Za-z]:|[/\\])/.test(p) || p.replace(/\\/g, "/").split("/").includes("..");
  if (!Array.isArray(value) || value.some(bad)) {
    throw new InputError(`${key} must contain repository-relative paths (no absolute paths, no "..")`);
  }
}

/** Every adapter funnels through here, so "the validator ran on what you meant"
 *  is checked once rather than per transport. */
export function validateRunOptions(opts: { mode: unknown; changed: unknown; modified?: unknown; now: unknown; tierOverride?: unknown }): void {
  if (opts.mode !== "gate" && opts.mode !== "author") throw new InputError("mode must be gate or author");
  validatePaths("changed", opts.changed);
  validatePaths("modified", opts.modified ?? []);
  if (opts.tierOverride !== undefined && ![0, 1, 2].includes(opts.tierOverride as number)) {
    throw new InputError("tier must be 0, 1, or 2");
  }
  if (opts.now !== null && opts.now !== undefined) {
    if (typeof opts.now !== "string" || !ISO_DATE.test(opts.now)) throw new InputError("now must be an ISO date (YYYY-MM-DD)");
    const date = new Date(`${opts.now}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== opts.now) {
      throw new InputError(`now must be a real calendar date (${opts.now} is not)`);
    }
  }
}

/** Resolve and verify the repo root: an absolute path with a docs/ directory. */
export function resolveRepoRoot(root: string): string {
  if (typeof root !== "string" || root.trim() === "" || root.includes("\0")) {
    throw new InputError("path must be a non-empty repository path");
  }
  const absolute = resolve(root);
  const docsDir = join(absolute, "docs");
  if (!existsSync(docsDir) || !statSync(docsDir).isDirectory()) {
    throw new InputError(`no docs/ directory at ${absolute}; run specline init first`);
  }
  return absolute;
}

export type Severity = "error" | "warning" | "info";
export type Scope = "repo" | "spec";
export type SpecKind = "spec" | "knowledge" | "archive";

export interface RuleMeta {
  rule_id: string;
  severity: Severity;
  scope: Scope;
  tier: number;
  downgradable: boolean;
}

export interface RawFinding {
  rule_id: string;
  /** repo-root-relative POSIX path, or null for repo-wide findings. */
  file: string | null;
  line: number | null;
  message: string;
  fix_hint: string;
  /** the spec dirName this finding belongs to, for quarantine; null = repo-wide. */
  specDir?: string | null;
}

export interface Finding {
  rule_id: string;
  severity: Severity;
  scope: Scope;
  file: string | null;
  line: number | null;
  message: string;
  fix_hint: string;
  label?: string;
}

export interface SpecFolder {
  kind: SpecKind;
  /** absolute directory path. */
  abs: string;
  /** repo-root-relative POSIX path of the directory. */
  rel: string;
  dirName: string;
  /** the spec's identity: the folder name (canon 2.7, slug-as-ID). Always the dir. */
  slug: string;
  files: string[];
  hasSpec: boolean;
  hasRelations: boolean;
  hasStatus: boolean;
  hasOpenQuestions: boolean;
  specContent: string | null;
  frontmatter: Frontmatter | null;
  statusContent: string | null;
  relationsContent: string | null;
  openQuestionsContent: string | null;
}

export interface MdFile {
  abs: string;
  rel: string;
  content: string;
}

export interface CanonPin {
  /** the pinned version string, verbatim, e.g. "2.4.0-draft". */
  version: string;
  /** repo-root-relative POSIX path of the file the pin was read from. */
  file: string;
  /** 1-based line number of the pin within that file. */
  line: number;
}

export interface RepoConfig {
  /** acceptance + Behavior item count above which SCOPE-EXCEEDS-SIZE nudges while size: small. */
  suggestSlicingPast: number;
  /** B7 decider focus limit: max specs in `building`, and max in active states, per decider. */
  focusLimitBuilding: number;
  focusLimitActive: number;
  /** B2 coupling ceiling: spec + forced loads must stay under this % of contextWindowChars. */
  couplingCeilingPct: number;
  contextWindowChars: number;
  /** the capability tiers declared under `models:` (e.g. light/standard/frontier). */
  modelTiers: string[];
}

export interface Repo {
  root: string;
  docsDir: string;
  tier: number;
  tierSource: "declared" | "override" | "default";
  config: RepoConfig;
  /** the repo's declared canon pin, or null when none is declared. */
  canonPin: CanonPin | null;
  specs: SpecFolder[];
  knowledge: SpecFolder[];
  archive: SpecFolder[];
  /** every spec/knowledge/archive folder, flattened. */
  allFolders: SpecFolder[];
  mdFiles: MdFile[];
}

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();
}

function walkMd(dir: string, root: string, acc: MdFile[]): void {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) walkMd(abs, root, acc);
    else if (e.isFile() && e.name.endsWith(".md")) {
      acc.push({ abs, rel: toPosix(relative(root, abs)), content: readFileSync(abs, "utf8") });
    }
  }
}

function loadFolder(kind: SpecKind, abs: string, root: string): SpecFolder {
  const dirName = abs.split(sep).pop() ?? "";
  const files = listFiles(abs);
  const read = (name: string): string | null =>
    files.includes(name) ? readFileSync(join(abs, name), "utf8") : null;
  const specContent = read("spec.md");
  return {
    kind,
    abs,
    rel: toPosix(relative(root, abs)),
    dirName,
    slug: dirName,
    files,
    hasSpec: files.includes("spec.md"),
    hasRelations: files.includes("relations.md"),
    hasStatus: files.includes("status.md"),
    hasOpenQuestions: files.includes("open-questions.md"),
    specContent,
    frontmatter: specContent !== null ? parseFrontmatter(specContent) : null,
    statusContent: read("status.md"),
    relationsContent: read("relations.md"),
    openQuestionsContent: read("open-questions.md"),
  };
}

function readTier(docsDir: string): number | null {
  const f = join(docsDir, "conventions", "doc-architecture.md");
  if (!existsSync(f)) return null;
  const text = readFileSync(f, "utf8");
  const m = text.match(/\*\*Tier\*\*\s*\|\s*\*\*\s*(\d)/);
  return m ? Number(m[1]) : null;
}

const CONFIG_DEFAULTS: RepoConfig = {
  suggestSlicingPast: 6,
  focusLimitBuilding: 3,
  focusLimitActive: 6,
  couplingCeilingPct: 50,
  contextWindowChars: 400000,
  modelTiers: [],
};

/** The indented child `key: value` map directly under a top-level `parent:` block.
 *  A dedent (a non-indented, non-blank line) ends the block. Dependency-free —
 *  parseFlatYaml is flat, and specline.yml's focus_limit/models blocks are nested. */
function blockChildren(text: string, parent: string): Record<string, string> {
  const out: Record<string, string> = {};
  let inBlock = false;
  for (const raw of text.split(/\r?\n/)) {
    if (!inBlock) {
      if (new RegExp(`^${parent}:\\s*(#.*)?$`).test(raw)) inBlock = true;
      continue;
    }
    if (raw.trim() === "") continue;
    if (/^\S/.test(raw)) break; // dedent ends the block
    const m = raw.match(/^\s+([A-Za-z0-9_]+):\s*(.*)$/);
    if (m) out[m[1]!] = (m[2] ?? "").replace(/\s+#.*$/, "").trim();
  }
  return out;
}

/** Read `specline.yml` at repo root — the source of truth for pins and thresholds
 *  (doc-architecture.md is the demoted fallback). */
function readSpeclineConfig(root: string): { tier: number | null; config: RepoConfig } {
  const f = join(root, "specline.yml");
  if (!existsSync(f)) return { tier: null, config: { ...CONFIG_DEFAULTS } };
  const text = readFileSync(f, "utf8");
  const intOf = (re: RegExp, fallback: number): number => {
    const m = text.match(re);
    const n = m ? Number(m[1]) : NaN;
    return Number.isFinite(n) ? n : fallback;
  };
  const childInt = (block: Record<string, string>, key: string, fallback: number): number => {
    const n = Number(block[key]);
    return Number.isFinite(n) ? n : fallback;
  };
  const focus = blockChildren(text, "focus_limit");
  const config: RepoConfig = {
    suggestSlicingPast: intOf(/^suggest_slicing_past:\s*(\d+)/m, CONFIG_DEFAULTS.suggestSlicingPast),
    focusLimitBuilding: childInt(focus, "building", CONFIG_DEFAULTS.focusLimitBuilding),
    focusLimitActive: childInt(focus, "active", CONFIG_DEFAULTS.focusLimitActive),
    couplingCeilingPct: intOf(/^coupling_ceiling:\s*(\d+)/m, CONFIG_DEFAULTS.couplingCeilingPct),
    contextWindowChars: intOf(/^context_window:\s*(\d+)/m, CONFIG_DEFAULTS.contextWindowChars),
    modelTiers: Object.keys(blockChildren(text, "models")),
  };
  const tierM = text.match(/^tier:\s*(\d+)/m);
  return { tier: tierM ? Number(tierM[1]) : null, config };
}

/** Read the repo's declared canon pin. specline.yml `canon:` is the source of
 *  truth; the doc-architecture.md `| **Canon** | Specline `X` |` row is the
 *  demoted fallback — mirrors how the tier is read. Null when neither declares one. */
function readCanonPin(root: string): CanonPin | null {
  const yml = join(root, "specline.yml");
  if (existsSync(yml)) {
    const lines = readFileSync(yml, "utf8").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i]!.match(/^canon:\s*(\S+)/);
      if (m) return { version: m[1]!, file: "specline.yml", line: i + 1 };
    }
  }
  const arch = join(root, "docs", "conventions", "doc-architecture.md");
  if (existsSync(arch)) {
    const lines = readFileSync(arch, "utf8").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i]!.match(/\*\*Canon\*\*\s*\|\s*Specline\s*`?([0-9][^`\s|]*)/);
      if (m) return { version: m[1]!, file: "docs/conventions/doc-architecture.md", line: i + 1 };
    }
  }
  return null;
}

export interface LoadOptions {
  tierOverride?: number;
}

/** Locate `docs/` beneath `root` and build the repo model. */
export function loadRepo(root: string, opts: LoadOptions = {}): Repo {
  root = resolveRepoRoot(root);
  if (opts.tierOverride !== undefined && ![0, 1, 2].includes(opts.tierOverride)) {
    throw new InputError("tier must be 0, 1, or 2");
  }
  const docsDir = join(root, "docs");
  const specsDir = join(docsDir, "specs");
  const knowledgeDir = join(docsDir, "knowledge");
  const archiveDir = join(docsDir, "archive");

  const specs = listDirs(specsDir).map((d) => loadFolder("spec", join(specsDir, d), root));
  const knowledge = listDirs(knowledgeDir).map((d) => loadFolder("knowledge", join(knowledgeDir, d), root));
  const archive = listDirs(archiveDir).map((d) => loadFolder("archive", join(archiveDir, d), root));

  const mdFiles: MdFile[] = [];
  walkMd(docsDir, root, mdFiles);

  const { tier: ymlTier, config } = readSpeclineConfig(root);
  const declaredTier = ymlTier ?? readTier(docsDir);
  let tier: number;
  let tierSource: Repo["tierSource"];
  if (opts.tierOverride !== undefined) {
    tier = opts.tierOverride;
    tierSource = "override";
  } else if (declaredTier !== null) {
    tier = declaredTier;
    tierSource = "declared";
  } else {
    tier = 1;
    tierSource = "default";
  }

  return {
    root,
    docsDir,
    tier,
    tierSource,
    config,
    canonPin: readCanonPin(root),
    specs,
    knowledge,
    archive,
    allFolders: [...specs, ...knowledge, ...archive],
    mdFiles,
  };
}

export { existsSync, statSync, join, toPosix };
