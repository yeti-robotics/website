// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://yetirobotics.org',

  // Static output, no adapter, no SSR. Every page is prerendered, which is what
  // lets sharp optimise images at build time and lets the whole site be served
  // from Cloudflare Workers Static Assets with no server.
  output: 'static',

  // MDX is installed for the rare long-form page that needs a component
  // mid-paragraph. It is NOT the default: records are .md with flat
  // frontmatter, pages are .yaml block lists. See AGENTS.md.
  integrations: [mdx()],

  // Tailwind v4 is a Vite plugin, not an Astro integration. @astrojs/tailwind
  // is the v3 integration and is deprecated — do not reach for it.
  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Libre Franklin',
      cssVariable: '--font-libre-franklin',
      weights: [400, 500, 700],
      styles: ['normal'],
    },
    {
      provider: fontProviders.google(),
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      weights: [500, 700],
      styles: ['normal'],
    },
  ],

  // Markdown defaults are Astro 7's satteri defaults: GFM, heading IDs, smart
  // punctuation, container directives. Markdown *strings* in frontmatter fields
  // go through src/lib/md.ts, which uses the same engine, so a `bodyMarkdown:`
  // field renders identically to a .md body.
});
