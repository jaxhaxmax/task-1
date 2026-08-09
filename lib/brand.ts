
export const C = {
  ink: "#0D1B2A", 
  deep: "#173A5E", 
  coral: "#FF5A36", 
  mango: "#FFB238", 
  foam: "#7FD1C1", 
  sand: "#F2E8D5", 
  stampInk: "#C1361F", 
  muted: "#8AA0B4", 
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

export const ASSETS = {
  goaDevanagari: "/brand/goa-devanagari.svg",
  wordmark: "/brand/hh-goa-wordmark.svg",
  palm: "/brand/palm.png",
} as const;
