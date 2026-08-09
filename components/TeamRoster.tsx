"use client";
import { useRef } from "react";

export function TeamRoster({
  names,
  onNames,
  photos,
  onPickPhoto,
  activeIndex,
  onActive,
}: {
  names: string[];
  onNames: (n: string[]) => void;
  photos: (ImageBitmap | null)[];
  onPickPhoto: (index: number, file: File) => void;
  activeIndex: number;
  onActive: (i: number) => void;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const setName = (i: number, v: string) => {
    const next = [...names];
    next[i] = v;
    onNames(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] tracking-[0.2em] text-foam">
        PASSENGERS ({names.length})
      </span>

      {names.map((n, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded-xl border p-2 transition ${
            activeIndex === i ? "border-mango/60 bg-white/5" : "border-white/10"
          }`}
        >
          <input
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickPhoto(i, f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => {
              onActive(i);
              inputs.current[i]?.click();
            }}
            className={`grid size-11 shrink-0 place-items-center rounded-full border font-mono text-[10px] ${
              photos[i] ? "border-foam/60 text-foam" : "border-white/20 text-muted"
            }`}
          >
            {photos[i] ? "\u2713" : "+"}
          </button>
          <input
            value={n}
            maxLength={24}
            placeholder={`Member ${i + 1}`}
            onFocus={() => onActive(i)}
            onChange={(e) => setName(i, e.target.value)}
            className="w-full bg-transparent px-1 py-2 text-sand placeholder:text-muted/60 focus:outline-none"
          />
          {names.length > 2 && (
            <button
              onClick={() => {
                onNames(names.filter((_, j) => j !== i));
                if (activeIndex >= names.length - 1) onActive(0);
              }}
              aria-label={`Remove member ${i + 1}`}
              className="shrink-0 px-2 font-mono text-xs text-muted hover:text-coral"
            >
              &times;
            </button>
          )}
        </div>
      ))}

      {names.length < 6 && (
        <button
          onClick={() => onNames([...names, ""])}
          className="rounded-xl border border-dashed border-white/20 py-3 font-mono text-[11px] tracking-[0.2em] text-muted transition hover:border-white/40 hover:text-sand"
        >
          + ADD PASSENGER
        </button>
      )}
    </div>
  );
}
