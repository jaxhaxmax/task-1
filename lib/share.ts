import type { FormatId } from "./types";

export type SharePayload = {
  file: File;
  upload: Promise<{ id: string | null }>;
};

export function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"),
  );
}

/**
 * Called on every RENDER COMPLETION, never on click.
 *
 * Two reasons this must happen eagerly:
 *   1. iOS Safari treats an intervening network await as consuming the user
 *      gesture, so navigator.share() throws NotAllowedError. The File has to
 *      already exist when the click handler runs.
 *   2. By the time the user reaches for Share, the blob upload has usually
 *      already resolved, so the share feels instant.
 */
export async function prepareShare(
  artCanvas: HTMLCanvasElement,
  ogCanvas: HTMLCanvasElement,
  format: FormatId,
  serial: string,
): Promise<SharePayload> {
  const art = await toBlob(artCanvas);
  const og = await toBlob(ogCanvas);

  const file = new File([art], `framein-goa-${format}-${serial}.png`, {
    type: "image/png",
  });

  const fd = new FormData();
  fd.append("art", art);
  fd.append("og", og);

  const upload = fetch("/api/share", { method: "POST", body: fd })
    .then((r) => r.json() as Promise<{ id: string | null }>)
    .catch(() => ({ id: null as string | null }));

  return { file, upload };
}

export type ShareResult = "native" | "cancelled" | "link" | "link-fallback";

/**
 * Three tiers, tried in order.
 *
 *   A  Web Share Level 2  - native sheet with the image ATTACHED. The real
 *      mobile answer, and the reason the tool satisfies "one pass, start to
 *      finish" where competitors tell users to attach the file by hand.
 *   B  OG link           - X's web intent CANNOT attach an image, so we pass a
 *      /f/{id} URL whose card preview IS the generated graphic.
 *   C  homepage fallback - storage unconfigured or offline.
 */
export async function shareToX(
  payload: SharePayload | null,
  captionText: string,
): Promise<ShareResult> {
  // canShare() is synchronous, so the user gesture survives into share().
  if (payload && navigator.canShare?.({ files: [payload.file] })) {
    try {
      // NOTE: files + text only. Including `url` alongside files makes some
      // Android targets silently drop the image.
      await navigator.share({ files: [payload.file], text: captionText });
      return "native";
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return "cancelled";
      // any other failure falls through to the link path
    }
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const { id } = payload ? await payload.upload : { id: null };
  const url = id ? `${base}/f/${id}` : base;

  window.open(
    `https://x.com/intent/post?text=${encodeURIComponent(captionText)}&url=${encodeURIComponent(url)}`,
    "_blank",
    "noopener,noreferrer",
  );

  return id ? "link" : "link-fallback";
}

/** Revoking the object URL immediately breaks the download in Safari. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}
