import { C, EVENT } from "../../brand";
import type { FormatSpec, Layer, PhotoSlot, RenderInput } from "../../types";
import { fD, fM } from "../fonts";
import {
  H,
  W,
  backgroundLayers,
  dataCell,
  headerLayers,
  marqueeLayer,
  perforationLayers,
  stubLayers,
} from "./idcard";

/**
 * TEAM PASS - 1600x900.
 *
 * Explicitly required by the task page ("bring your teammates into one combined
 * frame") and absent from the PDF, so most submissions will miss it.
 *
 * All chrome is IMPORTED from idcard.ts. If this file grows past ~120 lines you
 * have started duplicating instead of reusing.
 */

const ROW_LEFT = 40;
const ROW_W = 1070; // main body minus margins
const ROW_CY = 300; // vertical centre of the avatar row

export function teamSlots(n: number): PhotoSlot[] {
  const count = Math.max(2, Math.min(6, n));
  const gap = ROW_W / count;
  const r = Math.min(140, gap / 2 - 20);

  return Array.from({ length: count }, (_, i) => ({
    x: ROW_LEFT + gap * i + gap / 2 - r,
    y: ROW_CY - r,
    w: r * 2,
    h: r * 2,
    shape: "circle" as const,
    ring: { width: 5, colors: [C.coral, C.mango] },
  }));
}

/** Names sit BENEATH the circles rather than overlapping them - named members
 *  are what make people tag each other, and tags are what drive replies. */
function memberNameLayers(n: number): Layer[] {
  const slots = teamSlots(n);
  const gap = ROW_W / Math.max(2, Math.min(6, n));

  return slots.map((s, i) => ({
    kind: "text" as const,
    value: (input: RenderInput) => input.memberNames[i] || `MEMBER ${i + 1}`,
    x: s.x + s.w / 2,
    y: s.y + s.h + 46,
    align: "center" as const,
    font: fM(400, 26),
    color: C.sand,
    maxW: gap - 24,
    minScale: 0.65,
    upper: true,
  }));
}

export function teamSpec(memberCount: number): FormatSpec {
  const n = Math.max(2, Math.min(6, memberCount));

  const foreground: Layer[] = [
    ...headerLayers(`GROUP BOARDING \u00B7 ${n} PASSENGERS`),
    ...memberNameLayers(n),

    {
      kind: "text",
      value: (i) => i.team || "YOUR TEAM",
      x: 575,
      y: 600,
      align: "center",
      font: fD(800, 76),
      color: C.sand,
      maxW: 880,
      minScale: 0.5,
      upper: true,
    },

    ...dataCell(76, "BOARDING", EVENT.boarding, 740, 790),
    ...dataCell(436, "PARTY", String(n), 740, 790),

    {
      kind: "stamp",
      x: 760,
      y: 640,
      w: 330,
      h: 140,
      rotate: 6,
      lines: ["ADMITTED", `${EVENT.gate} \u00B7 ${EVENT.boarding}`],
      color: C.stampInk,
      seed: (i) => Number(i.serial) * 104729,
      fonts: { top: fM(700, 44), bottom: fM(400, 22) },
    },

    ...perforationLayers(),
    ...stubLayers(),
    marqueeLayer(),
  ];

  return {
    id: "team",
    w: W,
    h: H,
    background: backgroundLayers(),
    photoSlots: teamSlots(n),
    foreground,
  };
}
