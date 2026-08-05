/**
 * Block type → component.
 *
 * The `satisfies Record<Block['type'], unknown>` is the whole point: add a
 * branch to the union in src/schemas/blocks.ts and forget to register a
 * component here, and TypeScript fails the build naming the missing key. The
 * alternative — a lookup that returns undefined — renders a silent blank space
 * that nobody notices until a visitor does.
 *
 * Adding a block type is three edits, in this order:
 *   1. a branch in src/schemas/blocks.ts
 *   2. a component in src/components/blocks/
 *   3. an entry here
 */
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { Block } from '../../schemas/blocks';

import Hero from './Hero.astro';
import StatBand from './StatBand.astro';
import RobotShowcase from './RobotShowcase.astro';
import SponsorWall from './SponsorWall.astro';
import Gallery from './Gallery.astro';
import RichText from './RichText.astro';
import Cta from './Cta.astro';
import DownloadList from './DownloadList.astro';
import Custom from './Custom.astro';

/**
 * The annotation carries two guarantees, which is why it is written out rather
 * than inferred: every block type must have a key (a missing one is an error
 * naming the key), and every value must be a real Astro component.
 *
 * Per-block prop checking happens in each component, which types its own props
 * as BlockProps<'hero'> straight from the schema. Between the two, Sections.astro
 * needs no cast to dispatch.
 */
export const blockComponents: Record<Block['type'], AstroComponentFactory> = {
  hero: Hero,
  statBand: StatBand,
  robotShowcase: RobotShowcase,
  sponsorWall: SponsorWall,
  gallery: Gallery,
  richText: RichText,
  cta: Cta,
  downloadList: DownloadList,
  custom: Custom,
};
