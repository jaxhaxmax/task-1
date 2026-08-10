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
    <div className="flex gap-0" style={{ border: "3px solid #2C1810" }}>
      {/* DOWNLOAD */}
      <button
        onClick={onDownload}
        disabled={!ready}
        className="flex-1 font-mono text-[10px] tracking-[0.25em] py-4 transition-all disabled:opacity-30"
        style={{
          background: "#F5ECD7",
          color: "#2C1810",
          border: "none",
          borderRight: "3px solid #2C1810",
          fontFamily: "var(--f-mono)",
        }}
        onMouseEnter={(e) => {
          if (ready) {
            e.currentTarget.style.background = "#2C1810";
            e.currentTarget.style.color = "#F5ECD7";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#F5ECD7";
          e.currentTarget.style.color = "#2C1810";
        }}
      >
        ↓ DOWNLOAD
      </button>

      {/* SHARE */}
      <button
        onClick={onShare}
        disabled={!ready || busy}
        className="flex-1 relative overflow-hidden transition-all disabled:opacity-30"
        style={{
          background: "#E85D3A",
          color: "#F5ECD7",
          border: "none",
          fontFamily: "var(--f-display)",
          fontSize: "18px",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          paddingTop: "16px",
          paddingBottom: "16px",
        }}
        onMouseEnter={(e) => {
          if (ready && !busy) {
            e.currentTarget.style.background = "#1B6B3F";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#E85D3A";
        }}
      >
        {/* Halftone overlay */}
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(44,24,16,0.1) 1px, transparent 1px)",
            backgroundSize: "5px 5px",
          }}
        />
        {/* Misreg ghost */}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{
            fontFamily: "var(--f-display)",
            fontSize: "18px",
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: "#E8A838",
            transform: "translate(3px, 2px)",
            opacity: 0.2,
          }}
        >
          {busy ? "OPENING…" : "SHARE TO X"}
        </span>
        <span className="relative z-10">
          {busy ? "OPENING…" : "🚀 SHARE TO X"}
        </span>
      </button>
    </div>
  );
}
