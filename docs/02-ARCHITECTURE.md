# 02 — Architecture

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | needed for per-URL OG metadata |
| Styling | **Tailwind CSS v4** | app UI only — the graphic is canvas, not DOM |
| Rendering | **Canvas 2D, hand-rolled** | no Fabric, no Konva, no html2canvas |
| Storage | **Vercel Blob** (`@vercel/blob`) | R2/Supabase acceptable substitutes |
| Fonts | `next/font/google`, self-hosted | see `03-DESIGN-SPEC.md` §2 |
| HEIC | `heic2any`, **dynamically imported** | ~1.5MB, must never be in the main bundle |
| IDs | `nanoid` | 8-char share IDs |
| Deploy | Vercel | |

**No state library. No form library. No animation library.** The app has one screen and about eight
pieces of state. `useState` and `useRef` are sufficient. Adding Zustand or react-hook-form here costs
time and bundle size for nothing.

### package.json dependencies

```
next@^15  react@^19  react-dom@^19
@vercel/blob
nanoid
heic2any            (dynamic import only)
tailwindcss@^4  @tailwindcss/postcss
typescript  @types/react  @types/node
```

That is the entire list. If you find yourself adding a tenth dependency, stop and reconsider.

---

## 2. File tree

```
app/
  layout.tsx                 root layout, fonts, metadataBase
  page.tsx                   the entire tool (single screen)
  globals.css                tailwind + brand CSS vars
  opengraph-image.png        static OG for the landing page
  f/
    [id]/
      page.tsx               share landing — generateMetadata emits og:image
  api/
    share/
      route.ts               POST: accepts art + og blobs, returns { id }

components/
  Uploader.tsx               drop zone / file input / paste handler
  FormatTabs.tsx             PFP · BUILDER PASS · TEAM
  Preview.tsx                canvas element + drag-to-reposition + zoom
  Fields.tsx                 name / role inputs, title reveal + re-roll
  TeamRoster.tsx             2–6 member rows (photo + name)
  ShareBar.tsx               Download · Share · Copy link
  Toast.tsx                  minimal inline status messages

lib/
  brand.ts                   ★ ALL design tokens. Single point of Brand Kit swap.
  types.ts                   FormatSpec, Layer, PhotoSlot, RenderInput
  hash.ts                    cyrb53
  builder-title.ts           deterministic title + rarity + serial
  share.ts                   web share / intent / clipboard orchestration
  caption.ts                 X caption templates
  image/
    load.ts                  File → ImageBitmap (HEIC + EXIF handled)
    crop.ts                  cover-crop math, focal bias, zoom
    faces.ts                 optional native FaceDetector, feature-detected
  render/
    engine.ts                renderSpec(spec, input) → HTMLCanvasElement
    helpers.ts               arcText, roundRect, fitText, marquee, grain, stamp
    specs/
      pfp.ts                 1000×1000
      idcard.ts              1600×900
      team.ts                1600×900
      og.ts                  1200×630 composite

public/
  brand/                     logos, wordmarks, गोवा mark, textures
  fonts/                     if not using next/font
```

---

## 3. Data flow

```
File
 │
 ├─ loadImage()        HEIC detect → native decode → heic2any fallback
 │                     createImageBitmap(blob, { imageOrientation: 'from-image' })
 ▼
ImageBitmap ──────────────────────────────────────────┐
                                                      │
User input (name, role, team) ──► builderTitle()      │
                                  ├─ title            │
                                  ├─ rarity           │
                                  └─ serial #NNN/247  │
                                                      ▼
                                          renderSpec(spec, input)
                                                      │
                                          ┌───────────┴───────────┐
                                          ▼                       ▼
                                    art canvas              og canvas (1200×630)
                                          │                       │
                        ┌─────────────────┼───────────┐           │
                        ▼                 ▼           ▼           ▼
                  display preview    toBlob → File  ┌──── POST /api/share ────┐
                     (CSS scaled)    (kept in ref)  │  put both to Blob        │
                                          │         │  return { id }           │
                                          │         └──────────┬───────────────┘
                                          ▼                    ▼
                                     Download            /f/{id} OG link
                                     navigator.share      x.com/intent/post
```

**The upload to `/api/share` fires automatically in the background as soon as a render completes**,
debounced ~400ms. By the time the user reaches for the share button, `id` already exists. This is
what makes the share feel instant and is what preserves the iOS user gesture.

---

## 4. The render contract (`lib/types.ts`)

This is the most important file in the project. Three formats become three data objects rather than
three components.

```ts
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type RenderInput = {
  photos: (ImageBitmap | null)[];      // index-matched to spec.photoSlots
  focals: { x: number; y: number; zoom: number }[];  // per photo, user-adjustable
  name: string;
  role: string;
  team?: string;
  title: string;
  rarity: Rarity;
  serial: string;                      // "042"
  memberNames?: string[];              // team format
};

export type PhotoSlot = {
  x: number; y: number; w: number; h: number;
  shape: 'circle' | 'rect';
  radius?: number;                     // rect corner rounding
  ring?: { width: number; colors: string[] };
  shadow?: boolean;
};

export type TextLayer = {
  kind: 'text';
  value: string | ((i: RenderInput) => string);
  x: number; y: number;
  font: string;                        // full CSS font shorthand
  color: string | ((i: RenderInput) => string);
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxW?: number;                       // triggers auto-shrink
  minSize?: number;                    // floor for auto-shrink, default 60% of base
  letterSpacing?: number;              // px, applied per character
  upper?: boolean;
};

export type Layer =
  | { kind: 'fill'; color: string }
  | { kind: 'linearGradient'; x0:number; y0:number; x1:number; y1:number;
      stops: [number, string][] }
  | { kind: 'radialGradient'; cx:number; cy:number; r0:number; r1:number;
      stops: [number, string][] }
  | { kind: 'asset'; src: string; x:number; y:number; w:number; h:number;
      opacity?: number; blend?: GlobalCompositeOperation }
  | { kind: 'rect'; x:number; y:number; w:number; h:number; radius?: number;
      fill?: string; stroke?: string; lineWidth?: number }
  | { kind: 'dashed'; x0:number; y0:number; x1:number; y1:number;
      dash: number[]; color: string; width: number }
  | { kind: 'notch'; cx:number; cy:number; r:number; color: string }
  | { kind: 'marquee'; text: string; y:number; h:number; font: string;
      color: string; bg: string; gap?: number }
  | { kind: 'arcText'; value: string; cx:number; cy:number; r:number;
      centerAngle: number; flip?: boolean; font: string; color: string;
      letterSpacing?: number }
  | { kind: 'stamp'; x:number; y:number; w:number; h:number; rotate: number;
      lines: string[]; color: string }
  | { kind: 'grain'; opacity: number }
  | TextLayer
  | { kind: 'custom'; draw: (ctx: CanvasRenderingContext2D, input: RenderInput) => void }
  | { kind: 'when'; cond: (i: RenderInput) => boolean; layers: Layer[] };

export type FormatSpec = {
  id: 'pfp' | 'idcard' | 'team' | 'og';
  w: number;
  h: number;
  background: Layer[];   // drawn first
  photoSlots: PhotoSlot[];
  foreground: Layer[];   // drawn over the photos — all chrome and text lives here
};
```

### Engine signature

```ts
export async function renderSpec(
  spec: FormatSpec,
  input: RenderInput,
  target?: HTMLCanvasElement
): Promise<HTMLCanvasElement>
```

Order of operations, exactly:

1. `await document.fonts.ready` — **before anything else**
2. size canvas to `spec.w × spec.h` (no devicePixelRatio scaling; fixed export resolution)
3. draw `spec.background` in order
4. for each `photoSlot`, if a photo exists: `ctx.save()` → clip to shape → `drawImage` with
   cover-crop rect from `crop.ts` → `ctx.restore()` → draw ring if specified
5. draw `spec.foreground` in order
6. return the canvas

Preview is the same canvas element with `style="width:100%; height:auto"`. Do not maintain two
canvases and do not re-render at a preview resolution — a 1600×900 render is ~15ms.

### Why declarative

`team.ts` is `idcard.ts` with a different `photoSlots` array and three swapped text layers. Writing
it as a second React component would duplicate the crop pipeline, the font handling, the grain, the
marquee, and the stamp. Adding the fourth format (`og.ts`) costs about twenty lines.

---

## 5. Component state

Keep it all in `page.tsx`. Roughly:

```ts
const [format, setFormat]   = useState<'pfp'|'idcard'|'team'>('pfp');
const [photos, setPhotos]   = useState<(ImageBitmap|null)[]>([null]);
const [focals, setFocals]   = useState([{ x: .5, y: .35, zoom: 1 }]);
const [name, setName]       = useState('');
const [role, setRole]       = useState('');
const [team, setTeam]       = useState('');
const [salt, setSalt]       = useState(0);            // re-roll counter
const [status, setStatus]   = useState<'idle'|'decoding'|'ready'|'error'>('idle');

const canvasRef  = useRef<HTMLCanvasElement>(null);
const fileRef    = useRef<File|null>(null);           // eager File for navigator.share
const shareIdRef = useRef<Promise<{id:string|null}>|null>(null);
```

Derive the title, never store it:

```ts
const { title, rarity, serial } = useMemo(
  () => builderTitle(name, role, salt), [name, role, salt]
);
```

Persist `name` and `role` to `localStorage` so returning users and format-switchers don't retype.
Never persist photos.

---

## 6. Environment variables

```bash
BLOB_READ_WRITE_TOKEN=          # from Vercel dashboard → Storage → Blob
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_BLOB_BASE_URL=https://<store-id>.public.blob.vercel-storage.com
```

`NEXT_PUBLIC_BLOB_BASE_URL` lets `/f/[id]` reconstruct the image URL from the id alone, so **no
database is needed**. This requires `addRandomSuffix: false` on every `put()` call. Verify this — an
older `@vercel/blob` default appended a random suffix, which would break the reconstruction.

**Graceful degradation:** if `BLOB_READ_WRITE_TOKEN` is absent, `/api/share` returns
`{ id: null }`. The client then falls back to Web Share (mobile) or download + intent link to the
homepage (desktop). The app must never break because storage is unconfigured.

---

## 7. Performance budget

| Metric | Target | How |
|---|---|---|
| Landing JS (gzip) | < 180 KB | no state/form/animation libs; heic2any dynamic |
| LCP on 4G mobile | < 2.0 s | server-render the shell, canvas mounts empty |
| JPEG upload → visible render | < 1.5 s | client-only; `createImageBitmap` is off-main-thread |
| HEIC upload → visible render | < 4 s | native decode first; WASM only on failure |
| Format switch | < 50 ms | bitmap already decoded, just re-run `renderSpec` |
| Field keystroke → re-render | < 30 ms | debounce 120ms, re-render whole canvas (it's cheap) |

Do not add a progress bar for the JPEG path. It finishes before a spinner would fade in. Show a
status line only for the HEIC conversion path, where the wait is real.
