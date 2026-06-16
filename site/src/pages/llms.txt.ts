import type { APIRoute } from "astro";

export const prerender = true;

const BODY = `# Specline

> Spec-driven development where a machine-checkable spec is the contract, humans hold
> the two gates (ratify, accept), and an agent runs the loop between them. Canon
> 2.4.0-draft.

## Canon
- [Specline canon, raw markdown](https://specline.dev/spec.md): the full normative
  methodology. Everything an agent needs to operate Specline, in the format it reads best.

## Docs
- [Handbook](https://specline.dev/): the readable explainer of how Specline works.

## Tooling
- doctor: the deterministic structural validator. CLI (\`specline doctor\`) and an MCP
  server exposing doctor_check / doctor_spec / doctor_rules.
`;

export const GET: APIRoute = () =>
  new Response(BODY, { headers: { "content-type": "text/plain; charset=utf-8" } });
