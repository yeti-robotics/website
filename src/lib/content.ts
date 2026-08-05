/**
 * Typed query helpers.
 *
 * Pages and components call these instead of writing getCollection() filters
 * inline, so "what counts as a published robot" is defined once. If you find
 * yourself writing a filter in a .astro file, add a helper here instead.
 */
import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import { statSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * The YAML is imported with ?raw rather than read from disk, so Vite inlines it
 * at build time. Reading it at runtime would work in dev and then fail during
 * the build, where this module is bundled into dist/ and the relative path no
 * longer points anywhere.
 */
import siteYaml from '../data/site.yaml?raw';
import sponsorTiersYaml from '../data/sponsor-tiers.yaml?raw';
import { siteSchema, sponsorTiersSchema, type Site, type SponsorTierDef } from '../schemas/data.ts';

/**
 * public/ resolved from the project root. process.cwd() is correct in dev and
 * in the build; import.meta.url is not, because this file gets bundled.
 */
const PUBLIC_DIR = `${process.cwd()}/public`;

/* ------------------------------------------------------------------ *
 * src/data — site-wide facts, never hardcoded in a component
 * ------------------------------------------------------------------ */

export type SponsorTierId = CollectionEntry<'sponsors'>['data']['tier'];
export type { Site, SponsorTierDef as SponsorTier };

/**
 * Parsed AND validated, so a typo in site.yaml fails the build with a message
 * naming the field instead of rendering "undefined" in every page footer.
 * Validation is also what gives these real types without a cast.
 */
export const site = siteSchema.parse(parse(siteYaml));

/** Tier definitions in display order, highest tier first. */
export const sponsorTiers = sponsorTiersSchema.parse(parse(sponsorTiersYaml)).tiers;

/* ------------------------------------------------------------------ *
 * Drafts
 * ------------------------------------------------------------------ */

/**
 * Drafts are visible while running `pnpm dev` and stripped from the built site.
 * That way a half-written post is previewable without being publishable by
 * accident. scripts/audit-content.mjs warns about drafts that have gone stale.
 */
const published = <T extends { data: { draft?: boolean } }>(entry: T): boolean =>
  import.meta.env.DEV || entry.data.draft !== true;

/* ------------------------------------------------------------------ *
 * Robots
 * ------------------------------------------------------------------ */

/** Every published robot, newest season first. */
export async function robotsByYear(): Promise<CollectionEntry<'robots'>[]> {
  const all = await getCollection('robots', published);
  return all.sort((a, b) => b.data.year - a.data.year || a.data.name.localeCompare(b.data.name));
}

/** Only robots built for an official FRC season. */
export async function competitionRobots(): Promise<CollectionEntry<'robots'>[]> {
  return (await robotsByYear()).filter((r) => r.data.season === 'competition');
}

/**
 * Resolve the `robots:` references on a robotShowcase block, in listed order.
 *
 * The cast is the one seam in the reference typing: src/schemas/blocks.ts
 * deliberately does not import astro:content (so scripts/gen-schema.mjs can
 * import it from plain node), which means a reference is typed structurally as
 * { collection, id } rather than with Astro's branded type. The build still
 * validates every reference — a robot name that does not exist fails there.
 */
type Refs = Parameters<typeof getEntries>[0];

export async function resolveRobots(
  refs: { collection: string; id: string }[],
): Promise<CollectionEntry<'robots'>[]> {
  if (refs.length === 0) return [];
  const entries = await getEntries(refs as Refs);
  return entries.filter(Boolean) as CollectionEntry<'robots'>[];
}

/* ------------------------------------------------------------------ *
 * Sponsors
 * ------------------------------------------------------------------ */

export type SponsorGroup = { tier: SponsorTierDef; sponsors: CollectionEntry<'sponsors'>[] };

/**
 * Active sponsors grouped by tier, in the order set by sponsor-tiers.yaml.
 *
 * Empty tiers are dropped, so a wall asking for seven tiers with three filled
 * renders three groups. Retired sponsors (active: false) never appear here,
 * but their files stay put so robot credits keep resolving.
 */
export async function sponsorsByTier(only?: SponsorTierId[]): Promise<SponsorGroup[]> {
  const all = await getCollection('sponsors', (s) => s.data.active);
  const wanted = only && only.length > 0 ? new Set(only) : null;

  return sponsorTiers
    .filter((tier) => !wanted || wanted.has(tier.id))
    .map((tier) => ({
      tier,
      sponsors: all
        .filter((s) => s.data.tier === tier.id)
        .sort((a, b) => a.data.since - b.data.since || a.data.name.localeCompare(b.data.name)),
    }))
    .filter((group) => group.sponsors.length > 0);
}

/** Resolve the `sponsors:` references on a robot, including retired ones. */
export async function resolveSponsors(
  refs: CollectionEntry<'robots'>['data']['sponsors'],
): Promise<CollectionEntry<'sponsors'>[]> {
  if (refs.length === 0) return [];
  return (await getEntries(refs as Refs)) as CollectionEntry<'sponsors'>[];
}

/* ------------------------------------------------------------------ *
 * Programs, posts, events
 * ------------------------------------------------------------------ */

/** Outreach programs in the order set by each program's `order:` field. */
export async function programsInOrder(): Promise<CollectionEntry<'programs'>[]> {
  const all = await getCollection('programs', published);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Posts, newest first. */
export async function postsByDate(): Promise<CollectionEntry<'posts'>[]> {
  const all = await getCollection('posts', published);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * Events that have not happened yet, soonest first.
 *
 * "Now" is build time. The site rebuilds on every push and on a schedule, so a
 * past event drops off without anyone editing prose.
 */
export async function upcomingEvents(now = new Date()): Promise<CollectionEntry<'events'>[]> {
  const all = await getCollection('events', published);
  return all
    .filter((e) => (e.data.end ?? e.data.start).getTime() >= now.getTime())
    .sort((a, b) => a.data.start.getTime() - b.data.start.getTime());
}

/** The next occurrence of a named event, or undefined. Used by the Join page. */
export async function nextEvent(title: string): Promise<CollectionEntry<'events'> | undefined> {
  return (await upcomingEvents()).find((e) => e.data.title.toLowerCase() === title.toLowerCase());
}

/* ------------------------------------------------------------------ *
 * Downloads
 * ------------------------------------------------------------------ */

export type DownloadFileMeta = { bytes: number; size: string; modified: Date; extension: string };

/**
 * Read a download's real size and modification time off disk at build time, so
 * nobody hand-types "PDF, 2.4 MB" and nobody has to remember to update it.
 */
export function fileMeta(path: string): DownloadFileMeta {
  const stats = statSync(`${PUBLIC_DIR}${path}`);
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = stats.size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return {
    bytes: stats.size,
    size: `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`,
    modified: stats.mtime,
    extension: (path.split('.').pop() ?? '').toUpperCase(),
  };
}

/** Downloads, featured first then newest, optionally filtered. */
export async function downloadsFor(
  options: {
    category?: CollectionEntry<'downloads'>['data']['category'];
    featuredOnly?: boolean;
  } = {},
): Promise<CollectionEntry<'downloads'>[]> {
  const all = await getCollection('downloads');
  return all
    .filter((d) => !options.category || d.data.category === options.category)
    .filter((d) => !options.featuredOnly || d.data.featured)
    .sort(
      (a, b) =>
        Number(b.data.featured) - Number(a.data.featured) ||
        b.data.updated.getTime() - a.data.updated.getTime(),
    );
}

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */

/** Every published page, for [...page].astro to build routes from. */
export async function publishedPages(): Promise<CollectionEntry<'pages'>[]> {
  return getCollection('pages', published);
}

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'America/New_York',
});

const DATETIME_FMT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/New_York',
});

/** Format a date in the team's timezone, so a build machine in UTC agrees. */
export const formatDate = (date: Date): string => DATE_FMT.format(date);
export const formatDateTime = (date: Date): string => DATETIME_FMT.format(date);
