import { C, EVENT, ASSETS, RARITY } from "../../brand";
import type { FormatSpec, RenderInput } from "../../types";
import { fD, fM } from "../fonts";
import { lsText } from "../helpers";

const CX = 500;
const CY = 510;
const R  = 240;

// Humourous signpost signs
const SIGNS: { text: string; bg: string; fg: string; rot: number }[] = [
  { text: "EAT. CODE.",  bg: C.mango, fg: C.ink,  rot: -5 },
  { text: "NO SLEEP.",   bg: C.coral, fg: C.sand, rot:  4 },
  { text: "SHIP IT 👀",  bg: C.deep,  fg: C.sand, rot: -3 },
];

// Subtitle shown under the name pill
function humourTitle(input: RenderInput): string {
  const role = input.role?.trim();
  if (role) return `⚡ ${role.toUpperCase()} ⚡`;
  const jokes: Record<string, string> = {
    common:    "⚡ PROFESSIONAL CTRL+Z ⚡",
    rare:      "🔥 SEMICOLON SURVIVOR 🔥",
    epic:      "🌴 WIFI DEPENDENT 🌴",
    legendary: "👑 SHIPS ON FRIDAYS 👑",
  };
  return jokes[input.rarity] ?? jokes.common;
}

export function pfpSpec(): FormatSpec {
  return {
    id: "pfp",
    w: 1000,
    h: 1000,

    background: [
      // ── Full Goa scene background ───────────────────────────────
      {
        kind: "asset",
        src: ASSETS.goaBg,
        x: 0, y: 0, w: 1000, h: 1000,
        fit: "cover",
        opacity: 1,
      },

      // Semi-transparent sand wash so text stays legible
      { kind: "fill", color: "rgba(245,236,215,0.15)" },

      // Palm watermark on top of wash
      {
        kind: "asset",
        src: ASSETS.palm,
        x: -100, y: -100, w: 1200, h: 1200,
        fit: "cover", blend: "luminosity", opacity: 0.08,
      },

      // Outer vintage border
      { kind: "rect", x: 20, y: 20, w: 960, h: 960, radius: 40, stroke: C.deep,  lineWidth: 28 },
      { kind: "rect", x: 40, y: 40, w: 920, h: 920, radius: 24, stroke: C.mango, lineWidth: 4  },

      // Sun halo behind photo
      {
        kind: "custom",
        draw: (ctx) => {
          ctx.beginPath();
          ctx.arc(CX, CY, R + 40, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,200,87,0.85)";
          ctx.fill();
        },
      },
    ],

    photoSlots: [
      {
        x: CX - R, y: CY - R, w: R * 2, h: R * 2,
        shape: "circle",
        ring: { width: 14, colors: [C.ink, C.ink] },
      },
    ],

    foreground: (i: RenderInput) => {
      const rBg      = RARITY[i.rarity || "common"].bg;
      const nameText = (i.name || "YOUR NAME").toUpperCase();
      const subTitle = humourTitle(i);

      return [
        // ── PHOTO FRAME RINGS ──────────────────────────────────────
        {
          kind: "custom",
          draw: (ctx) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(CX, CY, R + 14, 0, Math.PI * 2);
            ctx.strokeStyle = C.coral;
            ctx.lineWidth = 6;
            ctx.setLineDash([12, 10]);
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(CX, CY, R + 30, 0, Math.PI * 2);
            ctx.strokeStyle = rBg;
            ctx.lineWidth = 14;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(CX, CY, R + 37, 0, Math.PI * 2);
            ctx.strokeStyle = C.ink;
            ctx.lineWidth = 4;
            ctx.stroke();
          },
        },

        // ── HEADER LOGOTYPE  (tightened gap) ──────────────────────
        // "HACKER" centred at x=285, "HOUSE" centred at x=715
        // gap of 70px around the Devanagari logo vs the previous 120px
        { kind: "text", value: "HACKER", x: 291, y: 166, font: fD(900, 72), color: C.deep,  align: "center", letterSpacing: 3, opacity: 0.35, blend: "multiply" },
        { kind: "text", value: "HACKER", x: 282, y: 157, font: fD(900, 72), color: C.coral, align: "center", letterSpacing: 3, opacity: 0.35, blend: "multiply" },
        { kind: "text", value: "HACKER", x: 285, y: 160, font: fD(900, 72), color: C.ink,   align: "center", letterSpacing: 3 },

        { kind: "text", value: "HOUSE",  x: 721, y: 166, font: fD(900, 72), color: C.deep,  align: "center", letterSpacing: 3, opacity: 0.35, blend: "multiply" },
        { kind: "text", value: "HOUSE",  x: 712, y: 157, font: fD(900, 72), color: C.coral, align: "center", letterSpacing: 3, opacity: 0.35, blend: "multiply" },
        { kind: "text", value: "HOUSE",  x: 715, y: 160, font: fD(900, 72), color: C.ink,   align: "center", letterSpacing: 3 },

        // Goa Devanagari logo — centred in the tighter gap
        {
          kind: "asset",
          src: ASSETS.goaDevanagari,
          x: 440, y: 66, w: 120, h: 110,
          fit: "contain", blend: "source-over",
        },

        // Mini date tags
        { kind: "text", value: "✦ 28-31 OCT 2026 ✦", x: 285, y: 64, font: fM(900, 12), color: C.coral, align: "center", letterSpacing: 1 },
        { kind: "text", value: "✦ GOA, INDIA ✦",      x: 715, y: 64, font: fM(900, 12), color: C.deep,  align: "center", letterSpacing: 1 },

        // ── LEFT SIDE: HUMOUR SIGNPOST ─────────────────────────────
        {
          kind: "custom",
          draw: (ctx) => {
            const drawSign = (text: string, cy: number, rot: number, bg: string, fg: string) => {
              ctx.save();
              ctx.translate(150, cy);
              ctx.rotate(rot * Math.PI / 180);

              ctx.fillStyle = C.ink;
              ctx.beginPath();
              ctx.roundRect(-84, -26 + 5, 168, 52, 6);
              ctx.fill();

              ctx.fillStyle = bg;
              ctx.beginPath();
              ctx.roundRect(-84, -26, 168, 52, 6);
              ctx.fill();
              ctx.strokeStyle = C.ink;
              ctx.lineWidth = 3;
              ctx.stroke();

              ctx.fillStyle = fg;
              ctx.font = fM(900, 20);
              ctx.textBaseline = "middle";
              lsText(ctx, text, 0, 2, 2, "center");
              ctx.restore();
            };

            // Wooden pole
            ctx.fillStyle = "#7B5E3A";
            ctx.fillRect(144, 295, 12, 335);
            ctx.fillStyle = C.ink;
            ctx.fillRect(144, 295, 12, 6);

            drawSign(SIGNS[0].text, 350, SIGNS[0].rot, SIGNS[0].bg, SIGNS[0].fg);
            drawSign(SIGNS[1].text, 430, SIGNS[1].rot, SIGNS[1].bg, SIGNS[1].fg);
            drawSign(SIGNS[2].text, 510, SIGNS[2].rot, SIGNS[2].bg, SIGNS[2].fg);
          },
        },

        // ── BOTTOM: NAME + HUMOUR ROLE PILLS ──────────────────────
        {
          kind: "custom",
          draw: (ctx) => {
            ctx.save();
            ctx.translate(CX, 806);

            // Name pill
            ctx.font = fM(900, 34);
            const tw = ctx.measureText(nameText).width;
            const nameBoxW = Math.max(340, tw + 80);

            ctx.fillStyle = C.ink;
            ctx.beginPath();
            ctx.roundRect(-nameBoxW / 2 + 6, -30 + 6, nameBoxW, 60, 30);
            ctx.fill();

            ctx.fillStyle = C.deep;
            ctx.beginPath();
            ctx.roundRect(-nameBoxW / 2, -30, nameBoxW, 60, 30);
            ctx.fill();
            ctx.strokeStyle = C.sand;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = C.sand;
            ctx.textBaseline = "middle";
            lsText(ctx, nameText, 0, 2, 3, "center");

            // Subtitle pill
            ctx.translate(0, 58);
            ctx.font = fM(900, 18);
            const stw = ctx.measureText(subTitle).width;
            const subBoxW = Math.max(240, stw + 60);

            ctx.fillStyle = C.ink;
            ctx.beginPath();
            ctx.roundRect(-subBoxW / 2 + 4, -20 + 4, subBoxW, 40, 20);
            ctx.fill();

            ctx.fillStyle = C.mango;
            ctx.beginPath();
            ctx.roundRect(-subBoxW / 2, -20, subBoxW, 40, 20);
            ctx.fill();
            ctx.strokeStyle = C.ink;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = C.ink;
            ctx.textBaseline = "middle";
            lsText(ctx, subTitle, 0, 1, 1, "center");

            ctx.restore();
          },
        },

        // ── FOOTER BANNER ─────────────────────────────────────────
        { kind: "rect", x: 40, y: 924, w: 920, h: 36, fill: C.coral, radius: 0 },
        {
          kind: "text",
          value: `${EVENT.hashtag.toUpperCase()} \u2022 ${EVENT.site}`,
          x: 500, y: 948,
          font: fM(900, 15), color: C.sand, align: "center", letterSpacing: 4,
        },

        // ── GRAIN OVERLAY ─────────────────────────────────────────
        { kind: "grain", opacity: 0.14 },
      ];
    },
  };
}
