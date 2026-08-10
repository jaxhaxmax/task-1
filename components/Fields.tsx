"use client";
import { RARITY } from "@/lib/brand";
import type { Rarity } from "@/lib/types";
import { useMechanicalSounds } from "./useAudio";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 40,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      {/* Tropical label tab */}
      <span
        className="block font-mono text-[9px] tracking-[0.28em] px-3 py-1.5"
        style={{
          background: "#1B6B3F",
          color: "#E8A838",
          display: "inline-block",
          marginBottom: 0,
          letterSpacing: "0.28em",
        }}
      >
        {label}
      </span>
      <input
        className="w-full font-mono text-sm tracking-wider"
        style={{
          padding: "12px 16px",
          border: "3px solid #2C1810",
          borderTop: "none",
          background: "#F5ECD7",
          color: "#2C1810",
          outline: "none",
          boxShadow: "3px 3px 0 #1B6B3F",
          transition: "box-shadow 0.1s",
          fontFamily: "var(--f-mono)",
          fontSize: "14px",
          letterSpacing: "0.05em",
        }}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = "3px 3px 0 #E8A838";
          e.currentTarget.style.background = "#EDE4CC";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "3px 3px 0 #1B6B3F";
          e.currentTarget.style.background = "#F5ECD7";
        }}
      />
    </label>
  );
}

export function TitleReveal({
  title,
  rarity,
  serial,
  onReroll,
}: {
  title: string;
  rarity: Rarity;
  serial: string;
  onReroll: () => void;
}) {
  const r = RARITY[rarity];
  const { playSound } = useMechanicalSounds();

  const rarityColors: Record<Rarity, { bg: string; text: string; border: string; accent: string }> = {
    common:    { bg: "#F5ECD7",  text: "#2C1810",  border: "#2C1810", accent: "#8B7B5E" },
    rare:      { bg: "#1B6B3F",  text: "#F5ECD7",  border: "#2C1810", accent: "#0E8D7A" },
    epic:      { bg: "#E85D3A",  text: "#F5ECD7",  border: "#2C1810", accent: "#E8A838" },
    legendary: { bg: "#2C1810",  text: "#E8A838",  border: "#E8A838", accent: "#E85D3A" },
  };

  const rc = rarityColors[rarity];

  return (
    <div>
      {/* Label */}
      <span
        className="block font-mono text-[9px] tracking-[0.28em] px-3 py-1.5"
        style={{
          background: "#E8A838",
          color: "#2C1810",
          display: "inline-block",
          marginBottom: 0,
        }}
      >
        🏝️ BUILDER CLASS
      </span>

      {/* Title card + reroll */}
      <div className="flex items-stretch gap-0" style={{ border: "3px solid #2C1810", borderTop: "none" }}>
        <div
          key={`${title}-${serial}`}
          className="chip-pop flex-1 flex items-center justify-between gap-3 px-4 py-3"
          style={{
            background: rc.bg,
            borderRight: "3px solid #2C1810",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Halftone texture */}
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, ${rc.accent}22 1px, transparent 1px)`,
              backgroundSize: "5px 5px",
            }}
          />

          {/* Title with misreg effect */}
          <div className="relative">
            {/* Green shadow layer */}
            <span
              aria-hidden
              className="absolute inset-0 flex items-center font-display text-xl font-black uppercase"
              style={{
                fontFamily: "var(--f-display)",
                color: "#1B6B3F",
                transform: "translate(2px, 2px)",
                opacity: 0.25,
              }}
            >
              {title}
            </span>
            <span
              className="relative font-display text-xl font-black uppercase"
              style={{ fontFamily: "var(--f-display)", color: rc.text }}
            >
              {title}
            </span>
          </div>

          {/* Rarity badge */}
          <span
            className="shrink-0 font-mono text-[9px] tracking-[0.2em] px-2 py-1"
            style={{
              background: "#2C1810",
              color: "#E8A838",
              border: "1.5px solid #E8A838",
              whiteSpace: "nowrap",
            }}
          >
            🌟 {r.label}
          </span>
        </div>

        {/* Reroll button */}
        <button
          onClick={() => {
            playSound("stamp");
            onReroll();
          }}
          aria-label="Re-roll builder class"
          className="px-4 font-mono text-[10px] tracking-[0.15em] transition-all"
          style={{
            background: "#EDE4CC",
            color: "#8B7B5E",
            border: "none",
            fontFamily: "var(--f-mono)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#E85D3A";
            e.currentTarget.style.color = "#F5ECD7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#EDE4CC";
            e.currentTarget.style.color = "#8B7B5E";
          }}
        >
          RE&#8209;ROLL
        </button>
      </div>

      {/* Serial number */}
      <p
        className="font-mono text-[9px] tracking-[0.2em] px-1 pt-1.5"
        style={{ color: "#8B7B5E" }}
      >
        🎫 SEAT #{serial}/247
      </p>
    </div>
  );
}
