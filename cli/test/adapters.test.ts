// The adapters, exercised as processes: what a shell and an MCP client actually
// see. Covers the two things unit tests cannot — that a large report survives the
// pipe, and that bad input fails visibly instead of being defaulted away.

import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCanon } from "../src/canon.ts";

const cli = fileURLToPath(new URL("../src/cli/index.ts", import.meta.url));
const mcp = fileURLToPath(new URL("../src/mcp/index.ts", import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));
const env = { ...process.env, SPECLINE_NO_UPDATE_CHECK: "1" };

function temp(t: TestContext): string {
  const root = mkdtempSync(join(tmpdir(), "specline-adapter-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function invoke(entry: string, args: string[], options: object = {}) {
  const result = spawnSync(process.execPath, [entry, ...args], { encoding: "utf8", env, timeout: 20_000, maxBuffer: 8 * 1024 * 1024, ...options });
  assert.ifError(result.error);
  return result;
}
function rpc(method: string, params: unknown = {}, id: number | null = 1): string {
  return JSON.stringify({ jsonrpc: "2.0", id, method, params });
}
function tool(args: unknown) {
  const result = invoke(mcp, [], { input: `${rpc("tools/call", { name: "specline_check", arguments: args })}\n` });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).result;
}

test("CLI streams the complete canon through a pipe and returns clean JSON", () => {
  const spec = invoke(cli, ["spec"]);
  assert.equal(spec.status, 0, spec.stderr);
  assert.equal(spec.stdout.trimEnd(), loadCanon().text.trimEnd());
  const report = invoke(cli, ["check", fixture("clean"), "--format", "json"]);
  assert.equal(report.status, 0, report.stderr);
  assert.equal(JSON.parse(report.stdout).summary.errors, 0);
  assert.equal(invoke(cli, ["--help"]).status, 0);
});

test("CLI drains a JSON report larger than the pipe buffer", (t) => {
  // process.exit() truncated stdout at the 64 KiB pipe buffer: a 74 KB report came
  // out as exactly 65536 bytes of unparseable JSON.
  const root = temp(t);
  mkdirSync(join(root, "docs"));
  const count = 300;
  writeFileSync(join(root, "docs/links.md"), Array.from({ length: count }, (_, i) => `[Missing ${i}](missing-${i}.md)`).join("\n"));
  const result = invoke(cli, ["check", root, "--format", "json"]);
  assert.equal(result.status, 1, result.stderr);
  assert.ok(Buffer.byteLength(result.stdout) > 64 * 1024, `report was ${Buffer.byteLength(result.stdout)} bytes`);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.errors, count);
  assert.equal(report.findings.length, count);
  assert.ok(report.findings.every((f: { rule_id: string }) => f.rule_id === "LINK-DANGLING"));
});

test("CLI exit codes separate findings from invalid input", (t) => {
  assert.equal(invoke(cli, ["check", fixture("missing-spec"), "--changed", "docs/specs/widget/relations.md"]).status, 1);
  const file = join(temp(t), "file");
  writeFileSync(file, "not a directory");
  for (const args of [
    ["oops"],
    ["check", "/missing-specline-root"],
    ["check", fixture("clean"), "--now", "2026-02-30"],
    ["check", fixture("clean"), "--now", "yesterday"],
    ["check", fixture("clean"), "--tier", "-1"],
    ["check", fixture("clean"), "--changed", "../escape"],
    ["init", file, "--yes"],
  ]) {
    const result = invoke(cli, args);
    assert.equal(result.status, 2, `${args.join(" ")}: ${result.stdout}${result.stderr}`);
    assert.ok(!result.stderr.startsWith("specline: internal error"), args.join(" "));
  }
});

test("MCP validates its arguments and matches the CLI report byte for byte", () => {
  for (const args of [null, [], {}, { path: 42 }, { path: "/missing-specline-root" }, ...[
    { tier: -1 }, { tier: 1.5 }, { mode: "banana" }, { now: "banana" }, { now: "2026-02-30" }, { now: 42 },
    { changed: [1] }, { modified: "docs/archive/old/spec.md" }, { changed: ["../escape"] },
  ].map((extra) => ({ path: fixture("clean"), ...extra }))]) {
    assert.equal(tool(args).isError, true, JSON.stringify(args));
  }
  const args = { path: fixture("archive-edited"), changed: ["docs/archive/old/spec.md"], modified: ["docs/archive/old/spec.md"] };
  const report = JSON.parse(tool(args).content[0].text);
  const local = invoke(cli, ["check", args.path, "--format", "json", "--changed", ...args.changed, "--modified", ...args.modified]);
  assert.deepEqual(report, JSON.parse(local.stdout));
  assert.ok(report.findings.some((f: { rule_id: string }) => f.rule_id === "ARCHIVE-EDITED"));
});

test("MCP handles discovery, prompts, malformed JSON, notifications and split chunks", async () => {
  const child = spawn(process.execPath, [mcp], { env, stdio: ["pipe", "pipe", "pipe"] });
  let out = "";
  let err = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { out += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { err += chunk; });
  const timer = setTimeout(() => child.kill(), 20_000);
  const exited = new Promise<number | null>((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
  const requests = [
    rpc("initialize"),
    JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }), // no id: no response
    rpc("tools/list", {}, 2),
    rpc("prompts/list", {}, 3),
    rpc("prompts/get", { name: "shape", arguments: { feature: "widgets" } }, 4),
    "{", // unparseable: -32700, not silence
    rpc("tools/call", { name: "specline_spec" }, 5),
  ].join("\n");
  child.stdin.write(requests.slice(0, 13)); // split mid-request: the framing must not care
  child.stdin.end(requests.slice(13)); // ...and the last line has no trailing newline
  try {
    assert.equal(await exited, 0, err);
  } finally {
    clearTimeout(timer);
  }
  const responses = out.trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(responses.length, 6);
  assert.ok(responses[0].result.capabilities.prompts);
  assert.ok(responses[1].result.tools[0].inputSchema.properties.modified);
  assert.deepEqual(responses[2].result.prompts.map((p: { name: string }) => p.name), ["shape"]);
  assert.match(responses[3].result.messages[0].content.text, /widgets/);
  assert.equal(responses[4].error.code, -32700);
  assert.equal(responses[5].result.content[0].text, loadCanon().text);
});
