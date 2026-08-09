# 04 — Build Phases

Each phase ends with a **GATE**. Do not start the next phase until the gate passes. If a gate fails,
fix it before adding features — every downstream phase depends on the one below it.

Estimated total: **17 hours**. Realistically two focused days.

---

## P0 — Scaffold · ~1h

**Tasks**
1. `npx create-next-app@latest` — TypeScript, Tailwind, App Router, `src/` off, import alias `@/*`
2. Install: `@vercel/blob nanoid`. Do **not** install `heic2any` as a static import; add it to
   package.json but only ever `await import('heic2any')`.
3. `lib/brand.ts` — paste the token block from `03-DESIGN-SPEC.md` §2 verbatim
4. `lib/types.ts` — paste the type contract from `02-ARCHITECTURE.md` §4 verbatim
5. `app/layout.tsx` — load the three fonts via `next/font/google` with `display: 'block'`; set
   `metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL!)`
6. `app/globals.css` — expose the brand tokens as CSS custom properties for the app UI
7. `.env.local` with the three variables from `02-ARCHITECTURE.md` §6

**GATE 0** — `document.fonts.check('700 26px "JetBrains Mono"')` returns `true` in the browser
console after load. If it returns `false`, the canvas will silently render in Arial and you will not
notice until the graphic looks wrong. Verify this now.

---

## P1 — Image pipeline · ~2h · HIGHEST BUG RISK

Build this standalone at `/dev/pipeline` (delete before shipping) so you can test decoding without
the rest of the app existing.

**Tasks**
1. `lib/image/load.ts` — implement `loadImage(file: File): Promise<ImageBitmap>` exactly as written
   in `05-CRITICAL-CODE.md` §1. Native decode first, HEIC fallback second, `imageOrientation:
   'from-image'` always.
2. `lib/image/crop.ts` — `coverRect()` and `defaultFocal()` per `05-CRITICAL-CODE.md` §2
3. `components/Uploader.tsx` — file input + drag-drop + **paste from clipboard** (`onPaste` on
   window; costs five lines and desktop users will use it)
4. Reject files > 25MB with a clear message before decoding
5. Free bitmaps on replace: `oldBitmap.close()`

**GATE 1** — a test page draws each uploaded photo into a 400×400 square. Verify with:
- a portrait JPEG from a phone → upright, face visible, not sideways
- a landscape JPEG → centred horizontally
- a `.heic` straight off an iPhone → decodes on both iOS Safari and desktop Chrome
- a PNG with transparency → no black box
- a 12MP photo → decodes in under 1.5s

If EXIF orientation is wrong, stop and fix it here. Every format inherits this bug.

---

## P2 — Render engine + PFP · ~3h

**Tasks**
1. `lib/render/helpers.ts` — `roundRect`, `fitText`, `drawArcText`, `drawMarquee`, `drawGrain`,
   `drawStamp`, `letterSpacedText`. Source in `05-CRITICAL-CODE.md` §3.
2. `lib/render/engine.ts` — `renderSpec()`. `await document.fonts.ready` on line one.
3. `lib/render/specs/pfp.ts` — build to `03-DESIGN-SPEC.md` §4, referencing tokens only
4. `components/Preview.tsx` — canvas at `width:100%`, pointer drag → `focal.x/y`, wheel and pinch →
   `focal.zoom` (clamp 1–3). Use pointer events, not mouse events, so touch works for free.
5. Wire `page.tsx`: upload → render → preview
6. **Deploy to Vercel now.** Ugly is fine. Get the URL existing.

**GATE 2** — upload a photo on a real phone via the deployed URL and see a correctly framed PFP with
legible ring text within two seconds. Drag repositions smoothly at 60fps.

---

## P3 — Builder Pass + fields + titles · ~3h

**Tasks**
1. `lib/hash.ts` (cyrb53) and `lib/builder-title.ts` per `03-DESIGN-SPEC.md` §8
2. `lib/render/specs/idcard.ts` per `03-DESIGN-SPEC.md` §5 — export the shared pieces
   (`headerLayers`, `perforationLayers`, `stubLayers`, `marqueeLayer`) as named exports so `team.ts`
   can import them
3. `components/Fields.tsx` — name, stack, title reveal, re-roll. Debounce re-render 120ms.
4. `components/FormatTabs.tsx` — instant switch, bitmap already decoded
5. Auto-shrink on the name field: `fitText` must handle a 30-character name without overflowing into
   the perforation
6. Persist name/role to `localStorage`

**GATE 3** — with the fields empty the pass still renders as a complete, sensible graphic. Typing a
name updates it with no visible lag. `ARJUN` and `SIVAPRASAD VENKATARAMAN` both fit. Re-roll changes
the title and serial together. Rendering the same name twice produces an identical card.

---

## P4 — Team Pass · ~2h

**Tasks**
1. `components/TeamRoster.tsx` — 2–6 rows, each with a small photo button and a name input; add and
   remove member controls
2. `lib/render/specs/team.ts` — computed slots per `03-DESIGN-SPEC.md` §6, **importing** chrome from
   `idcard.ts`
3. Per-member focal state (an array, index-matched)
4. Team name derives the serial

**GATE 4** — three photos of different aspect ratios produce three evenly spaced, correctly framed
circles with names beneath. Adding a fourth member reflows without a reload. If you wrote more than
~90 lines in `team.ts`, you duplicated chrome — go back and import it.

---

## P5 — Download + Share + OG · ~3h · HIGHEST SCORING RISK

**Tasks**
1. Download: `canvas.toBlob` → `URL.createObjectURL` → synthetic `<a download>` click →
   **`URL.revokeObjectURL` after a 1s timeout** (revoking immediately breaks the download in Safari)
2. Filename: `framein-goa-{format}-{serial}.png`
3. `lib/render/specs/og.ts` — the 1200×630 composite per `03-DESIGN-SPEC.md` §7
4. `app/api/share/route.ts` — accept `FormData { art, og }`, `put()` both with
   `addRandomSuffix: false`, return `{ id }`. `export const runtime = 'nodejs'`.
   Return `{ id: null }` if the token is missing — never throw.
5. Background upload: fire on render-complete, debounced 400ms, store the promise in a ref
6. `lib/share.ts` — the three-tier orchestration per `05-CRITICAL-CODE.md` §5.
   **Prepare the `File` eagerly at render time.**
7. `app/f/[id]/page.tsx` — `generateMetadata` (remember: `params` is a Promise in Next 15) emitting
   `og:image`, `twitter:card=summary_large_image`, `twitter:image`. The page body shows the graphic,
   a Download button, and a large **Make yours** CTA linking home.
8. `lib/caption.ts` — captions per `06-QA-AND-LAUNCH.md` §3

**GATE 5** — all four must pass:
- **a.** Download produces a real PNG that opens in a photo viewer at the correct dimensions
- **b.** On a real phone, Share opens the native sheet with the image attached; picking X shows it in
  the composer
- **c.** On desktop, Share opens the X composer with the caption, hashtag, and `/f/{id}` link
- **d.** Paste that `/f/{id}` URL into a real tweet composer (or opengraph.xyz) and the preview shows
  **the actual generated graphic**. Not blank. Not a default. This is the requirement the brief calls
  out by name — if it fails, fix it before anything else.

---

## P6 — Mobile polish · ~2h

**Tasks**
1. Test at 390 × 844 throughout. Tap targets ≥ 48px. Inputs `font-size: 16px` to stop iOS zoom.
2. Empty state: render the frame with a silhouette placeholder before any upload
3. Error states with real copy (`03-DESIGN-SPEC.md` §9)
4. HEIC conversion is the only case that shows a status line: *"Converting from HEIC…"*
5. `prefers-reduced-motion` respected on the title reveal
6. Keyboard: visible focus rings, tab order photo → tabs → fields → actions
7. `overscroll-behavior: contain` on the canvas so dragging doesn't scroll the page
8. `touch-action: none` on the canvas element

**GATE 6** — complete the full flow on a physical phone, on cellular data, without a laptop. Upload,
adjust, type, download, share. If any step is awkward, fix it — this is the flow the judges will use.

---

## P7 — Launch prep · ~1h

**Tasks**
1. Static `app/opengraph-image.png` for the landing page (1200×630, the design from §7 with a sample
   card)
2. Favicon and `apple-touch-icon` from the HH Goa mark
3. Title / description / `twitter:card` on the root layout
4. Lighthouse mobile — performance ≥ 90, accessibility ≥ 95
5. Delete `/dev/*` routes
6. Point the custom domain, verify HTTPS
7. Verify the production `NEXT_PUBLIC_BASE_URL` is the real domain, not `localhost`

**GATE 7** — open the production URL in an incognito window on a phone. From cold, complete upload →
download → share in under 30 seconds without instructions.

---

## If you fall behind

Cut in this order:
1. Team format (P4) — costs the site-listed requirement, but P0–P3 + P5 still submits
2. Barcode and grain details
3. Paste-from-clipboard
4. Custom domain

**Never cut:** the OG share link (P5.7), mobile testing (P6), or HEIC support (P1). Those are
explicit, named requirements in the brief.
