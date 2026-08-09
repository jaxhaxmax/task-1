const HEIC_RE = /\.(heic|heif)$/i;
export const MAX_BYTES = 25 * 1024 * 1024;

export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name);
}

export class ImageLoadError extends Error {}

export async function loadImage(file: File): Promise<ImageBitmap> {
  if (file.size > MAX_BYTES) {
    throw new ImageLoadError("That photo is over 25MB. Try a smaller one.");
  }

  
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
    
    
  } catch {
      }

  
  
  if (isHeic(file)) {
    try {
      const mod = await import("heic2any");
      const heic2any = (mod as any).default ?? mod;
      const out = await (heic2any as unknown as (o: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>)({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92,
      });
      const blob = Array.isArray(out) ? out[0] : out;
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      throw new ImageLoadError(
        "Could not read that HEIC. On iPhone try Settings > Camera > Formats > Most Compatible, or send yourself the photo as a JPG.",
      );
    }
  }

  
  
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return await createImageBitmap(img);
  } catch {
    throw new ImageLoadError("That file did not decode. Try a JPG or PNG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
