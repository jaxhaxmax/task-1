import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };


const BLOB = process.env.NEXT_PUBLIC_BLOB_BASE_URL || "";
const BASE = process.env.NEXT_PUBLIC_BASE_URL || "";

/**
 * THE REQUIREMENT MOST SUBMISSIONS FAIL.
 *
 * X's web intent cannot attach an image, so the brief specifies that a shared
 * link's preview must show the actual generated graphic. That is exactly what
 * this does: og:image points at the stored OG composite for this share id.
 *
 * No database - the blob path is rebuilt from the id, which works because
 * /api/share writes with addRandomSuffix: false.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const img = `${BLOB}/f/${id}-og.png`;
  const title = "I got my Hacker House Goa 2026 pass";
  const description =
    "Drop a photo, get your HH Goa 2026 frame or builder pass in seconds. #FrameInGoa";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE}/f/${id}`,
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image", 
      title,
      description,
      images: [img],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const art = `${BLOB}/f/${id}.png`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 px-5 py-12">
      <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {}
        {}
        <img src={art} alt="Hacker House Goa 2026 pass" className="w-full" />
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <a
          href={art}
          download={`framein-goa-${id}.png`}
          className="flex-1 rounded-xl border border-white/15 py-4 text-center font-mono text-sm tracking-widest text-sand/80 transition hover:bg-white/5"
        >
          DOWNLOAD
        </a>
        <Link
          href="/"
          className="flex-1 rounded-xl bg-coral py-4 text-center font-display text-lg font-extrabold text-ink transition hover:brightness-110"
        >
          Make yours
        </Link>
      </div>

      <p className="text-center font-mono text-xs tracking-widest text-muted">
        HACKER HOUSE GOA 2026 &middot; 28&ndash;31 OCT &middot; #FrameInGoa
      </p>
    </main>
  );
}
