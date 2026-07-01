# Migrating a repo from Specline 2.6 → 2.7 (slug-as-ID)

**Audience: the agent running the migration.** Follow these steps top-to-bottom.
Most of it is mechanical, but two steps (collision detection, prose references)
need judgment — they're flagged.

## What changed, in one paragraph

A spec's identity used to be a four-digit number (`docs/specs/0007-ranch-mgmt/`),
allocated through a shared `docs/specs/.id-counter`. **2.7 drops the number: the
slug — the folder name — is the identity.** `docs/specs/ranch-mgmt/`. References
cite the slug (`depends_on: ranch-mgmt`). There is no counter. Slugs are unique
across `specs/ ∪ knowledge/ ∪ archive/`, and a ratified slug is frozen — renaming a
merged spec that anything depends on dangles its inbound edges (`RELATION-DANGLING`).
The migration is therefore: **strip the
`NNNN-` prefix from every lifecycle folder and rewrite every reference to match.**

The transform is prefix-stripping, and it's information-preserving: `0007-ranch-mgmt`
already *contains* its slug (`ranch-mgmt`). The new name is just that remainder.

---

## Step 0 — Build the `id → slug` map, and STOP if slugs collide

Before renaming anything, enumerate every lifecycle folder and derive the map. For
each `NNNN-<slug>` under `docs/specs/`, `docs/knowledge/`, `docs/archive/`, and each
`NNNN-<slug>.md` under `docs/decisions/`:

```
0007-ranch-mgmt   → ranch-mgmt
0011-quote-flow   → quote-flow
```

**Collision check (needs judgment).** The old scheme allowed two features to share a
slug, kept distinct only by number — e.g. `0004-auth` and `0009-auth`. Under 2.7 the
slug must be unique. Group your map by the stripped slug. **If any slug appears
twice, you cannot proceed until you disambiguate it.** Pick the more specific names
(`auth-oauth`, `auth-sso`), and remember: whichever you rename, you must also rewrite
every edge that pointed at *its* old number in Step 2. Resolve every collision before
touching the filesystem.

```bash
# Surface potential slug collisions across all three lifecycle dirs:
find docs/specs docs/knowledge docs/archive -maxdepth 1 -type d \
  | sed -E 's#.*/[0-9]{4}-##' | sort | uniq -d
# Any output here is a collision you must resolve by hand first.
```

---

## Step 1 — Rewrite references BEFORE renaming folders

Edges live in `relations.md` files and point at IDs. Rewrite them using the map from
Step 0. This must happen while the old names still exist so you can verify each edge
resolves.

For every `relations.md` under `docs/`, in each edge line
(`depends_on:`, `part_of:`, `supersedes:`, `conflicts_with:`):

- `depends_on: 0007` **→** `depends_on: ranch-mgmt`
- `depends_on: 0007-ranch-mgmt` **→** `depends_on: ranch-mgmt` (drop the number if the
  full `NNNN-slug` form was used)
- Cross-repo: `repo:0007-ranch-mgmt` **→** `repo:ranch-mgmt`

`part_of: <slug>` uses the same map. `none` stays `none`.

**Prose references (needs judgment).** Spec bodies, ADRs, knowledge docs, and
`architecture.md` may cite specs inline as `spec 0007` or `0007-ranch-mgmt`. Grep for
them and rewrite to the slug:

```bash
grep -rnE '\b[0-9]{4}-[a-z0-9-]+|\bspec [0-9]{4}\b' docs/ --include=*.md
```

Rewrite each hit to the bare slug (`spec ranch-mgmt`). Don't blind-`sed` this — a
four-digit run could be a year or a figure; read each hit.

---

## Step 2 — Strip the `id:` frontmatter field

The numeric `id` field is retired. In every `spec.md` (in `specs/`, `knowledge/`,
`archive/`):

- **Delete** the `id: 0007` line.
- **Ensure** `slug:` is present and equals the folder's slug (the stripped name). If a
  spec had no `slug:` field, add it.

The folder name is now authoritative; `slug:` must match it or `check` errors with a
slug/directory mismatch.

---

## Step 3 — Rename the folders (drop the `NNNN-` prefix)

Now rename on disk. Use `git mv` so history follows. Order doesn't matter between
dirs; do all four:

```bash
# specs/, knowledge/, archive/ folders:
for d in docs/specs docs/knowledge docs/archive; do
  for f in "$d"/[0-9][0-9][0-9][0-9]-*; do
    [ -d "$f" ] || continue
    new="$d/$(basename "$f" | sed -E 's/^[0-9]{4}-//')"
    git mv "$f" "$new"
  done
done

# decisions/ ADR files (NNNN-slug.md → slug.md):
for f in docs/decisions/[0-9][0-9][0-9][0-9]-*.md; do
  [ -e "$f" ] || continue
  git mv "$f" "docs/decisions/$(basename "$f" | sed -E 's/^[0-9]{4}-//')"
done
```

> **`archive/` note.** Archive is normally read-only (`ARCHIVE-EDITED`). This one-time
> structural rename is a canon migration, not a content edit — the `spec.md` inside is
> unchanged. Do it in the migration commit and don't touch archived *content*.

---

## Step 4 — Delete the counter

```bash
git rm docs/specs/.id-counter
```

There is no counter in 2.7. Also delete any `.id-counter` mention from
`docs/*/README.md` boilerplate if your repo carries it.

---

## Step 5 — Bump the canon pin

```bash
specline upgrade    # bumps specline.yml `canon:` and doc-architecture.md to 2.7
```

Or by hand: set `canon: 2.7` in `specline.yml` and the `| **Canon** |` row in
`docs/architecture.md` / `doc-architecture.md`. (Pins track MAJOR.MINOR, so `2.7` is
correct — not `2.7.0`.)

---

## Step 6 — Regenerate and verify

```bash
specline check --fix    # regenerates relations-index.yml with slug-keyed reverse edges
specline check          # must be clean
```

Expect **zero** of: `SLUG-DUPLICATE` (a collision you missed in Step 0), a slug/
directory mismatch (a frontmatter `slug:` that doesn't match its folder — Step 2), or
a dangling relation edge (a reference you didn't rewrite — Step 1). If any fire, they
point straight back at the step that owns them.

---

## Before / after (one spec)

```
BEFORE                                  AFTER
docs/specs/.id-counter                  (deleted)
docs/specs/0007-ranch-mgmt/             docs/specs/ranch-mgmt/
  spec.md                                 spec.md
    id: 0007                                (id line removed)
    slug: ranch-mgmt                        slug: ranch-mgmt
  relations.md                            relations.md
    depends_on: 0011                        depends_on: quote-flow
```

## In-flight branches during the migration

If specs are open on other branches while you migrate main, each rebases onto the new
scheme the same way: strip prefixes, rewrite edges. If two branches independently
create the same slug, that's now a **git add/add conflict on
`docs/specs/<slug>/spec.md`** at merge — resolve it by re-slugging the later merger
(nothing references an unratified slug yet). That visible conflict is the intended
2.7 behavior; it replaces the old scheme's silent duplicate-number merge.
