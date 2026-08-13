export const C = {
  ink: "#2C1810", // Rich Brown
  deep: "#1B6B3F", // Tropical Forest Green
  coral: "#E85D3A", // Sunset Coral
  mango: "#E8A838", // Golden Sun
  foam: "#0E8D7A", // Ocean Teal
  sand: "#F5ECD7", // Warm Sand Paper
  stampInk: "#1B6B3F", // Forest Green Stamp
  muted: "#8B7B5E", // Muted Earth
} as const;

export type Stop = [number, string];

export const GRAD = {
  sunrise: [
    [0, "#E85D3A"],
    [1, "#E8A838"],
  ] as Stop[],
  dusk: [
    [0, "#2C1810"],
    [1, "#1B6B3F"],
  ] as Stop[],
  glow: [
    [0, "rgba(232,168,56,0.2)"],
    [1, "rgba(0,0,0,0)"],
  ] as Stop[],
};

export const RARITY = {
  common: { label: "TRAVELER", color: C.ink, bg: C.sand },
  rare: { label: "EXPLORER", color: C.sand, bg: C.deep },
  epic: { label: "NAVIGATOR", color: C.ink, bg: C.coral },
  legendary: { label: "LEGEND", color: C.mango, bg: C.ink },
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
  tagline: "BUILD IN PARADISE. SHIP FROM THE BEACH.",
  site: "HHGOA.COM",
  handle: "@247pmstudio",
  hashtag: "#FrameInGoa",
  studioTime: "2:47 PM",
} as const;

export const ASSETS = {
  goaDevanagari: "/brand/goa-devanagari.svg",
  wordmark: "/brand/hh-goa-wordmark.svg",
  palm: "/brand/palm.png",
  goaBg: "/brand/goa-bg.png",
} as const;
