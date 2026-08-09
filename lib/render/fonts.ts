
let DISPLAY = "sans-serif";
let MONO = "monospace";
let resolved = false;
let readyPromise: Promise<void> | null = null;

function resolveFamilies() {
  if (resolved || typeof window === "undefined") return;
  const cs = getComputedStyle(document.documentElement);
  const d = cs.getPropertyValue("--f-display").trim();
  const m = cs.getPropertyValue("--f-mono").trim();
  if (!d || !m) return; 
  DISPLAY = d;
  MONO = m;
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
    ];

    await Promise.all(
      faces.map((f) => document.fonts.load(f).catch(() => undefined)),
    );
    await document.fonts.ready;
  })();

  return readyPromise;
}
