# 05 — Critical Code

Seven things break in every project of this shape. Here they are, solved. Use these as written;
where the comment says a line is load-bearing, it is.

---

## 1. Image loading — HEIC + EXIF · `lib/image/load.ts`

Two independent traps. **HEIC**: desktop browsers can't decode it, iOS Safari can. **EXIF
orientation**: phone photos carry a rotation flag and `createImageBitmap` does not apply it by
default, so portraits arrive sideways.

```ts
const HEIC_RE = /\.(heic|heif)$/i;

function isHeic(file: File) {
  // iOS often reports an EMPTY mime type for HEIC — never trust type alone
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name);
}

export async function loadImage(file: File): Promise<ImageBitmap> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('That photo is over 25MB. Try a smaller one.');
  }

  // Try native first. iOS Safari decodes HEIC natively, so ~half of HEIC users
  // never download the 1.5MB WASM at all.
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
    //                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                              LOAD-BEARING. Without it, portraits are sideways.
  } catch {
    // fall through
  }

  if (isHeic(file)) {
    const { default: heic2any } = await import('heic2any'); // dynamic ONLY
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(out) ? out[0] : out;
    return await createImageBitmap(blob as Blob, { imageOrientation: 'from-image' });
  }

  // Last resort: <img> decode. Modern browsers apply EXIF here automatically
  // (CSS image-orientation defaults to from-image).
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}
```

**Notes**
- Never import `heic2any` at module top level. It bundles libheif WASM and will land in your initial
  chunk.
- A 12MP HEIC can take 2–4s to convert. This is the only path that gets a status message.
- Call `bitmap.close()` when replacing a photo. Six 12MP bitmaps in team mode is real memory.

---

## 2. Cover crop with focal bias · `lib/image/crop.ts`

The brief says *don't assume users will crop first*. This is the 90% solution with zero dependencies:
faces sit in the upper portion of nearly every portrait, so bias the crop upward instead of centring.

```ts
export type Focal = { x: number; y: number; zoom: number };

export function defaultFocal(imgW: number, imgH: number, dstW: number, dstH: number): Focal {
  const imgAspect = imgW / imgH;
  const dstAspect = dstW / dstH;
  // Taller than the target => we crop vertically => keep the top, where the face is.
  const y = imgAspect < dstAspect ? 0.3 : 0.5;
  return { x: 0.5, y, zoom: 1 };
}

export function coverRect(
  imgW: number, imgH: number, dstW: number, dstH: number, f: Focal
) {
  const base = Math.max(dstW / imgW, dstH / imgH);
  const scale = base * f.zoom;
  const sw = Math.min(imgW, dstW / scale);
  const sh = Math.min(imgH, dstH / scale);
  const sx = clamp((imgW - sw) * f.x, 0, imgW - sw);
  const sy = clamp((imgH - sh) * f.y, 0, imgH - sh);
  return { sx, sy, sw, sh };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
```

Drag-to-reposition maps pixel delta to focal delta:

```ts
// in the pointermove handler
const scaleFactor = canvas.width / canvas.getBoundingClientRect().width;
setFocal(f => ({
  ...f,
  x: clamp(f.x - (dx * scaleFactor) / sw, 0, 1),
  y: clamp(f.y - (dy * scaleFactor) / sh, 0, 1),
}));
```

**Optional face detection (P2, only if ahead of schedule).** `FaceDetector` ships in very few
browsers, so it must be a pure enhancement:

```ts
export async function detectFocal(bmp: ImageBitmap): Promise<Focal | null> {
  if (!('FaceDetector' in window)) return null;
  try {
    // @ts-expect-error — not in lib.dom
    const faces = await new FaceDetector({ maxDetectedFaces: 6, fastMode: true }).detect(bmp);
    if (!faces.length) return null;
    const cx = avg(faces.map(f => f.boundingBox.x + f.boundingBox.width / 2)) / bmp.width;
    const cy = avg(faces.map(f => f.boundingBox.y + f.boundingBox.height / 2)) / bmp.height;
    return { x: clamp(cx, 0.15, 0.85), y: clamp(cy, 0.15, 0.85), zoom: 1 };
  } catch { return null; }
}
```

Render with the heuristic focal immediately; if detection resolves later, update. Never block the
first paint on it.

---

## 3. Canvas helpers · `lib/render/helpers.ts`

### Arc text — for the PFP ring

The `flip` argument is the whole reason this function exists. Without it, text on the bottom of the
ring renders upside down.

```ts
export function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string, cx: number, cy: number, r: number,
  centerAngle: number,
  o: { font: string; color: string; letterSpacing?: number; flip?: boolean }
) {
  ctx.save();
  ctx.font = o.font;
  ctx.fillStyle = o.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = [...text];
  const ls = o.letterSpacing ?? 0;
  const widths = chars.map(c => ctx.measureText(c).width + ls);
  const totalAngle = widths.reduce((a, b) => a + b, 0) / r;
  const dir = o.flip ? -1 : 1;

  let a = centerAngle - (dir * totalAngle) / 2;
  for (let i = 0; i < chars.length; i++) {
    const step = widths[i] / r;
    a += (dir * step) / 2;
    ctx.save();
    ctx.translate(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.rotate(a + (o.flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    a += (dir * step) / 2;
  }
  ctx.restore();
}
```

Canvas angles: `0` = right, `-PI/2` = up, `PI/2` = down.
Top arc → `centerAngle: -Math.PI/2`, `flip: false`.
Bottom arc → `centerAngle: Math.PI/2`, `flip: true`.

### Auto-shrinking text

```ts
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string, font: string, maxW: number, minScale = 0.6
) {
  const m = font.match(/(\d+(?:\.\d+)?)px/);
  if (!m) return font;
  const base = parseFloat(m[1]);
  for (let size = base; size >= base * minScale; size -= 2) {
    const f = font.replace(/\d+(?:\.\d+)?px/, `${size}px`);
    ctx.font = f;
    if (ctx.measureText(text).width <= maxW) return f;
  }
  return font.replace(/\d+(?:\.\d+)?px/, `${Math.round(base * minScale)}px`);
}
```

Below `minScale`, ellipsise rather than shrinking further — a 30px name on a 92px slot looks broken.

### Letter-spaced text

`ctx.letterSpacing` exists in Chrome but not Safari, so draw per character:

```ts
export function lsText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  ls: number, align: CanvasTextAlign = 'left'
) {
  const chars = [...text];
  const total = chars.reduce((s, c) => s + ctx.measureText(c).width + ls, 0) - ls;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + ls; }
  ctx.textAlign = prev;
}
```

### The stamp — signature element

The distress pass is what makes it read as ink rather than clipart. Do not skip it.

```ts
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, rotate: number,
  lines: [string, string], color: string, seed: number
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.globalAlpha = 0.62;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  roundRect(ctx, -w / 2, -h / 2, w, h, 10); ctx.lineWidth = 5; ctx.stroke();
  roundRect(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 6); ctx.lineWidth = 2; ctx.stroke();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 52px "JetBrains Mono", monospace';
  lsText(ctx, lines[0], 0, -14, 6, 'center');
  ctx.font = '400 26px "JetBrains Mono", monospace';
  lsText(ctx, lines[1], 0, 36, 3, 'center');

  // Distress: punch deterministic holes so it looks like pressed ink.
  ctx.globalCompositeOperation = 'destination-out';
  let s = seed || 1;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 500; i++) {
    ctx.beginPath();
    ctx.arc((rnd() - 0.5) * w, (rnd() - 0.5) * h, rnd() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
```

### Grain

```ts
export function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number, opacity: number) {
  const d = ctx.createImageData(w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d.data[i] = d.data[i+1] = d.data[i+2] = v;
    d.data[i+3] = (opacity * 255) | 0;
  }
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  off.getContext('2d')!.putImageData(d, 0, 0);
  ctx.drawImage(off, 0, 0);
}
```

Generate the grain tile **once** and cache it in a module-level variable. Regenerating 1.4M pixels on
every keystroke will make typing feel laggy.

---

## 4. Engine · `lib/render/engine.ts`

```ts
export async function renderSpec(
  spec: FormatSpec, input: RenderInput, target?: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;   // LOAD-BEARING — first line, always.

  const canvas = target ?? document.createElement('canvas');
  canvas.width = spec.w;
  canvas.height = spec.h;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.clearRect(0, 0, spec.w, spec.h);

  for (const l of spec.background) drawLayer(ctx, l, input, spec);

  spec.photoSlots.forEach((slot, i) => {
    const bmp = input.photos[i];
    if (!bmp) { drawPlaceholder(ctx, slot); return; }
    const f = input.focals[i] ?? { x: .5, y: .35, zoom: 1 };
    const { sx, sy, sw, sh } = coverRect(bmp.width, bmp.height, slot.w, slot.h, f);
    ctx.save();
    clipToSlot(ctx, slot);
    ctx.drawImage(bmp, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
    if (slot.ring) drawRing(ctx, slot);
  });

  for (const l of spec.foreground) drawLayer(ctx, l, input, spec);
  return canvas;
}
```

`drawLayer` is a `switch` over `Layer['kind']`. Keep it exhaustive with a `never` default so adding a
layer type is a compile error until it's handled.

**Do not apply `devicePixelRatio`.** The canvas renders at fixed export resolution and is scaled down
by CSS. Applying DPR would change the export size and break every hardcoded coordinate.

---

## 5. Share — the part that decides the score · `lib/share.ts`

The critical constraint: **`navigator.share` must be reached without an intervening network await.**
iOS Safari treats the gesture as consumed and throws `NotAllowedError`. So the `File` is built
eagerly at render time and the blob upload runs in the background.

```ts
// Called on every render completion, NOT on click.
export async function prepareShare(
  artCanvas: HTMLCanvasElement, ogCanvas: HTMLCanvasElement, serial: string
) {
  const art = await toBlob(artCanvas);
  const og  = await toBlob(ogCanvas);
  const file = new File([art], `framein-goa-${serial}.png`, { type: 'image/png' });

  const fd = new FormData();
  fd.append('art', art);
  fd.append('og', og);
  const upload = fetch('/api/share', { method: 'POST', body: fd })
    .then(r => r.json() as Promise<{ id: string | null }>)
    .catch(() => ({ id: null }));

  return { file, upload };   // store BOTH in refs
}

// Called directly from the click handler.
export async function shareToX(
  file: File | null,
  upload: Promise<{ id: string | null }> | null,
  caption: string
) {
  // TIER A — mobile native share sheet, image attached.
  // canShare() is synchronous, so the gesture survives into navigator.share().
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: caption });
      return 'native';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled';   // user closed the sheet
      // any other error: fall through
    }
  }

  // TIER B — OG link. The upload has been running since render; usually already resolved.
  const { id } = (await upload) ?? { id: null };
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const url = id ? `${base}/f/${id}` : base;
  window.open(
    `https://x.com/intent/post?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(url)}`,
    '_blank', 'noopener'
  );
  return id ? 'link' : 'link-fallback';
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((res, rej) =>
    c.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
```

**Do not include `url` alongside `files` in `navigator.share`.** Some Android targets drop the image
when both are present. Files plus text only.

**Tier C (clipboard)** is an optional extra button, not part of the main path:

```ts
await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
```

Chrome-only, and must also be inside a gesture.

### Download

```ts
const url = URL.createObjectURL(blob);
const a = Object.assign(document.createElement('a'), {
  href: url, download: `framein-goa-${format}-${serial}.png`,
});
document.body.appendChild(a); a.click(); a.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);  // immediate revoke breaks Safari
```

---

## 6. Blob route · `app/api/share/route.ts`

```ts
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ id: null });

  try {
    const fd = await req.formData();
    const art = fd.get('art') as Blob | null;
    const og  = fd.get('og')  as Blob | null;
    if (!art || !og) return Response.json({ id: null }, { status: 400 });
    if (art.size > 5_000_000 || og.size > 5_000_000) {
      return Response.json({ id: null }, { status: 413 });
    }

    const id = nanoid(8);
    await Promise.all([
      put(`f/${id}.png`,    art, { access: 'public', contentType: 'image/png',
                                   addRandomSuffix: false }),
      put(`f/${id}-og.png`, og,  { access: 'public', contentType: 'image/png',
                                   addRandomSuffix: false }),
    ]);
    return Response.json({ id });
  } catch {
    return Response.json({ id: null }, { status: 500 });   // never throw — share degrades
  }
}
```

**`addRandomSuffix: false` is load-bearing.** It makes the stored URL deterministic
(`${NEXT_PUBLIC_BLOB_BASE_URL}/f/{id}.png`), which is what removes the need for a database. Verify
this against your installed `@vercel/blob` version — some releases default it to `true`.

Vercel serverless request bodies cap around 4.5MB. Two PNGs of this size land near 1–1.5MB total, so
there is headroom, but the size guard above stops a pathological case.

---

## 7. OG metadata · `app/f/[id]/page.tsx`

```ts
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };
//                     ^^^^^^^ Next 15: params is a Promise. Awaiting it is required.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const img = `${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/f/${id}-og.png`;
  const title = 'I got my Hacker House Goa 2026 pass';
  const description = 'Drop a photo, get your HH Goa 2026 frame or builder pass. #FrameInGoa';

  return {
    title, description,
    openGraph: {
      title, description, type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/f/${id}`,
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',   // LOAD-BEARING — 'summary' gives a tiny square thumbnail
      title, description, images: [img],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const art = `${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/f/${id}.png`;
  // Render: the graphic, a Download button, and a large "Make yours →" CTA linking to "/".
  // This page IS the growth loop — every shared tweet routes new users through it.
}
```

**Also required:** `metadataBase` in `app/layout.tsx`, or relative OG URLs resolve wrong in
production:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL!),
};
```

### Verifying the card

X's Card Validator is retired. Test by pasting the URL into a real X composer on a throwaway account
and watching the preview render, or use opengraph.xyz. Common failure causes, in order of frequency:

1. `twitter:card` set to `summary` instead of `summary_large_image` → tiny square thumbnail
2. Image URL not absolute or not publicly reachable → blank preview
3. `metadataBase` missing → relative URL resolves to `localhost` in production
4. Blob pathname got a random suffix → 404 at the reconstructed URL
5. Image over 5MB → X silently drops it
