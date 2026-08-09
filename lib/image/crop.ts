import type { Focal } from "../types";

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/**
 * The brief requires the tool to work on uncropped photos. Faces sit in the
 * upper portion of nearly every portrait, so when we have to crop vertically we
 * keep the top rather than centring. Zero dependencies, correct ~90% of the time,
 * and drag-to-reposition covers the rest.
 */
export function defaultFocal(
  imgW: number,
  imgH: number,
  dstW: number,
  dstH: number,
): Focal {
  const imgAspect = imgW / imgH;
  const dstAspect = dstW / dstH;
  // Source is taller than the target box => vertical crop => bias upward.
  const y = imgAspect < dstAspect ? 0.3 : 0.5;
  return { x: 0.5, y, zoom: 1 };
}

/** Source rectangle for a "cover" fit, offset by the focal point. */
export function coverRect(
  imgW: number,
  imgH: number,
  dstW: number,
  dstH: number,
  f: Focal,
) {
  const base = Math.max(dstW / imgW, dstH / imgH);
  const scale = base * Math.max(1, f.zoom);
  const sw = Math.min(imgW, dstW / scale);
  const sh = Math.min(imgH, dstH / scale);
  const sx = clamp((imgW - sw) * f.x, 0, Math.max(0, imgW - sw));
  const sy = clamp((imgH - sh) * f.y, 0, Math.max(0, imgH - sh));
  return { sx, sy, sw, sh };
}

/** Destination rectangle for a "contain" fit. Used by the OG composite. */
export function containRect(
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { x: boxX + (boxW - w) / 2, y: boxY + (boxH - h) / 2, w, h };
}
