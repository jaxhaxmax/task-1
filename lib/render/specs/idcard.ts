import { C, EVENT, GRAD, RARITY, ASSETS } from "../../brand";
import type { FormatSpec, Layer, RenderInput } from "../../types";
import { fD, fM } from "../fonts";


export const W = 1600;
export const H = 900;
export const PERF_X = 1150; 
export const HEADER_H = 112;
export const MARQUEE_Y = 852;


export function headerLayers(centreText: string): Layer[] {
  return [
    { kind: "rect", x: 0, y: 0, w: W, h: HEADER_H, fill: "rgba(13,27,42,0.55)" },
    { kind: "gradientRect", x: 0, y: HEADER_H - 2, w: W, h: 3, stops: GRAD.sunrise },

    
    { kind: "rect", x: 56, y: 40, w: 10, h: 34, fill: C.coral, radius: 2 },
    {
      kind: "text",
      value: EVENT.short,
      x: 82,
      y: 68,
      font: fD(800, 38),
      color: C.sand,
      letterSpacing: 1,
    },
    {
      kind: "text",
      value: centreText,
      x: 590,
      y: 66,
      align: "center",
      font: fM(700, 28),
      color: C.sand,
      letterSpacing: 7,
      maxW: 620,
    },
    {
      kind: "asset",
      src: ASSETS.goaDevanagari,
      x: 1010,
      y: 34,
      w: 84,
      h: 46,
      fit: "contain",
      opacity: 0.8,
    },
  ];
}

export function perforationLayers(): Layer[] {
  return [
    { kind: "rect", x: PERF_X, y: 0, w: W - PERF_X, h: H, fill: "rgba(255,255,255,0.035)" },
    {
      kind: "dashed",
      x0: PERF_X,
      y0: 132,
      x1: PERF_X,
      y1: 836,
      dash: [14, 12],
      color: "rgba(242,232,213,0.45)",
      width: 3,
    },
    
    { kind: "notch", cx: PERF_X, cy: HEADER_H, r: 22, color: C.ink },
    { kind: "notch", cx: PERF_X, cy: MARQUEE_Y, r: 22, color: C.ink },
  ];
}

export function stubLayers(): Layer[] {
  const cx = PERF_X + (W - PERF_X) / 2; 

  return [
    {
      kind: "text",
      value: (i: RenderInput) => `#${i.serial} / ${EVENT.cohort}`,
      x: cx,
      y: 180,
      align: "center",
      font: fM(700, 40),
      color: C.mango,
      letterSpacing: 2,
    },
    {
      kind: "text",
      value: EVENT.studioTime,
      x: cx,
      y: 228,
      align: "center",
      font: fM(400, 26),
      color: C.muted,
      letterSpacing: 3,
    },
    {
      kind: "vertText",
      value: "FRAME IN GOA",
      cx,
      cy: 510,
      font: fD(800, 52),
      color: "rgba(242,232,213,0.20)",
      letterSpacing: 8,
    },
    {
      kind: "barcode",
      x: 1206,
      y: 782,
      w: 338,
      h: 58,
      color: C.sand,
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
    color: C.ink,
    bg: C.coral,
    letterSpacing: 4,
  };
}

export function backgroundLayers(): Layer[] {
  return [
    { kind: "linearGradient", x0: 0, y0: 0, x1: W, y1: H, stops: GRAD.dusk },
    {
      kind: "radialGradient",
      cx: 1150,
      cy: 0,
      r0: 0,
      r1: 1100,
      stops: [
        [0, "rgba(255,178,56,0.22)"],
        [1, "rgba(23,58,94,0)"],
      ],
    },
    {
      kind: "asset",
      src: ASSETS.palm,
      x: 980,
      y: 380,
      w: 560,
      h: 520,
      fit: "contain",
      opacity: 0.1,
      blend: "screen",
    },
    { kind: "grain", opacity: 0.045 },
  ];
}

export function dataCell(
  x: number,
  label: string,
  value: string | ((i: RenderInput) => string),
  labelY = 758,
  valueY = 806,
): Layer[] {
  return [
    {
      kind: "text",
      value: label,
      x,
      y: labelY,
      font: fM(400, 22),
      color: C.foam,
      letterSpacing: 5,
      upper: true,
    },
    {
      kind: "text",
      value,
      x,
      y: valueY,
      font: fM(700, 38),
      color: C.sand,
      letterSpacing: 1,
    },
  ];
}


export function idcardSpec(): FormatSpec {
  const foreground: Layer[] = [
    ...headerLayers("BUILDER BOARDING PASS"),

    
    {
      kind: "text",
      value: (i) => `\u25C6 ${RARITY[i.rarity].label} CLASS`,
      x: 556,
      y: 240,
      font: fM(700, 24),
      color: (i) => RARITY[i.rarity].color,
      letterSpacing: 5,
    },
    {
      kind: "text",
      value: (i) => i.name || "YOUR NAME",
      x: 556,
      y: 330,
      font: fD(800, 92),
      color: C.sand,
      maxW: 560,
      minScale: 0.5,
      upper: true,
    },
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
      font: fD(700, 40),
      color: C.coral,
      bg: "rgba(255,90,54,0.14)",
      border: C.coral,
    },

    
    {
      kind: "stamp",
      x: 56,
      y: 505,
      w: 380,
      h: 165,
      rotate: -8,
      lines: ["ADMITTED", `${EVENT.gate} \u00B7 ${EVENT.boarding}`],
      color: C.stampInk,
      seed: (i) => Number(i.serial) * 31337,
      fonts: { top: fM(700, 50), bottom: fM(400, 24) },
    },

    ...dataCell(76, "GATE", EVENT.gate),
    ...dataCell(396, "BOARDING", EVENT.boarding),
    ...dataCell(716, "SEAT", (i) => i.serial),
    ...dataCell(1000, "CLASS", EVENT.year),

    ...perforationLayers(),
    ...stubLayers(),
    marqueeLayer(),

    
    {
      kind: "when",
      cond: (i) => i.rarity === "legendary",
      layers: [
        {
          kind: "rect",
          x: 14,
          y: 14,
          w: W - 28,
          h: H - 28,
          radius: 6,
          stroke: C.sand,
          lineWidth: 4,
          opacity: 0.8,
        },
      ],
    },
  ];

  return {
    id: "idcard",
    w: W,
    h: H,
    background: backgroundLayers(),
    photoSlots: [
      {
        x: 76,
        y: 196,
        w: 420,
        h: 420,
        shape: "rect",
        radius: 20,
        ring: { width: 5, colors: [C.coral, C.mango] },
      },
    ],
    foreground,
  };
}
