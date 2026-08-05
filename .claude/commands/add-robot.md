---
description: Add a robot record with its photos
---

Add a robot to yetirobotics.org. Arguments: $ARGUMENTS

## Steps

1. **Gather the facts.** Name, year, FRC game name, whether it's a competition
   or offseason robot, a two-sentence summary, and at least a hero photo.

   Ask rather than guess on: awards (exact FIRST award names and the event),
   the win/loss record, and specs. **Never invent an award or a record.** These
   are claims about a real team's history. An empty `awards: []` is correct and
   honest; a plausible-sounding invented award is not.

2. **Place photos** in `src/assets/robots/<year>/`. Never `public/`.
   Hero should be landscape if possible. Optimisation happens at build time, so
   upload the largest version you have.

3. **Create the record** by copying `src/content/_templates/robot.md` to
   `src/content/robots/<year>-<name>.md` — e.g. `2026-yeti.md`. That filename is
   the id pages use to reference this robot.

   - `summary` is 280 characters max, plain text, no markdown
   - every image needs `alt` describing what's actually in the photo
   - `season: competition` for an official FRC season, `offseason` otherwise.
     Two competition robots in the same year fails the audit.
   - `sponsors` are filenames from `src/content/sponsors/` without `.md`. A
     name that doesn't exist fails the build.
   - `record` holds numbers, not a sentence. Omit the block entirely if unknown.
   - the markdown body is for design decisions and trade-offs. The `specs`
     table already covers the parts list — don't repeat it in prose.

4. **Run `pnpm verify`.**

5. **Consider** whether the robot should be added to the `robotShowcase` block
   in `src/content/pages/home.yaml`. That block holds at most 6 — if it's full,
   ask which one to drop rather than silently replacing one.

## Do not

- Do not edit `src/components/content/RobotCard.astro` or `/robots`. The robots
  index builds itself from the collection.
- Do not put a year in the `name` field. `name: Kitty`, `year: 2024`.
