# Contributing

**You do not need to install anything to update this site.** If you can use a
web browser, you can add a sponsor, fix a typo, or post an update. This page is
written for that path.

Developers: see [AGENTS.md](AGENTS.md) instead.

---

## The idea

Everything on this site is stored as a **file**, one file per thing. One sponsor
is one file. One robot is one file. Adding a sponsor to the sponsor wall means
adding one file — you never touch a page layout, and you can't accidentally
break the design.

When you save a change, a robot checks it automatically. If you typo a field
name or point at a photo that isn't there, it tells you, with the filename and
what to fix. Nothing broken can reach the live site.

---

## Editing something that already exists

Say you want to fix a typo in a robot description.

1. Go to the file on GitHub — for robots that's the `src/content/robots/` folder.
2. Click the file, then click the **pencil icon** (top right).
3. Make your change.
4. Scroll down. Under **Commit changes**, write one line saying what you did
   ("fix typo in 2016 robot description").
5. Choose **Create a new branch for this commit and start a pull request**.
6. Click **Propose changes**, then **Create pull request**.

That's it. Someone on the team reviews it, and it goes live when they merge.

---

## Adding a new sponsor

Two files: the logo, and the sponsor record.

### 1. Upload the logo

1. Go to the `src/assets/sponsors/` folder on GitHub.
2. Click **Add file → Upload files**.
3. Drag the logo in. Name it after the company in lowercase with hyphens:
   `blue-ridge-machining.png`.
4. Commit it as a new branch and open a pull request, as above.

> **Important:** logos go in `src/assets/`, never in the `public` folder. Images
> in `src/assets/` get automatically shrunk and converted to modern formats so
> the site stays fast. Images in `public` don't.

### 2. Add the sponsor file

1. Open `src/content/_templates/sponsor.md` and copy everything in it.
2. Go to `src/content/sponsors/`, click **Add file → Create new file**.
3. Name it after the company: `blue-ridge-machining.md`.
4. Paste the template, then fill it in. Delete the comment lines starting with
   `#` as you go — they're instructions, not content.
5. Commit and open a pull request.

The sponsor wall updates itself. Nobody has to lay anything out.

---

## Retiring a sponsor

**Do not delete the file.** Open it and change:

```yaml
active: true
```

to:

```yaml
active: false
```

They come off the sponsor wall, but robots from the years they supported still
credit them. Deleting the file breaks those pages and the site stops building.

---

## Replacing a downloadable PDF

The recruitment flyer and similar files live in `public/files/`.

**Keep the filename exactly the same.** Those web addresses are printed on
posters and in Instagram bios — changing the name breaks every one of them.

1. Go to `public/files/`.
2. **Add file → Upload files**, and upload the new version with the _same_
   filename. GitHub will replace it.
3. Then open the matching file in `src/content/downloads/` and update the
   `updated:` date.

The file size and date shown on the site are read from the actual file, so you
never type those in.

---

## Changing a meeting date

Dates are never written into page text. They live in `src/content/events/`.

Edit the event file, change `start:`, and every page that mentions it updates.
Once the date passes, the event drops off the site by itself.

---

## Writing rules that matter

**Alt text is required on every image.** It's the `alt:` line next to each
photo. Describe what's in the picture for someone who can't see it: "Kitty on
the field with its intake lowered", not "robot photo" and not "image of".

**Don't invent field names.** If the template doesn't have a field for it, the
site doesn't have a place to show it. Adding `color:` to a sponsor file will
fail the check, on purpose.

**Two sentences means two sentences.** Fields like `summary:` have length
limits because they show on cards. Going over fails the check.

---

## If the check fails

Your pull request will show a red X. Click **Details** to see why.

The message names the file and says what to do. Most common:

| Message says                                   | It means                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `Unrecognized key(s) in object: "..."`         | A field name is misspelled, or isn't a real field. Compare with the template. |
| `Unknown section "type". Valid types are: ...` | A page section has a bad `type:`. The message lists every valid one.          |
| `No file at public/files/...`                  | The PDF isn't uploaded, or the name doesn't match.                            |
| `Could not find ... in collection`             | You referenced a sponsor or robot whose file doesn't exist. Check spelling.   |
| `Expected string, received undefined`          | A required field is missing.                                                  |

Fix the file in your branch and the check re-runs automatically.

**If you're stuck, say so in the pull request.** Someone will help. A broken
pull request costs nothing — the live site is never affected.

---

## Working locally (optional)

If you'd rather run it on your own machine:

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm verify     # run the same checks CI runs
```

You'll need [Node](https://nodejs.org) 22+ and [pnpm](https://pnpm.io).

In VS Code, install the **YAML** extension. Page files then autocomplete every
section type and show what each field means as you type.
