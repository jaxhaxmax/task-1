"use client";

export type ToastKind = "info" | "error" | "success";

export function Toast({ msg, kind }: { msg: string; kind: ToastKind }) {
  if (!msg) return null;

  const styles = {
    error:   { bg: "#E85D3A", color: "#F5ECD7", border: "#2C1810", icon: "⚠️" },
    success: { bg: "#1B6B3F", color: "#E8A838", border: "#2C1810", icon: "🌴" },
    info:    { bg: "#EDE4CC", color: "#8B7B5E", border: "#2C1810", icon: "🌊" },
  }[kind];

  return (
    <div
      role="status"
      aria-live="polite"
      className="tropic-enter font-mono text-xs leading-relaxed"
      style={{
        padding: "10px 14px",
        border: `3px solid ${styles.border}`,
        background: styles.bg,
        color: styles.color,
        boxShadow: "3px 3px 0 #2C1810",
        letterSpacing: "0.1em",
        fontFamily: "var(--f-mono)",
        fontSize: "11px",
      }}
    >
      <span
        aria-hidden
        style={{ marginRight: 8 }}
      >
        {styles.icon}
      </span>
      {msg}
    </div>
  );
}
