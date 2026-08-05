/**
 * Turn a heading into a URL fragment.
 *
 * Every block that renders a heading also gets `id={slug(heading)}` on its
 * <section>, so "#upcoming" links work without anyone authoring an id. Derived
 * rather than authored on purpose: an `anchor:` field would be one more knob to
 * get wrong, and scripts/check-links.mjs already fails the build on a fragment
 * that resolves to nothing.
 */
export function slug(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const id = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id || undefined;
}
