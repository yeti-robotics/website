---
# TEMPLATE — copy this to src/content/posts/<yyyy-mm>-<slug>.md
# e.g. 2026-08-kickoff.md. The date prefix keeps the folder sorted.

# Post title. Sentence case, not Title Case.
title: What we learned at the district championship

# Publication date, YYYY-MM-DD, unquoted.
date: 2026-08-04

# Who wrote it. A person's name, or "YETI Robotics" for team posts.
author: YETI Robotics

# Lowercase, hyphenated. Reuse tags that already exist rather than
# inventing new ones — grep src/content/posts/ to see what is in use.
tags: [build-season, outreach]

# OPTIONAL. Lead image, from src/assets/ — NEVER public/.
hero:
  src: ../../assets/site/team.jpg
  alt: The team standing together in the shop

# true hides this from the built site. Drafts are visible with `pnpm dev`
# so you can preview them, and stripped from the built site.
draft: false
---

The body is the post. Plain markdown — headings, lists, links, bold, images.
No components.

Start headings at `##`. The post title above is already the page's `h1`, and
skipping heading levels breaks screen reader navigation.
