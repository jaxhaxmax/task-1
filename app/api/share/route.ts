import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

const MAX = 5_000_000;

/**
 * Stores the generated art and its OG composite so /f/{id} can serve a real
 * link preview.
 *
 * NEVER THROWS. If storage is unconfigured or fails, we return { id: null } and
 * the client degrades to the download + native-share path. A broken share is
 * bad; a broken app is worse.
 */
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ id: null });
  }

  try {
    const fd = await req.formData();
    const art = fd.get("art");
    const og = fd.get("og");

    if (!(art instanceof Blob) || !(og instanceof Blob)) {
      return Response.json({ id: null }, { status: 400 });
    }
    if (art.size > MAX || og.size > MAX) {
      return Response.json({ id: null }, { status: 413 });
    }

    const id = nanoid(8);

    await Promise.all([
      put(`f/${id}.png`, art, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false, // LOAD-BEARING: makes the URL rebuildable from id
      }),
      put(`f/${id}-og.png`, og, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
      }),
    ]);

    return Response.json({ id });
  } catch {
    return Response.json({ id: null }, { status: 500 });
  }
}
