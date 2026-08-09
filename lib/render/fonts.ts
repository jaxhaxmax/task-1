/**
 * next/font generates HASHED family names ("__Bricolage_Grotesque_a1b2c3").
 * Writing ctx.font = '800 88px "Bricolage Grotesque"' therefore falls back to
 * Arial silently and the export looks wrong with no error anywhere.
 *
 * Two things are needed and both are load-bearing:
 *   1. read the real family name out of the CSS variable next/font sets
 *   2. explicitly document.fonts.load() every face before drawing, because
 *      setting ctx.font does NOT mark a font as pending, so document.fonts.ready
 *      can resolve before a canvas-only font has even started downloading.
 */

let DISPLAY = "sans-serif";
let MONO = "monospace";
let resolved = false;
let readyPromise: Promise<void> | null = null;

function resolveFamilies() {
  if (resolved || typeof window === "undefined") return;
  const cs = getComputedStyle(document.documentElement);
  const d = cs.getPropertyValue("--f-display").trim();
  const m = cs.getPropertyValue("--f-mono").trim();
  if (!d || !m) return; // don't cache a miss — retry on the next call
  DISPLAY = d;
  MONO = m;
  resolved = true;
}

/** Display face. Names, wordmarks, headlines. Identity, never data. */
export function fD(weight: number, size: number): string {
  resolveFamilies();
  return `${weight} ${size}px ${DISPLAY}, sans-serif`;
}

/** Mono face. Labels, serials, coordinates, dates. Data, never identity. */
export function fM(weight: number, size: number): string {
  resolveFamilies();
  return `${weight} ${size}px ${MONO}, monospace`;
}

/**
 * Call and await before the first canvas draw. Idempotent, cached.
 * The sizes here are arbitrary; the browser caches per family+weight, so
 * loading one size loads the face for every size.
 */
export function ensureFonts(): Promise<void> {
  resolveFamilies();
  if (readyPromise && resolved) return readyPromise;

  readyPromise = (async () => {
    if (typeof document === "undefined") return;

    // Resolve again in case families became available since the earlier call
    resolveFamilies();

    const faces = [
      fD(800, 64),
      fD(700, 40),
      fM(700, 32),
      fM(400, 26),
    ];

    await Promise.all(
      faces.map((f) => document.fonts.load(f).catch(() => undefined)),
    );
    await document.fonts.ready;
  })();

  return readyPromise;
}
