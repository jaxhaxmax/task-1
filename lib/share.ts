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

export async function shareToX(
  payload: SharePayload | null,
  captionText: string,
): Promise<ShareResult> {
  
  if (payload && navigator.canShare?.({ files: [payload.file] })) {
    try {
      
      
      await navigator.share({ files: [payload.file], text: captionText });
      return "native";
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return "cancelled";
      
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
