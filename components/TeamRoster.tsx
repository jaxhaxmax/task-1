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
    <div className="flex flex-col gap-0">
      {/* Label */}
      <span
        className="font-mono text-[9px] tracking-[0.28em] px-3 py-1.5 inline-block"
        style={{ background: "#1B6B3F", color: "#E8A838" }}
      >
        🌴 CREW MANIFEST ({names.length})
      </span>

      {/* Roster rows */}
      <div style={{ border: "3px solid #2C1810", borderTop: "none" }}>
        {names.map((n, i) => (
          <div
            key={i}
            className="flex items-center gap-0 transition-colors"
            style={{
              background: activeIndex === i ? "#EDE4CC" : "#F5ECD7",
              borderBottom: i < names.length - 1 ? "2px solid #2C1810" : "none",
              position: "relative",
            }}
          >
            {/* Active indicator bar — forest green */}
            {activeIndex === i && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: "#1B6B3F",
                }}
              />
            )}

            <input
              ref={(el) => { inputs.current[i] = el; }}
              type="file"
              accept="image/*,.heic,.heif"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickPhoto(i, f);
                e.target.value = "";
              }}
            />

            {/* Photo pick button */}
            <button
              onClick={() => {
                onActive(i);
                inputs.current[i]?.click();
              }}
              className="grid shrink-0 place-items-center font-mono text-[11px] transition-all"
              style={{
                width: 44,
                height: 44,
                background: photos[i] ? "#1B6B3F" : "#EDE4CC",
                color: photos[i] ? "#E8A838" : "#8B7B5E",
                border: "none",
                borderRight: "2px solid #2C1810",
                marginLeft: activeIndex === i ? 4 : 0,
              }}
            >
              {photos[i] ? "✓" : `${i + 1}`}
            </button>

            {/* Name input */}
            <input
              value={n}
              maxLength={24}
              placeholder={`MEMBER ${i + 1}`}
              onFocus={() => onActive(i)}
              onChange={(e) => setName(i, e.target.value)}
              className="w-full bg-transparent px-3 py-3 focus:outline-none"
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: "12px",
                letterSpacing: "0.1em",
                color: "#2C1810",
                border: "none",
              }}
            />

            {/* Remove button */}
            {names.length > 2 && (
              <button
                onClick={() => {
                  onNames(names.filter((_, j) => j !== i));
                  if (activeIndex >= names.length - 1) onActive(0);
                }}
                aria-label={`Remove member ${i + 1}`}
                className="shrink-0 px-3 font-mono text-sm transition-all"
                style={{
                  color: "#8B7B5E",
                  height: "100%",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  borderLeft: "2px solid #2C1810",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E85D3A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8B7B5E")}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add member */}
        {names.length < 6 && (
          <button
            onClick={() => onNames([...names, ""])}
            className="w-full font-mono text-[10px] tracking-[0.2em] py-3 transition-all"
            style={{
              background: "#EDE4CC",
              color: "#8B7B5E",
              border: "none",
              borderTop: "2px dashed #8B7B5E",
              fontFamily: "var(--f-mono)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1B6B3F";
              e.currentTarget.style.color = "#E8A838";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#EDE4CC";
              e.currentTarget.style.color = "#8B7B5E";
            }}
          >
            + ADD CREW MEMBER
          </button>
        )}
      </div>
    </div>
  );
}
