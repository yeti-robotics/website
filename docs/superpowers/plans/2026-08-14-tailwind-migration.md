# Tailwind + shadcn Token Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Tailwind v4, replace the hand-rolled token file with a shadcn-convention `globals.css`, and convert all 19 components off scoped CSS — with the light theme pixel-identical at the end.

**Architecture:** Tailwind v4 via `@tailwindcss/vite`. A single `src/styles/globals.css` holds the shadcn semantic palette in `oklch`, bridged to Tailwind through `@theme inline`. Dark activates on `prefers-color-scheme` only. Migration is incremental: Task 1 installs a **compatibility shim** aliasing every old `--color-*` name to its new token, so components keep working untouched; each later task converts a slice; the final task deletes the shim, which turns any missed reference into a visibly broken style rather than a silent one.

**Tech Stack:** Astro 7 (static), Tailwind CSS v4, pnpm, prettier + prettier-plugin-tailwindcss. No React, no framework integration, no client JS.

**Spec:** `docs/superpowers/specs/2026-08-14-tailwind-migration-design.md`

## Global Constraints

- **No client JS is added.** The site ships zero JS today except `VideoEmbed`'s click handler. Dark mode is `prefers-color-scheme` only — no toggle, no `localStorage`, no inline `<head>` script.
- **Do NOT add `@custom-variant dark (&:is(.dark *));`.** It rebinds `dark:` to class-based and would break every dark utility. Tailwind v4's default `dark:` is already media-query based.
- **Light theme must be pixel-identical** before and after, except the three bug fixes named in Tasks 2, 4 and 5.
- **Content files never carry class strings.** Tailwind lives only inside `.astro` markup. The enum rule in CLAUDE.md still holds.
- `pnpm verify` must pass at the end of every task. It runs: `astro check` → `pnpm build` → `audit-content.mjs` → `check-links.mjs` → `prettier --check .`
- **`prettier-plugin-tailwindcss` must be LAST** in `.prettierrc`'s `plugins` array. It does not function otherwise.
- Colours are `oklch`. Every token carries its source hex in a trailing comment.
- Astro 7's compiler does not auto-correct HTML. An unclosed tag is a hard error.
- Never use `@astrojs/tailwind` — that is the deprecated v3 integration.

---

### Task 1: Install Tailwind and build the token layer

**Files:**

- Create: `src/styles/globals.css`
- Delete: `src/styles/tokens.css`, `src/styles/global.css`
- Modify: `astro.config.mjs` (add vite plugin)
- Modify: `.prettierrc` (add plugin, last)
- Modify: `src/layouts/BaseLayout.astro:11` (change the import path)
- Modify: `package.json` (deps)

**Interfaces:**

- Produces: the full shadcn token set on `:root`; Tailwind theme keys `--color-background`, `--color-foreground`, `--color-card`, `--color-popover`, `--color-primary`, `--color-primary-strong`, `--color-secondary`, `--color-muted`, `--color-accent`, `--color-destructive`, `--color-border`, `--color-input`, `--color-ring`, each with a `-foreground` counterpart where shadcn defines one; container sizes `--container-narrow|default|wide`; font sizes `--text-xl|2xl|3xl` redefined at this site's values.
- Produces: a compatibility shim block aliasing `--color-bg`, `--color-bg-subtle`, `--color-bg-translucent`, `--color-bg-inverse`, `--color-text`, `--color-text-muted`, `--color-text-inverse`, `--color-accent`, `--color-accent-strong`, `--color-accent-text`, `--color-border`, `--border`, `--radius`, `--space-1..7`, `--text-sm..3xl`, `--width-narrow|default|wide`, `--gutter`, `--font-sans`, `--font-mono`. Tasks 2–9 rely on this. Task 10 deletes it.

**⚠ The single biggest hazard in this task:** `@import 'tailwindcss'` pulls in **Preflight**, a full reset. It sets `ul, ol { list-style: none; margin: 0; padding: 0 }` and makes headings inherit `font-size` and `font-weight`. Without the `@layer base` restoration below, `JoinChecklist`'s numbered `<ol>` loses its numbers and every markdown list in `Prose` loses its bullets. Step 4 exists specifically to catch this.

- [ ] **Step 1: Install**

```bash
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D prettier-plugin-tailwindcss
```

- [ ] **Step 2: Wire the Vite plugin**

In `astro.config.mjs`, add the import at the top with the others:

```js
import tailwindcss from '@tailwindcss/vite';
```

and add this key to the `defineConfig({...})` object, as a sibling of `integrations`:

```js
  // Tailwind v4 is a Vite plugin, not an Astro integration. @astrojs/tailwind
  // is the v3 integration and is deprecated — do not reach for it.
  vite: {
    plugins: [tailwindcss()],
  },
```

- [ ] **Step 3: Write `src/styles/globals.css`**

Create the file with exactly this content:

```css
/*
 * Design tokens and base styles, following shadcn/ui's globals.css convention.
 *
 * Two deliberate divergences from the upstream shadcn file, both load-bearing:
 *
 * 1. There is NO `@custom-variant dark (&:is(.dark *))`. That line rebinds
 *    Tailwind's `dark:` variant to class-based. This site has no theme toggle
 *    and ships no client JS, so nothing would ever set `.dark` and every dark
 *    utility would be dead. Tailwind v4's default `dark:` is already
 *    prefers-color-scheme, which is exactly what we want. Do not add it back.
 *
 * 2. The dark palette is written twice — once under the media query, once
 *    under `.dark`. The duplication is on purpose. `light-dark()` would need
 *    one copy, but then a pasted shadcn snippet using `.dark { --x: … }` would
 *    switch by a different mechanism than the tokens around it. `.dark` is
 *    dead code today; it is what a future toggle turns on.
 */
@import 'tailwindcss';

:root {
  --radius: 0.375rem; /* 6px, matching the pre-Tailwind --radius */

  --background: oklch(1 0 0); /* #ffffff */
  --foreground: oklch(0.279 0.024 253); /* #1f2933 */

  --card: oklch(1 0 0); /* #ffffff */
  --card-foreground: oklch(0.279 0.024 253); /* #1f2933 */

  --popover: oklch(1 0 0); /* #ffffff */
  --popover-foreground: oklch(0.279 0.024 253); /* #1f2933 */

  /* YETI blue. */
  --primary: oklch(0.729 0.109 231); /* #54b6e5 */
  --primary-foreground: oklch(0.222 0.023 233); /* #10232c */

  /*
   * NOT a shadcn token. The darker blue used for emphasis text and link hover.
   * shadcn has no "primary but darker" slot; --ring happens to carry the same
   * value but means something else, and overloading it would be a lie.
   */
  --primary-strong: oklch(0.591 0.098 233); /* #2589b8 */

  /* The donate-button gold. It is genuinely this site's second brand colour. */
  --secondary: oklch(0.868 0.157 88); /* #ffd044 */
  --secondary-foreground: oklch(0.218 0.014 250); /* #101820 */

  --muted: oklch(0.966 0.014 220); /* #eaf6fb */
  --muted-foreground: oklch(0.487 0.023 240); /* #52616b */

  --accent: oklch(0.966 0.014 220); /* #eaf6fb */
  --accent-foreground: oklch(0.279 0.024 253); /* #1f2933 */

  --destructive: oklch(0.577 0.245 27.3);
  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.887 0.006 240); /* #d9dee2 */
  --input: oklch(0.887 0.006 240); /* #d9dee2 */
  --ring: oklch(0.591 0.098 233); /* #2589b8 */

  /* The footer skyline's silhouette fill. */
  --skyline: oklch(0.949 0.004 230); /* #edf1f3 */

  --chart-1: oklch(0.729 0.109 231);
  --chart-2: oklch(0.591 0.098 233);
  --chart-3: oklch(0.868 0.157 88);
  --chart-4: oklch(0.487 0.023 240);
  --chart-5: oklch(0.279 0.024 253);

  --sidebar: oklch(1 0 0);
  --sidebar-foreground: oklch(0.279 0.024 253);
  --sidebar-primary: oklch(0.729 0.109 231);
  --sidebar-primary-foreground: oklch(0.222 0.023 233);
  --sidebar-accent: oklch(0.966 0.014 220);
  --sidebar-accent-foreground: oklch(0.279 0.024 253);
  --sidebar-border: oklch(0.887 0.006 240);
  --sidebar-ring: oklch(0.591 0.098 233);
}

/* Dark palette — values duplicated below under `.dark`. Keep the two in sync. */
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.208 0.021 253);
    --foreground: oklch(0.968 0.003 250);

    --card: oklch(0.258 0.022 253);
    --card-foreground: oklch(0.968 0.003 250);

    --popover: oklch(0.258 0.022 253);
    --popover-foreground: oklch(0.968 0.003 250);

    --primary: oklch(0.729 0.109 231);
    --primary-foreground: oklch(0.182 0.021 233);

    --primary-strong: oklch(0.812 0.093 227);

    --secondary: oklch(0.868 0.157 88);
    --secondary-foreground: oklch(0.218 0.014 250);

    --muted: oklch(0.288 0.023 250);
    --muted-foreground: oklch(0.724 0.021 245);

    --accent: oklch(0.288 0.023 250);
    --accent-foreground: oklch(0.968 0.003 250);

    --destructive: oklch(0.704 0.191 22.2);
    --destructive-foreground: oklch(0.982 0.008 20);

    --border: oklch(0.334 0.021 250);
    --input: oklch(0.334 0.021 250);
    --ring: oklch(0.729 0.109 231);

    --skyline: oklch(0.288 0.023 250);

    --sidebar: oklch(0.258 0.022 253);
    --sidebar-foreground: oklch(0.968 0.003 250);
    --sidebar-primary: oklch(0.729 0.109 231);
    --sidebar-primary-foreground: oklch(0.182 0.021 233);
    --sidebar-accent: oklch(0.288 0.023 250);
    --sidebar-accent-foreground: oklch(0.968 0.003 250);
    --sidebar-border: oklch(0.334 0.021 250);
    --sidebar-ring: oklch(0.729 0.109 231);
  }
}

/* Nothing sets this class today. It exists so adding a toggle later is a
   one-file change rather than a re-theming. Keep in sync with the block above. */
.dark {
  --background: oklch(0.208 0.021 253);
  --foreground: oklch(0.968 0.003 250);
  --card: oklch(0.258 0.022 253);
  --card-foreground: oklch(0.968 0.003 250);
  --popover: oklch(0.258 0.022 253);
  --popover-foreground: oklch(0.968 0.003 250);
  --primary: oklch(0.729 0.109 231);
  --primary-foreground: oklch(0.182 0.021 233);
  --primary-strong: oklch(0.812 0.093 227);
  --secondary: oklch(0.868 0.157 88);
  --secondary-foreground: oklch(0.218 0.014 250);
  --muted: oklch(0.288 0.023 250);
  --muted-foreground: oklch(0.724 0.021 245);
  --accent: oklch(0.288 0.023 250);
  --accent-foreground: oklch(0.968 0.003 250);
  --destructive: oklch(0.704 0.191 22.2);
  --destructive-foreground: oklch(0.982 0.008 20);
  --border: oklch(0.334 0.021 250);
  --input: oklch(0.334 0.021 250);
  --ring: oklch(0.729 0.109 231);
  --skyline: oklch(0.288 0.023 250);
  --sidebar: oklch(0.258 0.022 253);
  --sidebar-foreground: oklch(0.968 0.003 250);
  --sidebar-primary: oklch(0.729 0.109 231);
  --sidebar-primary-foreground: oklch(0.182 0.021 233);
  --sidebar-accent: oklch(0.288 0.023 250);
  --sidebar-accent-foreground: oklch(0.968 0.003 250);
  --sidebar-border: oklch(0.334 0.021 250);
  --sidebar-ring: oklch(0.729 0.109 231);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-strong: var(--primary-strong);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-skyline: var(--skyline);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Astro's font integration writes these; see astro.config.mjs. */
  --font-sans:
    var(--font-libre-franklin), system-ui, -apple-system, 'Segoe UI', Roboto,
    sans-serif;
  --font-mono:
    var(--font-space-grotesk), ui-monospace, SFMono-Regular, Menlo, monospace;

  /*
   * The type scale is REDEFINED here rather than dropped for Tailwind's.
   * Three sizes do not exist upstream: 2rem sits between text-3xl (1.875rem)
   * and text-4xl, and the clamp has no equivalent at all.
   *
   * Every size is paired with `--text-*--line-height: inherit`, which is
   * load-bearing. Tailwind's text-* utilities normally set line-height as well
   * as font-size, and overriding the size alone does NOT clear the default
   * companion — `text-sm` would still force 1.25rem where this site has always
   * inherited body's 1.6 (= 1.4rem). Setting the companions to `inherit` makes
   * every text-* utility size-only, so body's 1.6 flows through exactly as it
   * did before Tailwind. Removing these lines silently reflows the whole site.
   */
  --text-sm: 0.875rem;
  --text-sm--line-height: inherit;
  --text-base: 1rem;
  --text-base--line-height: inherit;
  --text-lg: 1.125rem;
  --text-lg--line-height: inherit;
  --text-xl: 1.5rem;
  --text-xl--line-height: inherit;
  --text-2xl: 2rem;
  --text-2xl--line-height: inherit;
  --text-3xl: clamp(2.25rem, 5vw, 3.5rem);
  --text-3xl--line-height: inherit;

  --container-narrow: 42rem;
  --container-default: 60rem;
  --container-wide: 90rem;
}

/*
 * COMPATIBILITY SHIM — deleted in the final task of the migration.
 *
 * Maps the old hand-rolled token names onto the new ones so components can be
 * converted one at a time instead of all at once. When this block goes, any
 * surviving old reference breaks visibly, which is the point.
 */
:root {
  --color-bg: var(--background);
  --color-bg-subtle: var(--muted);
  --color-bg-translucent: color-mix(
    in oklab,
    var(--background) 72%,
    transparent
  );
  --color-bg-inverse: var(--foreground);
  --color-text: var(--foreground);
  --color-text-muted: var(--muted-foreground);
  --color-text-inverse: var(--background);
  --color-accent: var(--primary);
  --color-accent-strong: var(--primary-strong);
  --color-accent-text: var(--primary-foreground);
  --color-border: var(--border);
  --border: 1px solid var(--border);
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --space-6: 3rem;
  --space-7: 5rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --width-narrow: 42rem;
  --width-default: 60rem;
  --width-wide: 90rem;
  --gutter: 1rem;
}

@media (min-width: 48rem) {
  :root {
    --gutter: 2rem;
  }
}

@media (min-width: 64rem) {
  :root {
    --gutter: 1.5rem;
  }
}

/*
 * Part of the shim: the old layout primitives, kept alive so that the 17 call
 * sites still using `class="container" data-width="…"` keep working until the
 * task that converts them. Deleted together with the block above.
 */
.container {
  width: 100%;
  max-width: var(--width-default);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
.container[data-width='narrow'] {
  max-width: var(--width-narrow);
}
.container[data-width='wide'] {
  max-width: var(--width-wide);
}
.section {
  padding-block: 3rem;
}

@layer base {
  /*
   * Preflight resets headings to inherit font-size and strips list markers off
   * ul/ol. Everything below restores what this site had before Tailwind. The
   * list rules in particular are not optional: JoinChecklist is a numbered <ol>
   * and every markdown list rendered through Prose needs its markers back.
   */
  body {
    @apply bg-background text-foreground font-sans text-base;
    line-height: 1.6;
  }

  h1,
  h2,
  h3,
  h4 {
    @apply mb-4 font-sans;
    line-height: 1.15;
    text-wrap: balance;
  }

  h1 {
    font-size: var(--text-3xl);
  }
  h2 {
    font-size: var(--text-2xl);
  }
  h3 {
    font-size: var(--text-xl);
  }

  p,
  ul,
  ol {
    @apply mb-4;
  }

  ul {
    list-style: disc;
  }

  ol {
    list-style: decimal;
  }

  a {
    @apply text-primary;
  }

  img {
    @apply h-auto max-w-full;
  }

  figure {
    @apply m-0;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/*
 * The one shared layout primitive: a centred column. Named `wrap`, not
 * `container`, because Tailwind ships its own `container` utility and shadowing
 * it would be a trap. Width is overridden per-use with max-w-narrow/wide.
 */
@utility wrap {
  @apply max-w-default mx-auto w-full px-4 md:px-8 lg:px-6;
}

/* Skip link, visible only on keyboard focus. */
@utility skip-link {
  @apply absolute -left-[9999px];

  &:focus {
    @apply border-border bg-background top-4 left-4 z-10 border px-4 py-2;
  }
}
```

- [ ] **Step 4: Point BaseLayout at the new file and delete the old ones**

In `src/layouts/BaseLayout.astro`, change line 11 from `import '../styles/global.css';` to:

```js
import '../styles/globals.css';
```

Then:

```bash
rm src/styles/global.css src/styles/tokens.css
```

- [ ] **Step 5: Add the prettier plugin, last**

In `.prettierrc`, change the `plugins` line to:

```json
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
```

`prettier-plugin-tailwindcss` must be the final entry or it silently does nothing.

- [ ] **Step 6: Verify the build and the reset restoration**

```bash
pnpm verify
```

Expected: PASS. If `prettier --check` fails, run `pnpm format` and re-run.

Then start the dev server and check the three things Preflight most likely broke:

```bash
pnpm dev
```

- `/join` — the JoinChecklist `<ol>` still shows **1. 2. 3. 4.**
- Any page with markdown body copy — `<ul>` bullets are still present
- `/` — the h1 is still large; headings have not collapsed to body size

If any of those regressed, the `@layer base` block in Step 3 is wrong. Fix it there, not in a component.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "build: install Tailwind v4 and adopt shadcn token convention

Replaces tokens.css + global.css with a single globals.css holding the
shadcn semantic palette in oklch, bridged via @theme inline. Dark mode is
defined and activates on prefers-color-scheme; no toggle, no client JS.

Old --color-*/--space-* names are kept as a compatibility shim so
components can migrate one at a time. The shim is removed at the end."
```

---

### Task 2: Layout primitives, and the `.c-section` bug

**Files:**

- Modify: `src/pages/404.astro:7`, `src/pages/robots/index.astro:14`, `src/pages/dev/blocks.astro:35,54`, `src/pages/sponsors/index.astro:18`, `src/pages/robots/[slug].astro:25`
- Modify: `src/components/blocks/Hero.astro:19-20`, `DownloadList.astro:14-15`, `SponsorWall.astro:12-13`, `Custom.astro:28-29`, `RichText.astro:18-19`, `StatBand.astro:11-12`, `Cta.astro:13-14`, `RobotShowcase.astro:16-17`, `Gallery.astro:12-13`, `SponsorMarquee.astro:61-62`
- Modify: `src/layouts/BaseLayout.astro:42,66`

**Interfaces:**

- Consumes: the `wrap` utility and `--container-*` sizes from Task 1.
- Produces: the `class="container" data-width="…"` / `class="section"` pattern is gone from the codebase. Later tasks assume call sites already read `wrap max-w-wide` and `py-12`.

**🐛 Bug fix included:** `src/pages/robots/[slug].astro:25` reads `class="c-section" data-width="wide"`. Neither `.c-section` nor that `data-width` is defined anywhere — the class does not exist in the repo. Every robot detail page currently renders full-bleed with no max-width and no gutter. This task fixes it. Expect `/robots/<slug>` to look **different** afterwards; that is the fix, not a regression.

- [ ] **Step 1: Replace the container pattern everywhere**

The mapping, applied at all 17 sites:

| Was                                             | Becomes                           |
| ----------------------------------------------- | --------------------------------- |
| `class="container"`                             | `class="wrap"`                    |
| `class="container" data-width="narrow"`         | `class="wrap max-w-narrow"`       |
| `class="container" data-width="wide"`           | `class="wrap max-w-wide"`         |
| `class="section"`                               | `class="py-12"`                   |
| `class="container section" data-width="narrow"` | `class="wrap max-w-narrow py-12"` |
| `class="container section" data-width="wide"`   | `class="wrap max-w-wide py-12"`   |

`--space-6` was `3rem`, which is Tailwind's `12`, so `py-12` is an exact match for the old `.section`.

Where a component has an extra class alongside — `class="stat-band section"`, `class="cta section"`, `class="showcase section"`, `class="hero section"`, `class="container footer-grid"` — keep the extra class and swap only the primitive: `class="stat-band py-12"`, `class="wrap footer-grid max-w-wide"`, and so on. Those extra classes are still styled by their component's own `<style>` block and are removed in later tasks.

- [ ] **Step 2: Fix the `c-section` bug**

In `src/pages/robots/[slug].astro`, change line 25 from:

```astro
<article class="c-section" data-width="wide"></article>
```

to:

```astro
<article class="wrap max-w-wide py-12"></article>
```

- [ ] **Step 3: Confirm nothing references the old primitives**

```bash
grep -rn 'class="[^"]*\bcontainer\b' src/ ; grep -rn 'data-width' src/ ; grep -rn 'c-section' src/
```

Expected: no output from any of the three. `data-width` should be gone entirely — it was only ever read by the `.container` attribute selectors.

- [ ] **Step 4: Verify**

```bash
pnpm verify
```

Expected: PASS. Then `pnpm dev` and check `/`, `/join`, `/sponsors`, `/robots`, `/dev/blocks` — column widths and gutters unchanged. Check `/robots/<any-slug>` — it should now be a centred column instead of full-bleed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: replace .container/.section with the wrap utility

Also fixes robots/[slug].astro, which referenced a .c-section class that
does not exist anywhere in the repo — every robot detail page has been
rendering full-bleed with no max-width or gutter."
```

---

### Task 3: BaseLayout — header and footer

**Files:**

- Modify: `src/layouts/BaseLayout.astro` (markup + `<style>`)

**Interfaces:**

- Consumes: `wrap`, `skip-link`, `--color-skyline` from Task 1.
- Produces: `BaseLayout`'s `<style>` block reduced to the skyline rule only.

**Keeps a `<style>` block.** `.footer-skyline` is an 8-layer `linear-gradient` stack with per-layer position and size plus a mask. It stays, with its `#edf1f3` literals swapped for `var(--skyline)` so it follows the theme.

- [ ] **Step 1: Convert the header**

```astro
<header
  class="border-border bg-background supports-[backdrop-filter]:bg-background/72 sticky top-0 z-10 border-b supports-[backdrop-filter]:backdrop-blur-md"
>
  <div
    class="wrap max-w-wide flex flex-wrap items-center justify-between gap-4 py-2"
  >
    <a class="inline-flex" href="/" aria-label={`${site.name} home`}>
      <Image
        src={logo}
        alt={site.name}
        widths={[140, 280]}
        sizes="70px"
        class="h-9 w-auto"
      />
    </a>
    <nav aria-label="Main">
      <ul class="m-0 flex list-none flex-wrap gap-6 p-0"></ul>
    </nav>
  </div>
</header>
```

The `@supports (backdrop-filter: …)` guard becomes Tailwind's `supports-[backdrop-filter]:` variant, preserving the original intent: only go translucent where the blur actually renders.

- [ ] **Step 2: Convert the footer**

```astro
<footer
  class="border-border bg-background relative isolate mt-20 overflow-hidden border-t py-[clamp(3rem,7vw,6rem)]"
>
  <div class="footer-skyline" aria-hidden="true"></div>
  <div
    class="wrap max-w-wide grid grid-cols-1 items-start gap-10 gap-x-8 min-[30rem]:grid-cols-2 min-[47rem]:grid-cols-[minmax(15rem,1.3fr)_0.8fr_1fr] min-[47rem]:gap-[clamp(2.5rem,8vw,7rem)]"
  >
    <section class="col-span-full min-[47rem]:col-auto" aria-label={site.name}>
    </section>
  </div>
</footer>
```

Two things to get right here. First, the **breakpoints invert**: the original was max-width based (`@media (max-width: 47rem)` and `(max-width: 30rem)`), Tailwind is min-width based. The equivalent is one column below `30rem`, two from `30rem`, three from `47rem`.

Second, use `min-[47rem]:`, **not** `md:`. Tailwind's `md` is `48rem`, and the original `max-width: 47rem` query stops applying at `47rem` — close enough to look like a rounding detail, far enough to move the three-column switch by a whole `16px`. `mt-20` is `5rem`, matching `--space-7`.

Remaining conversions in the same file:

| Selector            | Classes                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.footer-brand`     | `inline-flex items-center text-foreground no-underline`                                                                                                                        |
| `.footer-brand img` | `h-auto w-full max-w-64`                                                                                                                                                       |
| `address`           | `mt-4 text-base not-italic leading-[1.45]`                                                                                                                                     |
| `.footer-column h2` | `mb-6 border-b-[0.35rem] border-primary pb-2 text-xl`                                                                                                                          |
| `.footer-links`     | `m-0 grid list-none gap-2 p-0`                                                                                                                                                 |
| `.footer-links a`   | `text-foreground text-lg no-underline hover:text-primary-strong hover:underline focus-visible:text-primary-strong focus-visible:underline`                                     |
| `.socials`          | `m-0 mb-6 flex list-none flex-wrap gap-4 p-0`                                                                                                                                  |
| `.socials a`        | `grid size-10 place-items-center rounded-full border-2 border-current font-extrabold text-foreground no-underline hover:text-primary-strong focus-visible:text-primary-strong` |
| `.donate`           | `inline-block rounded-md bg-secondary px-8 py-[0.65rem] text-lg tracking-[0.08em] text-secondary-foreground no-underline hover:brightness-95`                                  |
| `.fine-print`       | `mt-4 mb-0 leading-[1.45] text-muted-foreground`                                                                                                                               |

The donate button's hover was a hardcoded second hex (`#f2bc1d`); `hover:brightness-95` reproduces it without a token for a one-off shade.

- [ ] **Step 3: Reduce the `<style>` block to the skyline only**

```astro
<style>
  /*
   * Stays hand-written: eight stacked linear-gradients with per-layer position
   * and size, plus a mask. Expressing this as utilities would mean embedding
   * the whole declaration in a class name.
   */
  .footer-skyline {
    position: absolute;
    z-index: -1;
    inset: auto 0 0;
    height: 65%;
    opacity: 0.55;
    background:
      linear-gradient(to top, var(--skyline) 0 18%, transparent 18%) 0 100% /
        100% 100% no-repeat,
      linear-gradient(to top, var(--skyline) 0 62%, transparent 62%) 8% 100% /
        7% 72% no-repeat,
      linear-gradient(to top, var(--skyline) 0 78%, transparent 78%) 18% 100% /
        5% 58% no-repeat,
      linear-gradient(to top, var(--skyline) 0 70%, transparent 70%) 31% 100% /
        9% 68% no-repeat,
      linear-gradient(to top, var(--skyline) 0 84%, transparent 84%) 47% 100% /
        5% 82% no-repeat,
      linear-gradient(to top, var(--skyline) 0 65%, transparent 65%) 58% 100% /
        11% 61% no-repeat,
      linear-gradient(to top, var(--skyline) 0 80%, transparent 80%) 76% 100% /
        7% 73% no-repeat,
      linear-gradient(to top, var(--skyline) 0 72%, transparent 72%) 91% 100% /
        6% 65% no-repeat;
    mask-image: linear-gradient(to bottom, transparent, #000 30%);
  }
</style>
```

- [ ] **Step 4: Verify**

```bash
pnpm verify
```

Expected: PASS. Then `pnpm dev`, and compare header and footer against the pre-migration screenshot at four widths: 375px, 500px, 800px, 1400px. The footer column count must go 1 → 2 → 3.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(layout): convert BaseLayout header and footer to Tailwind"
```

---

### Task 4: `ui/Button` and `ui/Prose`

**Files:**

- Modify: `src/components/ui/Button.astro`
- Modify: `src/components/ui/Prose.astro`

**Interfaces:**

- Consumes: tokens from Task 1.
- Produces: `Button` keeps its exact `Props` interface — `{ label: string; href: string; variant?: 'primary' | 'secondary' }`. Do not add a third variant; see the knob-explosion note in CLAUDE.md.

**🐛 Bug fix included:** `Button.astro:47` reads `.button: active` — a space after the colon, which makes the rule invalid. The press-down `translateY(2px)` has never applied. Converting to `active:` restores it. Expect buttons to gain a press animation.

- [ ] **Step 1: Convert Button**

Replace the markup and delete the `<style>` block entirely. `data-variant` stays — it is a schema-driven enum and a useful hook — but styling moves to `class:list`:

```astro
<a
  class:list={[
    'border-primary inline-flex cursor-pointer items-center justify-center rounded-md border px-6 py-2 leading-[1.4] font-semibold no-underline',
    'transition-[background-color,color,border-color,transform] duration-150 ease-out',
    'hover:brightness-110 active:translate-y-0.5',
    'focus-visible:outline-primary focus-visible:outline-3 focus-visible:outline-offset-[3px]',
    'motion-reduce:transition-none motion-reduce:active:translate-y-0',
    variant === 'primary'
      ? 'bg-primary text-primary-foreground'
      : 'text-primary hover:bg-muted bg-transparent',
  ]}
  data-variant={variant}
  href={href}
  rel={external ? 'noopener noreferrer' : undefined}
  target={external ? '_blank' : undefined}>{label}</a
>
```

Two changes beyond a straight port, both deliberate: `display: inline-block` becomes `inline-flex` (the original set `align-items`/`justify-content`, which do nothing on `inline-block` — this makes the existing intent work), and `active:translate-y-0.5` is `0.125rem` where the original said `2px`. Identical at default root font size.

- [ ] **Step 2: Convert Prose**

`Prose` **keeps its `<style>` block** — it styles rendered markdown through `:global()` descendant selectors and there is no markup to hang utilities on. Only the token names change. Replace `var(--space-N)` with the literal values and `var(--color-*)` with the new names:

```astro
<style>
  /*
   * Stays hand-written: this styles HTML produced by the markdown renderer, so
   * there are no elements in this file to put utilities on.
   *
   * The class name `.prose` collides with @tailwindcss/typography. That plugin
   * is not installed and Astro scopes this block, so there is no bug today —
   * but if anyone ever adds it, rename this first.
   */
  .prose > :global(:first-child) {
    margin-top: 0;
  }

  .prose > :global(:last-child) {
    margin-bottom: 0;
  }

  .prose :global(h2),
  .prose :global(h3) {
    margin-top: 2rem;
  }

  .prose :global(ul),
  .prose :global(ol) {
    padding-left: 1.5rem;
  }

  .prose :global(blockquote) {
    margin: 1.5rem 0;
    padding-left: 1rem;
    border-left: 3px solid var(--border);
    color: var(--muted-foreground);
  }

  .prose :global(code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--muted);
    padding: 0.1em 0.3em;
    border-radius: 3px;
  }

  .prose :global(pre) {
    overflow-x: auto;
    padding: 1rem;
    background: var(--muted);
    border-radius: var(--radius);
  }

  .prose :global(table) {
    width: 100%;
    border-collapse: collapse;
  }

  .prose :global(th),
  .prose :global(td) {
    text-align: left;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border);
  }
</style>
```

Note `border-bottom: var(--border)` became `border-bottom: 1px solid var(--border)` — the old `--border` token held a whole shorthand (`1px solid …`), the new one holds a colour. This trips up every remaining `<style>` block; watch for it.

- [ ] **Step 3: Verify**

```bash
pnpm verify
```

Expected: PASS. Then `pnpm dev` → `/dev/blocks`, and check both button variants in every block that uses one. Press a button and confirm it moves down slightly. Tab to it and confirm the focus ring. Check that markdown lists still have markers.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(ui): convert Button to Tailwind, retoken Prose

Fixes a dead rule in Button: '.button: active' (space after the colon) was
invalid, so the press-down state never applied."
```

---

### Task 5: `content/RobotCard` and `content/DownloadCard`

**Files:**

- Modify: `src/components/content/RobotCard.astro`
- Modify: `src/components/content/DownloadCard.astro`

**Interfaces:**

- Consumes: tokens from Task 1; `Picture` (unchanged, takes `class`).
- Produces: both components' `<style>` blocks deleted entirely.

**🐛 Bug fix included:** `RobotCard.astro:107` reads `.card-link: focus-visible` — same space-after-colon typo. **Robot cards have no visible keyboard focus ring today.** This is an accessibility bug. Converting to `focus-visible:` fixes it; expect a visible ring when tabbing through `/robots`.

- [ ] **Step 1: Convert RobotCard**

```astro
<a
  class="focus-visible:outline-primary flex rounded-md text-inherit no-underline focus-visible:outline-3 focus-visible:outline-offset-[3px]"
  href={`/robots/${robot.id}`}
>
  <article
    class="border-border bg-card hover:border-primary flex flex-col overflow-hidden rounded-md border transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_30px_rgb(31_41_51/12%)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:hover:shadow-[0_12px_30px_rgb(0_0_0/45%)]"
  >
    <Picture
      image={hero}
      widths={[400, 800]}
      sizes="(min-width: 60rem) 30rem, 100vw"
      class="aspect-video w-full object-cover"
    />
    <div class="flex flex-1 flex-col gap-6 p-6">
      <h3 class="m-0 text-xl">
        <span class="text-primary-strong mr-2">{year}</span>
        {name}
      </h3>
      <p
        class="text-muted-foreground m-0 flex flex-wrap items-center gap-2 text-sm"
      >
        {game}
        {
          season === 'offseason' && (
            <span class="border-border bg-muted text-primary-strong inline-flex items-center rounded-full border px-2 py-[0.15rem] text-sm font-semibold">
              Offseason
            </span>
          )
        }
      </p>
      <p class="text-muted-foreground m-0 leading-relaxed">{summary}</p>
      {
        awards.length > 0 && (
          <ul class="border-border text-foreground mt-auto mb-0 list-none border-t p-0 pt-4 text-sm">
            {awards.map((award) => (
              <li class="[&+li]:mt-2">
                {award.name}{' '}
                <span class="text-muted-foreground">— {award.event}</span>
              </li>
            ))}
          </ul>
        )
      }
    </div>
  </article>
</a>
```

Delete the entire `<style>` block, including the stray `/*spanned year code here*/` comment.

The dark-mode hover shadow is added here: `rgb(31 41 51 / 12%)` is invisible on a dark background, so `dark:hover:shadow-[…rgb(0_0_0/45%)]` replaces it.

- [ ] **Step 2: Convert DownloadCard**

| Was         | Classes                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------- |
| `.download` | `rounded-md border border-border p-6`                                                       |
| `h3`        | `mb-2 text-lg`                                                                              |
| `.tag`      | `ml-2 inline-block rounded-full border border-border px-2 align-middle text-sm font-normal` |
| `.meta`     | `m-0 text-sm text-muted-foreground`                                                         |

Delete the `<style>` block.

- [ ] **Step 3: Verify**

```bash
pnpm verify
```

Expected: PASS. Then `pnpm dev` → `/robots` and `/dev/blocks`. Hover a robot card (lift + blue border + shadow). **Tab through the robot list and confirm each card now shows a focus ring** — this is the bug fix. Check the offseason tag renders on a robot whose `season` is `offseason`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(content): convert RobotCard and DownloadCard to Tailwind

Fixes an accessibility bug in RobotCard: '.card-link: focus-visible'
(space after the colon) was an invalid selector, so robot cards had no
visible keyboard focus indicator."
```

---

### Task 6: Sponsor logos and the marquee

**Files:**

- Modify: `src/components/content/SponsorGrid.astro`
- Modify: `src/components/blocks/SponsorMarquee.astro`

**Interfaces:**

- Consumes: tokens from Task 1.
- Produces: `SponsorGrid`'s `<style>` deleted; `SponsorMarquee` keeps a reduced `<style>` holding `@keyframes scroll` and the rules that read its inline custom properties (`--logo-box-width`, `--logo-box-height`, `--gap`, `--cycle`, `--duration`). The frontmatter constants `LOGO_BOX_WIDTH`, `LOGO_BOX_HEIGHT`, `GAP`, `CELL`, `DESIGN_MAX_VIEWPORT`, `MIN_SCROLL_WIDTH`, `MAX_COPIES` are **not** touched.

**This is the dark-mode task.** All 33 sponsor logos are PNGs with baked-in white backgrounds. On a dark page they render as glowing white rectangles. Both components get a white plate in dark mode.

- [ ] **Step 1: Convert SponsorGrid**

```astro
groups.map((group) => (
<section class="[&+&]:mt-8">
  <h3 class="text-muted-foreground text-base tracking-[0.06em] uppercase">
    {group.tier.label}
  </h3>
  <ul
    class="m-0 flex list-none flex-wrap items-center gap-8 p-0"
    style={`--logo-width: ${group.tier.logoWidth}px`}
  >
    {
      group.sponsors.map((sponsor) => (
        <li class="max-w-[var(--logo-width)] dark:rounded-md dark:bg-white dark:p-2">
          <a href={sponsor.data.url} rel="noopener noreferrer" target="_blank">
            <Picture
              image={sponsor.data.logo}
              widths={[group.tier.logoWidth, group.tier.logoWidth * 2]}
              sizes={`${group.tier.logoWidth}px`}
              class="block h-auto w-full"
            />
          </a>
          {showBlurbs && sponsor.data.blurb && (
            <p class="text-muted-foreground mt-2 text-sm">
              {sponsor.data.blurb}
            </p>
          )}
        </li>
      ))
    }
  </ul>
</section>
))
```

`--logo-width` stays inline — it comes from `sponsor-tiers.yaml` at build time and cannot be a static class.

`dark:bg-white` is literal white, not `bg-background`, on purpose: the plate exists to match the logos' own baked-in white, so it must not follow the theme.

- [ ] **Step 2: Convert the marquee's non-animated parts**

Markup classes:

| Was              | Classes                                                       |
| ---------------- | ------------------------------------------------------------- |
| `h2` (the label) | `text-base tracking-[0.06em] uppercase text-muted-foreground` |
| `.empty`         | `text-muted-foreground`                                       |
| `li`             | `flex-none`                                                   |
| `li a`           | `block`                                                       |

The `.marquee` wrapper, `.track`, the `::before`/`::after` fades and all `[data-static]` / reduced-motion rules **stay in `<style>`** — they read the inline custom properties and drive the animation.

- [ ] **Step 3: Retoken the surviving `<style>` block and add the dark plate**

Replace `var(--color-bg)` with `var(--background)` in both fade gradients, `var(--space-5)` with `2rem`, `var(--space-3)` with `1rem`, `var(--space-4)` with `1.5rem`, and `var(--gutter)` — which the shim removes in Task 10 — with the literal responsive value. Since the static row needs the same gutter as `wrap`, use:

**Scope this carefully.** Inline padding belongs ONLY to the static and
reduced-motion tracks. The animated track keeps `padding: 1rem 0` — giving it
inline padding shifts the scrolling strip away from the viewport edge and
undoes the full-bleed effect the block exists for.

```css
/* The animated track: block padding only, flush to the viewport edges. */
.track {
  padding: 1rem 0;
}

/* The static fallback is not full-bleed, so it supplies its own gutter,
     matching what the `wrap` utility uses. */
.marquee[data-static] .track {
  padding-inline: 1rem;
}

@media (min-width: 48rem) {
  .marquee[data-static] .track {
    padding-inline: 2rem;
  }
}

@media (min-width: 64rem) {
  .marquee[data-static] .track {
    padding-inline: 1.5rem;
  }
}
```

The reduced-motion block at the bottom of the file needs the same three
`padding-inline` values under `@media (prefers-reduced-motion: reduce)`, since
it produces the same non-scrolling row by a different route. Nest the width
queries inside the reduced-motion query, or repeat the pairing — either works,
but do not leave the reduced-motion row with only the 1rem value.

Then rewrite the logo-cell rule and **replace the comment above it**, because the no-padding rationale stops being universally true once the dark plate exists:

```css
/*
   * The image IS the cell — one fixed box for every logo, not a shared height.
   * Sizing by height alone lets aspect ratio decide footprint, so a wide
   * wordmark dwarfs a square mark set to the same height.
   *
   * No padding in light mode: `contain` always fills one axis exactly, so
   * padding only scales the art down and leaves it flush against the new edge.
   * The breathing room is baked into the assets — every logo file carries a 4%
   * transparent border.
   *
   * Dark mode is the exception. The logos have baked-in white backgrounds, so
   * they need an explicit white plate to sit on or they glow. The plate needs
   * padding to read as a plate, which is why it is on the <li>, not here.
   */
li :global(img) {
  display: block;
  width: var(--logo-box-width);
  height: var(--logo-box-height);
  object-fit: contain;
}

@media (prefers-color-scheme: dark) {
  li {
    background: #fff;
    border-radius: var(--radius);
    padding: 0.5rem;
  }
}
```

- [ ] **Step 4: Verify, in both themes**

```bash
pnpm verify
```

Expected: PASS. Then `pnpm dev` → `/sponsors` and `/dev/blocks`:

- Light: the wall and the marquee are unchanged from the pre-migration screenshot.
- The marquee still scrolls, still pauses on hover and on focus-within, and still snaps seamlessly (watch one full cycle — a broken `--cycle` shows as a visible jump).
- Switch macOS to Dark (System Settings → Appearance) or emulate it in DevTools (⌘⇧P → "Show Rendering" → Emulate CSS `prefers-color-scheme: dark`). Every logo sits on a white rounded plate. None glows.
- Set `prefers-reduced-motion: reduce` in the same Rendering panel — the marquee becomes a centred wrapping row with no duplicate logos.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(sponsors): convert to Tailwind, add dark-mode logo plates

All 33 sponsor logos are PNGs with baked-in white backgrounds, so dark
mode gives each one an explicit white plate rather than letting it glow."
```

---

### Task 7: The remaining blocks

**Files:**

- Modify: `src/components/blocks/Hero.astro`, `Gallery.astro`, `StatBand.astro`, `Cta.astro`, `DownloadList.astro`, `RobotShowcase.astro`

**Interfaces:**

- Consumes: `wrap` and tokens from Task 1; `Button`, `Prose`, `Picture`, `RobotCard`, `DownloadCard` as already converted.
- Produces: all six `<style>` blocks deleted.

Each block's `BlockProps<'…'>` type and its props destructuring stay exactly as they are. Only markup classes change.

- [ ] **Step 1: Hero**

```astro
<section class="py-12">
  <div
    class="wrap max-w-wide grid items-center gap-8 min-[60rem]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[60rem]:gap-12"
  >
    <div class="max-w-2xl">
      <h1
        class="m-0 text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-[-0.03rem] text-balance"
      >
        {headline}
      </h1>
      {
        bodyMarkdown && (
          <Prose
            html={md(bodyMarkdown)}
            class="text-muted-foreground mt-6 text-lg leading-relaxed"
          />
        )
      }
      {
        actions.length > 0 && (
          <div class="mt-6 flex flex-wrap items-center gap-4">
            {actions.map((action) => (
              <Button {...action} />
            ))}
          </div>
        )
      }
    </div>
    <Picture
      image={image}
      loading="eager"
      widths={[600, 1000, 1600]}
      sizes="(min-width: 60rem) 50vw, 100vw"
      class="aspect-4/3 w-full overflow-hidden rounded-md object-cover"
    />
  </div>
</section>
```

Note the arbitrary breakpoint. The original was `@media (min-width: 60rem)`; Tailwind's `lg` is `64rem`. Using `lg:` would move the two-column switch by 4rem, which is visible on tablets — hence `min-[60rem]:`. The same caution applies anywhere else in this plan where an original breakpoint is not 40/48/64/80/96rem. `.text`'s `max-width: 42rem` is Tailwind's `max-w-2xl`.

- [ ] **Step 2: Gallery**

The `data-columns` attribute drives a 2/3/4-column grid above `45rem`. Keep the attribute (it comes from the schema) but move the branching into `class:list`:

```astro
<ul
  class:list={[
    'm-0 grid list-none grid-cols-1 gap-6 p-0',
    columns === 2 && 'min-[45rem]:grid-cols-2',
    columns === 3 && 'min-[45rem]:grid-cols-3',
    columns === 4 && 'min-[45rem]:grid-cols-4',
  ]}
>
</ul>
```

Then per element: `li` → `min-w-0`; `figure` → `m-0`; the image gets `class="aspect-4/3 w-full rounded-md object-cover"` passed to `Picture`; `figcaption` → `mt-2 text-sm leading-normal text-muted-foreground`; `.credit` → `mt-2 block italic`.

Because the three column classes are written out literally, Tailwind's scanner sees them. Do **not** build them as `` `min-[45rem]:grid-cols-${columns}` `` — a constructed class name is invisible to the scanner and will not be generated.

- [ ] **Step 3: StatBand**

| Was                    | Classes                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `.stat-band` (section) | `bg-muted py-12`                                                                       |
| `dl`                   | `m-0 grid grid-cols-2 gap-6 min-[45rem]:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]` |
| `.stat`                | `flex flex-col-reverse`                                                                |
| `dd`                   | `m-0 text-2xl leading-[1.1] font-bold`                                                 |
| `dt`                   | `text-sm text-muted-foreground`                                                        |

- [ ] **Step 4: Cta**

`data-tone` is a schema enum; branch on it in `class:list` rather than with an attribute selector:

```astro
<section
  class:list={[
    'py-12 text-center',
    tone === 'accent' && 'bg-foreground text-background',
  ]}
  data-tone={tone}
>
  <div class="wrap max-w-narrow">
    <h2>{headline}</h2>
    {bodyMarkdown && <Prose html={md(bodyMarkdown)} />}
    <div class="mt-6 flex flex-wrap justify-center gap-4">
      {actions.map((action) => <Button {...action} />)}
    </div>
  </div>
</section>
```

`--color-bg-inverse` / `--color-text-inverse` were the foreground/background pair swapped, so `bg-foreground text-background` is an exact port.

- [ ] **Step 5: DownloadList**

`.grid` → `grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4`; `.empty` → `text-muted-foreground`.

- [ ] **Step 6: RobotShowcase**

`.grid` → `mt-6 grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-6`.

- [ ] **Step 7: Verify**

```bash
pnpm verify
```

Expected: PASS. Then `pnpm dev` → `/dev/blocks`, which renders every block type in empty, minimal and maximal state. Compare each against the pre-migration screenshot. Pay attention to: the hero's two-column switch at exactly 60rem, the gallery at each of `columns: 2 | 3 | 4`, and the CTA in both `tone` values.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(blocks): convert Hero, Gallery, StatBand, Cta, DownloadList, RobotShowcase"
```

---

### Task 8: Custom components and VideoEmbed

**Files:**

- Modify: `src/components/blocks/custom/MeetingSchedule.astro`, `custom/JoinChecklist.astro`, `src/components/ui/VideoEmbed.astro`

**Interfaces:**

- Consumes: tokens from Task 1.
- Produces: all three `<style>` blocks deleted. `VideoEmbed`'s `<script>` is **not** touched — it builds the iframe at runtime and its selectors (`.video`, `button`, `wrapper.dataset.videoId`) must keep working, so the `.video` class stays on the wrapper even though it no longer carries styles.

- [ ] **Step 1: MeetingSchedule**

`.events` → `m-0 list-none p-0`; each `li` → `[&+li]:mt-6 [&+li]:border-t [&+li]:border-border [&+li]:pt-6`; `h3` → `mb-1`; `.when` → `text-sm text-muted-foreground`; `.empty` → `text-muted-foreground`.

- [ ] **Step 2: JoinChecklist**

`.checklist` → `list-decimal pl-6`; each `li` → `[&+li]:mt-2`.

Keep `list-decimal` explicitly even though `@layer base` sets it on `ol` — this component's whole point is the numbering, and Preflight strips it by default. Confirm the numbers render.

- [ ] **Step 3: VideoEmbed**

| Was                                      | Classes                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `.video` (keep the class for the script) | `relative aspect-video overflow-hidden rounded-md bg-foreground`                                                                               |
| `.facade`                                | `flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 border-0 bg-none p-6 text-center font-[inherit] text-background` |
| `.play`                                  | `text-2xl`                                                                                                                                     |
| `.label`                                 | `font-semibold`                                                                                                                                |
| `.note`                                  | `text-sm opacity-75`                                                                                                                           |

The `.video :global(iframe)` rule sized the injected iframe. Since the script creates that element, it cannot carry Tailwind classes from markup — set them in the script instead:

```js
iframe.className = 'block h-full w-full border-0';
```

- [ ] **Step 4: Verify**

```bash
pnpm verify
```

Expected: PASS. Then `pnpm dev` → `/join` (JoinChecklist numbers 1–4 present, MeetingSchedule dividers between events) and `/dev/blocks`. Click a video façade and confirm the iframe fills its box exactly as before.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: convert custom blocks and VideoEmbed to Tailwind"
```

---

### Task 9: Page-level styles

**Files:**

- Modify: `src/pages/dev/blocks.astro`, `src/pages/sponsors/index.astro`, `src/pages/robots/index.astro`

**Interfaces:**

- Consumes: tokens from Task 1.
- Produces: no `<style>` block remains anywhere in `src/pages/`.

- [ ] **Step 1: dev/blocks**

`.marker` → `mt-20 border-t-[3px] border-primary py-4`; `.marker h2` → `mb-1`; `.marker p` → `m-0 text-sm text-muted-foreground`; `.gap` → `font-semibold text-destructive`.

The `.gap` colour was a hardcoded `#b91c1c`, which is what `--destructive` is for. This is a dev-only page, so a small colour shift here is acceptable.

- [ ] **Step 2: sponsors/index**

`.lead` → `max-w-narrow text-muted-foreground`; `.actions` → `mt-12 flex flex-wrap gap-4`.

- [ ] **Step 3: robots/index**

`.lead` → `text-muted-foreground`; `.grid` → `mt-8 grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-6`.

- [ ] **Step 4: Verify**

```bash
pnpm verify
```

Expected: PASS. Then check `/sponsors`, `/robots`, `/dev/blocks` against the pre-migration screenshots.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(pages): convert remaining page-level styles to Tailwind"
```

---

### Task 10: Remove the shim, fix the docs, final sweep

**Files:**

- Modify: `src/styles/globals.css` (delete the compatibility shim block, the `--gutter` media queries, and the legacy `.container`/`.section` rules)
- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: everything above.
- Produces: no `--color-*`, `--space-*`, `--width-*` or `--gutter` reference survives anywhere in `src/`.

- [ ] **Step 1: Prove nothing still uses the old names**

```bash
grep -rn -- '--color-\|--space-\|--width-\|--gutter\|--text-sm\|--text-base\|--text-lg' src/ --include='*.astro'
```

Expected: no output. Any hit must be converted before continuing — the shim is about to be deleted and these would break silently in light mode and loudly in dark.

- [ ] **Step 2: Delete the shim**

In `src/styles/globals.css`, delete the block commented `COMPATIBILITY SHIM`, the two `@media` blocks redefining `--gutter` that follow it, and the legacy `.container` / `.container[data-width]` / `.section` rules after those. Everything else in the file stays.

Task 2 already removed every call site, so this deletes dead CSS. If anything visibly changes after this step, Task 2 missed a file — find it rather than restoring the rules.

- [ ] **Step 3: Rewrite the CLAUDE.md routing row**

Change the table row:

```
| Colours, fonts, spacing            | `src/styles/tokens.css`                                                       |
```

to:

```
| Colours, fonts, spacing            | `src/styles/globals.css`                                                      |
```

- [ ] **Step 4: Rewrite the styling rule in CLAUDE.md**

The existing rule reads:

```
**Style options are enums, never free strings.** No `class:` fields. A free
string invites inventing plausible utility classes that don't exist.
```

Replace it with:

```
**Style options in content are enums, never free strings.** No `class:` fields
in any schema. This is a rule about the *content model*, not about components:
a YAML page file must never be able to carry a made-up utility class. Tailwind
lives strictly inside `.astro` markup, where the compiler and the class scanner
can both see it, and does not touch that boundary.
```

Then add to the **Gotchas** section:

```
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
```

- [ ] **Step 5: Confirm no scoped CSS survives except the three exceptions**

```bash
grep -rln '<style' src/
```

Expected exactly three files: `src/layouts/BaseLayout.astro` (skyline), `src/components/ui/Prose.astro` (markdown cascade), `src/components/blocks/SponsorMarquee.astro` (keyframes + cycle arithmetic). Any other file still has unconverted CSS.

- [ ] **Step 6: Full verification sweep**

```bash
pnpm verify
```

Expected: PASS.

Then `pnpm dev` and walk every route in light, then dark, then with reduced motion: `/`, `/join`, `/sponsors`, `/robots`, `/robots/<slug>`, `/technical-binder`, `/404`, `/dev/blocks`.

In dark specifically, confirm: no sponsor logo glows; the footer skyline is visible but not stark; robot card hover shadows read; the header's translucent blur still separates it from content beneath.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: drop the token compatibility shim, update CLAUDE.md

Completes the Tailwind migration. Three <style> blocks survive on purpose:
the footer skyline's gradient stack, Prose's markdown cascade, and the
sponsor marquee's keyframes."
```

---

## Notes for the executor

**There are no tests in this repo.** `pnpm verify` proves the build is sound and the content is consistent; it cannot tell you a layout broke. Visual comparison is the real gate, which is why it happens per task rather than once at the end.

**Take screenshots before you start.** Run `pnpm dev` on `main` and capture `/`, `/join`, `/sponsors`, `/robots`, `/robots/<slug>`, `/dev/blocks` at 375px, 800px and 1400px. Every task's verify step compares against these.

**Three visual changes are intentional** and will show up in that comparison:

1. Task 2 — `/robots/<slug>` gains a max-width and gutters (`.c-section` was undefined).
2. Task 4 — buttons gain a press-down animation (`.button: active` was invalid).
3. Task 5 — robot cards gain a keyboard focus ring (`.card-link: focus-visible` was invalid).

Everything else in light mode should be indistinguishable. If it is not, that is a regression, not an improvement — fix it rather than accepting it.
