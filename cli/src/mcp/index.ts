#!/usr/bin/env node
// MCP adapter — a thin wrapper exposing the Specline engine as agent tools + prompts
// over the Model Context Protocol (stdio, newline-delimited JSON-RPC 2.0). It shares
// the exact engine and output contract as the CLI; it only changes the transport.
// Zero dependencies: the protocol surface Specline needs is small.
//
// Tools:
//   specline_check  — validate a repo; returns the JSON report (the source of truth)
//   specline_spec   — the pinned canon, for injecting Specline into an agent's context
//   specline_rules  — the rule catalog the agent will be checked against
// Prompts (surface as slash commands, e.g. /specline:shape):
//   shape           — adopt the planning persona and shape a feature into a spec

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { run } from "../engine/run.ts";
import { readUnattendedSwitch } from "../engine/model.ts";
import { REGISTRY } from "../engine/rules.ts";
import { TOOL_VERSION, CANON } from "../version.ts";
import { canonFor } from "../canon.ts";
import { refreshLatest, staleness } from "../staleness.ts";

const DEFAULT_PROTOCOL = "2025-06-18";

/** `path` is optional on the two read-only tools: absent means "no repo in view",
 *  and the switch defaults off — the same default a repo with no specline.yml gets. */
function switchAt(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value !== "string" || value.trim() === "") throw new Error("path must be a nonempty string");
  return readUnattendedSwitch(value);
}

function plannerPersona(): string {
  return readFileSync(fileURLToPath(new URL("../../prompts/planner.md", import.meta.url)), "utf8");
}

const PROMPTS = [
  {
    name: "shape",
    description: "Adopt the Specline planning persona and shape a feature into a spec with the product owner.",
    arguments: [{ name: "feature", description: "The feature you want to shape (optional — you can also just describe it after).", required: false }],
  },
];

const TOOLS = [
  {
    name: "specline_check",
    description:
      "Validate a Specline repo's structure. Returns the deterministic JSON report " +
      "(findings with rule_id, severity, scope, file, line, message, fix_hint). " +
      "Only integrity rules are errors and fail the gate; everything about spec quality is an " +
      "advisory warning. Pass changed=[...] (repo-relative paths) so spec-scoped integrity " +
      "errors quarantine correctly.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the repo root (contains docs/)." },
        mode: { type: "string", enum: ["gate", "author"], description: "Default gate." },
        changed: { type: "array", items: { type: "string" }, description: "Repo-relative changed paths." },
        modified: { type: "array", items: { type: "string" }, description: "Repo-relative modifications/deletions, excluding additions (archive edit detection)." },
        now: { type: "string", description: "Reference ISO date for time-dependent checks." },
      },
      required: ["path"],
    },
  },
  {
    name: "specline_spec",
    description:
      "Return the pinned Specline canon (markdown). Inject this to make an agent aware of the methodology " +
      "before it authors a spec. Pass path to honour that repo's `unattended:` switch — with it off (the " +
      "default) the experimental Part 3 is not included.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Path to the repo root, to read its unattended switch." } },
    },
  },
  {
    name: "specline_rules",
    description:
      "Return the rule catalog Specline enforces: every rule_id with its severity, scope, and canon part. " +
      "Part-3 (unattended) rules are listed only when the repo at path sets `unattended: true`.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Path to the repo root, to read its unattended switch." } },
    },
  },
];

interface Rpc {
  jsonrpc: "2.0";
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

function send(msg: Rpc): void {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function textResult(text: string, isError = false) {
  return { content: [{ type: "text", text }], ...(isError ? { isError: true } : {}) };
}

function callTool(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case "specline_check": {
      // Arguments are agent-supplied and unvalidated by the protocol. A wrong one
      // must be a visible error, never a silent default: `path` defaulting to "."
      // used to validate whatever directory the server happened to start in.
      if (typeof args.path !== "string" || args.path.trim() === "") throw new Error("path is required and must be a nonempty string");
      if (args.mode !== undefined && args.mode !== "author" && args.mode !== "gate") throw new Error("mode must be author or gate");
      for (const key of ["changed", "modified"]) {
        const value = args[key];
        if (value !== undefined && (!Array.isArray(value) || !value.every((p) => typeof p === "string"))) {
          throw new Error(`${key} must be an array of repo-relative paths`);
        }
      }
      if (args.now !== undefined && args.now !== null && typeof args.now !== "string") throw new Error("now must be an ISO date");
      const report = run(args.path, {
        mode: args.mode === "author" ? "author" : "gate",
        changed: (args.changed as string[] | undefined) ?? [],
        modified: (args.modified as string[] | undefined) ?? [],
        now: typeof args.now === "string" ? args.now : null,
      });
      return textResult(JSON.stringify(report, null, 2));
    }
    case "specline_spec":
      return textResult(canonFor(switchAt(args.path)));
    case "specline_rules": {
      const unattended = switchAt(args.path);
      const stale = staleness(CANON);
      const update = stale !== null ? { update_available: stale.latest } : {};
      const rules = REGISTRY
        .filter((r) => r.part !== 3 || unattended)
        .map((r) => (r.part === 3 ? { ...r, experimental: true } : { ...r }));
      return textResult(JSON.stringify({ tool_version: TOOL_VERSION, canon: CANON, ...update, unattended, rules }, null, 2));
    }
    default:
      return textResult(`unknown tool: ${name}`, true);
  }
}

function handle(req: Rpc): void {
  const { id, method, params } = req;
  // Notifications (no id) get no response.
  if (id === undefined || id === null) return;

  try {
    switch (method) {
      case "initialize": {
        const requested = params?.protocolVersion;
        send({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: typeof requested === "string" ? requested : DEFAULT_PROTOCOL,
            capabilities: { tools: {}, prompts: {} },
            serverInfo: { name: "specline", version: TOOL_VERSION },
          },
        });
        return;
      }
      case "tools/list":
        send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
        return;
      case "tools/call": {
        const name = String(params?.name ?? "");
        const supplied = params?.arguments;
        if (supplied !== undefined && (supplied === null || typeof supplied !== "object" || Array.isArray(supplied))) {
          throw new Error("arguments must be an object");
        }
        const args = (supplied as Record<string, unknown>) ?? {};
        send({ jsonrpc: "2.0", id, result: callTool(name, args) });
        return;
      }
      case "prompts/list":
        send({ jsonrpc: "2.0", id, result: { prompts: PROMPTS } });
        return;
      case "prompts/get": {
        const name = String(params?.name ?? "");
        if (name !== "shape") {
          send({ jsonrpc: "2.0", id, error: { code: -32602, message: `unknown prompt: ${name}` } });
          return;
        }
        const feature = (params?.arguments as Record<string, unknown>)?.feature;
        const intro = typeof feature === "string" && feature.trim() !== ""
          ? `The product owner wants to shape this feature: ${feature.trim()}\n\nAdopt the role below and begin.\n\n---\n\n`
          : "";
        send({
          jsonrpc: "2.0",
          id,
          result: {
            description: "Specline planning persona",
            messages: [{ role: "user", content: { type: "text", text: intro + plannerPersona() } }],
          },
        });
        return;
      }
      case "ping":
        send({ jsonrpc: "2.0", id, result: {} });
        return;
      default:
        send({ jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } });
    }
  } catch (err) {
    // Engine/internal failure becomes a tool error, not a crash.
    send({ jsonrpc: "2.0", id, result: textResult(`specline error: ${err instanceof Error ? err.message : String(err)}`, true) });
  }
}

// Warm the staleness cache in the background; specline_rules reads it synchronously
// (cache-only, no network in the request path) and reports if the bundle is behind.
void refreshLatest();

/** One JSON-RPC line. A client that sends garbage gets `-32700`, not silence: the
 *  old handler swallowed it and the caller waited for a reply that never came. */
function receive(line: string): void {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      (value as Rpc).jsonrpc !== "2.0" || typeof (value as Rpc).method !== "string") {
    send({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } });
    return;
  }
  handle(value as Rpc);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;
  let nl: number;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (line === "") continue;
    receive(line);
  }
});
// Handle a final line with no trailing newline, then exit naturally — process.exit
// would drop any response still buffered on stdout.
process.stdin.on("end", () => {
  if (buffer.trim() !== "") receive(buffer.trim());
});
