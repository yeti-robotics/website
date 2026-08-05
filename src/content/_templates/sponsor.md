---
# TEMPLATE — copy this to src/content/sponsors/<company-name>.md
#
# Filename becomes the id used by robots that credit this sponsor.
# Use lowercase with hyphens: acme-corp.md, blue-ridge-machining.md
#
# Every field below is shown. Delete the ones marked optional if unused.

# Company name, as they write it. Include Inc. or LLC if they use it.
name: Example Company

# One of: team, pit, platinum, gold, silver, bronze, partner
# Highest to lowest. Order and logo sizes live in src/data/sponsor-tiers.yaml.
tier: bronze

# Logo goes in src/assets/sponsors/ — NEVER in public/.
# Prefer SVG, or a PNG with a transparent background.
logo:
  src: ../../assets/sponsors/example-company.png
  alt: Example Company logo

# Full URL including https://
url: https://example.com

# First year they supported the team.
since: 2026

# OPTIONAL. One or two sentences. Plain text, no markdown.
# Shown on the sponsors page. Say what they actually give us.
blurb: Example Company donates machining time and hosts our fall design review.

# true = shown on the sponsor wall. false = retired.
#
# To retire a sponsor, set this to false. Do NOT delete the file: past robots
# still credit them, and deleting it breaks those references and the build.
active: true
---
