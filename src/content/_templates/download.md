---
# TEMPLATE — copy this to src/content/downloads/<file-name>.md
#
# TWO steps, and the order matters:
#   1. Put the actual file in public/files/  (NOT src/assets/)
#   2. Copy this template and point `file:` at it
#
# The build fails with a message naming the path if the file is not there.

# What the file is, as a person would say it out loud.
title: Recruitment flyer

# One or two sentences about what is inside. Plain text.
description: A one-page flyer for students and families, with meeting times and a QR code.

# One of: sponsorship, recruitment, outreach, team-documents, media
category: recruitment

# Path under /files/. The file must already exist at public/files/<name>.
#
# KEEP THIS FILENAME STABLE FOREVER. These URLs get printed on posters and put
# in Instagram bios. To update the document, replace the file at the same name
# and bump `updated:` below — never rename it.
file: /files/recruitment-flyer.pdf

# When the document was last revised. Update this when you replace the file.
updated: 2026-08-01

# true pins it to the top of the downloads page.
featured: false
---

Optional body text with any extra notes — printing instructions, who to ask
before changing it, that sort of thing.

Do NOT write the file size or type here. Both are read off the actual file at
build time, so "PDF · 2.4 MB · Updated August 1, 2026" is always correct.
