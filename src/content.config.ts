/**
 * Collection definitions. Deliberately thin — every schema lives in
 * src/schemas/ so it can be read on its own, and so scripts/gen-schema.mjs can
 * import the same definitions without booting Astro.
 *
 * Adding a collection: add a schema in src/schemas/collections.ts, add a
 * defineCollection() here, add a template in src/content/_templates/.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import * as schema from './schemas/collections';
import type { ReferenceFn, SchemaContext } from './schemas/blocks';

/**
 * Astro hands schemas only `image`. `reference` is a plain import, so we build
 * the context our schemas expect out of both.
 */
const ctx = (image: SchemaContext['image']): SchemaContext => ({
  image,
  reference: reference as unknown as ReferenceFn,
});

/** Records: flat .md frontmatter plus an optional prose body. */
const md = (dir: string) => glob({ pattern: '**/[^_]*.md', base: `./src/content/${dir}` });

/** Pages: standalone .yaml so the YAML language server can autocomplete them. */
const yaml = (dir: string) =>
  glob({ pattern: '**/[^_]*.{yaml,yml}', base: `./src/content/${dir}` });

export const collections = {
  robots: defineCollection({
    loader: md('robots'),
    schema: ({ image }) => schema.robots(ctx(image)),
  }),
  sponsors: defineCollection({
    loader: md('sponsors'),
    schema: ({ image }) => schema.sponsors(ctx(image)),
  }),
  programs: defineCollection({
    loader: md('programs'),
    schema: ({ image }) => schema.programs(ctx(image)),
  }),
  posts: defineCollection({ loader: md('posts'), schema: ({ image }) => schema.posts(ctx(image)) }),
  events: defineCollection({ loader: md('events'), schema: schema.events() }),
  downloads: defineCollection({ loader: md('downloads'), schema: schema.downloads() }),
  pages: defineCollection({
    loader: yaml('pages'),
    schema: ({ image }) => schema.pages(ctx(image)),
  }),
  fixtures: defineCollection({
    loader: yaml('fixtures'),
    schema: ({ image }) => schema.fixtures(ctx(image)),
  }),
};
