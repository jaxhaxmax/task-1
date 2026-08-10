import { C, EVENT, RARITY, ASSETS } from "../../brand";
import type { FormatSpec, Layer, RenderInput, Dyn } from "../../types";
import { fD, fM } from "../fonts";

export const W = 1600;
export const H = 900;
export const PERF_X = 1150;
export const HEADER_H = 120;
export const MARQUEE_Y = 840;

export function misregText(
  value: Dyn<string>,
  x: number,
  y: number,
  font: string,
  align: CanvasTextAlign = "left",
  maxW?: number,
  minScale = 0.5,
  upper = false,
  letterSpacing = 0,
): Layer[] {
  return [
    {
      kind: "text",
      value,
      x: x + 6,
      y: y + 6,
      font,
      color: C.deep,
      align,
      maxW,
      minScale,
      upper,
      letterSpacing,
      opacity: 0.35,
      blend: "multiply",
    },
    {
      kind: "text",
      value,
      x: x - 3,
      y: y - 3,
      font,
      color: C.coral,
      align,
      maxW,
      minScale,
      upper,
      letterSpacing,
      opacity: 0.35,
      blend: "multiply",
    },
    {
      kind: "text",
      value,
      x,
      y,
      font,
      color: C.ink,
      align,
      maxW,
      minScale,
      upper,
      letterSpacing,
    },
  ];
}

export function headerLayers(centreText: string): Layer[] {
  return [
    // Top border block
    { kind: "rect", x: 0, y: 0, w: W, h: 12, fill: C.coral, stroke: C.ink, lineWidth: 4 },
    { kind: "rect", x: 0, y: 12, w: W, h: HEADER_H - 12, fill: C.sand, stroke: C.ink, lineWidth: 4 },

    // Left black block
    { kind: "rect", x: 0, y: 12, w: 160, h: HEADER_H - 12, fill: C.ink, stroke: C.ink, lineWidth: 4 },
    { kind: "text", value: "ISSUE", x: 80, y: 50, align: "center", font: fM(400, 16), color: C.coral, letterSpacing: 4, opacity: 0.8 },
    { kind: "text", value: "01", x: 80, y: 92, align: "center", font: fD(900, 50), color: C.coral },

    // Center header text
    ...misregText(EVENT.short, 200, 84, fD(900, 64), "left", undefined, 0.5, true, 2),
    {
      kind: "text",
      value: centreText,
      x: 620,
      y: 76,
      align: "center",
      font: fM(700, 28),
      color: C.ink,
      letterSpacing: 4,
      maxW: 620,
    },

    // Right blue block
    { kind: "rect", x: W - 200, y: 12, w: 200, h: HEADER_H - 12, fill: C.deep, stroke: C.ink, lineWidth: 4 },
    { kind: "text", value: EVENT.hashtag, x: W - 100, y: 76, align: "center", font: fD(900, 26), color: C.sand, letterSpacing: 2 },
  ];
}

export function perforationLayers(): Layer[] {
  return [
    // Stub background
    { kind: "rect", x: PERF_X, y: HEADER_H, w: W - PERF_X, h: H - HEADER_H, fill: C.sand, stroke: C.ink, lineWidth: 4 },
    
    // Perforation line
    {
      kind: "dashed",
      x0: PERF_X,
      y0: HEADER_H + 20,
      x1: PERF_X,
      y1: H - 20,
      dash: [14, 12],
      color: C.ink,
      width: 4,
    },

    { kind: "notch", cx: PERF_X, cy: HEADER_H, r: 22, color: C.ink },
  ];
}

export function stubLayers(): Layer[] {
  const cx = PERF_X + (W - PERF_X) / 2;

  return [
    {
      kind: "text",
      value: (i: RenderInput) => `#${i.serial} / ${EVENT.cohort}`,
      x: cx,
      y: 220,
      align: "center",
      font: fM(700, 40),
      color: C.ink,
      letterSpacing: 2,
    },
    {
      kind: "text",
      value: EVENT.studioTime,
      x: cx,
      y: 270,
      align: "center",
      font: fM(400, 26),
      color: C.muted,
      letterSpacing: 3,
    },
    {
      kind: "vertText",
      value: "FRAME IN GOA",
      cx,
      cy: 530,
      font: fD(900, 68),
      color: C.deep,
      letterSpacing: 6,
      opacity: 0.15,
    },
    {
      kind: "barcode",
      x: 1206,
      y: 740,
      w: 338,
      h: 64,
      color: C.ink,
      seed: (i: RenderInput) => Number(i.serial) * 7919,
    },
  ];
}

export function marqueeLayer(): Layer {
  return {
    kind: "marquee",
    text: `${EVENT.tagline}   \u00B7   ${EVENT.site}`,
    y: MARQUEE_Y,
    h: H - MARQUEE_Y,
    font: fM(700, 24),
    color: C.sand,
    bg: C.ink,
    letterSpacing: 4,
  };
}

export function backgroundLayers(): Layer[] {
  return [
    { kind: "fill", color: C.sand },
    { kind: "grain", opacity: 0.15 },
  ];
}

export function dataCell(
  x: number,
  label: string,
  value: string | ((i: RenderInput) => string),
  labelY = 744,
  valueY = 794,
): Layer[] {
  return [
    {
      kind: "text",
      value: label,
      x,
      y: labelY,
      font: fM(400, 20),
      color: C.muted,
      letterSpacing: 4,
      upper: true,
    },
    {
      kind: "text",
      value,
      x,
      y: valueY,
      font: fD(900, 46),
      color: C.ink,
      letterSpacing: 1,
    },
  ];
}

export function idcardSpec(): FormatSpec {
  const foreground: Layer[] = [
    ...headerLayers("BUILDER PASS"),

    {
      kind: "rect",
      x: 556,
      y: 200,
      w: 240,
      h: 36,
      fill: (i) => RARITY[i.rarity].bg,
      stroke: C.ink,
      lineWidth: 3,
    },
    {
      kind: "text",
      value: (i) => `◆ ${RARITY[i.rarity].label} CLASS`,
      x: 570,
      y: 225,
      font: fM(700, 20),
      color: (i) => RARITY[i.rarity].color,
      letterSpacing: 3,
    },
    
    ...misregText((i) => i.name || "YOUR NAME", 556, 330, fD(900, 92), "left", 560, 0.5, true),
    
    {
      kind: "text",
      value: (i) => i.role || "your stack",
      x: 556,
      y: 386,
      font: fM(400, 32),
      color: C.muted,
      maxW: 560,
    },
    
    {
      kind: "chip",
      value: (i) => i.title,
      x: 556,
      y: 424,
      h: 76,
      padX: 32,
      maxW: 560,
      font: fD(900, 44),
      color: C.ink,
      bg: C.sand,
      border: C.ink,
    },

    {
      kind: "stamp",
      x: 56,
      y: 450,
      w: 380,
      h: 165,
      rotate: -6,
      lines: ["ADMITTED", `${EVENT.gate} \u00B7 ${EVENT.boarding}`],
      color: C.stampInk,
      seed: (i) => Number(i.serial) * 31337,
      fonts: { top: fD(900, 56), bottom: fM(700, 20) },
    },

    ...dataCell(76, "GATE", EVENT.gate),
    ...dataCell(396, "BOARDING", EVENT.boarding),
    ...dataCell(650, "SEAT", (i) => i.serial),
    ...dataCell(920, "CLASS", EVENT.year),

    ...perforationLayers(),
    ...stubLayers(),
     marqueeLayer(),
     
    // Hard horizontal line before footer
    { kind: "rect", x: 0, y: 700, w: PERF_X, h: 4, fill: C.ink, opacity: 0.1 },
  ];

  return {
    id: "idcard",
    w: W,
    h: H,
    background: [
      ...backgroundLayers(),
      // Hard shadow for photo
      { kind: "rect", x: 86, y: 206, w: 420, h: 420, fill: C.coral },
    ],
    photoSlots: [
      {
        x: 76,
        y: 196,
        w: 420,
        h: 420,
        shape: "rect",
        radius: 0,
        ring: { width: 4, colors: [C.ink, C.ink] },
      }
    ],
    foreground,
  };
}
