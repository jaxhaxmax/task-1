# FRAME IN GOA — Implementation Spec Pack

**For the coding agent:** Read every file in this folder before writing code. They are ordered. Do not
skip `01-CONTEXT.md` — it contains the reasoning behind decisions you will otherwise be tempted to
"improve," and those improvements will cost the submission points.

**Project:** A web tool for the Hacker House Goa 2026 shortlisting task. User uploads a photo, gets a
branded HH Goa 2026 graphic in three formats, downloads it, and shares it to X in one tap.

**Hard deadline:** 23:59 IST, 13 August 2026. Ship target is 12 August so the X post has time to
accumulate engagement.

---

## Read in this order

| File | What it is | Skip if… |
|---|---|---|
| `01-CONTEXT.md` | Research findings, the real judging criteria, competitive landscape, why each decision was made | never skip |
| `02-ARCHITECTURE.md` | Stack, dependencies, file tree, type contracts, env vars, data flow | never skip |
| `03-DESIGN-SPEC.md` | Brand tokens, typography, exact pixel layouts for all three formats | never skip |
| `04-BUILD-PHASES.md` | Ordered tasks with acceptance criteria and stop-gates | never skip |
| `05-CRITICAL-CODE.md` | Working code for the seven things that reliably break | never skip |
| `06-QA-AND-LAUNCH.md` | Device test matrix, edge cases, X post copy | before shipping |

---

## The five non-negotiables

If you have to cut scope, cut features. Never cut these — each maps directly to a stated requirement
in the task brief.

1. **No login, no signup, no gate of any kind.** Not before upload, not before download, not before
   share. No email capture. No "sign in to save." The brief says this twice.
2. **Upload to visible result in under 2 seconds** for a normal JPEG. No full-page loading screens.
   Render on the client; never round-trip to a server to produce the image.
3. **The download is a real file.** `canvas.toBlob()` → object URL → `<a download>`. Not a
   right-click-save-this-div. Not an on-screen-only render.
4. **The share link preview shows the actual generated graphic.** This is the single hardest
   requirement and the one most competitors will fail. See `05-CRITICAL-CODE.md` §5.
5. **Mobile first.** Build and test at 390px wide before you look at desktop. Most judges will open
   this on a phone.

---

## Three human-only tasks (the agent cannot do these)

Flag these to the operator immediately; do not block on them.

1. **Download the official Brand Kit.** There is a "Brand Kit" link in the footer of
   <https://hhgoa.com/>. Download it, extract logos/wordmarks/textures into `public/brand/`, and
   overwrite the placeholder tokens in `lib/brand.ts`. Until this happens, build against the
   placeholder palette in `03-DESIGN-SPEC.md` — it is designed to be swapped in one file.
2. **Provision Vercel Blob** and set `BLOB_READ_WRITE_TOKEN`. Without it the share-link preview
   degrades to a fallback (see §5). Everything else works.
3. **Buy and connect a domain.** Optional but recommended — most submissions sit on `*.vercel.app`
   and the share URL is the most-seen public artifact of this project.

---

## Build order (summary — full detail in `04-BUILD-PHASES.md`)

```
P0  scaffold + brand tokens + fonts loaded          ~1h
P1  image pipeline: upload → HEIC → EXIF → bitmap   ~2h   ← highest bug risk
P2  render engine + PFP format                      ~3h
P3  ID card format + fields + builder-title engine   ~3h
P4  team format                                      ~2h   ← reuses P3, do not rewrite
P5  download + share + OG route                      ~3h   ← highest scoring risk
P6  mobile polish, empty/error states, perf          ~2h
P7  landing OG, favicon, analytics                   ~1h
```

Deploy to Vercel at the end of **P2**, not at the end. A live ugly URL on day one is worth more than
a perfect localhost on day three.

---

## Things you will be tempted to do. Do not do them.

- **Do not write three separate renderers.** One engine, three declarative specs. See
  `02-ARCHITECTURE.md` §4. This is the single decision that makes three formats survivable solo.
- **Do not make the user pick a format before uploading.** Photo first, always. Format tabs live
  above the preview and switch instantly because the bitmap is already decoded.
- **Do not render canvas text before `document.fonts.ready` resolves.** You will get silent
  fallback-font renders on first paint and never notice on your own machine.
- **Do not `await` a network call before `navigator.share()`.** iOS Safari revokes the user gesture.
  See `05-CRITICAL-CODE.md` §5.
- **Do not use `next/image` anywhere in the render path.** You need raw `ImageBitmap`, not an
  optimized DOM element.
- **Do not hotlink assets from hhgoa.com.** Self-host everything in `public/brand/`.
- **Do not add a rounded-rect dark card with a neon-green border and glassmorphism.** That is the
  default AI design and roughly twenty other submissions will look exactly like it. The design in
  `03-DESIGN-SPEC.md` is deliberately not that. Follow it.
- **Do not add crop-before-upload UI.** The brief explicitly requires the tool to handle uncropped
  photos. Auto-frame, then offer optional adjustment.
