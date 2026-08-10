import { C, EVENT, ASSETS } from "../../brand";
import type { FormatSpec, Layer } from "../../types";
import { fD, fM } from "../fonts";

const CX = 500;
const CY = 500;
const R_IN = 380;
const R_OUT = 430;
const R_MID = (R_IN + R_OUT) / 2;

export function pfpSpec(): FormatSpec {
  const background: Layer[] = [
    { kind: "fill", color: C.sand },
    { kind: "grain", opacity: 0.2 },
    // Fake hard offset shadow for the photo
    { kind: "notch", cx: CX + 12, cy: CY + 12, r: R_IN + 10, color: C.deep },
  ];

  const foreground: Layer[] = [
    // Thick black border for the photo frame itself
    {
      kind: "custom",
      draw: (ctx) => {
        ctx.lineWidth = 14;
        ctx.strokeStyle = C.ink;
        ctx.beginPath();
        ctx.arc(CX, CY, R_IN + 7, 0, Math.PI * 2);
        ctx.stroke();
      },
    },

    // Misregistered arc text: Blue ghost
    {
      kind: "arcText",
      value: `${EVENT.name} \u00B7 ${EVENT.year}`,
      cx: CX + 4,
      cy: CY + 4,
      r: R_OUT,
      centerAngle: -Math.PI / 2,
      font: fD(900, 52),
      color: C.deep,
      letterSpacing: 4,
    },
    // Misregistered arc text: Orange ghost
    {
      kind: "arcText",
      value: `${EVENT.datesPretty} \u00B7 ${EVENT.cohort} BUILDERS`,
      cx: CX - 3,
      cy: CY - 3,
      r: R_OUT,
      centerAngle: Math.PI / 2,
      flip: true,
      font: fD(900, 48),
      color: C.coral,
      letterSpacing: 4,
    },

    // Main black arc text
    {
      kind: "arcText",
      value: `${EVENT.name} \u00B7 ${EVENT.year}`,
      cx: CX,
      cy: CY,
      r: R_OUT,
      centerAngle: -Math.PI / 2,
      font: fD(900, 52),
      color: C.ink,
      letterSpacing: 4,
    },
    {
      kind: "arcText",
      value: `${EVENT.datesPretty} \u00B7 ${EVENT.cohort} BUILDERS`,
      cx: CX,
      cy: CY,
      r: R_OUT,
      centerAngle: Math.PI / 2,
      flip: true,
      font: fD(900, 48),
      color: C.ink,
      letterSpacing: 4,
    },

    // Badges in the corners
    {
      kind: "text",
      value: String(EVENT.cohort),
      x: 64,
      y: 90,
      font: fD(900, 64),
      color: C.coral,
      letterSpacing: 3,
    },
    {
      kind: "text",
      value: "BUILDERS",
      x: 64,
      y: 124,
      font: fM(400, 20),
      color: C.ink,
      letterSpacing: 3,
    },

    {
      kind: "text",
      value: EVENT.hashtag,
      x: 936,
      y: 910,
      align: "right",
      font: fM(700, 32),
      color: C.ink,
    },
    
    // Bottom left devanagari overlay box
    {
      kind: "rect",
      x: 50,
      y: 840,
      w: 120,
      h: 110,
      fill: C.deep,
      stroke: C.ink,
      lineWidth: 4,
    },
    {
      kind: "asset",
      src: ASSETS.goaDevanagari,
      x: 68,
      y: 864,
      w: 84,
      h: 60,
      fit: "contain",
      opacity: 1.0,
      blend: "luminosity", // Blend heavily into the blue
    },

    {
      kind: "text",
      value: EVENT.studioTime,
      x: 936,
      y: 90,
      align: "right",
      font: fM(400, 24),
      color: C.muted,
    },
  ];

  return {
    id: "pfp", 
    w: 1000, 
    h: 1000, 
    background, 
    photoSlots: [
      { x: CX - R_IN, y: CY - R_IN, w: R_IN * 2, h: R_IN * 2, shape: "circle" },
    ], 
    foreground
  };
}
