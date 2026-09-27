// Pure parsing helpers: a flat-YAML reader for frontmatter and relations.md, and
// markdown structure extraction (headings, links). No filesystem, no judgment.

import { LineCounter, isMap, isScalar, parseDocument } from "yaml";

export interface ParsedYaml {
  data: Record<string, string | string[]>;
  /** 1-based source line each key was declared on. */
  lineOf: Record<string, number>;
  ok: boolean;
  error?: string;
}

/** A list item: a scalar, or the canon's annotated-edge shape `- slug: why`, which
 *  YAML reads as a single-key mapping and callers read back as `slug: why`. */
function flatItem(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value);
    const [key, annotation] = entries[0] ?? [];
    if (entries.length === 1 && key !== undefined) {
      if (annotation === null) return key;
      if (typeof annotation === "string") return `${key}: ${annotation}`;
    }
  }
  return null;
}

/** The flat subset Specline metadata is written in: a scalar, a list of scalars, or
 *  an empty value (`key:`), which reads as absent. Anything deeper is not the
 *  contract — a nested map under a key is a parse failure, as it always was. */
function flatten(value: unknown): string | string[] | null {
  if (value === null || value === undefined || value === "") return []; // `key:` — declared, absent
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const items = value.map(flatItem);
    return items.every((item) => item !== null) ? (items as string[]) : null;
  }
  return null;
}

/** Parse a flat key/value YAML subset: scalars, `[]`, `[a, b]`, and `- item` lists.
 *  A real YAML parser on the failsafe schema — so quoting, comments, tabs and
 *  duplicate keys are judged by the spec, and every scalar stays a string (a date
 *  or `yes` is metadata, not a Date or a boolean). */
export function parseFlatYaml(text: string, startLine = 1): ParsedYaml {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { schema: "failsafe", uniqueKeys: true, lineCounter, prettyErrors: false });
  const data: Record<string, string | string[]> = {};
  const lineOf: Record<string, number> = {};
  if (doc.errors.length > 0) {
    const err = doc.errors[0]!;
    return { data, lineOf, ok: false, error: `line ${startLine - 1 + lineCounter.linePos(err.pos[0]).line}: ${err.message}` };
  }
  if (doc.contents === null) return { data, lineOf, ok: true };
  if (!isMap(doc.contents)) return { data, lineOf, ok: false, error: "expected a `key: value` mapping" };

  for (const pair of doc.contents.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string") {
      return { data, lineOf, ok: false, error: "mapping keys must be plain text" };
    }
    lineOf[pair.key.value] = startLine - 1 + lineCounter.linePos(pair.key.range?.[0] ?? 0).line;
  }
  let js: unknown;
  try {
    js = doc.toJS({ maxAliasCount: 100 });
  } catch (err) {
    return { data, lineOf, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  for (const [key, value] of Object.entries(js as Record<string, unknown>)) {
    const flat = flatten(value);
    if (flat === null) {
      return { data, lineOf, ok: false, error: `line ${lineOf[key]}: "${key}" must be a value or a list of values` };
    }
    data[key] = flat;
  }
  return { data, lineOf, ok: true };
}

export interface Frontmatter extends ParsedYaml {
  /** number of lines consumed by the frontmatter block incl. fences, for body offset. */
  endLine: number;
  present: boolean;
}

/** Extract a `---` fenced YAML frontmatter block from the top of a markdown doc. */
export function parseFrontmatter(md: string): Frontmatter {
  const lines = md.split(/\r?\n/);
  if ((lines[0] ?? "").trim() !== "---") {
    return { data: {}, lineOf: {}, ok: false, present: false, endLine: 0, error: "no frontmatter block" };
  }
  const close = frontmatterEnd(lines);
  if (close === -1) {
    return { data: {}, lineOf: {}, ok: false, present: true, endLine: lines.length, error: "unterminated frontmatter block" };
  }
  const body = lines.slice(1, close).join("\n");
  const parsed = parseFlatYaml(body, 2); // first content line is line 2
  return { ...parsed, present: true, endLine: close + 1 };
}

/** Index of the closing `---` of a leading frontmatter block, or -1. */
function frontmatterEnd(lines: string[]): number {
  for (let i = 1; i < lines.length; i++) {
    if ((lines[i] ?? "").trim() === "---") return i;
  }
  return -1;
}

export interface Heading {
  level: number;
  title: string;
  line: number;
}

export interface MdLink {
  target: string;
  line: number;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const ATX = /^(#{1,6})\s+(.*)$/;
// `[text](target)`. The text may wrap across lines (but not across a blank line,
// which ends the paragraph); the destination may not.
const INLINE_LINK = /\[(?:[^\][\n]|\n(?![ \t]*\n))*\]\(([^)\n]*)\)/g;
// A reference definition: `[ref]: target` alone on its line, with an optional title.
const LINK_DEFINITION = /^ {0,3}\[[^\][\n]+\]:[ \t]*(\S+)(?:[ \t]+("[^"]*"|'[^']*'|\([^()]*\)))?[ \t]*$/;

/** Drop `<!-- … -->` spans, carrying an unclosed comment across lines. */
function stripComments(line: string, state: { open: boolean }): string {
  let out = "";
  let rest = line;
  for (;;) {
    if (state.open) {
      const end = rest.indexOf("-->");
      if (end === -1) return out;
      rest = rest.slice(end + 3);
      state.open = false;
    }
    const start = rest.indexOf("<!--");
    if (start === -1) return out + rest;
    out += rest.slice(0, start);
    rest = rest.slice(start + 4);
    state.open = true;
  }
}

/** Drop `` `code span` `` runs, so their contents are text and not markup. */
function stripCodeSpans(line: string): string {
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] !== "`") {
      out += line[i];
      i++;
      continue;
    }
    let run = 0;
    while (line[i + run] === "`") run++;
    const close = line.indexOf("`".repeat(run), i + run);
    if (close === -1) {
      out += line.slice(i, i + run); // an unclosed run is literal backticks
      i += run;
      continue;
    }
    i = close + run;
  }
  return out;
}

interface Structure {
  headings: Heading[];
  links: MdLink[];
}

/** One pass over the document: headings and links share the same block context
 *  (frontmatter, fenced and indented code, HTML comments), so they are found
 *  together. A line scanner, deliberately: a `##` heading is a `##` at the start
 *  of a line — no setext headings, none inside blockquotes or list items. */
function scan(md: string): Structure {
  const lines = md.split(/\r?\n/);
  // Frontmatter is metadata, not body. Blank it, keeping line numbers intact.
  if ((lines[0] ?? "").trim() === "---") {
    const close = frontmatterEnd(lines);
    if (close !== -1) for (let i = 0; i <= close; i++) lines[i] = "";
  }

  const headings: Heading[] = [];
  const body: string[] = []; // link-bearing text, one entry per source line
  const comment = { open: false };
  let fence: string | null = null;
  let afterBlank = true;
  let indentedCode = false;

  for (const raw of lines) {
    if (fence !== null) {
      body.push("");
      if (new RegExp(`^ {0,3}\\${fence[0]}{${fence.length},}[ \t]*$`).test(raw)) fence = null;
      continue;
    }
    const line = stripComments(raw, comment);
    if (line.trim() === "") {
      body.push("");
      afterBlank = true;
      indentedCode = false;
      continue;
    }
    const opening = FENCE.exec(line);
    if (opening) {
      body.push("");
      fence = opening[1]!;
      afterBlank = false;
      continue;
    }
    // An indented code block opens after a blank line and runs while indented.
    indentedCode = /^(?: {4}|\t)/.test(line) && (afterBlank || indentedCode);
    afterBlank = false;
    if (indentedCode) {
      body.push("");
      continue;
    }
    const atx = ATX.exec(line);
    if (atx) {
      headings.push({
        level: atx[1]!.length,
        // an ATX closing sequence (`## Goal ##`) is decoration, not title text
        title: atx[2]!.replace(/\s+#+\s*$/, "").replace(/[*_`]/g, "").trim(),
        line: body.length + 1,
      });
    }
    body.push(stripCodeSpans(line));
  }

  const links: MdLink[] = [];
  const text = body.join("\n");
  let lineNo = 1;
  let cursor = 0;
  for (const m of text.matchAll(INLINE_LINK)) {
    for (let i = cursor; i < m.index; i++) if (text[i] === "\n") lineNo++;
    cursor = m.index;
    links.push({ target: m[1]!.trim(), line: lineNo });
  }
  body.forEach((line, i) => {
    const def = LINK_DEFINITION.exec(line);
    if (def) links.push({ target: def[1]!, line: i + 1 });
  });
  return { headings, links: links.sort((a, b) => a.line - b.line) };
}

/** All ATX headings, fence-aware, with markdown emphasis stripped from the title. */
export function headings(md: string): Heading[] {
  return scan(md).headings;
}

/** Inline `[text](target)` links and reference definitions. Skips images is not
 *  needed; callers filter targets. */
export function links(md: string): MdLink[] {
  return scan(md).links;
}
