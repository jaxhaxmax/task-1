const HEIC_RE = /\.(heic|heif)$/i;
export const MAX_BYTES = 25 * 1024 * 1024;

/** iOS frequently reports an EMPTY mime type for HEIC. Never trust type alone. */
export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name);
}

export class ImageLoadError extends Error {}

/**
 * File -> ImageBitmap, handling the two traps that break every tool like this:
 *
 *   HEIC   desktop browsers cannot decode it, iOS Safari can. So we try native
 *          first and only pay the 1.5MB WASM cost when native actually fails.
 *   EXIF   phone photos carry a rotation flag. createImageBitmap does NOT apply
 *          it by default, so portraits arrive sideways.
 */
export async function loadImage(file: File): Promise<ImageBitmap> {
  if (file.size > MAX_BYTES) {
    throw new ImageLoadError("That photo is over 25MB. Try a smaller one.");
  }

  // 1. Native decode. Handles JPG, PNG, WEBP, GIF, and HEIC on iOS Safari.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
    //                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                            LOAD-BEARING. Without it portraits are sideways.
  } catch {
    /* fall through */
  }

  // 2. HEIC on a browser that cannot decode it. Dynamic import ONLY - a static
  //    import puts libheif WASM in the initial bundle for every visitor.
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

  // 3. Last resort. Modern browsers apply EXIF here automatically because the
  //    CSS image-orientation default is from-image.
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
