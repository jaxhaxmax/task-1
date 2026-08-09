import { C, EVENT, GRAD, ASSETS } from "../../brand";
import type { FormatSpec, Layer } from "../../types";
import { fD, fM } from "../fonts";
import { linGrad } from "../helpers";

/**
 * PFP - 1000x1000.
 *
 * X CROPS PROFILE PICTURES TO A CIRCLE. All essential branding therefore lives
 * in the ANNULUS between r=418 and r=500, not in a rectangular border - a
 * rectangular frame is invisible exactly where it matters.
 *
 * The corners are dead space for an avatar, so they carry the extras (serial,
 * hashtag, goa mark) which only appear when the image is posted as a square.
 */
const CX = 500;
const CY = 500;
const R_IN = 418; // photo edge
const R_OUT = 500; // canvas edge
const R_MID = (R_IN + R_OUT) / 2; // 459, ring centreline where arc text sits

export function pfpSpec(): FormatSpec {
  const background: Layer[] = [
    { kind: "fill", color: C.ink },
    {
      kind: "radialGradient",
      cx: 500,
      cy: 320,
      r0: 0,
      r1: 780,
      stops: GRAD.glow,
    },
    { kind: "grain", opacity: 0.05 },
  ];

  const foreground: Layer[] = [
    // --- the ring -----------------------------------------------------------
    {
      kind: "custom",
      draw: (ctx) => {
        ctx.lineWidth = R_OUT - R_IN;
        ctx.strokeStyle = linGrad(ctx, 120, 900, 880, 100, GRAD.sunrise);
        ctx.beginPath();
        ctx.arc(CX, CY, R_MID, 0, Math.PI * 2);
        ctx.stroke();

        // hairlines separate photo from ring and ring from edge
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(13,27,42,0.50)";
        ctx.beginPath();
        ctx.arc(CX, CY, R_IN + 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(13,27,42,0.32)";
        ctx.beginPath();
        ctx.arc(CX, CY, R_OUT - 1.5, 0, Math.PI * 2);
        ctx.stroke();
      },
    },

    // --- ring text ----------------------------------------------------------
    {
      kind: "arcText",
      value: `${EVENT.name} \u00B7 ${EVENT.year}`,
      cx: CX,
      cy: CY,
      r: R_MID,
      centerAngle: -Math.PI / 2,
      font: fM(700, 36),
      color: C.ink,
      letterSpacing: 4,
    },
    {
      kind: "arcText",
      value: `${EVENT.datesPretty} \u00B7 ${EVENT.cohort} BUILDERS`,
      cx: CX,
      cy: CY,
      r: R_MID,
      centerAngle: Math.PI / 2,
      flip: true,
      font: fM(700, 32),
      color: C.ink,
      letterSpacing: 4,
    },

    // --- corner marks (outside the circle, invisible as an avatar) ----------
    {
      kind: "text",
      value: String(EVENT.cohort),
      x: 46,
      y: 68,
      font: fM(700, 32),
      color: "rgba(242,232,213,0.55)",
      letterSpacing: 3,
    },
    {
      kind: "text",
      value: EVENT.hashtag,
      x: 954,
      y: 952,
      align: "right",
      font: fM(400, 24),
      color: "rgba(242,232,213,0.45)",
    },
    {
      kind: "asset",
      src: ASSETS.goaDevanagari,
      x: 46,
      y: 880,
      w: 104,
      h: 64,
      fit: "contain",
      opacity: 0.7,
    },
    {
      kind: "text",
      value: EVENT.studioTime,
      x: 954,
      y: 68,
      align: "right",
      font: fM(400, 24),
      color: "rgba(242,232,213,0.35)",
    },
  ];

  void fD; // display face unused here; the ring is intentionally all-mono

  return { id: "pfp", w: 1000, h: 1000, background, photoSlots: [
    { x: CX - R_IN, y: CY - R_IN, w: R_IN * 2, h: R_IN * 2, shape: "circle" },
  ], foreground };
}
