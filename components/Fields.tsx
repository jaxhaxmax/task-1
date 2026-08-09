"use client";
import { RARITY } from "@/lib/brand";
import type { Rarity } from "@/lib/types";

const input =
  "w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sand placeholder:text-muted/60 focus:border-mango/60 focus:outline-none";

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
      <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-foam">
        {label}
      </span>
      <input
        className={input}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** The title is a REVEAL, not a dropdown. Re-rolls drive repeat posts. */
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

  return (
    <div>
      <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-foam">
        BUILDER CLASS
      </span>
      <div className="flex items-center gap-2">
        <div
          key={`${title}-${serial}`}
          className="chip-pop flex flex-1 items-center justify-between gap-3 rounded-xl border border-coral/50 bg-coral/10 px-4 py-3"
        >
          <span className="font-display text-lg font-bold text-coral">{title}</span>
          <span
            className="shrink-0 font-mono text-[10px] tracking-[0.2em]"
            style={{ color: r.color }}
          >
            &#9670; {r.label}
          </span>
        </div>
        <button
          onClick={onReroll}
          aria-label="Re-roll builder class"
          className="rounded-xl border border-white/15 px-4 py-3 font-mono text-xs tracking-widest text-muted transition hover:bg-white/5 hover:text-sand"
        >
          RE&#8209;ROLL
        </button>
      </div>
      <p className="mt-1.5 font-mono text-[10px] tracking-[0.15em] text-muted">
        SEAT #{serial}/247
      </p>
    </div>
  );
}
