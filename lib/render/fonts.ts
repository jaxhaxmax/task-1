
let DISPLAY = "sans-serif";
let MONO = "monospace";
let DEVANAGARI = "sans-serif";
let resolved = false;
let readyPromise: Promise<void> | null = null;

function resolveFamilies() {
  if (resolved || typeof window === "undefined") return;
  const cs = getComputedStyle(document.documentElement);
  const d = cs.getPropertyValue("--f-display").trim();
  const m = cs.getPropertyValue("--f-mono").trim();
  const dv = cs.getPropertyValue("--f-devanagari").trim();
  if (!d || !m) return;
  DISPLAY = d;
  MONO = m;
  if (dv) DEVANAGARI = dv;
  resolved = true;
}

export function fD(weight: number, size: number): string {
  resolveFamilies();
  return `${weight} ${size}px ${DISPLAY}, sans-serif`;
}

export function fM(weight: number, size: number): string {
  resolveFamilies();
  return `${weight} ${size}px ${MONO}, monospace`;
}

/** Devanagari — Noto Sans Devanagari via --f-devanagari CSS var */
export function fDev(weight: number, size: number): string {
  resolveFamilies();
  return `${weight} ${size}px ${DEVANAGARI}, sans-serif`;
}

export function ensureFonts(): Promise<void> {
  resolveFamilies();
  if (readyPromise && resolved) return readyPromise;

  readyPromise = (async () => {
    if (typeof document === "undefined") return;

    resolveFamilies();

    const faces = [
      fD(800, 64),
      fD(700, 40),
      fM(700, 32),
      fM(400, 26),
      fDev(700, 44),
    ];

    await Promise.all(
      faces.map((f) => document.fonts.load(f).catch(() => undefined)),
    );
    await document.fonts.ready;
  })();

  return readyPromise;
}
