"use client";

export type ToastKind = "info" | "error" | "success";

export function Toast({ msg, kind }: { msg: string; kind: ToastKind }) {
  if (!msg) return null;
  const tone =
    kind === "error"
      ? "border-coral/50 text-coral"
      : kind === "success"
        ? "border-foam/50 text-foam"
        : "border-white/15 text-muted";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-lg border px-3 py-2 font-mono text-xs leading-relaxed ${tone}`}
    >
      {msg}
    </div>
  );
}
