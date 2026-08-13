/**
 * BUILDER TITLES
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  THIS IS THE ONE FILE TO REWRITE IN YOUR OWN VOICE.             │
 * │  Everything else is structure. This is the joke.                │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Register, deliberately:
 *   - lowercase always. Uppercase is for the nameplate, not the class.
 *   - no emoji. An emoji turns the plate into a Discord role.
 *   - no exclamation marks. Nothing here is excited.
 *   - specific > clever. "it was dns" beats "network ninja" forever.
 *   - self-deprecating. The card is about YOU, so the joke lands only
 *     if it's at your own expense. A compliment reads as a participation
 *     trophy; a confession reads as a person.
 *   - ≤ 30 characters. Longer auto-shrinks, but shrinking is a smell.
 *
 * Rarity is expressed by GLAZE — the tile rail and the plate recolour.
 * Nobody is told they got "Legendary". They just notice the tiles are
 * gold and ask about it in the replies. That is the entire mechanic.
 */

export type GlazeKey = 'INDIGO' | 'VERDE' | 'OXIDE' | 'OURO';

/**
 * OURO (3%) — the flex. Still dry. Nothing aspirational, nothing
 * motivational. These are funny because they are quietly impossible.
 */
const OURO: string[] = [
  'merged on the first try',
  'wrote the docs too',
  'zero open tabs',
  'replies within the hour',
];

/** OXIDE (11%) — the menace tier. */
const OXIDE: string[] = [
  'ships on fridays',
  'force pushed to main',
  'deploys from the car',
  'renamed the repo again',
  'has a fork of everything',
  'commits at 2:47 pm',
  'deleted node_modules, prayed',
  'one branch from glory',
];

/** VERDE (24%) — the procrastinator tier. */
const VERDE: string[] = [
  'still reviewing the pr',
  'works on my machine',
  'refactored instead of shipping',
  'three branches deep',
  'wrote a script to avoid it',
  "bumped the version, that's it",
  'rewrote it in rust, unprompted',
  'two commits and a vibe',
  'named the variable temp2',
  'local dev is the demo',
];

/** INDIGO (62%) — the baseline condition. Half debugging, half timeline. */
const INDIGO: string[] = [
  "console.log('here')",
  'it was dns',
  'off by one',
  'merge conflict',
  'undefined is not a function',
  'stack overflow, load bearing',
  'context window exceeded',
  'temperature set to 1.4',
  'hallucinates confidently',
  'the prompt is the architecture',
  'retries until it works',
  'rate limited',
  'gm at 2:47 pm',
  'seed phrase in the notes app',
  'gas fee enjoyer',
  'read the whitepaper (skimmed)',
  'still on testnet',
  'narrative first, code later',
];

const POOL: Record<GlazeKey, string[]> = { OURO, OXIDE, VERDE, INDIGO };

/** Walked in this order so the 3% is exactly 3%. */
const WEIGHTS: Array<[GlazeKey, number]> = [
  ['OURO', 0.03],
  ['OXIDE', 0.11],
  ['VERDE', 0.24],
  ['INDIGO', 0.62],
];

/**
 * cyrb53 — fast, well-distributed, 53-bit, no dependency.
 * Deterministic across machines, which is what makes the reveal feel real:
 * the same person always gets the same class from the same inputs.
 */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export type Roll = { title: string; glaze: GlazeKey };

/**
 * Seed from identity, not from the clock — the class has to be stable
 * across re-renders, format switches and page reloads, or the "reveal"
 * is just noise. `salt` is the reroll counter.
 */
export function rollBuilderTitle(seedInput: string, salt = 0): Roll {
  const key = `${seedInput.trim().toLowerCase()}|${salt}`;

  const r = (cyrb53(key, 1) % 100000) / 100000;
  let acc = 0;
  let glaze: GlazeKey = 'INDIGO';
  for (const [g, p] of WEIGHTS) {
    acc += p;
    if (r < acc) {
      glaze = g;
      break;
    }
  }

  const list = POOL[glaze];
  const title = list[cyrb53(key, 2) % list.length] ?? list[0]!;
  return { title, glaze };
}

/** Build the seed from the fields the user actually filled in. */
export function seedFrom(fields: {
  name?: string;
  role?: string;
  stack?: string;
  github?: string;
}): string {
  return [fields.name, fields.role, fields.stack, fields.github]
    .map((s) => (s ?? '').trim().toLowerCase())
    .join('|');
}

export const ALL_TITLES = POOL;
export const TITLE_COUNT = OURO.length + OXIDE.length + VERDE.length + INDIGO.length;
