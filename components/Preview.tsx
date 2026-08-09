"use client";
import { useRef, type PointerEvent as RPointerEvent, type RefObject } from "react";
import type { Focal } from "@/lib/types";
import { clamp } from "@/lib/image/crop";

/**
 * The canvas renders at full export resolution and is scaled down by CSS, so
 * pointer deltas must be converted back into canvas space before they become
 * focal deltas. Pointer events (not mouse events) so touch works for free.
 */
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

  const update = (fn: (f: Focal) => Focal) => {
    const next = [...focals];
    next[activeIndex] = fn(next[activeIndex] ?? { x: 0.5, y: 0.32, zoom: 1 });
    setFocals(next);
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
    const k = c.width / rect.width; // CSS px -> canvas px
    const dx = (e.clientX - drag.current.x) * k;
    const dy = (e.clientY - drag.current.y) * k;
    drag.current = { x: e.clientX, y: e.clientY };

    update((f) => ({
      ...f,
      x: clamp(f.x - dx / c.width, 0, 1),
      y: clamp(f.y - dy / c.height, 0, 1),
    }));
  };

  const onUp = () => {
    drag.current = null;
  };

  const zoom = focals[activeIndex]?.zoom ?? 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`block w-full ${enabled ? "cursor-grab active:cursor-grabbing" : ""}`}
        />
      </div>

      {enabled && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
            ZOOM
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
            className="h-1 flex-1 accent-coral"
            aria-label="Zoom"
          />
          <button
            onClick={() => update(() => ({ x: 0.5, y: 0.32, zoom: 1 }))}
            className="font-mono text-[10px] tracking-[0.2em] text-muted hover:text-sand"
          >
            RESET
          </button>
        </div>
      )}

      <p className="text-center font-mono text-[10px] tracking-[0.2em] text-muted">
        {enabled ? "DRAG THE PHOTO TO REPOSITION" : "ADD A PHOTO TO BEGIN"}
      </p>
    </div>
  );
}
