"use client";
import type { FormatId } from "@/lib/types";

const TABS: { id: Exclude<FormatId, "og">; label: string }[] = [
  { id: "pfp", label: "PFP" },
  { id: "idcard", label: "BUILDER PASS" },
  { id: "team", label: "TEAM" },
];

export function FormatTabs({
  value,
  onChange,
}: {
  value: FormatId;
  onChange: (f: Exclude<FormatId, "og">) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Format"
      className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1"
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 rounded-lg px-2 py-2.5 font-mono text-[11px] tracking-[0.15em] transition ${
            value === t.id
              ? "bg-coral text-ink"
              : "text-muted hover:bg-white/5 hover:text-sand"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
