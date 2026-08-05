/**
 * zod → JSON Schema, so editors autocomplete src/content/pages/*.yaml.
 *
 * The YAML language server reads the `# yaml-language-server: $schema=...`
 * comment at the top of each page file and gives real autocomplete, hover docs
 * from every .describe(), and inline errors — before the build runs. That does
 * NOT work inside markdown frontmatter, which is the whole reason pages are
 * standalone .yaml instead of .md.
 *
 * Output is committed so a fresh clone gets working autocomplete immediately.
 * Runs as part of `pnpm build`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'astro/zod';
import { pages } from '../src/schemas/collections.ts';

const OUT = fileURLToPath(new URL('../.schemas/page.json', import.meta.url));

/**
 * Stubs for the two helpers Astro normally injects.
 *
 * In a YAML file an image is written as a relative path string, so `image()`
 * becomes a string here. Likewise a `reference()` is written as the target
 * filename without its extension.
 */
const image = () =>
  z
    .string()
    .describe(
      'Path to an image file, relative to this file. Images live in src/assets/, never in public/.',
    );

const reference = (collection) =>
  z.string().describe(`Filename (without .md) of an entry in src/content/${collection}/.`);

const schema = pages({ image, reference });

/**
 * `io: 'input'` because the schemas use .default() — we want what an AUTHOR
 * writes, where defaulted fields are optional, not what the build produces.
 *
 * `unrepresentable: 'any'` because z.toJSONSchema throws on constructs with no
 * JSON Schema equivalent (dates, transforms, the .refine() on downloads).
 */
const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' });

json.title = 'YETI Robotics page';
json.description =
  'A page built from blocks. Each entry in `sections` needs a `type`, and the rest of its fields depend on that type.';

mkdirSync(fileURLToPath(new URL('../.schemas', import.meta.url)), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

/**
 * Check the union serialised in a shape editors can actually narrow on.
 *
 * zod 4 emits `oneOf` with a `const` on the discriminant rather than an
 * OpenAPI-style `discriminator` keyword. That is the shape the YAML language
 * server wants: once `type: hero` is typed, the const match narrows to that one
 * branch and only hero's fields are offered. If the consts ever go missing,
 * every branch matches at once and autocomplete becomes noise — so fail loudly.
 */
const sections = json.properties?.sections?.items;
const branches = sections?.oneOf ?? sections?.anyOf ?? [];
const types = branches.map((b) => b.properties?.type?.const).filter(Boolean);

console.log(`Wrote .schemas/page.json — ${branches.length} block types: ${types.join(', ')}`);

if (branches.length === 0) {
  console.error('ERROR: the block union did not serialise. Page autocomplete would not work.');
  process.exit(1);
}

if (types.length !== branches.length) {
  console.error(
    `ERROR: ${branches.length - types.length} block branch(es) lost the const on "type". ` +
      "Editors cannot narrow the union without it, so every block's fields would be offered at once.",
  );
  process.exit(1);
}

console.log('  Each branch carries a const on `type`, so editors narrow correctly.');
