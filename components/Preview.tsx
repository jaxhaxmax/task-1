"use client";
import { useRef, type PointerEvent as RPointerEvent, type RefObject } from "react";
import type { Focal } from "@/lib/types";
import { clamp } from "@/lib/image/crop";

export function Preview({
  canvasRef,
  activeIndex,
  focals,
  setFocals,
  enabled,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  activeIndex: number;
  focals: Focal[];
  setFocals: (f: Focal[]) => void;
  enabled: boolean;
}) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const update = (fn: (f: Focal) => Focal) => {
    const next = [...focals];
    next[activeIndex] = fn(next[activeIndex] ?? { x: 0.5, y: 0.32, zoom: 1 });
    setFocals(next);
  };

  const getPinchDist = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      pinch.current = {
        dist: getPinchDist(e),
        zoom: focals[activeIndex]?.zoom ?? 1,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!enabled || !pinch.current || e.touches.length !== 2) return;
    e.preventDefault();
    const newDist = getPinchDist(e);
    const scale = newDist / pinch.current.dist;
    const newZoom = clamp(pinch.current.zoom * scale, 1, 3);
    update((f) => ({ ...f, zoom: newZoom }));
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) {
      pinch.current = null;
    }
  };

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };

  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || !enabled) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const k = c.width / rect.width;
    const dx = (e.clientX - drag.current.x) * k;
    const dy = (e.clientY - drag.current.y) * k;
    drag.current = { x: e.clientX, y: e.clientY };
    update((f) => ({
      ...f,
      x: clamp(f.x - dx / c.width, 0, 1),
      y: clamp(f.y - dy / c.height, 0, 1),
    }));
  };

  const onUp = () => { drag.current = null; };
  const zoom = focals[activeIndex]?.zoom ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Canvas frame — massive borders, poster style */}
      <div
        className="relative"
        style={{
          padding: "12px",
          background: "#F5ECD7",
          border: "6px solid #2C1810",
          boxShadow: "10px 10px 0 #E8A838",
        }}
      >
        {/* Decorative Inner Frame */}
        <div 
          aria-hidden 
          className="absolute inset-[6px] pointer-events-none"
          style={{ border: "2px solid #E85D3A", opacity: 0.8 }}
        />

        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          className={`block w-full z-10 relative bg-white ${enabled ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{ display: "block" }}
        />

        {/* "ADD A PHOTO" empty state */}
        {!enabled && (
          <div
            className="absolute inset-[12px] z-20 flex flex-col items-center justify-center gap-4 pointer-events-none"
            style={{
              background: "#F5ECD7",
              backgroundImage: "radial-gradient(circle, #E8A838 2px, transparent 2px)",
              backgroundSize: "16px 16px",
            }}
          >
            {/* Detailed Empty Icon */}
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                border: "4px solid #2C1810",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#E85D3A",
                position: "relative",
                boxShadow: "6px 6px 0 #1B6B3F"
              }}
            >
              {/* Halftone inner */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  backgroundImage: "radial-gradient(circle, rgba(44,24,16,0.2) 1.5px, transparent 1.5px)",
                  backgroundSize: "6px 6px"
                }}
              />
              <span style={{ fontSize: 48, position: "relative" }}>📸</span>
            </div>
            
            <p
              className="font-display font-black text-2xl uppercase text-center mt-2 px-4"
              style={{ color: "#2C1810" }}
            >
              AWAITING<br/>BUILDER PHOTO...
            </p>
          </div>
        )}
      </div>

      {/* Zoom control — riso strip */}
      {enabled && (
        <div
          className="flex items-center gap-4 px-4 py-3"
          style={{
            border: "4px solid #2C1810",
            background: "#1B6B3F",
            boxShadow: "4px 4px 0 #E8A838"
          }}
        >
          <span
            className="font-display text-lg font-bold tracking-widest shrink-0"
            style={{ color: "#E8A838" }}
          >
            🔍 ZOOM
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) =>
              update((f) => ({ ...f, zoom: Number(e.target.value) }))
            }
            className="flex-1"
            aria-label="Zoom"
          />
          <button
            onClick={() => update(() => ({ x: 0.5, y: 0.32, zoom: 1 }))}
            className="font-display text-lg tracking-widest shrink-0 transition-colors uppercase bg-[#F5ECD7] text-[#2C1810] border-2 border-[#2C1810] px-3 py-1 scale-90 hover:scale-100"
          >
            RESET
          </button>
        </div>
      )}

      {/* Metadata label */}
      <div 
        className="text-center font-mono text-[10px] tracking-[0.2em] font-bold p-2 border-2 border-dashed border-[#8B7B5E]"
        style={{ color: "#2C1810" }}
      >
        {enabled ? "DRAG TO FRAME PERFECTLY" : "ACCEPTED: JPG, PNG, OR HEIC. AUTO FACE CROP."}
      </div>
    </div>
  );
}
