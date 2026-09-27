#!/usr/bin/env node
// The local CLI adapter — a thin wrapper over the engine and the scaffolder. It
// parses args, renders output (JSON is the source of truth; human is a projection),
// and maps results to a stable exit code. All real logic lives in the engine/init.

import { existsSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { run, exitCodeFor, type Report } from "../engine/run.ts";
import { InputError, readUnattendedSwitch } from "../engine/model.ts";
import { REGISTRY } from "../engine/rules.ts";
import { init, sync, upgrade, type RunResult } from "../init/scaffold.ts";
import { TOOL_VERSION, CANON } from "../version.ts";
import { canonFor } from "../canon.ts";
import { refreshLatest, staleness } from "../staleness.ts";

const USAGE = `specline — spec-driven development tooling

  specline check  [PATH] [--format json|human]
                         [--changed <file>...] [--modified <file>...] [--now <iso-date>]
  specline init    [PATH] [--decider <name>]
                          [--github-action | --no-github-action] [--check] [--yes]
  specline sync    [PATH] [--check]
  specline upgrade [PATH] [--check]
  specline rules   [PATH] [--format json|markdown]
  specline spec    [PATH]

  check validates a repo's structure (read-only). init/sync write generated artifacts.
  upgrade bumps the canon pin (specline.yml + doc-architecture.md) to this tool's
  canon and regenerates generated files.

  rules and spec read PATH's specline.yml for the \`unattended:\` switch: with it off
  (the default) the experimental Part 3 is neither listed nor served.

Exit: 0 = ok, 1 = errors / --check stale, 2 = usage error, 3 = internal error.`;

type Format = "json" | "human" | "markdown";

interface Args {
  command: "check" | "rules" | "spec" | "init" | "sync" | "upgrade";
  path: string;
  format: Format | null;
  changed: string[];
  modified: string[];
  now: string | null;
  decider: string;
  githubAction: "yes" | "no" | "ask";
  check: boolean;
  yes: boolean;
}

/** Help is not an error, but it does end the run — and `process.exit` here would
 *  truncate anything still buffered on stdout. Both unwind to main().catch. */
class HelpRequested extends Error {}

function fail(msg: string): never {
  throw new InputError(`${msg}\n\n${USAGE}`);
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    command: "check", path: ".", format: null, changed: [], modified: [], now: null,
    decider: "you", githubAction: "ask", check: false, yes: false,
  };
  const sub = argv[0];
  if (sub === undefined || sub === "-h" || sub === "--help") {
    process.stdout.write(`${USAGE}\n`);
    throw new HelpRequested();
  }
  if (sub === "check" || sub === "doctor") a.command = "check"; // `doctor` kept as a silent back-compat alias
  else if (sub === "rules") a.command = "rules";
  else if (sub === "spec") a.command = "spec";
  else if (sub === "init") a.command = "init";
  else if (sub === "sync") a.command = "sync";
  else if (sub === "upgrade") a.command = "upgrade";
  else if (sub.startsWith("-")) fail(`the first argument must be a command (check, init, sync, upgrade, rules, spec), not ${sub}`);
  else fail(`unknown command "${sub}" — did you mean: specline check ${sub}`);

  let sawPath = false;
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case "--format": {
        const v = argv[++i];
        if (v !== "json" && v !== "human" && v !== "markdown") fail(`--format must be json, human, or markdown`);
        a.format = v;
        break;
      }
      case "--now":
        a.now = argv[++i] ?? fail(`--now needs an ISO date`);
        break;
      case "--changed":
        while (i + 1 < argv.length && !argv[i + 1]!.startsWith("--")) a.changed.push(argv[++i]!);
        break;
      case "--modified":
        while (i + 1 < argv.length && !argv[i + 1]!.startsWith("--")) a.modified.push(argv[++i]!);
        break;
      case "--decider":
        a.decider = argv[++i] ?? fail(`--decider needs a name`);
        break;
      case "--github-action":
        a.githubAction = "yes";
        break;
      case "--no-github-action":
        a.githubAction = "no";
        break;
      case "--check":
        a.check = true;
        break;
      case "--yes":
      case "-y":
        a.yes = true;
        break;
      case "-h":
      case "--help":
        process.stdout.write(`${USAGE}\n`);
        throw new HelpRequested();
      default:
        if (arg.startsWith("--")) fail(`unknown flag ${arg}`);
        if (sawPath) fail(`unexpected extra argument ${arg}`);
        a.path = arg;
        sawPath = true;
    }
  }
  return a;
}

const PART_TITLES: Record<number, string> = {
  1: "Part 1 — the spec",
  2: "Part 2 — the record",
  3: "Part 3 — unattended builds (experimental)",
};

/** The catalog an agent reads to know what it will be checked against *before* it
 *  writes. With the switch off, Part-3 rules are omitted entirely rather than
 *  listed-and-inert: nothing should advertise a rule that cannot fire. */
function printRules(format: Format, unattended: boolean): void {
  const parts: (1 | 2 | 3)[] = unattended ? [1, 2, 3] : [1, 2];
  const listed = parts.flatMap((part) => REGISTRY.filter((r) => r.part === part));
  if (format === "json") {
    const rules = listed.map((r) => (r.part === 3 ? { ...r, experimental: true } : { ...r }));
    process.stdout.write(`${JSON.stringify({ tool_version: TOOL_VERSION, canon: CANON, unattended, rules }, null, 2)}\n`);
    return;
  }
  const lines = [`# specline rules — catalog (tool ${TOOL_VERSION}, canon ${CANON})`, ""];
  lines.push(unattended
    ? "`unattended: true` — Part 3 is in force and its rules are listed as experimental."
    : "`unattended` is off (the default), so the experimental Part-3 rules neither run nor are listed.");
  for (const part of parts) {
    lines.push("", `## ${PART_TITLES[part]}`, "");
    lines.push("| rule_id | severity | scope | tags |");
    lines.push("|---|---|---|---|");
    for (const r of REGISTRY.filter((x) => x.part === part)) {
      lines.push(`| \`${r.rule_id}\` | ${r.severity} | ${r.scope} | ${r.part === 3 ? "experimental" : ""} |`);
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

const SEV_LABEL: Record<string, string> = { error: "ERROR ", warning: "WARN  ", info: "INFO  " };

function renderHuman(report: Report, path: string): string {
  const out: string[] = [];
  out.push(`specline ${report.tool_version} · canon ${report.canon}${report.unattended ? " · unattended (experimental)" : ""}`);
  out.push(path);
  out.push("");
  if (report.findings.length === 0) {
    out.push("  ✓ no findings");
  } else {
    for (const f of report.findings) {
      const loc = f.file ? `${f.file}${f.line !== null ? `:${f.line}` : ""}` : "(repo)";
      const tag = f.label ? ` [${f.label}]` : "";
      out.push(`  ${SEV_LABEL[f.severity] ?? f.severity}  ${f.rule_id}${tag}  ${loc}`);
      out.push(`         ${f.message}`);
      out.push(`         ↳ ${f.fix_hint}`);
      out.push("");
    }
  }
  const s = report.summary;
  out.push(`${s.errors} error${s.errors === 1 ? "" : "s"}, ${s.warnings} warning${s.warnings === 1 ? "" : "s"}, ${s.info} info`);
  return out.join("\n");
}

function renderScaffold(cmd: string, path: string, res: RunResult, check: boolean): string {
  const out = [`specline ${cmd} · ${path}${check ? " · --check (no writes)" : ""}`, ""];
  for (const o of res.outcomes) out.push(`  ${o.action.padEnd(14)} ${o.rel}`);
  out.push("");
  if (check) out.push(res.clean ? "✓ up to date" : "✗ missing or stale — run without --check to write");
  else out.push(res.wrote ? "✓ written" : "✓ nothing to do");
  return `${out.join("\n")}\n`;
}

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function resolveGithubAction(args: Args): Promise<boolean> {
  if (args.githubAction === "yes") return true;
  if (args.githubAction === "no") return false;
  if (args.yes || !process.stdin.isTTY) return false; // non-interactive default: no
  const ans = (await ask("Add a GitHub Action to gate docs/ on PRs? [y/N] ")).trim().toLowerCase();
  return ans === "y" || ans === "yes";
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === "spec") {
    const text = canonFor(readUnattendedSwitch(args.path));
    process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
    return;
  }
  if (args.command === "rules") {
    printRules(args.format ?? "markdown", readUnattendedSwitch(args.path));
    return;
  }
  if (args.command === "init") {
    if (existsSync(args.path) && !statSync(args.path).isDirectory()) fail(`${args.path} is not a directory`);
    const res = init(args.path, {
      tier: 1,
      decider: args.decider,
      githubAction: await resolveGithubAction(args),
      check: args.check,
    });
    process.stdout.write(renderScaffold("init", args.path, res, args.check));
    process.exitCode = args.check && !res.clean ? 1 : 0;
    return;
  }
  if (args.command === "sync") {
    const res = sync(args.path, { check: args.check });
    process.stdout.write(renderScaffold("sync", args.path, res, args.check));
    process.exitCode = args.check && !res.clean ? 1 : 0;
    return;
  }
  if (args.command === "upgrade") {
    const res = upgrade(args.path, { check: args.check });
    process.stdout.write(renderScaffold("upgrade", args.path, res, args.check));
    process.exitCode = args.check && !res.clean ? 1 : 0;
    return;
  }

  const report = run(args.path, { changed: args.changed, modified: args.modified, now: args.now });
  const format = args.format ?? "human";
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderHuman(report, args.path)}\n`);
    await refreshLatest();
    const stale = staleness(CANON);
    if (stale !== null) {
      process.stderr.write(`\nnote: serving canon ${stale.current}; ${stale.latest} is the latest release — update your speclinedev/specline@ ref.\n`);
    }
  }
  process.exitCode = exitCodeFor(report);
}

// Nothing here calls process.exit: it discards whatever stdout has buffered, and a
// JSON report over ~64 KiB through a pipe came out truncated. Setting exitCode and
// letting the event loop drain is the whole fix.
main().catch((err) => {
  if (err instanceof HelpRequested) return;
  const input = err instanceof InputError;
  process.stderr.write(`specline: ${input ? "" : "internal error: "}${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = input ? 2 : 3;
});
