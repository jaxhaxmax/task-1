"use client";

export function ShareBar({
  onDownload,
  onShare,
  busy,
  ready,
}: {
  onDownload: () => void;
  onShare: () => void;
  busy: boolean;
  ready: boolean;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onDownload}
        disabled={!ready}
        className="flex-1 rounded-xl border border-white/15 py-4 font-mono text-xs tracking-[0.2em] text-sand transition hover:bg-white/5 disabled:opacity-40"
      >
        DOWNLOAD
      </button>
      <button
        onClick={onShare}
        disabled={!ready || busy}
        className="flex-1 rounded-xl bg-coral py-4 font-display text-lg font-extrabold text-ink transition hover:brightness-110 disabled:opacity-40"
      >
        {busy ? "Opening\u2026" : "Share to X"}
      </button>
    </div>
  );
}
