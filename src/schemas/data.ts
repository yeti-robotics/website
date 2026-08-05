/**
 * Schemas for the two files in src/data/.
 *
 * These are validated rather than trusted, for the same reason the content
 * collections are: a typo in site.yaml should fail the build with a message,
 * not silently render "undefined" in the footer of every page. Validating also
 * means src/lib/content.ts gets real inferred types with no cast.
 */
import { z } from 'astro/zod';
import { sponsorTier } from './primitives.ts';

const link = z.strictObject({
  label: z.string().min(1).describe('Visible link text.'),
  href: z
    .url()
    .or(z.string().startsWith('/'))
    .describe('An absolute URL, or an internal path starting with "/".'),
});

/** src/data/site.yaml — site-wide facts, never hardcoded in a component. */
export const siteSchema = z.strictObject({
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1).max(200),
  url: z.url(),
  nav: z
    .array(link)
    .min(1)
    .describe(
      'Main navigation, in order. Every href must resolve — scripts/check-links.mjs enforces it.',
    ),
  socials: z.array(link).default([]),
  address: z.strictObject({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2).describe('Two-letter state code.'),
    zip: z
      .string()
      .regex(/^\d{5}$/, 'Five digits, quoted so YAML keeps the leading zero if there is one.'),
  }),
  email: z.email(),
  paypal: z.url().describe('Where the donate buttons point.'),
});

export type Site = z.infer<typeof siteSchema>;

/** src/data/sponsor-tiers.yaml — display order and logo sizing per tier. */
export const sponsorTiersSchema = z.strictObject({
  tiers: z
    .array(
      z.strictObject({
        id: sponsorTier.describe('Must match a value in the `tier` enum in primitives.ts.'),
        label: z.string().min(1).describe('Heading shown above this tier on the sponsor wall.'),
        logoWidth: z
          .number()
          .int()
          .min(80)
          .max(480)
          .describe(
            'Rendered logo width in pixels on a wide screen. Higher tiers get bigger logos.',
          ),
      }),
    )
    .min(1)
    .describe('Tiers in display order, highest first.')
    .refine(
      (tiers) => new Set(tiers.map((t) => t.id)).size === tiers.length,
      'Each tier id may appear only once in sponsor-tiers.yaml.',
    ),
});

export type SponsorTierDef = z.infer<typeof sponsorTiersSchema>['tiers'][number];
