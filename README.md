# yetirobotics.org

Website for **FRC Team 3506, YETI Robotics** — Charlotte, North Carolina.

Replaces the Wix site. Not live yet.

## Why this exists

On the old site, every change went through one person, because the site's
structured content — 14 robots across 15 seasons, ~40 sponsors in 7 tiers, 8
outreach programs — was stored as hand-arranged page layouts rather than as
data. Adding a sponsor meant duplicating a layout block, and nothing could be
diffed, reviewed, or reused.

Here, **content is data**. A robot is a record with a year, a game, awards and
photos. A sponsor is a record with a name, tier, logo and URL. The sponsor wall
renders itself from those records, and each fact is stored exactly once.

The second goal is that this survives annual student turnover. Whoever inherits
it will not read documentation, so the rules are enforced by schemas that fail
the build with a useful message rather than by prose nobody reads.

## Running it

Requires [Node](https://nodejs.org) 22+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm verify     # types, build, content audit, links, formatting
```

`pnpm verify` is the definition of "ready" and is exactly what CI runs.

Useful routes while developing:

- `/` and `/join` — real pages, built from `src/content/pages/*.yaml`
- `/robots`, `/sponsors` — built from the collections
- `/dev/blocks` — kitchen sink: every block type in empty, minimal and maximal
  states

## Layout

```
src/
├── content/        the site's actual content, one file per thing
│   ├── _templates/ copy these — every field, commented
│   ├── robots/     14 robots, ported from the Wix site
│   ├── sponsors/   placeholder data, not yet ported
│   ├── pages/      .yaml block lists — this is what a page IS
│   └── fixtures/   block states for the kitchen sink
├── data/           site-wide facts: nav, address, sponsor tiers
├── assets/         all photos and logos (never public/)
├── schemas/        zod schemas — the rules, in one place
├── components/
│   ├── blocks/     one per page-section type, plus the registry
│   ├── content/    record renderers: SponsorGrid, RobotCard, DownloadCard
│   └── ui/         Button, Prose, Picture, VideoEmbed
└── lib/            typed query helpers, markdown rendering

public/files/       downloadable PDFs — stable filenames, printed on posters
scripts/            gen-schema, audit-content, check-links
```

## Stack

Astro 7, static output, no adapter. pnpm. TypeScript strict. Plain CSS with
custom properties — no Tailwind, no framework. `satteri` for rendering markdown
strings from content fields. Target host is Cloudflare Workers Static Assets.

Visual design is deliberately minimal for now: semantic markup and a neutral
stylesheet, restyleable from `src/styles/tokens.css` without touching content.

## Contributing

- **Non-technical / no clone:** [CONTRIBUTING.md](CONTRIBUTING.md) — the
  GitHub-web-editor path. Adding a sponsor is one file plus one logo.
- **Developers and agents:** [AGENTS.md](AGENTS.md) — routing table, rules,
  and the Astro 7 gotchas that will bite you.
