---
description: Add a sponsor to the sponsor wall (one file plus one logo)
---

Add a new sponsor to yetirobotics.org. Arguments: $ARGUMENTS

This is a two-file task. Do not touch any component or page.

## Steps

1. **Gather what you need.** You need: company name, tier, logo file, website
   URL, and the first year they supported the team. If the user hasn't given you
   the tier or the `since` year, ask — do not guess. Tier determines logo size
   and placement, and a wrong `since` year is a factual error about a real
   company.

2. **Place the logo** in `src/assets/sponsors/<company-slug>.png` (or `.svg`).
   Never `public/` — files there skip image optimisation entirely.
   Name it lowercase with hyphens, matching the record filename.

3. **Create the record** by copying `src/content/_templates/sponsor.md` to
   `src/content/sponsors/<company-slug>.md`. Fill in every field. Strip the
   template's instructional `#` comments.

   - `tier` must be one of: `team`, `pit`, `platinum`, `gold`, `silver`,
     `bronze`, `partner`
   - `alt` on the logo describes the image, e.g. "Blue Ridge Machining logo"
   - `blurb` is optional but wanted: one or two sentences on what they actually
     give the team, not marketing copy about the company

4. **Run `pnpm verify`.** Fix anything it names.

5. **Report** the two files created, and confirm no other file changed. If you
   found yourself editing a component, something went wrong — the sponsor wall
   builds itself from the collection.

## Do not

- Do not edit `src/components/content/SponsorGrid.astro` or any page.
- Do not add a tier that isn't in the enum. Adding a tier is a schema change in
  `src/schemas/primitives.ts` plus `src/data/sponsor-tiers.yaml`, and a
  deliberate decision — ask first.
- Do not delete a sponsor file to retire one. Set `active: false`; past robots
  still credit them by reference.
