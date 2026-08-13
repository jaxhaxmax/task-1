/**
 * Low-level canvas primitives for the builder pass.
 * No dependencies. No devicePixelRatio scaling anywhere — the canvas
 * renders at fixed export resolution and is scaled DOWN by CSS. Applying
 * DPR would change the export size and invalidate every coordinate.
 */

export type Ctx = CanvasRenderingContext2D;
export type Align = 'left' | 'right' | 'center';

/* ------------------------------------------------------------------ */
/* shapes                                                              */
/* ------------------------------------------------------------------ */

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* text                                                                */
/* ------------------------------------------------------------------ */

/**
 * Manual letter-spacing. ctx.letterSpacing exists but only lands in
 * Chrome 99+ / Safari 17.4+, and this has to work on a three-year-old
 * Android in a beach resort with bad wifi.
 *
 * NEVER apply tracking to Devanagari — per-glyph drawing destroys the
 * shaping and combining marks detach. Latin and digits only.
 */
export function measureTracked(ctx: Ctx, text: string, tracking: number): number {
  if (!text) return 0;
  if (tracking === 0) return ctx.measureText(text).width;
  let w = 0;
  let n = 0;
  for (const ch of text) {
    w += ctx.measureText(ch).width + tracking;
    n++;
  }
  return n ? w - tracking : 0;
}

export function drawTracked(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: Align = 'left',
): number {
  // Zero tracking: draw as one string so Devanagari shaping survives.
  // Per-glyph drawing detaches combining marks (matras).
  if (tracking === 0) {
    const w = ctx.measureText(text).width;
    const prevAlign = ctx.textAlign;
    ctx.textAlign = align;
    ctx.fillText(text, align === 'left' ? x : align === 'right' ? x : x, y);
    ctx.textAlign = prevAlign;
    return w;
  }
  const total = measureTracked(ctx, text, tracking);
  let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  ctx.textAlign = prevAlign;
  return total;
}

/** A span of text with its own face and colour, set on a shared baseline. */
export type Run = { text: string; font: string; color: string; tracking?: number; gap?: number };

export function measureRuns(ctx: Ctx, runs: Run[]): number {
  let w = 0;
  for (const r of runs) {
    ctx.font = r.font;
    w += measureTracked(ctx, r.text, r.tracking ?? 0) + (r.gap ?? 0);
  }
  return w;
}

export function drawRuns(ctx: Ctx, runs: Run[], x: number, y: number, align: Align = 'left'): number {
  const total = measureRuns(ctx, runs);
  let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  for (const r of runs) {
    ctx.font = r.font;
    ctx.fillStyle = r.color;
    cx += drawTracked(ctx, r.text, cx, y, r.tracking ?? 0, 'left') + (r.gap ?? 0);
  }
  return total;
}

/**
 * Largest size in [min, max] whose rendered width fits maxW.
 * Linear walk down in 1px steps — at most ~50 measureText calls, which is
 * microseconds, and it never overshoots the way a binary search can.
 */
export function fitFont(
  ctx: Ctx,
  text: string,
  maxW: number,
  makeFont: (size: number) => string,
  max: number,
  min: number,
  tracking = 0,
): number {
  for (let s = max; s > min; s--) {
    ctx.font = makeFont(s);
    if (measureTracked(ctx, text, tracking) <= maxW) return s;
  }
  return min;
}

/** LinkedIn slugs are long. Cut the middle, keep both ends recognisable. */
export function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  const keep = max - 1;
  const head = Math.ceil(keep / 2);
  const tail = Math.floor(keep / 2);
  return `${s.slice(0, head)}\u2026${s.slice(s.length - tail)}`;
}

/* ------------------------------------------------------------------ */
/* images                                                              */
/* ------------------------------------------------------------------ */

export type PhotoSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

export function dimsOf(src: PhotoSource): { w: number; h: number } {
  const nat = (src as HTMLImageElement).naturalWidth;
  if (typeof nat === 'number' && nat > 0) {
    return { w: nat, h: (src as HTMLImageElement).naturalHeight };
  }
  return { w: (src as ImageBitmap).width, h: (src as ImageBitmap).height };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Source rect for a cover crop.
 * focal is 0..1 in source space. Default y is 0.36, not 0.5 — faces sit
 * in the upper third of a portrait and a centred crop cuts the forehead.
 * Zero dependencies, works everywhere, right about 90% of the time. The
 * drag-to-reposition handle covers the other 10%.
 */
export function coverRect(
  iw: number,
  ih: number,
  dw: number,
  dh: number,
  focal: { x: number; y: number } = { x: 0.5, y: 0.36 },
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  return {
    sx: clamp((iw - sw) * focal.x, 0, Math.max(0, iw - sw)),
    sy: clamp((ih - sh) * focal.y, 0, Math.max(0, ih - sh)),
    sw,
    sh,
  };
}

/** Destination rect for a contain fit — used by the OG composite so no face is ever cropped. */
export function containRect(
  iw: number,
  ih: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(bw / iw, bh / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { x: bx + (bw - w) / 2, y: by + (bh - h) / 2, w, h };
}

/* ------------------------------------------------------------------ */
/* texture                                                             */
/* ------------------------------------------------------------------ */

/** mulberry32 — tiny, seedable, good enough for tile jitter. */
export function seededRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plaster grain, generated once at module scope.
 * Regenerating 50k pixels on every keystroke makes typing visibly lag —
 * this is the difference between a field that feels instant and one that
 * stutters, and it costs one module-level variable.
 */
let grainTile: HTMLCanvasElement | null = null;

function getGrain(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (grainTile) return grainTile;

  const S = 220;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  if (!g) return null;

  const img = g.createImageData(S, S);
  const rand = seededRand(2471026);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rand();
    const dark = v < 0.5;
    img.data[i] = dark ? 40 : 255;
    img.data[i + 1] = dark ? 30 : 250;
    img.data[i + 2] = dark ? 20 : 240;
    // sparse — a dense field reads as TV static, not lime plaster
    img.data[i + 3] = v > 0.86 || v < 0.06 ? 255 : 0;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

export function paintGrain(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
): void {
  const t = getGrain();
  if (!t) return;
  const p = ctx.createPattern(t, 'repeat');
  if (!p) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* handles                                                             */
/* ------------------------------------------------------------------ */

/**
 * Accepts anything a human might paste — a full profile URL, an @handle,
 * a bare username — and returns the bare username.
 * Never make someone retype something they already have on their clipboard.
 */
export function normaliseHandle(raw: string): string {
  let s = (raw ?? '').trim();
  if (!s) return '';
  s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  s = s.replace(/^(github\.com|x\.com|twitter\.com)\//i, '');
  s = s.replace(/^linkedin\.com\/(in|pub)\//i, '');
  s = s.replace(/^@+/, '');
  s = s.split(/[?#]/)[0] ?? s;
  s = s.replace(/\/+$/, '');
  return s.trim();
}
