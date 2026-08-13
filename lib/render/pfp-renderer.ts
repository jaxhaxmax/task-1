/**
 * HH Goa 2026 — PFP frame renderer
 * 1000×1000, annular frame, circle-crop safe.
 *
 * Integration notes:
 *  - Call `await ensureFonts()` before `renderPFP()`
 *  - Pass `{ fD, fM }` from lib/render/fonts.ts via the `fonts` field
 */

import { fD, fM, fDev } from "./fonts";

// ── Tokens (mirrors lib/brand.ts) ─────────────────────────────────────────

export const BRAND = {
  ink: "#0D1B2A",
  deep: "#173A5E",
  coral: "#FF5A36",
  mango: "#FFB238",
  foam: "#7FD1C1",
  sand: "#F2E8D5",
} as const;

// ── Geometry ──────────────────────────────────────────────────────────────

export const PFP_SIZE = 1000;
const CX = PFP_SIZE / 2;

const R_PHOTO = 418; // photo circle + inner edge of the band
const R_OUT = 494;   // outer edge — 6px inside the 500 mask for antialiasing
const R_MID = 456;   // band centreline

const DEG = Math.PI / 180;

const ZONE = {
  topArc: -90 * DEG,
  bottomArc: 90 * DEG,
  perfStart: -22 * DEG,
  perfEnd: 22 * DEG,
  gaugeStart: 158 * DEG,
  gaugeEnd: 202 * DEG,
};

const CLASSES = ["STANDARD", "PRIORITY", "BUSINESS", "FOUNDER"] as const;
export type PFPRarity = (typeof CLASSES)[number];

// ── Types ─────────────────────────────────────────────────────────────────

export type PFPInput = {
  photo: (ImageBitmap | HTMLCanvasElement) & { width: number; height: number };
  rarity: PFPRarity;
  serial: string;
  focal?: { x: number; y: number };
  goaAsset?: CanvasImageSource;
};

// ── Rarity mapping ────────────────────────────────────────────────────────

export function toPFPRarity(r: string): PFPRarity {
  switch (r) {
    case "legendary": return "FOUNDER";
    case "epic":      return "BUSINESS";
    case "rare":      return "PRIORITY";
    default:          return "STANDARD";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function annulusPath(ctx: CanvasRenderingContext2D, rIn: number, rOut: number) {
  ctx.beginPath();
  ctx.arc(CX, CX, rOut, 0, Math.PI * 2, false);
  ctx.arc(CX, CX, rIn, 0, Math.PI * 2, true);
  ctx.closePath();
}

function coverSquare(iw: number, ih: number, fx: number, fy: number) {
  const side = Math.min(iw, ih);
  const sx = clamp((iw - side) * fx, 0, iw - side);
  const sy = clamp((ih - side) * fy, 0, ih - side);
  return { sx, sy, sw: side, sh: side };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  radius: number,
  centerAngle: number,
  font: string,
  color: string,
  letterSpacing = 0,
  flip = false,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width + letterSpacing);
  const total = widths.reduce((a, b) => a + b, 0);
  const totalAngle = total / radius;
  const dir = flip ? -1 : 1;

  let angle = centerAngle - (dir * totalAngle) / 2;

  for (let i = 0; i < chars.length; i++) {
    const stepAngle = widths[i] / radius;
    const a = angle + (dir * stepAngle) / 2;

    ctx.save();
    ctx.translate(CX + Math.cos(a) * radius, CX + Math.sin(a) * radius);
    ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();

    angle += dir * stepAngle;
  }
  ctx.restore();
}

// ── Grain, cached at module level ────────────────────────────────────────

let grainTile: CanvasPattern | null = null;

function getGrain(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (grainTile) return grainTile;
  const TILE = 256;
  const off = document.createElement("canvas");
  off.width = off.height = TILE;
  const octx = off.getContext("2d");
  if (!octx) return null;

  const img = octx.createImageData(TILE, TILE);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(off, "repeat");
  return grainTile;
}

// ── Layer draws ───────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BRAND.ink;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);

  const sky = ctx.createRadialGradient(CX, 320, 0, CX, 320, 700);
  sky.addColorStop(0, rgba(BRAND.deep, 0.55));
  sky.addColorStop(1, rgba(BRAND.deep, 0));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);
}

function drawRingBody(ctx: CanvasRenderingContext2D) {
  ctx.save();
  annulusPath(ctx, R_PHOTO, R_OUT);
  ctx.clip();

  const ramp = ctx.createLinearGradient(180, 180, 820, 820);
  ramp.addColorStop(0, BRAND.coral);
  ramp.addColorStop(1, BRAND.mango);
  ctx.fillStyle = ramp;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);

  const bloom = ctx.createRadialGradient(CX, 60, 0, CX, 60, 420);
  bloom.addColorStop(0, rgba(BRAND.mango, 0.55));
  bloom.addColorStop(1, rgba(BRAND.mango, 0));
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);

  ctx.restore();
}

function drawPhoto(ctx: CanvasRenderingContext2D, input: PFPInput) {
  const { photo } = input;
  const fx = input.focal?.x ?? 0.5;
  const fy = input.focal?.y ?? 0.42;

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CX, R_PHOTO, 0, Math.PI * 2);
  ctx.clip();

  const { sx, sy, sw, sh } = coverSquare(photo.width, photo.height, fx, fy);
  // Mild correction for hazy phone snaps — reset BEFORE the vignette
  ctx.filter = 'contrast(1.08) saturate(1.06)';
  ctx.drawImage(
    photo as CanvasImageSource,
    sx, sy, sw, sh,
    CX - R_PHOTO, CX - R_PHOTO, R_PHOTO * 2, R_PHOTO * 2,
  );
  ctx.filter = 'none';

  // Inner vignette — drawn after filter reset so it is not boosted
  const vig = ctx.createRadialGradient(CX, CX, R_PHOTO - 26, CX, CX, R_PHOTO);
  vig.addColorStop(0, rgba(BRAND.ink, 0));
  vig.addColorStop(1, rgba(BRAND.ink, 0.18));
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);

  ctx.restore();
}

function drawEdges(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(CX, CX, R_PHOTO + 1.5, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = BRAND.ink;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CX, R_PHOTO + 4.25, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgba(BRAND.foam, 0.4);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CX, R_OUT - 3.5, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgba(BRAND.sand, 0.22);
  ctx.stroke();
}

function drawPerforation(ctx: CanvasRenderingContext2D) {
  const span = ZONE.perfEnd - ZONE.perfStart;
  const arcLen = span * R_MID;
  const spacing = 20;
  const count = Math.max(2, Math.round(arcLen / spacing));

  ctx.fillStyle = BRAND.ink;
  for (let i = 0; i <= count; i++) {
    const a = ZONE.perfStart + (span * i) / count;
    ctx.beginPath();
    ctx.arc(CX + Math.cos(a) * R_MID, CX + Math.sin(a) * R_MID, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGauge(ctx: CanvasRenderingContext2D, rarity: PFPRarity) {
  const earned = CLASSES.indexOf(rarity);
  const SEG = 9 * DEG;
  const GAP = (8 / 3) * DEG;

  ctx.save();
  ctx.lineWidth = 22;
  ctx.lineCap = "butt";

  for (let i = 0; i < CLASSES.length; i++) {
    // Index from gaugeStart upward so i=0 (STANDARD) lights the LOWEST segment
    const a0 = ZONE.gaugeStart + i * (SEG + GAP);
    const a1 = a0 + SEG;

    ctx.strokeStyle = i <= earned ? rgba(BRAND.sand, 0.95) : rgba(BRAND.ink, 0.35);
    ctx.beginPath();
    ctx.arc(CX, CX, R_MID, a0, a1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArcs(ctx: CanvasRenderingContext2D, input: PFPInput) {
  // Top arc: always sand — mango on coral is the same low-contrast problem
  drawArcText(
    ctx,
    "HACKER HOUSE GOA · 28–31 OCT 2026",
    R_MID,
    ZONE.topArc,
    fD(700, 28),
    BRAND.sand,
    4,
    false,
  );
  // ZONE.bottomArc reserved — bottom band stays clean gradient
}

function drawFounderMark(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(CX, CX, 486, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = BRAND.mango;
  ctx.stroke();
}

function drawCorners(ctx: CanvasRenderingContext2D, input: PFPInput) {
  ctx.save();
  ctx.textBaseline = "alphabetic";

  // Top-right studio tag
  ctx.font = fM(700, 20);
  ctx.fillStyle = rgba(BRAND.foam, 0.45);
  ctx.textAlign = "right";
  ctx.fillText("2:47 PM STUDIO", 944, 76);

  // Bottom-left: गोवा — Devanagari face, sized to stay clear of the ring
  // At y=944, r=500 circle spans x≈270–730; we must stay under x=270.
  // fDev(700,44) renders ~180px wide starting at x=56 → ends at ~236. Safe.
  if (input.goaAsset) {
    ctx.globalAlpha = 0.1;
    ctx.drawImage(input.goaAsset, 56, 892, 96, 56); // was (56, 828, 200, 116)
    ctx.globalAlpha = 1;
  } else {
    ctx.font = fDev(700, 44);
    ctx.fillStyle = rgba(BRAND.sand, 0.16);
    ctx.textAlign = "left";
    ctx.fillText("गोवा", 56, 944);
  }

  // Bottom-right hashtag — balanced pair with गोवा
  ctx.font = fM(700, 24);
  ctx.fillStyle = BRAND.coral;
  ctx.textAlign = "right";
  ctx.fillText("#FrameInGoa", 944, 944);

  ctx.restore();
}

function drawGrain(ctx: CanvasRenderingContext2D) {
  const pattern = getGrain(ctx);
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, PFP_SIZE, PFP_SIZE);
  ctx.restore();
}

// ── Entry point ───────────────────────────────────────────────────────────

/**
 * Renders the PFP into a 1000×1000 canvas.
 * Await `ensureFonts()` before calling to guarantee correct typefaces.
 */
export function renderPFP(
  canvas: HTMLCanvasElement,
  input: PFPInput,
): void {
  canvas.width = PFP_SIZE;
  canvas.height = PFP_SIZE;

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error("2D context unavailable");

  ctx.clearRect(0, 0, PFP_SIZE, PFP_SIZE);

  drawBackground(ctx);
  drawRingBody(ctx);
  drawPhoto(ctx, input);
  drawEdges(ctx);
  drawPerforation(ctx);
  drawGauge(ctx, input.rarity);
  drawArcs(ctx, input);
  if (input.rarity === "FOUNDER") drawFounderMark(ctx);
  drawCorners(ctx, input);
  drawGrain(ctx);
}
