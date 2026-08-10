"use client";
import type { FormatId } from "@/lib/types";
import { useMechanicalSounds } from "./useAudio";

const TABS: { id: Exclude<FormatId, "og">; label: string; sub: string; icon: string }[] = [
  { id: "pfp",     label: "PFP",           sub: "CIRCLE",  icon: "🌅" },
  { id: "idcard",  label: "BUILDER PASS",  sub: "ID CARD", icon: "🎫" },
  { id: "team",    label: "TEAM",          sub: "CREW",    icon: "🌴" },
];

export function FormatTabs({
  value,
  onChange,
}: {
  value: FormatId;
  onChange: (f: Exclude<FormatId, "og">) => void;
}) {
  const { playSound } = useMechanicalSounds();

  return (
    <div
      role="tablist"
      aria-label="Format"
      className="flex gap-2"
    >
      {TABS.map((t, idx) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (value !== t.id) playSound("click");
              onChange(t.id);
            }}
            className="relative flex-1 flex flex-col items-center justify-center py-4 px-2 font-mono text-[10px] tracking-[0.18em] transition-all duration-150 border-4 border-[#2C1810]"
            style={{
              background: active ? "#E8A838" : "#E85D3A",
              color: active ? "#2C1810" : "#F5ECD7",
              boxShadow: active ? "6px 6px 0px #1B6B3F" : "4px 4px 0px #2C1810",
              fontFamily: "var(--f-mono)",
              position: "relative",
              overflow: "hidden",
              transform: active ? "translateY(-4px)" : "none",
            }}
          >
            {/* Halftone texture overlay */}
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(44,24,16,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "6px 6px",
              }}
            />
            {/* Misreg ghost on active */}
            {active && (
              <span
                aria-hidden
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
                style={{
                  color: "#E85D3A",
                  transform: "translate(3px, 3px)",
                  opacity: 0.3,
                  fontFamily: "var(--f-mono)",
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "0.18em",
                }}
              >
                {t.label}
              </span>
            )}
            <span style={{ fontSize: 18, marginBottom: 4, position: "relative" }}>{t.icon}</span>
            <span className="text-[12px] font-black tracking-[0.15em] leading-tight relative">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
