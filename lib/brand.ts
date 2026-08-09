/**
 * SINGLE SOURCE OF TRUTH FOR THE VISUAL IDENTITY.
 *
 * When the official HH Goa Brand Kit arrives (footer link on hhgoa.com), edit
 * this file and nothing else. Every render spec references these tokens, never
 * a literal hex value, so the swap is one file plus the assets in public/brand.
 */

export const C = {
  ink: "#0D1B2A", // pre-dawn navy, primary surface
  deep: "#173A5E", // ocean blue, secondary surface
  coral: "#FF5A36", // sunrise coral, PRIMARY ACCENT
  mango: "#FFB238", // golden hour, secondary accent
  foam: "#7FD1C1", // sea foam, data labels only
  sand: "#F2E8D5", // paper, primary text on dark
  stampInk: "#C1361F", // stamp red, the stamp element ONLY
  muted: "#8AA0B4", // muted labels
} as const;

export type Stop = [number, string];

export const GRAD = {
  sunrise: [
    [0, "#FF5A36"],
    [0.55, "#FF8A3D"],
    [1, "#FFB238"],
  ] as Stop[],
  dusk: [
    [0, "#0D1B2A"],
    [1, "#173A5E"],
  ] as Stop[],
  glow: [
    [0, "rgba(255,90,54,0.30)"],
    [0.6, "rgba(255,178,56,0.10)"],
    [1, "rgba(13,27,42,0)"],
  ] as Stop[],
};

/**
 * Rarity tiers are FARE CLASSES, not loot-box tiers. Common/Rare/Epic/Legendary
 * would break the boarding-pass concept; a fare class is something a real
 * travel document actually carries.
 */
export const RARITY = {
  common: { label: "STANDARD", color: C.foam },
  rare: { label: "PRIORITY", color: C.mango },
  epic: { label: "BUSINESS", color: C.coral },
  legendary: { label: "FOUNDER", color: C.sand },
} as const;

export const EVENT = {
  name: "HACKER HOUSE GOA",
  short: "HH GOA",
  year: "2026",
  dates: "28-31 OCT 2026",
  datesPretty: "28\u201331 OCT 2026",
  boarding: "28 OCT 2026",
  gate: "GOA",
  coords: "15.29\u00B0N 74.12\u00B0E",
  cohort: 247,
  tagline: "LESS NOISE. MORE SIGNAL.",
  site: "HHGOA.COM",
  handle: "@247pmstudio",
  hashtag: "#FrameInGoa",
  studioTime: "2:47 PM",
} as const;

/** Optional brand assets. Missing files are skipped silently at render time. */
export const ASSETS = {
  goaDevanagari: "/brand/goa-devanagari.svg",
  wordmark: "/brand/hh-goa-wordmark.svg",
  palm: "/brand/palm.png",
} as const;
