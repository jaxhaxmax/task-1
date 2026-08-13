/**
 * BUILDER PASS — design tokens
 *
 * Concept: an azulejo nameplate on a lime-washed Goan wall.
 * Portuguese tile tradition, Goan execution. Fontainhas, Panjim.
 *
 * Palette hierarchy (deliberate, do not reorder):
 *   green   — structure and ink. The brand. Carries the card.
 *   limewash— ground. Plaster, not paper. Textured, never flat.
 *   indigo  — the default tile glaze. Classic azulejo blue.
 *   ouro    — hairlines only. Gold leaf on a painted sign.
 *   magenta — the गोवा mark ONLY. Never anywhere else.
 *   oxide   — a glaze variant only. Not a general accent.
 *
 * Single point of Brand Kit swap: change C below, nothing else.
 */

export const PASS = { W: 1600, H: 900 } as const;
export const OG = { W: 1200, H: 630 } as const;

export const C = {
  green: '#0B4B2C', // Goa green — architrave, ink, rules
  greenDeep: '#062B18', // shadow side of the green
  limewash: '#F3EBDA', // plaster ground
  tile: '#F8F2E6', // tile body, slightly brighter than plaster
  cream: '#FBF6EC', // text on dark plates
  ouro: '#C08A1E', // gold hairline
  magenta: '#E23C77', // गोवा mark only
  indigo: '#1C3D72',
  oxide: '#A93A24',
  verde: '#0B5C3A',
} as const;

export type GlazeKey = 'INDIGO' | 'VERDE' | 'OXIDE' | 'OURO';

export type Glaze = {
  key: GlazeKey;
  label: string;
  /** tile motif + eyebrow */
  motif: string;
  /** the small centre dot inside each tile's quatrefoil */
  dot: string;
  /** the title plate fill */
  plate: string;
  /** the title plate text */
  plateText: string;
  /** probability, must sum to 1 across all glazes */
  p: number;
};

/**
 * Rarity is VISIBLE, not named. The whole tile rail recolours.
 * OURO also thickens the gold pinstripe on the architrave — a payoff
 * you can spot at thumbnail size, which is what makes people reroll.
 */
export const GLAZES: Record<GlazeKey, Glaze> = {
  INDIGO: {
    key: 'INDIGO',
    label: 'INDIGO',
    motif: '#1C3D72',
    dot: '#A93A24',
    plate: '#1C3D72',
    plateText: '#FBF6EC',
    p: 0.62,
  },
  VERDE: {
    key: 'VERDE',
    label: 'VERDE',
    motif: '#0B5C3A',
    dot: '#C08A1E',
    plate: '#0B5C3A',
    plateText: '#FBF6EC',
    p: 0.24,
  },
  OXIDE: {
    key: 'OXIDE',
    label: 'OXIDE',
    motif: '#A93A24',
    dot: '#1C3D72',
    plate: '#93301D',
    plateText: '#FBF6EC',
    p: 0.11,
  },
  OURO: {
    key: 'OURO',
    label: 'OURO',
    motif: '#A8801A',
    dot: '#A93A24',
    plate: '#5A4407',
    plateText: '#F0CE7B',
    p: 0.03,
  },
};

/** Roll order matters — walked high-rarity first so the 3% is exact. */
export const GLAZE_ORDER: GlazeKey[] = ['OURO', 'OXIDE', 'VERDE', 'INDIGO'];

/**
 * Geometry. Every number here is load bearing — the layout was solved
 * on paper at 1600x900 and these are the results. If you move one,
 * check the two neighbours above and below it.
 */
export const GEO = {
  frame: 34, // green architrave
  pinstripe: { x: 16, y: 16, w: PASS.W - 32, h: PASS.H - 32 },

  plaque: { x: 34, y: 34, w: 1532, h: 832 },
  rail: { x: 34, y: 34, w: 140, h: 832, tiles: 6 },

  contentL: 214,
  contentR: 1536,

  headBaseline: 112,
  rule1: 154,

  photo: { x: 214, y: 198, s: 372 },
  meta1: 616, // dates
  meta2: 650, // coordinates

  col: { x: 644, w: 892 }, // right-hand identity column

  eyebrow: 246,
  name: 346,
  role: 406,
  stack: 450,
  glazeTag: 498,
  plate: { x: 644, y: 514, w: 892, h: 104 },
  socials: 686,

  rule2: 722,
  quote: 782,
  rule3: 806,
  foot: 844,
} as const;

/** The line the whole card is built around. */
export const QUOTE = 'Quem viu Goa, excusa de ver Lisboa';
export const QUOTE_ATTR = 'PORTUGUESE PROVERB \u00B7 GOA';

/**
 * गोवा in the lockup.
 *
 * Chrome and Safari shape Devanagari correctly on canvas. Some engines
 * do not, and when shaping fails the matras detach — you get ग ो व ा
 * instead of गोवा, which looks broken rather than distinctive.
 *
 * I could not verify this headlessly, so: LOOK AT IT ON YOUR PHONE.
 * If the vowel marks are floating loose, set this to false and the
 * lockup falls back to a Latin GOA. Five-second fix, no other changes.
 */
export const USE_DEVANAGARI = true;
export const GOA_DEVANAGARI = '\u0917\u094B\u0935\u093E'; // गोवा
export const GOA_LATIN = 'GOA';

export const EVENT = {
  datesLine: '28\u201331 OCT 2026',
  coords: '15.2993\u00B0N   74.1240\u00B0E',
  hashtag: '#FrameInGoa',
  studio: '2:47 PM STUDIO',
  domain: 'hhgoa.com',
} as const;

/** rgba() from a #rrggbb hex plus alpha. */
export function withAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
