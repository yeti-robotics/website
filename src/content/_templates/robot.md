---
# TEMPLATE — copy this to src/content/robots/<year>-<name>.md
# e.g. 2026-yeti.md. That filename is how pages refer to this robot.

# The robot's name as the team says it. No year here.
name: Example

# Competition season year, as a number.
year: 2026

# The FIRST game name for that season.
game: Rebuilt

# competition = built for an official FRC season
# offseason   = built outside one (training robot, offseason event)
season: competition

# Two sentences at most. Shown on cards. Plain text — no markdown.
summary: One or two sentences about what this robot did well and what made it different.

# Photos go in src/assets/robots/<year>/ — NEVER in public/.
# alt describes what is in the photo, for screen readers.
hero:
  src: ../../assets/robots/2026/example.jpg
  alt: Example on the competition field with its intake lowered

# OPTIONAL. Up to 12 more photos. caption and credit are optional per photo.
gallery:
  - src: ../../assets/robots/2026/example-match.jpg
    alt: Example scoring during a qualification match
    caption: Qualification match 12 at the Charlotte district event.
    credit: Photographer name

# OPTIONAL. The 11-character YouTube ID, not the full URL.
# In https://youtu.be/dQw4w9WgXcQ the id is dQw4w9WgXcQ.
# Nothing loads from YouTube until a visitor clicks.
# video:
#   id: dQw4w9WgXcQ
#   title: Example robot reveal

# Awards this robot won. Use the exact award name FIRST gives.
# Leave as [] rather than inventing any.
awards:
  - name: Excellence in Engineering Award
    event: FIRST North Carolina District Charlotte Event

# OPTIONAL. Season record, as numbers rather than a sentence.
# Leave the whole block out rather than guessing.
record:
  wins: 30
  losses: 12
  ties: 0
  stateRank: 8
  districtPoints: 223

# OPTIONAL. Free-form spec table. Keys show exactly as written.
specs:
  Drivetrain: Swerve, MK4i modules
  Weight: 118 lb
  Intake: Over-the-bumper roller

# OPTIONAL. Full URL to the Chief Delphi build thread.
buildThread: https://www.chiefdelphi.com/t/example/000000

# Sponsor filenames without .md, from src/content/sponsors/.
# A name that does not exist fails the build.
sponsors:
  - acme-corp

# true hides this from the built site.
draft: false
---

The body is the long description. Plain markdown — headings, lists, links, bold.
No components: records stay flat so they can be edited in a form later.

Write about decisions and trade-offs, not just a parts list. The specs table
above already covers the parts.
