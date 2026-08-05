/**
 * One schema per record collection.
 *
 * Records are flat .md files: frontmatter plus an optional prose body, and
 * NO components in the body. Flat frontmatter maps onto a form; a file full of
 * JSX does not. Keeping that true is what makes an admin UI possible later.
 *
 * Every schema here uses z.strictObject(), so a misspelled field name fails the
 * build instead of silently vanishing.
 */
import { z } from 'astro/zod';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  downloadCategory,
  galleryImage,
  imageRef,
  sponsorTier,
  strict,
  youtube,
  type ImageFn,
} from './primitives.ts';
import { blockSchema, type ReferenceFn, type SchemaContext } from './blocks.ts';

/** Where /files/* actually lives on disk. */
const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));

/** Earliest plausible year for anything on this site. Team 3506 rookie year is 2010. */
const FOUNDING_YEAR = 2010;

const year = z
  .number()
  .int()
  .min(FOUNDING_YEAR, `Team 3506 started in ${FOUNDING_YEAR}, so no year before that.`)
  .max(2100)
  .describe('Four-digit year, as a number and not a string.');

/**
 * A competition robot or an offseason build.
 *
 * One file per robot, named <year>-<name>.md — e.g. 2024-kitty.md.
 */
export const robots = (ctx: SchemaContext) =>
  strict('robot', {
    name: z
      .string()
      .min(1)
      .describe('The robot’s name, as the team calls it. Just the name — no year.'),
    year: year.describe('Competition season year. For 2024 Crescendo that is 2024.'),
    game: z.string().min(1).describe('The FIRST game name for that season, e.g. Crescendo.'),
    season: z
      .enum(['competition', 'offseason'])
      .default('competition')
      .describe('competition = built for an official FRC season. offseason = built outside one.'),
    summary: z
      .string()
      .min(1)
      .max(280)
      .describe(
        'Two sentences at most, shown on robot cards. Plain text — no markdown, no headings.',
      ),
    hero: imageRef(ctx.image).describe(
      'The main photo, used on cards and at the top of the robot page.',
    ),
    gallery: z
      .array(galleryImage(ctx.image))
      .max(12)
      .default([])
      .describe('Additional photos with captions and photo credits.'),
    video: youtube
      .optional()
      .describe('An optional reveal or match video. Loads only when a visitor clicks.'),
    awards: z
      .array(
        z.strictObject({
          name: z
            .string()
            .min(1)
            .describe(
              'Award name exactly as FIRST gives it, e.g. Excellence in Engineering Award.',
            ),
          event: z
            .string()
            .min(1)
            .describe('Event where it was won, e.g. FIRST North Carolina District Championship.'),
        }),
      )
      .default([])
      .describe('Awards this robot won. Leave empty rather than inventing any.'),
    /**
     * Win/loss record, as data rather than the sentence "Aurora was 35-14-0 in
     * official play". Stored structured so a season summary can be computed and
     * so nobody has to retype a number into prose.
     */
    record: z
      .strictObject({
        wins: z.number().int().min(0).describe('Wins in official play.'),
        losses: z.number().int().min(0).describe('Losses in official play.'),
        ties: z.number().int().min(0).default(0).describe('Ties in official play.'),
        stateRank: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Final rank in North Carolina that season.'),
        districtPoints: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('District points earned that season.'),
      })
      .optional()
      .describe('Season record. Leave it out entirely rather than guessing at numbers.'),
    specs: z
      .record(z.string(), z.string())
      .default({})
      .describe('Free-form spec table, e.g. Drivetrain: Swerve. Keys are shown as written.'),
    buildThread: z
      .url()
      .optional()
      .describe('Full URL to the Chief Delphi build thread, if there is one.'),
    sponsors: z
      .array(ctx.reference('sponsors'))
      .default([])
      .describe(
        'Sponsor filenames without .md, credited on this robot. A name that does not exist fails the build.',
      ),
    draft: z
      .boolean()
      .default(false)
      .describe('true hides this from the built site. Flip to false to publish.'),
  });

/**
 * A sponsor.
 *
 * Retiring a sponsor means setting `active: false` — NEVER deleting the file,
 * because past robot pages still credit them and reference() would break.
 */
export const sponsors = (ctx: SchemaContext) =>
  strict('sponsor', {
    name: z
      .string()
      .min(1)
      .describe('Company name as they write it, including Inc. or LLC if they use it.'),
    tier: sponsorTier,
    logo: imageRef(ctx.image).describe('Company logo. Prefer SVG or a transparent PNG.'),
    url: z.url().describe('Full URL to the sponsor’s website, including https://.'),
    since: year.describe('First year they supported the team.'),
    blurb: z
      .string()
      .max(400)
      .optional()
      .describe('One or two sentences about the company or what they give. Plain text.'),
    active: z
      .boolean()
      .default(true)
      .describe(
        'false retires them from the sponsor wall but keeps past robot credits working. Never delete the file.',
      ),
  });

/** One of the team's outreach programs. */
export const programs = (ctx: SchemaContext) =>
  strict('program', {
    title: z.string().min(1).describe('Program name, e.g. FIRST LEGO League.'),
    summary: z
      .string()
      .min(1)
      .max(280)
      .describe('Two sentences at most, shown on cards. Plain text.'),
    image: imageRef(ctx.image),
    order: z
      .number()
      .int()
      .min(0)
      .describe(
        'Sort position on the outreach page, lowest first. Leave gaps of 10 so inserting one later is easy.',
      ),
    draft: z.boolean().default(false).describe('true hides this from the built site.'),
  });

/** A news post. The body of the .md file is the post. */
export const posts = (ctx: SchemaContext) =>
  strict('post', {
    title: z.string().min(1).describe('Post title. Sentence case.'),
    date: z.coerce.date().describe('Publication date as YYYY-MM-DD, unquoted.'),
    author: z
      .string()
      .min(1)
      .describe('Who wrote it. A person’s name, or "YETI Robotics" for team posts.'),
    tags: z
      .array(z.string().min(1))
      .default([])
      .describe(
        'Lowercase single words, e.g. [build-season, outreach]. Reuse existing tags rather than inventing new ones.',
      ),
    hero: imageRef(ctx.image).optional().describe('Optional lead image.'),
    draft: z.boolean().default(false).describe('true hides this from the built site.'),
  });

/**
 * A dated event.
 *
 * The Join page renders recruitment night from here rather than from prose, so
 * a stale date is structurally impossible instead of merely unlikely.
 */
export const events = () =>
  strict('event', {
    title: z.string().min(1).describe('Event name, e.g. Recruitment Night.'),
    start: z.coerce
      .date()
      .describe('Start date and time, ISO 8601: 2027-09-12T18:00:00-04:00. Include the offset.'),
    end: z.coerce
      .date()
      .optional()
      .describe('End date and time, same format. Leave out for an all-day event.'),
    location: z
      .string()
      .min(1)
      .describe('Where it happens. Street address if the public is invited.'),
    registrationUrl: z.url().optional().describe('Full URL to sign up, if signup is required.'),
    description: z
      .string()
      .min(1)
      .describe('What happens and who should come. Two or three sentences. Plain text.'),
    draft: z.boolean().default(false).describe('true hides this from the built site.'),
  });

/**
 * A downloadable file.
 *
 * The PDF itself lives in public/files/ with a STABLE filename, because these
 * URLs go on printed posters and in Instagram bios and must survive the file
 * being replaced. Size and last-modified are read from disk at build time —
 * never hand-type "PDF, 2.4 MB".
 */
export const downloads = () =>
  strict('download', {
    title: z.string().min(1).describe('What the file is, as a person would say it.'),
    description: z
      .string()
      .min(1)
      .max(280)
      .describe('One or two sentences about what is inside. Plain text.'),
    category: downloadCategory,
    file: z
      .string()
      .startsWith('/files/', 'Must start with /files/ — downloadable files live in public/files/.')
      .superRefine((p, ctx) => {
        if (existsSync(`${PUBLIC_DIR}${p}`)) return;
        ctx.addIssue({
          code: 'custom',
          message:
            `No file at public${p}. Add the file to public/files/ with this exact name, ` +
            `or fix the "file:" path to match a file that is already there. ` +
            `Keep filenames stable once published — these URLs go on printed posters.`,
        });
      })
      .describe(
        'Path under /files/, e.g. /files/recruitment-flyer.pdf. The file must already exist in public/files/.',
      ),
    updated: z.coerce
      .date()
      .describe(
        'When the file was last revised, YYYY-MM-DD. Update this when you replace the file.',
      ),
    featured: z.boolean().default(false).describe('true pins it to the top of the downloads page.'),
  });

/** A page built from blocks. See src/schemas/blocks.ts. */
export const pages = (ctx: SchemaContext) =>
  strict('page', {
    title: z.string().min(1).describe('Page title, shown in the browser tab and as the page h1.'),
    description: z
      .string()
      .min(1)
      .max(200)
      .describe('One or two sentences for search results and link previews. Max 200 characters.'),
    draft: z.boolean().default(false).describe('true hides this page from the built site.'),
    sections: z
      .array(blockSchema(ctx))
      .min(1, 'A page needs at least one section. Start with a hero.')
      .describe('The page, top to bottom. Reorder this list to reorder the page.'),
  });

/** Same shape as pages, but only for the kitchen sink at /_dev/blocks. */
export const fixtures = pages;

export type { ImageFn, ReferenceFn };
