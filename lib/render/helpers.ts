import type { Stop } from "../types";


export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function linGrad(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: Stop[],
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function radGrad(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  stops: Stop[],
) {
  const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}


export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxW: number,
  minScale = 0.6,
): { font: string; text: string } {
  const m = font.match(/(\d+(?:\.\d+)?)px/);
  if (!m) return { font, text };
  const base = parseFloat(m[1]);

  for (let size = base; size >= base * minScale; size -= 2) {
    const f = font.replace(/\d+(?:\.\d+)?px/, `${size}px`);
    ctx.font = f;
    if (ctx.measureText(text).width <= maxW) return { font: f, text };
  }

  const floorFont = font.replace(
    /\d+(?:\.\d+)?px/,
    `${Math.round(base * minScale)}px`,
  );
  ctx.font = floorFont;

  let t = text;
  while (t.length > 1 && ctx.measureText(t + "\u2026").width > maxW) {
    t = t.slice(0, -1);
  }
  return { font: floorFont, text: t.length < text.length ? t + "\u2026" : t };
}

export function lsText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  ls: number,
  align: CanvasTextAlign = "left",
) {
  if (!ls) {
    const prev = ctx.textAlign;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.textAlign = prev;
    return;
  }

  const chars = [...text];
  const total = chars.reduce((s, c) => s + ctx.measureText(c).width + ls, 0) - ls;
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;

  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + ls;
  }
  ctx.textAlign = prev;
}

export function measureLs(
  ctx: CanvasRenderingContext2D,
  text: string,
  ls: number,
): number {
  if (!ls) return ctx.measureText(text).width;
  const chars = [...text];
  return chars.reduce((s, c) => s + ctx.measureText(c).width + ls, 0) - ls;
}

export function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  r: number,
  centerAngle: number,
  o: { font: string; color: string; letterSpacing?: number; flip?: boolean },
) {
  ctx.save();
  ctx.font = o.font;
  ctx.fillStyle = o.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = [...text];
  const ls = o.letterSpacing ?? 0;
  const widths = chars.map((c) => ctx.measureText(c).width + ls);
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


let grainTile: HTMLCanvasElement | null = null;
let grainKey = "";

/**
 * Regenerating 1.4M pixels of noise on every keystroke makes typing feel laggy,
 * so the tile is generated once and reused.
 */
export function drawGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opacity: number,
) {
  const key = `${w}x${h}@${opacity}`;
  if (grainKey !== key || !grainTile) {
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d")!;
    const d = octx.createImageData(w, h);
    const a = Math.round(opacity * 255);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d.data[i] = v;
      d.data[i + 1] = v;
      d.data[i + 2] = v;
      d.data[i + 3] = a;
    }
    octx.putImageData(d, 0, 0);
    grainTile = off;
    grainKey = key;
  }
  ctx.drawImage(grainTile, 0, 0);
}


export function drawStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rotateDeg: number,
  lines: [string, string],
  color: string,
  seed: number,
  fonts: { top: string; bottom: string },
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rotateDeg * Math.PI) / 180);
  ctx.globalAlpha = 0.62;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  roundRect(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.lineWidth = 5;
  ctx.stroke();

  roundRect(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 6);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = fonts.top;
  lsText(ctx, lines[0], 0, -h * 0.12, 6, "center");
  ctx.font = fonts.bottom;
  lsText(ctx, lines[1], 0, h * 0.24, 3, "center");

  
  ctx.globalCompositeOperation = "destination-out";
  let s = seed || 1;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 520; i++) {
    ctx.beginPath();
    ctx.arc((rnd() - 0.5) * w, (rnd() - 0.5) * h, rnd() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  seed: number,
) {
  ctx.save();
  ctx.fillStyle = color;
  let s = seed || 1;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  let cx = x;
  while (cx < x + w) {
    const bw = 2 + Math.floor(rnd() * 6);
    const gap = 2 + Math.floor(rnd() * 5);
    if (cx + bw > x + w) break;
    ctx.fillRect(cx, y, bw, h);
    cx += bw + gap;
  }
  ctx.restore();
}

export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  h: number,
  canvasW: number,
  font: string,
  color: string,
  bg: string,
  ls = 4,
) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, y, canvasW, h);

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";

  const unit = text + "   \u00B7   ";
  const unitW = measureLs(ctx, unit, ls);
  const midY = y + h / 2;

  let cx = 24;
  while (cx < canvasW) {
    lsText(ctx, unit, cx, midY, ls, "left");
    cx += unitW;
  }
  ctx.restore();
}
