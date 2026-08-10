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
  misregText,
  PERF_X
} from "./idcard";

const ROW_LEFT = 40;
const ROW_W = 1070;
const ROW_CY = 300;

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
    ring: { width: 4, colors: [C.ink, C.ink] },
  }));
}

function memberNameLayers(n: number): Layer[] {
  const slots = teamSlots(n);
  const gap = ROW_W / Math.max(2, Math.min(6, n));

  return slots.flatMap((s, i) => {
    // Generate misreg text for each member
    return misregText(
      (input: RenderInput) => input.memberNames[i] || `MEMBER ${i + 1}`,
      s.x + s.w / 2,
      s.y + s.h + 46,
      fD(900, 36),
      "center",
      gap - 20,
       0.65,
       true
    );
  });
}

export function teamSpec(memberCount: number): FormatSpec {
  const n = Math.max(2, Math.min(6, memberCount));

  // Background needs shadow circles for the photo slots
  const slots = teamSlots(n);
  const shadows: Layer[] = slots.map((s) => ({
    kind: "notch",
    cx: s.x + s.w / 2 + 6,
    cy: s.y + s.h / 2 + 6,
    r: s.w / 2,
    color: C.deep, // blue shadows for team
  }));

  const foreground: Layer[] = [
    ...headerLayers(`CREW MANIFEST \u00B7 ${n} PASSENGERS`),
    ...memberNameLayers(n),

    ...misregText((i) => i.team || "YOUR TEAM", 575, 590, fD(900, 76), "center", 880, 0.5, true),

    ...dataCell(76, "BOARDING", EVENT.boarding, 720, 770),
    ...dataCell(436, "PARTY", String(n), 720, 770),

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
      fonts: { top: fD(900, 48), bottom: fM(700, 18) },
    },

    ...perforationLayers(),
    ...stubLayers(),
    marqueeLayer(),
    
    { kind: "rect", x: 0, y: 700, w: PERF_X, h: 4, fill: C.ink, opacity: 0.1 },
  ];

  return {
    id: "team",
    w: W,
    h: H,
    background: [...backgroundLayers(), ...shadows],
    photoSlots: slots,
    foreground,
  };
}
