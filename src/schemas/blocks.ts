/**
 * The block union — the vocabulary of sections a page can be built from.
 *
 * A page is an ordered list of these. Reordering a page is reordering the
 * array; adding a *kind* of section is deliberately a code change: a branch
 * here, a component in src/components/blocks/, and an entry in registry.ts.
 * Miss the registry entry and it is a COMPILE error, not a blank space.
 *
 * Adding a block type is rare. A section used on exactly one page is usually
 * a `richText` or a `custom`, not a new branch.
 */
import { z } from 'astro/zod';
import {
  action,
  customComponent,
  downloadCategory,
  galleryImage,
  imageRef,
  sponsorTier,
  typeOnlyImage,
  width,
  youtube,
  type ImageFn,
} from './primitives.ts';

/**
 * `reference()` from astro:content, passed in rather than imported.
 *
 * astro:content is a virtual module that only exists inside the Astro build,
 * and scripts/gen-schema.mjs runs in plain node. Passing both helpers in keeps
 * one definition of every block usable from both places.
 */
export type ReferenceFn = (collection: string) => z.ZodType<{ collection: string; id: string }>;

/** Stub used only for TYPE inference — never for validation. */
export const typeOnlyReference: ReferenceFn = () => z.custom<{ collection: string; id: string }>();

export type SchemaContext = { image: ImageFn; reference: ReferenceFn };

/**
 * Every valid `type:` value, listed once.
 *
 * zod 4 reports a bare "Invalid input" when a discriminator matches no branch,
 * which is useless for the single most likely authoring mistake. We name them
 * all in the error message instead.
 */
export const BLOCK_TYPES = [
  'hero',
  'statBand',
  'robotShowcase',
  'sponsorWall',
  'gallery',
  'richText',
  'cta',
  'downloadList',
  'custom',
] as const;

export const blockSchema = ({ image, reference }: SchemaContext) =>
  z.discriminatedUnion(
    'type',
    [
      /** Big opening section. One per page, always first. */
      z.strictObject({
        type: z.literal('hero'),
        headline: z
          .string()
          .min(1)
          .describe('The single biggest line on the page. Under 60 characters. No markdown.'),
        bodyMarkdown: z
          .string()
          .optional()
          .describe('One or two sentences under the headline. Markdown allowed. No headings.'),
        image: imageRef(image),
        actions: z
          .array(action)
          .max(2)
          .default([])
          .describe('Buttons under the text. Two at most — a third dilutes both.'),
      }),

      /** A row of numbers: "14 robots", "15 seasons". */
      z.strictObject({
        type: z.literal('statBand'),
        heading: z.string().optional().describe('Optional heading above the numbers.'),
        stats: z
          .array(
            z.strictObject({
              value: z
                .string()
                .min(1)
                .describe('The number itself, as text so "40+" and "15" both work.'),
              label: z.string().min(1).describe('What the number counts. Two or three words.'),
            }),
          )
          .min(2, 'A stat band needs at least 2 stats — use richText for a single number.')
          .max(4, 'A stat band holds at most 4 stats so they stay readable on a phone.')
          .describe('Between 2 and 4 numbers.'),
      }),

      /** Cards for specific robots, pulled from the robots collection. */
      z.strictObject({
        type: z.literal('robotShowcase'),
        heading: z.string().default('Our robots').describe('Heading above the robot cards.'),
        bodyMarkdown: z.string().optional().describe('Optional intro paragraph. Markdown allowed.'),
        robots: z
          .array(reference('robots'))
          .min(1, 'Pick at least one robot, by filename without .md — e.g. 2024-kitty.')
          .max(6, 'At most 6 robots in one showcase. Link to /robots for the full list.')
          .describe(
            'Robot filenames without .md, e.g. 2024-kitty. A name that does not exist fails the build.',
          ),
      }),

      /** The sponsor wall, grouped by tier. Renders itself from the collection. */
      z.strictObject({
        type: z.literal('sponsorWall'),
        heading: z.string().default('Our sponsors').describe('Heading above the logos.'),
        tiers: z
          .array(sponsorTier)
          .min(1, 'List at least one tier. To show every tier, list all seven.')
          .describe(
            'Which tiers to show, e.g. [team, pit, platinum]. Order comes from sponsor-tiers.yaml, not from this list.',
          ),
        showBlurbs: z
          .boolean()
          .default(false)
          .describe('Show each sponsor’s blurb under its logo. Usually false on the homepage.'),
      }),

      /** A grid of photos. */
      z.strictObject({
        type: z.literal('gallery'),
        heading: z.string().optional().describe('Optional heading above the photos.'),
        images: z
          .array(galleryImage(image))
          .min(1, 'A gallery needs at least one image.')
          .max(12, 'At most 12 images. More than that belongs on its own page.')
          .describe('Between 1 and 12 photos.'),
        columns: z
          .enum(['2', '3', '4'])
          .default('3')
          .describe('Columns on a wide screen. Always one column on a phone.'),
      }),

      /** Long-form prose. The default answer to "I need a section for X". */
      z.strictObject({
        type: z.literal('richText'),
        heading: z.string().optional().describe('Optional heading above the prose.'),
        markdown: z
          .string()
          .min(1)
          .describe(
            'The body text. Full markdown: headings, lists, links, bold. Start headings at ## since the page already has an h1.',
          ),
        width,
      }),

      /** A closing "do this now" band. */
      z.strictObject({
        type: z.literal('cta'),
        headline: z.string().min(1).describe('The ask, as a short sentence.'),
        bodyMarkdown: z.string().optional().describe('One supporting sentence. Markdown allowed.'),
        actions: z
          .array(action)
          .min(1, 'A call to action needs at least one button — otherwise use richText.')
          .max(2)
          .describe('One or two buttons.'),
        tone: z
          .enum(['default', 'accent'])
          .default('accent')
          .describe('Visual weight. Only these two.'),
      }),

      /** Downloadable files, pulled from the downloads collection. */
      z.strictObject({
        type: z.literal('downloadList'),
        heading: z.string().default('Downloads').describe('Heading above the file list.'),
        category: downloadCategory
          .optional()
          .describe('Show only this category. Leave it out to show every category.'),
        featuredOnly: z
          .boolean()
          .default(false)
          .describe('Show only downloads marked featured: true.'),
      }),

      /** Escape hatch for a genuinely one-off section. Keeps pages out of MDX. */
      z.strictObject({
        type: z.literal('custom'),
        component: customComponent,
        heading: z.string().optional().describe('Optional heading above the component.'),
      }),
    ],
    {
      error: (issue) =>
        issue.code === 'invalid_union'
          ? `Unknown section "type". Valid types are: ${BLOCK_TYPES.join(', ')}. Check the spelling — types are camelCase.`
          : undefined,
    },
  );

/**
 * The Block type, inferred from the same definition the build validates
 * against, so a schema change that a component ignores is a type error.
 */
export type Block = z.infer<ReturnType<typeof blockSchema>>;

/** Narrow Block to one branch: `BlockOf<'hero'>`. Used by every block component. */
export type BlockOf<T extends Block['type']> = Extract<Block, { type: T }>;

/** Props a block component receives: its branch minus the discriminant. */
export type BlockProps<T extends Block['type']> = Omit<BlockOf<T>, 'type'>;

/** Convenience for typing the union in components, with real ImageMetadata. */
export const typeOnlyBlockSchema = () =>
  blockSchema({ image: typeOnlyImage, reference: typeOnlyReference });

/** Video is used by record schemas, re-exported here so blocks.ts is the one import. */
export { youtube };
