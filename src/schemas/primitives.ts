/**
 * Shared schema fragments.
 *
 * Rules that apply to every schema in this folder:
 *   - z.strictObject() ALWAYS. z.object() silently drops unknown keys, so a
 *     typo like `headine:` would build green with a missing headline.
 *   - .describe() every field whose contract isn't obvious from its name.
 *     Descriptions become editor hover text via .schemas/page.json.
 *   - .default() over .optional() whenever a sane default exists.
 */
import { z } from 'astro/zod';
import type { ImageMetadata } from 'astro';

/** Edit distance, for "did you mean" suggestions. */
function distance(a: string, b: string): number {
  const rows: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j += 1) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i]![j] = Math.min(
        rows[i - 1]![j]! + 1,
        rows[i]![j - 1]! + 1,
        rows[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length]![b.length]!;
}

/** The closest valid key to `input`, if one is close enough to be worth suggesting. */
function nearest(input: string, candidates: string[]): string | undefined {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: distance(input.toLowerCase(), candidate.toLowerCase()),
    }))
    .sort((a, b) => a.score - b.score)[0];
  return scored && scored.score <= Math.max(2, Math.floor(input.length / 3))
    ? scored.candidate
    : undefined;
}

/**
 * z.strictObject() with an error message that actually helps.
 *
 * Zod's default for an unknown key is `Unrecognized key: "blrub"`, which tells
 * an author the thing they already know — that they typed it — and nothing
 * about what they should have typed. This lists every valid field and suggests
 * the nearest one, which is the difference between a contributor fixing their
 * own PR and a contributor giving up.
 *
 * `label` names the record type and matches its file in _templates/.
 */
export function strict<T extends z.ZodRawShape>(label: string, shape: T) {
  const keys = Object.keys(shape);
  return z.strictObject(shape, {
    error: (issue) => {
      if (issue.code !== 'unrecognized_keys') return undefined;
      const listed = issue.keys
        .map((key) => {
          const suggestion = nearest(key, keys);
          return suggestion ? `"${key}" (did you mean "${suggestion}"?)` : `"${key}"`;
        })
        .join(', ');
      return (
        `Unknown ${label} field: ${listed}. ` +
        `Valid fields are: ${keys.join(', ')}. ` +
        `Copy src/content/_templates/${label}.md rather than inventing frontmatter.`
      );
    },
  });
}

/**
 * The `image` helper Astro hands to schemas via the collection schema context.
 *
 * We take it as a parameter instead of importing it so that the same schema
 * definitions can be reused by scripts/gen-schema.mjs, which has no Astro
 * image pipeline and substitutes a plain string.
 */
export type ImageFn = () => z.ZodType<ImageMetadata>;

/** Stub used only for TYPE inference — never for validation. */
export const typeOnlyImage: ImageFn = () => z.custom<ImageMetadata>();

/**
 * An image plus its alt text, always together.
 *
 * Pairing them in one object is deliberate: an author cannot set the picture
 * and forget the alt text, because `alt` is required inside the same block.
 */
export const imageRef = (image: ImageFn) =>
  z.strictObject({
    src: image().describe(
      'Path to the image, relative to this file. Images live in src/assets/ — never in public/.',
    ),
    alt: z
      .string()
      .min(1)
      .describe(
        'What the image shows, for screen readers. Describe the content, not the file. Do not start with "Image of".',
      ),
  });

/** An image with optional photo-credit metadata, for galleries. */
export const galleryImage = (image: ImageFn) =>
  z.strictObject({
    src: image().describe('Path to the image, relative to this file.'),
    alt: z.string().min(1).describe('What the image shows, for screen readers.'),
    caption: z
      .string()
      .optional()
      .describe('Visible caption under the photo. One sentence. No headings.'),
    credit: z.string().optional().describe('Photographer name, shown as a small byline.'),
  });

/** Button styles. An enum, not a free string — see AGENTS.md on knob explosion. */
export const actionVariant = z
  .enum(['primary', 'secondary'])
  .default('primary')
  .describe('Button style. Only these two exist; do not invent others.');

/** A link rendered as a button. */
export const action = z.strictObject({
  label: z.string().min(1).describe('Button text. Two or three words, sentence case.'),
  href: z
    .string()
    .min(1)
    .describe(
      'Where it goes. Internal links start with "/". External links start with "https://".',
    ),
  variant: actionVariant,
});

/** Per-page metadata for <head>. */
export const seo = z.strictObject({
  title: z.string().min(1).describe('Page title, shown in the browser tab and search results.'),
  description: z
    .string()
    .min(1)
    .max(200)
    .describe(
      'One or two sentences shown in search results and link previews. Max 200 characters.',
    ),
});

/** A YouTube video, rendered click-to-load through youtube-nocookie.com. */
export const youtube = z.strictObject({
  id: z
    .string()
    .regex(
      /^[A-Za-z0-9_-]{11}$/,
      'Must be an 11-character YouTube video ID, not a full URL. In https://youtu.be/dQw4w9WgXcQ the ID is dQw4w9WgXcQ.',
    )
    .describe('The 11-character YouTube video ID, not the full URL.'),
  title: z
    .string()
    .min(1)
    .describe('Video title, used as the iframe accessible name and the poster caption.'),
});

/**
 * Sponsor tiers, highest to lowest.
 *
 * Shared by the sponsors collection and the sponsorWall block so the two can
 * never disagree. Display order and labels live in src/data/sponsor-tiers.yaml.
 */
export const sponsorTier = z
  .enum(['team', 'pit', 'platinum', 'gold', 'silver', 'bronze', 'partner'])
  .describe('Sponsorship level. Determines size and placement on the sponsor wall.');

/** Download categories. Shared by the downloads collection and downloadList block. */
export const downloadCategory = z
  .enum(['sponsorship', 'recruitment', 'outreach', 'team-documents', 'media'])
  .describe('Which group this file belongs to on the downloads page.');

/**
 * Names of one-off components the `custom` block is allowed to render.
 *
 * Add a name here ONLY together with a component of the same name in
 * src/components/blocks/custom/. The enum is what stops an agent inventing a
 * component that does not exist.
 */
export const customComponent = z
  .enum(['JoinChecklist', 'MeetingSchedule'])
  .describe(
    'Which one-off component to render. Must match a file in src/components/blocks/custom/.',
  );

/** Section width. Enum, deliberately only three values. */
export const width = z
  .enum(['narrow', 'default', 'wide'])
  .default('default')
  .describe('How wide the section content is. Only these three; do not add CSS classes.');
