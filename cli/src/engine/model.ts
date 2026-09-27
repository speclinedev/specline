// The repo model: doctor's read-only view of a Specline repo. Walks `docs/`,
// parses frontmatter and structure, and exposes a plain data model that the rule
// functions consume. It never executes, imports, or compiles repo code.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { LineCounter, isMap, isScalar, parseDocument } from "yaml";
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
export function validateRunOptions(opts: { changed: unknown; modified?: unknown; now: unknown }): void {
  validatePaths("changed", opts.changed);
  validatePaths("modified", opts.modified ?? []);
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
  /** which canon part the rule belongs to (canon 3.1). Parts 1–2 always run; part 3
   *  runs and is listed only when `specline.yml` sets `unattended: true`. */
  part: 1 | 2 | 3;
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
  /** the capability names declared under `models:` (e.g. light/standard/frontier). */
  modelTiers: string[];
}

export interface Repo {
  root: string;
  docsDir: string;
  /** the one switch (canon 3.1): `unattended: true` in specline.yml puts Part 3 in
   *  force for this repo. Default false — Part-3 rules neither run nor are listed. */
  unattended: boolean;
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

const CONFIG_DEFAULTS: RepoConfig = {
  suggestSlicingPast: 6,
  focusLimitBuilding: 3,
  focusLimitActive: 6,
  couplingCeilingPct: 50,
  contextWindowChars: 400000,
  modelTiers: [],
};

/** Parse `specline.yml` with a real YAML parser. Config is *nested* by design
 *  (`focus_limit:`, `models:`), so it does not go through parseFlatYaml — but it
 *  does go through the same failsafe schema, which is what makes `tier: "2"` and
 *  `canon: "2.4.0"` mean exactly what their unquoted forms mean. The hand-rolled
 *  line regexes this replaces read the quotes as part of the value, which silently
 *  disabled CANON-PIN-MISMATCH on any repo that quoted its pin. */
function parseConfigFile(text: string, file: string): { data: Record<string, unknown>; lineOf: Record<string, number> } {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { schema: "failsafe", uniqueKeys: true, lineCounter, prettyErrors: false });
  if (doc.errors.length > 0) throw new InputError(`${file}: ${doc.errors[0]!.message}`);
  if (doc.contents === null) return { data: {}, lineOf: {} };
  if (!isMap(doc.contents)) throw new InputError(`${file} must be a \`key: value\` mapping`);
  const lineOf: Record<string, number> = {};
  for (const pair of doc.contents.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string") {
      throw new InputError(`${file}: mapping keys must be plain text`);
    }
    lineOf[pair.key.value] = lineCounter.linePos(pair.key.range?.[0] ?? 0).line;
  }
  let js: unknown;
  try {
    js = doc.toJS({ maxAliasCount: 100 });
  } catch (err) {
    throw new InputError(`${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { data: (js as Record<string, unknown> | null) ?? {}, lineOf };
}

function configMapping(value: unknown, key: string): Record<string, unknown> {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError(`specline.yml ${key} must be a mapping`);
  }
  return value as Record<string, unknown>;
}

/** Every config scalar arrives as a string (failsafe schema), so `50` and `"50"`
 *  are the same value — which is the point. `50%` is accepted for the ceiling. */
function configInteger(value: unknown, key: string, fallback: number, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  if (value === undefined) return fallback;
  const text = typeof value === "string" ? value.replace(/%$/, "").trim() : value;
  if (typeof text !== "string" || !/^\d+$/.test(text) || Number(text) < minimum || Number(text) > maximum) {
    throw new InputError(`specline.yml ${key} must be an integer from ${minimum} to ${maximum}`);
  }
  return Number(text);
}

function configBoolean(value: unknown, key: string): boolean {
  if (typeof value === "string" && /^(true|false)$/i.test(value)) return value.toLowerCase() === "true";
  throw new InputError(`specline.yml ${key} must be true or false`);
}

const VERSION_PATTERN = /^\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** Read `specline.yml` at repo root — the source of truth for the unattended
 *  switch, the pin, and the thresholds (doc-architecture.md is the demoted pin
 *  fallback). */
function readSpeclineConfig(root: string): { unattended: boolean; config: RepoConfig; canonPin: CanonPin | null } {
  const f = join(root, "specline.yml");
  if (!existsSync(f)) return { unattended: false, config: { ...CONFIG_DEFAULTS }, canonPin: null };
  const { data, lineOf } = parseConfigFile(readFileSync(f, "utf8"), "specline.yml");
  const focus = configMapping(data.focus_limit, "focus_limit");
  const config: RepoConfig = {
    suggestSlicingPast: configInteger(data.suggest_slicing_past, "suggest_slicing_past", CONFIG_DEFAULTS.suggestSlicingPast),
    focusLimitBuilding: configInteger(focus.building, "focus_limit.building", CONFIG_DEFAULTS.focusLimitBuilding),
    focusLimitActive: configInteger(focus.active, "focus_limit.active", CONFIG_DEFAULTS.focusLimitActive),
    couplingCeilingPct: configInteger(data.coupling_ceiling, "coupling_ceiling", CONFIG_DEFAULTS.couplingCeilingPct, 0, 100),
    contextWindowChars: configInteger(data.context_window, "context_window", CONFIG_DEFAULTS.contextWindowChars, 1),
    modelTiers: Object.keys(configMapping(data.models, "models")),
  };
  // canon 3.1 removed tiers; `unattended` is the only switch. `tier` is still
  // *accepted* for one MINOR so a v3.0 repo does not error — it gates nothing, and
  // `tier: 2` maps onto the switch only when `unattended` is absent. Any other tier
  // value is read and discarded. `specline upgrade` rewrites both away.
  const unattended = data.unattended !== undefined
    ? configBoolean(data.unattended, "unattended")
    : data.tier === "2";
  let canonPin: CanonPin | null = null;
  if (data.canon !== undefined) {
    if (typeof data.canon !== "string" || !VERSION_PATTERN.test(data.canon)) {
      throw new InputError("specline.yml canon must be a MAJOR.MINOR or MAJOR.MINOR.PATCH version");
    }
    canonPin = { version: data.canon, file: "specline.yml", line: lineOf.canon ?? 1 };
  }
  return { unattended, config, canonPin };
}

/** The doc-architecture.md `| **Canon** | Specline `X` |` row — the demoted pin
 *  fallback, read only when specline.yml declares none. */
function readCanonPin(root: string): CanonPin | null {
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

/** The unattended switch for a directory that may not be a Specline repo at all —
 *  what `specline rules` and `specline spec` need to know which parts to show. No
 *  specline.yml (or no repo) means off, which is the default the canon states. */
export function readUnattendedSwitch(root: string): boolean {
  if (typeof root !== "string" || root.trim() === "" || root.includes("\0")) {
    throw new InputError("path must be a non-empty repository path");
  }
  return readSpeclineConfig(resolve(root)).unattended;
}

/** Locate `docs/` beneath `root` and build the repo model. */
export function loadRepo(root: string): Repo {
  root = resolveRepoRoot(root);
  const docsDir = join(root, "docs");
  const specsDir = join(docsDir, "specs");
  const knowledgeDir = join(docsDir, "knowledge");
  const archiveDir = join(docsDir, "archive");

  const specs = listDirs(specsDir).map((d) => loadFolder("spec", join(specsDir, d), root));
  const knowledge = listDirs(knowledgeDir).map((d) => loadFolder("knowledge", join(knowledgeDir, d), root));
  const archive = listDirs(archiveDir).map((d) => loadFolder("archive", join(archiveDir, d), root));

  const mdFiles: MdFile[] = [];
  walkMd(docsDir, root, mdFiles);

  const { unattended, config, canonPin } = readSpeclineConfig(root);

  return {
    root,
    docsDir,
    unattended,
    config,
    canonPin: canonPin ?? readCanonPin(root),
    specs,
    knowledge,
    archive,
    allFolders: [...specs, ...knowledge, ...archive],
    mdFiles,
  };
}

export { existsSync, statSync, join, toPosix };
