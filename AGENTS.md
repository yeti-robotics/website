# AGENTS.md

Routing table for this repo. Read the section you need; don't read the whole file.

**yetirobotics.org** — FRC Team 3506, Charlotte NC. Astro 7, static output, pnpm,
Tailwind v4 with shadcn-convention design tokens. Deployed to Cloudflare Workers
Static Assets (not live yet).

## Where things live

| You want to change                 | Edit                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| A sponsor                          | `src/content/sponsors/<name>.md` + logo in `src/assets/sponsors/`             |
| A robot                            | `src/content/robots/<year>-<name>.md` + photos in `src/assets/robots/<year>/` |
| An outreach program                | `src/content/programs/<name>.md`                                              |
| A news post                        | `src/content/posts/<yyyy-mm>-<slug>.md`                                       |
| A date, meeting, open house        | `src/content/events/<year>-<name>.md`                                         |
| A downloadable PDF                 | file in `public/files/` + record in `src/content/downloads/`                  |
| What's on a page, or its order     | `src/content/pages/<slug>.yaml`                                               |
| Nav, address, socials, PayPal link | `src/data/site.yaml`                                                          |
| Sponsor tier order and logo sizes  | `src/data/sponsor-tiers.yaml`                                                 |
| What fields a content type has     | `src/schemas/collections.ts`                                                  |
| What sections a page can have      | `src/schemas/blocks.ts` + `src/components/blocks/`                            |
| Colours, fonts, spacing            | `src/styles/globals.css`                                                      |

## The four routine tasks

Slash commands exist for all four in `.claude/commands/`.

1. **Add a sponsor** — copy `src/content/_templates/sponsor.md` into
   `src/content/sponsors/`, put the logo in `src/assets/sponsors/`. That's it.
   The sponsor wall builds itself.
2. **Add a robot** — copy `src/content/_templates/robot.md` into
   `src/content/robots/`, photos into `src/assets/robots/<year>/`.
3. **Add a download** — put the PDF in `public/files/` **first**, then copy
   `src/content/_templates/download.md`.
4. **Write a post** — copy `src/content/_templates/post.md`.

Then run `pnpm verify`.

## Commands

```
pnpm dev       # local server; drafts are visible
pnpm verify    # the gate — run before every commit. CI runs exactly this.
pnpm build     # generates .schemas/page.json, then builds
```

`pnpm verify` runs, in order: `astro check` (types) → `astro build` (schemas,
images, references, block union) → `audit-content.mjs` (cross-file checks) →
`check-links.mjs` (internal links resolve) → `prettier --check`.

Every failure names the file and says how to fix it. If one doesn't, that's a
bug in the error message — fix the schema, not just the content.

`/dev/blocks` is the kitchen sink: every block type in empty, minimal and
maximal states, rendered from `src/content/fixtures/`. Check it after changing
a block component.

## Rules

**Never put photos in `public/`.** They live in `src/assets/`. Files in
`public/` are copied verbatim and skip image optimisation entirely — a 6 MB
JPEG stays a 6 MB JPEG. `src/assets/` gets AVIF/WebP at build time.

**`public/files/` is the exception, and only for downloads.** Those filenames go
on printed posters and in Instagram bios, so they must never change. To update a
PDF, replace the file at the same name and bump `updated:` in its record.

**Never hardcode a date, a sponsor name, or a robot name in a component.** If a
component mentions a specific thing, that thing belongs in a content file. This
is the rule the whole repo exists to enforce — the old Wix site bottlenecked on
one person because facts lived inside page layouts.

**Copy a template. Don't invent frontmatter.** Every collection has one in
`src/content/_templates/`, with every field and what it means. Schemas use
`z.strictObject()`, so an invented field name fails the build rather than being
silently dropped.

**Prefer duplication over abstraction.** Two similar components beat one
component with nine props. A section that appears on exactly one page is a
`richText` or a `custom` block, not a new block type.

**Style options in content are enums, never free strings.** No `class:` fields
in any schema. This is a rule about the _content model_, not about components:
a YAML page file must never be able to carry a made-up utility class. Tailwind
lives strictly inside `.astro` markup, where the compiler and the class scanner
can both see it, and does not touch that boundary.

## Content model

Three kinds of content, kept distinct so a form-based admin UI stays possible:

- **Records** (`robots`, `sponsors`, `programs`, `posts`, `events`, `downloads`)
  — `.md`, flat frontmatter, optional prose body. **No components in bodies.**
  A flat record maps onto a form; a file full of JSX does not.
- **Pages** (`pages`) — `.yaml` with an ordered `sections` array. Standalone
  YAML rather than markdown frontmatter because the YAML language server gives
  real editor autocomplete from `.schemas/page.json`, and does not work inside
  frontmatter.
- **Documents** — `.mdx`, for the rare page needing a component mid-paragraph.
  Currently zero of these. Don't reach for MDX by default.

### Adding a block type

Rare, and deliberately a code change. Three edits, in order:

1. A branch in `src/schemas/blocks.ts` (`z.strictObject()`, not `z.object()`)
2. A component in `src/components/blocks/`, typed `BlockProps<'yourType'>`
3. An entry in `src/components/blocks/registry.ts`

Skip step 3 and it's a **compile error**, not a blank space on the page.

Two failure modes to avoid. _Knob explosion_: blocks accumulating `padding`,
`bgColor`, `align` until the schema is an untyped CSS API. _Block-type
explosion_: a section used on one page isn't a block type.

## Gotchas

- `import { z } from 'astro/zod'` — Astro 7 ships zod 4, and `astro:content`
  no longer exports `z`.
- Collections config is `src/content.config.ts`, not `src/content/config.ts`.
- Files inside `src/schemas/` import each other **with the `.ts` extension**, so
  `scripts/gen-schema.mjs` can import them from plain Node.
- Astro 7's compiler doesn't auto-correct HTML. An unclosed tag is a hard error.
- `compressHTML` defaults to `'jsx'` and collapses whitespace between inline
  elements — watch for missing spaces around `<a>` and `<strong>`.
- `client:*` directives don't work on a component rendered from a variable. If a
  block needs hydration, put it inside that block's own component.
- `sharp` is a **direct** dependency. pnpm's strict linking means Astro's
  bundled copy may not resolve, and image optimisation silently depends on it.
- `astro check` needs TypeScript 6.x. TypeScript 7's native compiler dropped the
  API it uses, so `typescript` is pinned to `6.0.3`.
- Tailwind v4 is wired as a Vite plugin (`@tailwindcss/vite`), not an Astro
  integration. `@astrojs/tailwind` is the deprecated v3 package.
- `globals.css` deliberately omits shadcn's `@custom-variant dark`. That line
  makes `dark:` class-based; this site has no toggle, so it must stay
  media-query based. Don't add it back.
- Never build a class name by interpolation (`` `grid-cols-${n}` ``). Tailwind
  scans source text, so a constructed class is never generated. Branch in
  `class:list` with the full names written out.
- Prettier sorts Tailwind classes via `prettier-plugin-tailwindcss`, which must
  stay LAST in `.prettierrc`'s plugins array or it silently does nothing.

## Known gaps

- **No photo of the 2022 robot Aurora.** Every other robot's photo was ported
  from the Wix site; that site had none of Aurora. `2022-aurora.md` uses a
  placeholder and says so in a comment.
- **No sponsor has a real `since` year.** All 33 were scraped from the old Wix
  sponsors page, which listed no start years, so every record says `since: 2024`
  — the last season we know they were on the wall, not their first. Each file
  says so in a comment. Fix them as someone confirms the real years.
- **No sponsor has a blurb.** The Wix page was logos only, so `pnpm verify`
  emits 33 "active sponsor with no blurb" warnings. They are warnings, not
  failures, and they go away one blurb at a time.
- **Mr. John Stoffel is missing.** He was listed as a Platinum sponsor on the
  Wix page as plain text, with no logo and no URL — both of which the schema
  requires. Adding him needs a decision about individual (non-company) sponsors.
- **`public/_redirects` is empty.** It must be filled in before going live, or
  every old Wix URL breaks.
- Robots have no per-robot detail pages yet — `/robots` is the whole list.
- Only two real pages exist (`home.yaml`, `join.yaml`). About, Outreach,
  Contact and the blog index are not built.
