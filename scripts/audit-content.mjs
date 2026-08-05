/**
 * Cross-file checks that zod cannot see.
 *
 * A schema validates one file at a time. It cannot know that two robots claim
 * the same competition year, that a photo in src/assets/ is referenced by
 * nothing, or that a draft has been sitting unpublished since last season.
 * Those checks live here.
 *
 * Every failure names the file and says what to do about it. Warnings do not
 * fail the build; errors do.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { parse } from 'yaml';

const ROOT = process.cwd();
const errors = [];
const warnings = [];

const error = (file, message) => errors.push({ file, message });
const warn = (file, message) => warnings.push({ file, message });

/** Every file under `dir`, recursively. */
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

/** Split a .md file into its frontmatter object and body. */
function frontmatter(file) {
  const raw = readFileSync(file, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) return { data: {}, body: raw };
  return { data: parse(match[1]) ?? {}, body: raw.slice(match[0].length) };
}

const collection = (name) =>
  walk(join(ROOT, 'src/content', name))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({
      file: relative(ROOT, f),
      id: f.split('/').pop().replace(/\.md$/, ''),
      ...frontmatter(f),
    }));

const yamlEntries = (name) =>
  walk(join(ROOT, 'src/content', name))
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => ({
      file: relative(ROOT, f),
      id: f
        .split('/')
        .pop()
        .replace(/\.ya?ml$/, ''),
      raw: readFileSync(f, 'utf8'),
      data: parse(readFileSync(f, 'utf8')) ?? {},
    }));

const robots = collection('robots');
const sponsors = collection('sponsors');
const downloads = collection('downloads');
const programs = collection('programs');
const posts = collection('posts');
const events = collection('events');
const pages = yamlEntries('pages');

/* ------------------------------------------------------------------ *
 * 1. Two competition robots claiming the same season
 * ------------------------------------------------------------------ */

const byYear = new Map();
for (const robot of robots) {
  if (robot.data.season === 'offseason') continue;
  const list = byYear.get(robot.data.year) ?? [];
  list.push(robot.file);
  byYear.set(robot.data.year, list);
}
for (const [year, files] of byYear) {
  if (files.length > 1) {
    error(
      files[1],
      `Two competition robots are both marked year ${year}: ${files.join(' and ')}. ` +
        `There is one competition robot per season — set season: offseason on whichever was not the season robot.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 2. Downloads and public/files/ agreeing with each other
 * ------------------------------------------------------------------ */

const filesDir = join(ROOT, 'public/files');
const onDisk = new Set(
  walk(filesDir)
    .map((f) => `/files/${relative(filesDir, f)}`)
    .filter((f) => !f.endsWith('.gitkeep')),
);
const referenced = new Set(downloads.map((d) => d.data.file));

for (const download of downloads) {
  if (!download.data.file) continue;
  if (!onDisk.has(download.data.file)) {
    error(
      download.file,
      `Points at ${download.data.file}, which is not in public/files/. ` +
        `Add the file with that exact name, or change "file:" to match one that is there.`,
    );
    continue;
  }
  const size = statSync(join(ROOT, 'public', download.data.file)).size;
  if (size === 0) {
    error(
      download.file,
      `${download.data.file} is an empty file (0 bytes). Replace it with the real document.`,
    );
  }
}

for (const path of onDisk) {
  if (!referenced.has(path)) {
    warn(
      `public${path}`,
      `Sits in public/files/ but no download record points at it, so nothing on the site links to it. ` +
        `Add a file in src/content/downloads/ (copy _templates/download.md), or delete it.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 3. Orphaned images in src/assets/
 * ------------------------------------------------------------------ */

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.svg', '.webp', '.avif', '.gif']);
const assets = walk(join(ROOT, 'src/assets')).filter((f) =>
  IMAGE_EXT.has(extname(f).toLowerCase()),
);

/** Everything that could name an image: content files, data files, components. */
const searchable = [
  ...walk(join(ROOT, 'src/content')),
  ...walk(join(ROOT, 'src/data')),
  ...walk(join(ROOT, 'src/components')),
  ...walk(join(ROOT, 'src/pages')),
  ...walk(join(ROOT, 'src/layouts')),
]
  .filter((f) => /\.(md|mdx|ya?ml|astro|ts)$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

for (const asset of assets) {
  const name = asset.split('/').pop();
  if (!searchable.includes(name)) {
    warn(
      relative(ROOT, asset),
      `Nothing references this image, so it is shipped to nobody. Point a content file at it, or delete it.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 4. Stale drafts
 * ------------------------------------------------------------------ */

const STALE_DAYS = 90;
const now = Date.now();
const ageInDays = (date) => (now - new Date(date).getTime()) / 86_400_000;

for (const entry of [...posts, ...programs, ...robots, ...events, ...pages]) {
  if (entry.data.draft !== true) continue;
  const stamp = entry.data.date ?? entry.data.start;
  const age = stamp ? ageInDays(stamp) : null;
  if (age === null) {
    warn(
      entry.file,
      `Still draft: true, so it is stripped from the built site. Set draft: false to publish it.`,
    );
  } else if (age > STALE_DAYS) {
    warn(
      entry.file,
      `Has been draft: true for ${Math.round(age)} days and is invisible on the site. ` +
        `Publish it with draft: false, or delete it.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 5. Sponsors
 * ------------------------------------------------------------------ */

const thisYear = new Date().getFullYear();
for (const sponsor of sponsors) {
  if (sponsor.data.since > thisYear) {
    error(
      sponsor.file,
      `since: ${sponsor.data.since} is in the future. Use the first year they actually supported the team.`,
    );
  }
  if (sponsor.data.active !== false && !sponsor.data.blurb) {
    warn(
      sponsor.file,
      `Active sponsor with no blurb. One sentence about them makes the sponsor page worth reading.`,
    );
  }
}

/** A sponsor referenced by a robot must exist — Astro checks that; check the reverse. */
const creditedSponsors = new Set(robots.flatMap((r) => r.data.sponsors ?? []));
for (const sponsor of sponsors) {
  if (sponsor.data.active === false && !creditedSponsors.has(sponsor.id)) {
    warn(
      sponsor.file,
      `Retired (active: false) and not credited on any robot, so it appears nowhere on the site. ` +
        `That is fine if intentional — the file is kept so history and references stay intact.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 6. Page YAML wired up for editor autocomplete
 * ------------------------------------------------------------------ */

for (const page of pages) {
  if (!page.raw.includes('yaml-language-server: $schema=')) {
    error(
      page.file,
      `Missing the schema comment on line 1, so editors give no autocomplete here. Add:\n` +
        `    # yaml-language-server: $schema=../../../.schemas/page.json`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 7. Navigation points at pages that exist
 * ------------------------------------------------------------------ */

const site = parse(readFileSync(join(ROOT, 'src/data/site.yaml'), 'utf8'));
const routableFiles = new Set([
  ...pages.map((p) => `/${p.id}`),
  ...walk(join(ROOT, 'src/pages'))
    .filter((f) => /\.astro$/.test(f) && !f.includes('['))
    .map(
      (f) =>
        `/${relative(join(ROOT, 'src/pages'), f)
          .replace(/(index)?\.astro$/, '')
          .replace(/\/$/, '')}`,
    ),
]);

for (const item of site.nav ?? []) {
  if (!item.href.startsWith('/')) continue;
  if (!routableFiles.has(item.href)) {
    error(
      'src/data/site.yaml',
      `Nav item "${item.label}" points at ${item.href}, but no page builds that URL. ` +
        `Add src/content/pages${item.href}.yaml, or fix the href.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const show = (list, label) => {
  if (list.length === 0) return;
  console.log(`\n${label}`);
  for (const item of list) console.log(`  ${item.file}\n    ${item.message}`);
};

show(warnings, `${warnings.length} warning(s):`);
show(errors, `${errors.length} error(s):`);

if (errors.length > 0) {
  console.error(`\naudit-content: ${errors.length} error(s). Fix the files named above.`);
  process.exit(1);
}

console.log(
  `\naudit-content: OK — ${robots.length} robots, ${sponsors.length} sponsors, ${programs.length} programs, ` +
    `${posts.length} posts, ${events.length} events, ${downloads.length} downloads, ${pages.length} pages.` +
    (warnings.length > 0 ? ` ${warnings.length} warning(s) above.` : ''),
);
