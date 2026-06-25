import type { APIRoute } from "astro";
import { CANON_VERSION } from "../canon.ts";

export const prerender = true;

const BODY = `# Specline

> Spec-driven development where a machine-checkable spec is the contract, humans hold
> the gates (ratify by merging to main, accept), and an agent runs the loop between
> them. Specline blocks only on integrity; spec quality is advisory. Canon ${CANON_VERSION}.

## Canon
- [Specline canon, raw markdown](https://specline.dev/spec.md): the full normative
  methodology. Everything an agent needs to operate Specline, in the format it reads best.

## Docs
- [Handbook](https://specline.dev/): the readable explainer of how Specline works.

## Tooling
- Specline: the deterministic structural validator. CLI (\`specline check\`) and an MCP
  server exposing specline_check / specline_spec / specline_rules.
`;

export const GET: APIRoute = () =>
  new Response(BODY, { headers: { "content-type": "text/plain; charset=utf-8" } });
