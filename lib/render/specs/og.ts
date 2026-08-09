import { C, EVENT, GRAD } from "../../brand";
import type { FormatSpec, Layer } from "../../types";
import { containRect } from "../../image/crop";
import { fD, fM } from "../fonts";


const BOX = { x: 120, y: 84, w: 960, h: 420 };

export function ogSpec(art: HTMLCanvasElement, siteLabel: string): FormatSpec {
  const foreground: Layer[] = [
    { kind: "rect", x: 0, y: 0, w: 10, h: 630, fill: C.coral },
    {
      kind: "custom",
      draw: (ctx) => {
        const r = containRect(art.width, art.height, BOX.x, BOX.y, BOX.w, BOX.h);
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 12;
        ctx.drawImage(art, r.x, r.y, r.w, r.h);
        ctx.restore();
      },
    },
    {
      kind: "text",
      value: `${EVENT.short} ${EVENT.year}`,
      x: 120,
      y: 56,
      font: fD(800, 32),
      color: C.sand,
      letterSpacing: 2,
    },
    {
      kind: "text",
      value: EVENT.hashtag,
      x: 1080,
      y: 56,
      align: "right",
      font: fM(400, 26),
      color: C.muted,
    },
    {
      kind: "text",
      value: "MAKE YOURS \u2192",
      x: 120,
      y: 578,
      font: fD(800, 44),
      color: C.sand,
      letterSpacing: 1,
    },
    {
      kind: "text",
      value: siteLabel,
      x: 1080,
      y: 578,
      align: "right",
      font: fM(400, 30),
      color: C.mango,
    },
  ];

  return {
    id: "og",
    w: 1200,
    h: 630,
    background: [
      { kind: "linearGradient", x0: 0, y0: 0, x1: 1200, y1: 630, stops: GRAD.dusk },
      { kind: "grain", opacity: 0.04 },
    ],
    photoSlots: [],
    foreground,
  };
}
