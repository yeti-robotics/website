# Tailwind + shadcn token convention

Design doc. Written 2026-08-14, against `e224f3e`.

## Problem

The site styles itself with a hand-rolled token file (`src/styles/tokens.css`)
plus ~950 lines of per-component scoped CSS across 19 `.astro` files. That was a
deliberate early choice, and it has held up — but it means every new component
re-derives the same flex/grid/spacing declarations by hand, and there is no
shared vocabulary for the things a design system usually names (`muted`,
`border`, `ring`, `card`).

We want Tailwind, and we want the token layer to follow shadcn's `globals.css`
convention so that shadcn snippets and any future component work drop in without
translation.

## Decisions

Three decisions were made up front and constrain everything below.

1. **Full shadcn token set, including dark.** Not a minimal subset. The complete
   semantic palette is defined — `background`, `foreground`, `card`, `popover`,
   `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`,
   `ring`, `chart-1..5`, `sidebar-*` — even where this site does not yet use a
   slot, so that a pasted snippet resolves rather than silently rendering
   unstyled.
2. **Dark activates by system preference only.** No toggle, no `localStorage`, no
   inline `<head>` script. The site ships zero client JS today and this change
   does not alter that.
3. **Every component migrates.** All 19 files with `<style>` blocks, with three
   named exceptions (§6).

## 1. Install and wiring

```
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D prettier-plugin-tailwindcss
```

`astro.config.mjs` gains:

<!-- prettier-ignore -->
```js
import tailwindcss from '@tailwindcss/vite';
// ...
vite: {
  plugins: [tailwindcss()],
}
```

Not `@astrojs/tailwind` — that package is the Tailwind v3 integration and is
deprecated. Tailwind v4 is a Vite plugin.

`.prettierrc` gains `prettier-plugin-tailwindcss` as the **last** entry in
`plugins` (the plugin requires last position to function). This is load-bearing,
not cosmetic: `pnpm verify` terminates in `prettier --check .`, so without the
plugin the first hand-authored class list whose order differs from canonical
fails CI. With it, class ordering is normalised on format and never argued about.

## 2. The stylesheet

`src/styles/tokens.css` and `src/styles/global.css` are both deleted and replaced
by a single `src/styles/globals.css`. `BaseLayout.astro` imports it.

Structure, in this order, matching shadcn:

```
@import 'tailwindcss';

:root { /* light palette + --radius */ }

@media (prefers-color-scheme: dark) {
  :root { /* dark palette */ }
}

.dark { /* dark palette, same values */ }

@theme inline { /* --color-*: var(--*) bridges, fonts, container widths */ }

@layer base { /* resets, body, headings, skip-link */ }
```

### Why shadcn's `@custom-variant dark` is omitted

shadcn's stock `globals.css` includes:

```css
@custom-variant dark (&:is(.dark *));
```

That line **rebinds Tailwind's `dark:` variant from media-query to class-based.**
Given decision 2, including it would break every `dark:` utility on the site,
because nothing would ever add the `.dark` class. Tailwind v4's default `dark:`
variant is already `prefers-color-scheme: dark`, so omitting this line is
precisely what makes system-preference dark mode work with no JS.

This is the one intentional divergence from the shadcn file. It is commented in
place so nobody "fixes" it back.

### Why the dark palette is written twice

The dark values appear in both the `@media (prefers-color-scheme: dark)` block
and the `.dark` block — roughly 25 duplicated lines.

The alternative considered was CSS `light-dark()`, which needs one copy:

```css
:root {
  color-scheme: light dark;
  --background: light-dark(oklch(1 0 0), oklch(0.19 0.02 250));
}
```

Rejected. It works, and it is genuinely tidier, but it means a pasted shadcn
snippet of the form `.dark { --something: … }` behaves inconsistently with the
tokens around it — some switching via `color-scheme`, some via class. For a site
maintained by rotating high-school students, a predictable shape that matches the
upstream docs beats 25 saved lines.

The `.dark` block is dead code today. It exists so that adding a toggle later is
a change to one file, not a re-theming.

## 3. Token mapping

| Today                                | Becomes                                              | Note                                        |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------------------- |
| `--color-bg`                         | `--background`                                       |                                             |
| `--color-text`                       | `--foreground`                                       |                                             |
| `--color-bg-subtle` `#eaf6fb`        | `--muted`, `--accent`                                |                                             |
| `--color-text-muted`                 | `--muted-foreground`                                 |                                             |
| `--color-accent` `#54b6e5`           | `--primary`                                          | YETI blue                                   |
| `--color-accent-text` `#10232c`      | `--primary-foreground`                               |                                             |
| `--color-border` `#d9dee2`           | `--border`, `--input`                                |                                             |
| `--color-accent-strong` `#2589b8`    | `--ring`, **`--primary-strong`**                     | extension, see below                        |
| `#ffd044` (donate button, hardcoded) | `--secondary`                                        | it is the second brand colour               |
| `--color-bg-translucent`             | **deleted**                                          | becomes `bg-background/72 backdrop-blur-md` |
| `--color-bg-inverse`                 | **deleted**                                          | value is identical to `--foreground`        |
| `--radius: 6px`                      | `--radius: 0.375rem` + shadcn sm/md/lg/xl calc chain | same computed value                         |

Colours are expressed in `oklch`, per shadcn convention.

### Deliberate non-shadcn additions

Two, both because the site uses them in six or more places and shadcn has no
corresponding slot:

- `--primary-strong` — the darker blue used for emphasis text and link hover.
  shadcn has no "primary but darker" concept; `--ring` carries the same value but
  means something else, and overloading it would be a lie.
- `--font-sans` / `--font-mono` — bridged into `@theme` from the Astro font
  variables so `font-sans` works as a utility.

Both are commented as extensions so they are not mistaken for upstream.

### Scales that are dropped entirely

`--space-1..7` are deleted in favour of Tailwind's spacing scale. Every value
already lands on it exactly — `0.25/0.5/1/1.5/2/3/5rem` are `1/2/4/6/8/12/20` —
so this is a rename, not a re-spacing.

The **type scale does not map cleanly** and is handled differently. Three of six
sizes match Tailwind (`--text-sm`, `--text-base`, `--text-lg`); the rest do not:

| Token        | Value                         | Tailwind                                |
| ------------ | ----------------------------- | --------------------------------------- |
| `--text-xl`  | `1.5rem`                      | `text-2xl` — matches, but renamed       |
| `--text-2xl` | `2rem`                        | no equivalent; `text-3xl` is `1.875rem` |
| `--text-3xl` | `clamp(2.25rem, 5vw, 3.5rem)` | no equivalent                           |

So the type scale is **redefined in `@theme`** under its existing names rather
than deleted, preserving the exact values. This costs six lines and keeps the
"light theme is pixel-identical" guarantee in §8 honest.

Related hazard: Tailwind's `text-*` utilities set `line-height` as well as
`font-size`, whereas the current `--text-*` tokens set size only and inherit
`line-height: 1.6` from `body`. Declaring them in `@theme` as bare font sizes
preserves current behaviour; using Tailwind's stock `text-lg` etc. would not.
This is the single most likely source of silent visual drift in the migration.

`--width-narrow/default/wide` move into `@theme` as container sizes, so
`max-w-narrow` resolves. The responsive `--gutter` — which is non-monotonic,
widening at 48rem and tightening again at 64rem — is expressed directly as
`px-4 md:px-8 lg:px-6`.

## 4. Dark mode: the parts that are real design work

Token swapping handles most of the site. Four things do not fall out for free.

### Sponsor logos (the hard one)

All 33 sponsor logos are PNGs with **baked-in white backgrounds**. On a dark
page they render as glowing white rectangles. This affects `SponsorGrid` and
`SponsorMarquee`.

Treatment: in dark, each logo cell gets an explicit white plate —
`dark:bg-white dark:rounded-md dark:p-2`.

This intentionally contradicts the existing comment in `SponsorMarquee`
explaining that cells carry no padding because every logo file ships with a 4%
transparent border. That comment becomes wrong the moment the plate exists, so it
is rewritten to explain both cases rather than left standing.

### Marquee edge fades

`SponsorMarquee`'s `::before`/`::after` gradients hardcode `var(--color-bg)`.
Repointing to `var(--background)` makes them follow the theme automatically. The
existing comment noting that the fades assume the section sits on the page
background stays true and stays put.

### Footer

`BaseLayout` hardcodes `background: #fff` on `.site-footer` and `#edf1f3`
throughout the skyline gradient stack. Both move to tokens.

### RobotCard hover shadow

`box-shadow: 0 12px 30px rgb(31 41 51 / 12%)` is invisible against a dark
background. Gets a `dark:` variant.

## 5. Two bugs found while reading

Both are the same typo — a space between the selector and its pseudo-class,
which makes the whole rule invalid and silently dead:

- `src/components/ui/Button.astro:47` — `.button: active`. The press-down
  `translateY(2px)` has never applied.
- `src/components/content/RobotCard.astro:107` — `.card-link: focus-visible`.
  **Robot cards have no visible keyboard focus ring today.** This is an
  accessibility bug, not a cosmetic one.

The migration fixes both by construction. They are called out in the commit
message rather than buried inside a 950-line diff, because "cards suddenly have a
focus ring" is otherwise an unexplained visual change during review.

## 6. What stays as hand-written CSS

Three `<style>` blocks survive. Each keeps a comment stating why, so the mixed
convention reads as a decision rather than an unfinished migration.

1. **`BaseLayout` `.footer-skyline`** — an 8-layer `linear-gradient` stack with
   per-layer position and size, plus a mask. Expressible as an arbitrary value
   only by embedding the entire declaration in a class name.
2. **`SponsorMarquee` `@keyframes scroll`** and the cycle arithmetic — the
   component computes pixel geometry in its frontmatter and passes it inline as
   custom properties, which the keyframe reads back. The layout and the animation
   must come from the same numbers; utilities cannot express that coupling.
3. **`Prose`** — styles rendered markdown through `:global()` descendant
   selectors. There is no markup to attach utilities to.

Note: `Prose` uses the class name `.prose`, which collides with
`@tailwindcss/typography` should that ever be installed. Astro's scoping means
there is no bug today. A comment records the hazard; the class is not renamed.

## 7. Documentation changes

Two pieces of prose become false and must be rewritten, not left to rot:

- `global.css`'s header comment: _"There is no utility-class system on purpose —
  a free-string `class:` field is exactly the kind of thing an agent invents
  plausible nonsense for."_
- `CLAUDE.md`'s "Colours, fonts, spacing → `src/styles/tokens.css`" routing row.

**The enum rule stays, and gets sharpened.** CLAUDE.md's _"Style options are
enums, never free strings. No `class:` fields"_ was always a rule about the
**content schema** — it exists so that a YAML page file cannot carry a made-up
utility class. Tailwind lives strictly inside `.astro` markup and does not touch
that boundary. The rewritten rule says so explicitly, because the two statements
look contradictory at a glance and the distinction is the whole point.

## 8. Verification

- `pnpm verify` green — `astro check`, build, content audit, link check, prettier.
- `/dev/blocks` compared against a pre-migration screenshot for every block type
  in its empty, minimal and maximal state.
- The same sweep again with `prefers-color-scheme: dark` emulated.

There are no tests behind this code. Given a ~950-line diff with no test
coverage, visual comparison happens **per file as each is migrated**, not once at
the end — a regression found after 19 files is a bisect, and a regression found
after one file is a typo.

## Out of scope

- A dark-mode toggle, and any client JS to drive it.
- shadcn/ui components proper. They are React; this site has no framework
  integration installed. Only the CSS convention is adopted.
- `@tailwindcss/typography`. `Prose` stays hand-written.
- Any visual redesign. The light theme should be pixel-identical before and
  after, excepting the two bug fixes in §5.
