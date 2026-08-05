---
# TEMPLATE — copy this to src/content/events/<year>-<name>.md
# e.g. 2027-recruitment-night.md
#
# Events exist so that dates are never typed into page prose. A page renders
# the event from here, so once it is over it disappears from the site by itself
# instead of sitting there telling people to show up to something that happened
# last September.

# Event name.
title: Recruitment Night

# ISO 8601 WITH the timezone offset. -04:00 is Charlotte in summer (EDT),
# -05:00 in winter (EST). The offset matters: without it a build machine in
# UTC shows the wrong time.
start: 2027-09-09T18:00:00-04:00

# OPTIONAL. Same format. Leave out for an all-day event.
end: 2027-09-09T20:00:00-04:00

# Where it happens. Use the full street address if the public is invited.
location: YETI Shop, 2102 Cambridge Beltway Drive, Suite B, Charlotte, NC 28273

# OPTIONAL. Full URL to sign up, if signup is required.
registrationUrl: https://example.com/signup

# What happens and who should come. Two or three sentences. Plain text.
description: An open house for students and parents. Drive last year's robot and meet the subteams.

# true hides this from the built site.
draft: false
---
