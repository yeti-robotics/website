---
description: Write a news post
---

Write a post for yetirobotics.org. Arguments: $ARGUMENTS

## Steps

1. **Create the file** by copying `src/content/_templates/post.md` to
   `src/content/posts/<yyyy-mm>-<slug>.md` — e.g. `2026-08-kickoff.md`. The date
   prefix keeps the folder sorted chronologically.

2. **Fill in the frontmatter.**
   - `title` in sentence case, not Title Case
   - `date` as `YYYY-MM-DD`, unquoted
   - `author` is a person's name, or `YETI Robotics` for a team post
   - `tags` are lowercase and hyphenated. **Reuse existing tags** — check what's
     already in `src/content/posts/` rather than inventing a new one that means
     the same thing as an existing one.
   - `hero` is optional; if included, the image goes in `src/assets/` and needs
     real `alt` text

3. **Write the body** in plain markdown. No components.

   Start headings at `##`. The title is already the page's `h1`, and skipping
   levels breaks screen reader navigation.

4. **Set `draft`.** `draft: true` is visible with `pnpm dev` and stripped from
   the built site. Use it for anything not ready. The content audit warns about
   drafts left sitting for more than 90 days.

5. **Run `pnpm verify`.**

## On writing

Write like a person on the team, not like a press release. Concrete beats
promotional: what happened, what broke, what the team learned. Name students
only if the user confirms it's okay — this is a high school team and many
families have opinions about that.

Don't invent quotes, match results, or award names. If the user hasn't given you
a fact, ask for it or leave it out.
