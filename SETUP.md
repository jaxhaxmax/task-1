# Frame in Goa - setup

Unzip, then:

```bash
npm install
cp .env.example .env.local     # fill in later; app runs without it
npm run typecheck              # DO THIS FIRST - see "unverified" below
npm run dev
```

Open http://localhost:3000

## Read this before touching the code

**This code has never been compiled.** It was written carefully against the spec
but `tsc` never ran. Your first task is `npm run typecheck` and fixing whatever
falls out. Expect a handful of small type errors, not architectural problems.

The `docs/` folder contains the full specification - research, judging criteria,
design rationale, and the reasoning behind every decision. Read `docs/README.md`
before changing anything, especially the design.

## Deploy

```bash
npx vercel
```

Then in the Vercel dashboard: **Storage -> Blob -> Create store**, and set all
three variables from `.env.example` in **Settings -> Environment Variables**.

Without `BLOB_READ_WRITE_TOKEN` everything still works - share just degrades from
"link preview shows your graphic" to "download and attach manually." That degraded
path is what every competing submission does, so getting Blob configured is worth
the five minutes.

## Three things only a human can do

1. **Brand Kit.** Footer link on hhgoa.com. Extract into `public/brand/` as
   `goa-devanagari.svg`, `hh-goa-wordmark.svg`, `palm.png`. Then update
   `lib/brand.ts` with the real palette and fonts. Missing assets are skipped
   silently, so the app looks complete without them - just less on-brand.
2. **Vercel Blob token.**
3. **A domain.** Your `/f/{id}` link is the most-seen public artifact here.

## Verify these four before submitting

1. Download produces a real PNG at 1000x1000 (PFP) or 1600x900 (pass)
2. On a physical phone, Share opens the native sheet with the image attached
3. On desktop, Share opens the X composer with caption + link
4. **Paste a `/f/{id}` URL into a real tweet composer and confirm the preview
   shows the generated graphic.** This is the requirement the brief names
   explicitly and the one most submissions fail.

## Where the tricky parts live

| Concern | File | Note |
|---|---|---|
| HEIC + EXIF | `lib/image/load.ts` | native decode first, WASM only on failure |
| Canvas fonts | `lib/render/fonts.ts` | next/font hashes family names - read the comment |
| Auto-framing | `lib/image/crop.ts` | upper-third bias, no ML dependency |
| Share gesture | `lib/share.ts` | File must exist BEFORE the click handler |
| Link preview | `app/f/[id]/page.tsx` | `summary_large_image`, absolute URL |
| Blob storage | `app/api/share/route.ts` | `addRandomSuffix: false` is load-bearing |
| All design tokens | `lib/brand.ts` | one-file Brand Kit swap |
| Layout coordinates | `lib/render/specs/*.ts` | pixel positions for each format |

## Known soft spots

- **Stamp position** on the builder pass is computed from rotation extents but
  never visually checked. If it collides with the data row, adjust `y: 505` in
  `lib/render/specs/idcard.ts`.
- **`handleFile` in `app/page.tsx`** depends on `input`, which changes every
  render. Correct but noisy - narrowing that dependency array is safe.
- **Tailwind v4** uses `@theme` in `app/globals.css` instead of a config file.
  If `bg-coral` or `font-display` don't resolve, that is where to look.
- **`lib/render/specs/team.ts` is ~113 lines** because it imports its chrome from
  `idcard.ts`. If it grows past ~150 someone has started duplicating.
