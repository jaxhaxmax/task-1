import type { Focal } from "../types";

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export function defaultFocal(
  imgW: number,
  imgH: number,
  dstW: number,
  dstH: number,
): Focal {
  const imgAspect = imgW / imgH;
  const dstAspect = dstW / dstH;
  
  const y = imgAspect < dstAspect ? 0.3 : 0.5;
  return { x: 0.5, y, zoom: 1 };
}

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
