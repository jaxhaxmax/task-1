import { C, EVENT } from "../../brand";
import type { FormatSpec, Layer } from "../../types";
import { containRect } from "../../image/crop";
import { fD, fM } from "../fonts";
import { misregText } from "./idcard";

const BOX = { x: 120, y: 84, w: 960, h: 420 };

export function ogSpec(art: HTMLCanvasElement, siteLabel: string): FormatSpec {
  const foreground: Layer[] = [
    // Branding bar on the left
    { kind: "rect", x: 0, y: 0, w: 16, h: 630, fill: C.coral, stroke: C.ink, lineWidth: 4 },
    
    // Draw the generated art (ID Card, PFP, etc.) with a hard shadow
    {
      kind: "custom",
      draw: (ctx) => {
        const r = containRect(art.width, art.height, BOX.x, BOX.y, BOX.w, BOX.h);
        ctx.save();
        
        // Brutalist hard shadow
        ctx.fillStyle = C.deep;
        ctx.fillRect(r.x + 12, r.y + 12, r.w, r.h);
        
        // Thick border
        ctx.lineWidth = 6;
        ctx.strokeStyle = C.ink;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        
        ctx.drawImage(art, r.x, r.y, r.w, r.h);
        ctx.restore();
      },
    },

    ...misregText(`${EVENT.short} ${EVENT.year}`, 120, 48, fD(900, 42), "left", undefined, 0.5, true, 2),

    {
      kind: "text",
      value: EVENT.hashtag,
      x: 1080,
      y: 56,
      align: "right",
      font: fM(700, 32),
      color: C.ink,
      letterSpacing: 2
    },

    ...misregText("MAKE YOURS \u2192", 120, 580, fD(900, 52), "left", undefined, 0.5, true, 2),

    {
      kind: "text",
      value: siteLabel,
      x: 1080,
      y: 580,
      align: "right",
      font: fM(700, 36),
      color: C.ink,
      letterSpacing: 2
    },
  ];

  return {
    id: "og",
    w: 1200,
    h: 630,
    background: [
      { kind: "fill", color: C.sand },
      { kind: "grain", opacity: 0.15 },
    ],
    photoSlots: [],
    foreground,
  };
}
