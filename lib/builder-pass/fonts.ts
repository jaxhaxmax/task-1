/**
 * CANVAS FONT RESOLUTION
 *
 * Two traps, both silent, both fatal to the export:
 *
 *  1. next/font generates HASHED family names. Writing
 *     ctx.font = '900 96px "Fraunces"' matches nothing and falls back to
 *     Arial with no error anywhere. You only find out by looking at a PNG.
 *
 *  2. document.fonts.ready is NOT sufficient. It resolves when *pending*
 *     loads finish, and setting ctx.font does not mark a font as pending.
 *     A face that nothing in the DOM uses may never start downloading.
 *
 * Fix: read the real family off the CSS variable, then explicitly
 * document.fonts.load() every weight/style combination we draw with.
 *
 * REQUIRED in app/layout.tsx — note display: 'block' on all three.
 * With 'swap' a fallback can paint, and if the canvas renders during that
 * window your export is set in Arial.
 *
 *   import { Fraunces, JetBrains_Mono, Noto_Serif_Devanagari } from 'next/font/google';
 *
 *   const display = Fraunces({
 *     subsets: ['latin'],
 *     weight: ['600', '700', '900'],
 *     style: ['normal', 'italic'],
 *     display: 'block',
 *     variable: '--font-display',
 *   });
 *   const mono = JetBrains_Mono({
 *     subsets: ['latin'],
 *     weight: ['400', '500', '600', '700'],
 *     display: 'block',
 *     variable: '--font-mono',
 *   });
 *   const deva = Noto_Serif_Devanagari({
 *     subsets: ['devanagari'],
 *     weight: ['600', '700'],
 *     display: 'block',
 *     variable: '--font-deva',
 *   });
 *
 *   <html className={`${display.variable} ${mono.variable} ${deva.variable}`}>
 */

const FALLBACK = {
  display: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  deva: '"Noto Serif Devanagari", "Nirmala UI", "Devanagari Sangam MN", serif',
};

let families = { ...FALLBACK };
let resolved = false;
let loading: Promise<void> | null = null;

function cssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Resolve the hashed families. Only caches on SUCCESS — an early call
 * before next/font's CSS variables land must not permanently poison the
 * cache with the fallback. (This exact bug shipped once already.)
 */
export function resolveFamilies(): boolean {
  if (resolved) return true;
  const d = cssVar('--font-pass-display');
  const m = cssVar('--font-pass-mono');
  if (!d || !m) return false;
  families = {
    display: d,
    mono: m,
    deva: cssVar('--font-pass-deva') || FALLBACK.deva,
  };
  resolved = true;
  return true;
}

/** document.fonts.load() chokes on a comma list — feed it one family. */
function first(list: string): string {
  const head = list.split(',')[0]?.trim() ?? '';
  return head || 'sans-serif';
}

/** Every face the pass actually draws with. Keep in sync with fD/fM/fDev calls. */
const NEEDED: Array<[keyof typeof families, string]> = [
  ['display', '900 96px'],
  ['display', '700 40px'],
  ['display', '600 40px'],
  ['display', 'italic 600 38px'],
  ['mono', '700 44px'],
  ['mono', '600 30px'],
  ['mono', '500 27px'],
  ['mono', '400 22px'],
  ['deva', '700 54px'],
];

/**
 * Await this before EVERY render. It is cheap after the first call.
 * Never memoises a promise built from unresolved family names.
 */
export async function ensureBuilderPassFonts(): Promise<void> {
  if (typeof document === 'undefined') return;

  if (!resolveFamilies()) {
    // CSS variables not applied yet — give the stylesheet a tick and retry.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    resolveFamilies();
  }

  if (loading) return loading;

  loading = (async () => {
    const jobs = NEEDED.map(([role, spec]) =>
      document.fonts.load(`${spec} ${first(families[role])}`).catch(() => []),
    );
    await Promise.all(jobs);
    await document.fonts.ready;
  })();

  try {
    await loading;
  } finally {
    // If families were still unresolved, drop the memo so a later call retries.
    if (!resolved) loading = null;
  }
}

/** Display face — identity. Names, wordmark, the proverb. */
export function fD(weight: number, size: number, italic = false): string {
  return `${italic ? 'italic ' : ''}${weight} ${size}px ${families.display}`;
}

/** Mono face — data. Labels, handles, dates, coordinates, the title. */
export function fM(weight: number, size: number): string {
  return `${weight} ${size}px ${families.mono}`;
}

/** Devanagari — the गोवा mark only. */
export function fDev(weight: number, size: number): string {
  return `${weight} ${size}px ${families.deva}`;
}

/** Diagnostic. Log this once in dev — if it says "sans-serif", stop and fix. */
export function fontReport() {
  return { ...families, resolved };
}
