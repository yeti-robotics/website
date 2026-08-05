/**
 * Rendering markdown *strings* from block and record fields.
 *
 * Astro renders .md FILES, but exposes no API for a markdown string sitting in
 * a frontmatter field. satteri is the same engine Astro 7 uses for .md, so a
 * `bodyMarkdown:` field renders identically to a .md body.
 *
 * satteri does NOT run remark/rehype plugins — it has its own plugin system.
 * It already covers GFM, heading IDs, smart punctuation, and container
 * directives, which is everything this site needs.
 */
import { markdownToHtml } from 'satteri';

/**
 * Render a markdown string to block-level HTML (wrapped in <p>, <ul>, etc.).
 *
 * Use for any field named `markdown` or `bodyMarkdown` that may hold more than
 * one sentence.
 */
export function md(source: string | undefined): string {
  if (!source) return '';
  return markdownToHtml(source).html;
}

/**
 * Render a markdown string as inline HTML, stripping the wrapping <p>.
 *
 * Use inside a heading or a lead paragraph, where a nested <p> would be invalid
 * HTML. Only sensible for single-paragraph source text.
 */
export function mdInline(source: string | undefined): string {
  if (!source) return '';
  const html = markdownToHtml(source).html.trim();
  const match = /^<p>([\s\S]*)<\/p>$/.exec(html);
  return match ? match[1]! : html;
}
