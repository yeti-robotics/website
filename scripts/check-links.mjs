/**
 * Internal link checker. Runs over dist/ after the build.
 *
 * Astro validates references between content files, but nothing validates the
 * href a person typed into a `cta` block or a markdown link. This catches
 * /sponsers, and the printed-poster case: a /files/ URL that no longer resolves.
 *
 * External links are not fetched — a build that fails because someone else's
 * server is down is a build nobody trusts.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('check-links: no dist/ directory. Run `pnpm build` first.');
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const all = walk(DIST);
const html = all.filter((f) => f.endsWith('.html'));

/** Every URL path the built site actually serves. */
const served = new Set();
for (const file of all) {
  const path = `/${relative(DIST, file)}`;
  served.add(path);
  if (path.endsWith('/index.html')) {
    served.add(path.replace(/index\.html$/, '')); // /robots/
    served.add(path.replace(/\/index\.html$/, '')); // /robots
  }
  if (path.endsWith('.html')) served.add(path.replace(/\.html$/, ''));
}
served.add('/');

const broken = [];

for (const file of html) {
  const source = readFileSync(file, 'utf8');
  const page = `/${relative(DIST, file)}`;

  /** Anchor ids available on this page, for same-page #fragment links. */
  const ids = new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  for (const match of source.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = match[1];

    // Skip anything that leaves the site or is not a navigation target.
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(raw)) {
      if (raw.startsWith('#') && raw.length > 1 && !ids.has(raw.slice(1))) {
        broken.push({
          page,
          link: raw,
          fix: `No element with id="${raw.slice(1)}" on this page. Add the id, or fix the link.`,
        });
      }
      continue;
    }
    if (!raw.startsWith('/')) continue;

    const [path, hash] = raw.split('#');
    if (served.has(path) || served.has(`${path}/`) || served.has(`${path}index.html`)) {
      // Cross-page fragments are not resolved; only the page itself is checked.
      void hash;
      continue;
    }

    broken.push({
      page,
      link: raw,
      fix: path.startsWith('/files/')
        ? `Nothing is served at ${path}. Add the file to public/files/ — and keep the name stable, these URLs go on posters.`
        : `Nothing is served at ${path}. Check the spelling, or add src/content/pages${path}.yaml.`,
    });
  }
}

const bytes = all.reduce((sum, f) => sum + statSync(f).size, 0);

if (broken.length > 0) {
  console.error(`\ncheck-links: ${broken.length} broken internal link(s):\n`);
  for (const item of broken) {
    console.error(`  ${item.page}\n    ${item.link}\n    ${item.fix}\n`);
  }
  process.exit(1);
}

console.log(
  `check-links: OK — ${html.length} pages, ${all.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB. ` +
    `No broken internal links.`,
);
