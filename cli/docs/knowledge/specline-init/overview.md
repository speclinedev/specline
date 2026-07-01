# specline init / sync — overview

`specline init` scaffolds a Specline repo, and `specline sync` keeps its generated
files current. They are the *writer* half of the CLI; doctor is the read-only
*checker*. The two never overlap — init/sync write, doctor validates.

## What init does

It creates the tier's directories, each with a generated `README.md` that explains
the folder in place, so the structure is self-documenting. It scaffolds three
authored starters — `architecture.md` and `conventions/doc-architecture.md` (the canon
+ tier pin doctor reads) — and, on request, a
`.github/workflows/specline.yml` that runs doctor on pull requests. A freshly
init'd repo passes doctor with zero findings.

## Generated vs. authored — the line that keeps it safe

A file is *generated* (regenerable, overwritten by `sync`) only if its first line
carries the `generated · canon …` header. Anything without that header is
*authored* and is never touched. So folder READMEs and the workflow regenerate on a
canon bump; your specs, knowledge docs, and the pin stay yours. This is why the
self-documenting READMEs are durable rather than a maintenance burden: they're a
projection of the canon, not hand-written copies that drift.

## sync

Regenerates the generated artifacts from the pinned canon and refreshes their
header — run it after adopting a new canon version. `--check` reports drift without
writing (for CI or a pre-commit hook); the authoritative drift gate is doctor.

## Interaction

`init` is interactive only for the optional GitHub Action prompt; `--github-action`
/ `--no-github-action` / `--yes` make it non-interactive for scripts and CI. Tier
selection scaffolds only the folders that tier uses, so a light repo stays light.
