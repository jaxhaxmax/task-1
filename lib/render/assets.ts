const cache = new Map<string, HTMLImageElement | null>();
const inflight = new Map<string, Promise<HTMLImageElement | null>>();

export function getAsset(src: string): HTMLImageElement | null {
  return cache.get(src) ?? null;
}

export function loadAsset(src: string): Promise<HTMLImageElement | null> {
  if (cache.has(src)) return Promise.resolve(cache.get(src)!);
  const existing = inflight.get(src);
  if (existing) return existing;

  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      cache.set(src, null); 
      resolve(null);
    };
    img.src = src;
  });

  inflight.set(src, p);
  return p;
}

export function preloadAssets(srcs: string[]): Promise<unknown> {
  return Promise.all(srcs.map(loadAsset));
}
