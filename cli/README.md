# specline

The deterministic structural validator for [Specline](../) repos. One
question — *"is this repo structurally valid?"* — answered the same way, with the
same exit code, for every consumer: CI, an agent mid-build, and the human at a
gate.

`specline` reads **only** markdown, YAML, and directory structure. It never
executes, imports, or compiles the repo it validates — which is what lets one
binary validate a Rails, Flutter, or Next.js repo identically. It runs no model
and makes no judgment call; meaning lives at the two human gates, structure lives
here. It runs in **one mode**: it reports every finding and exits nonzero when
any of them is an error.

## Status

Shipped. This repo's own [`docs/`](docs/) dogfoods Specline — see
[`docs/specs/doctor/spec.md`](docs/specs/doctor/spec.md) for the validator's own
spec.

## Scope

The **engine** (pure rules, Parts 1 and 2 always on, Part 3 gated by
`unattended: true`), the **output contract** (JSON + exit code + stable
`rule_id`), and the **local CLI**. The MCP adapter and the GitHub Action are
sibling surfaces over the same engine; `relations-index --fix` generation and
`specline diff` are still planned.

## Layout

| Path | What |
|---|---|
| `docs/` | This repo's own Specline docs — the `doctor` spec, conventions, architecture. |
| `src/engine/` | Pure rule engine: `(repo model) → findings[]`. The only stateful logic. |
| `src/cli/` | The local CLI adapter — a thin wrapper over the engine. |
| `fixtures/` | Frozen test corpus (valid + one malformed per `rule_id`). Owned by the test suite. |

## Usage

```
specline check   [PATH] [--format json|human]
                        [--changed <file>...] [--modified <file>...] [--now <iso-date>]
specline init    [PATH] [--decider <name>] [--github-action | --no-github-action] [--check] [--yes]
specline sync    [PATH] [--check]
specline upgrade [PATH] [--check]
specline rules   [PATH] [--format json|markdown]
specline spec    [PATH]
```

`check` validates a repo's structure (read-only) and is the default command.
`init`/`sync` write generated artifacts (folder READMEs, `specline.yml`);
`upgrade` bumps the canon pin and regenerates them. `rules` and `spec` read
`PATH`'s `specline.yml` for the `unattended:` switch — with it off (the
default) the experimental Part 3 is neither listed nor served.

Exit codes: `0` clean, `1` errors (or a stale `--check`), `2` usage error, `3`
internal error.

**Requirements:** Node ≥22.18 runs the TS source directly (`npm ci` in `cli/`
— one runtime dependency, `yaml`). Building the compiled binary
(`bun build --compile`) needs [Bun](https://bun.sh); the composite GitHub
Action installs its own dependencies and needs neither on the caller's runner.
