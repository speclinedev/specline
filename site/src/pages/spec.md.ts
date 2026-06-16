import type { APIRoute } from "astro";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// The agent endpoint: serve the canon as raw markdown. Read from the repo's single
// source at build time — resolved by glob (specline-*.md in the project root's
// parent), not a hard-coded filename, so a canon version bump never breaks the
// route and there is no vendored copy to drift from the source.
export const prerender = true;

function canonPath(): string {
  const dir = resolve(process.cwd(), "..");
  const files = readdirSync(dir).filter((f) => /^specline-.*\.md$/.test(f));
  if (files.length !== 1) {
    throw new Error(`expected exactly one specline-*.md in ${dir}, found ${files.length} (${files.join(", ") || "none"})`);
  }
  return resolve(dir, files[0]!);
}

export const GET: APIRoute = () => {
  const md = readFileSync(canonPath(), "utf8");
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
};
