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
import { REGISTRY } from "../engine/rules.ts";
import { TOOL_VERSION, CANON } from "../version.ts";
import { loadCanon } from "../canon.ts";
import { refreshLatest, staleness } from "../staleness.ts";

const DEFAULT_PROTOCOL = "2025-06-18";

function canonText(): string {
  return loadCanon().text;
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
        now: { type: "string", description: "Reference ISO date for time-dependent checks." },
        tier: { type: "integer", description: "Override the declared tier (0|1|2)." },
      },
      required: ["path"],
    },
  },
  {
    name: "specline_spec",
    description: "Return the pinned Specline canon (markdown). Inject this to make an agent aware of the methodology before it authors a spec.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "specline_rules",
    description: "Return the rule catalog Specline enforces: every rule_id with its severity, scope, tier, and downgradable flag.",
    inputSchema: { type: "object", properties: {} },
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
      const path = typeof args.path === "string" ? args.path : ".";
      const report = run(path, {
        mode: args.mode === "author" ? "author" : "gate",
        changed: Array.isArray(args.changed) ? (args.changed as string[]) : [],
        now: typeof args.now === "string" ? args.now : null,
        tierOverride: typeof args.tier === "number" ? args.tier : undefined,
      });
      return textResult(JSON.stringify(report, null, 2));
    }
    case "specline_spec":
      return textResult(canonText());
    case "specline_rules": {
      const stale = staleness(CANON);
      const update = stale !== null ? { update_available: stale.latest } : {};
      return textResult(JSON.stringify({ tool_version: TOOL_VERSION, canon: CANON, ...update, rules: REGISTRY }, null, 2));
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
        const args = (params?.arguments as Record<string, unknown>) ?? {};
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

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;
  let nl: number;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (line === "") continue;
    try {
      handle(JSON.parse(line) as Rpc);
    } catch {
      // Unparseable line — ignore per JSON-RPC stream robustness.
    }
  }
});
process.stdin.on("end", () => process.exit(0));
