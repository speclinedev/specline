import type { APIRoute } from "astro";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The agent endpoint: serve the canon as raw markdown. Read from the repo's single
// source at build time (../specline-2.3.md relative to the site project root) — no
// vendored copy, so it can never drift from the canon.
export const prerender = true;

export const GET: APIRoute = () => {
  const md = readFileSync(resolve(process.cwd(), "../specline-2.3.md"), "utf8");
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
};
