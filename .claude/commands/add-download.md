---
description: Publish a downloadable file (PDF) with its metadata record
---

Add a downloadable file to yetirobotics.org. Arguments: $ARGUMENTS

**Order matters here.** The file must exist before the record, because the
schema checks the disk and fails the build if it doesn't.

## Steps

1. **Put the file in `public/files/`.** This is the one place a file goes in
   `public/` rather than `src/assets/`, and the reason is specific: these URLs
   get printed on posters and put in Instagram bios, so they must never change.
   Hashed filenames would break that.

   Choose a filename that will still be right in three years:
   `recruitment-flyer.pdf`, not `flyer-v3-final-2026.pdf`. Lowercase, hyphens.

2. **Create the record** by copying `src/content/_templates/download.md` to
   `src/content/downloads/<same-name>.md`.

   - `file` must start with `/files/` and match the uploaded filename exactly
   - `category` is one of: `sponsorship`, `recruitment`, `outreach`,
     `team-documents`, `media`
   - `updated` is when the document was last revised
   - **Do not write the file size or type anywhere.** Both are read off the
     actual file at build time, so they can't go stale.

3. **Run `pnpm verify`.**

## If you're REPLACING an existing file

Do not upload under a new name. Overwrite the file at its existing path and bump
`updated:` in its record. Renaming it breaks every printed poster and QR code
pointing at the old URL.

## Do not

- Do not put the PDF in `src/assets/`. It won't be servable at a stable URL.
- Do not create the record before the file exists — the build will fail naming
  the missing path.
