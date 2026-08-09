"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function Uploader({
  onFile,
  hasPhoto,
  busy,
}: {
  onFile: (f: File) => void;
  hasPhoto: boolean;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = useCallback(() => inputRef.current?.click(), []);

  // Desktop users will paste. Five lines, worth it.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const f = item?.getAsFile();
      if (f) onFile(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      <button
        onClick={pick}
        disabled={busy}
        className={`w-full rounded-xl py-4 font-display text-lg font-extrabold transition disabled:opacity-60 ${
          hasPhoto
            ? "border border-white/15 text-sand hover:bg-white/5"
            : "bg-coral text-ink hover:brightness-110"
        } ${over ? "ring-2 ring-mango" : ""}`}
      >
        {busy ? "Reading photo\u2026" : hasPhoto ? "Change photo" : "Add a photo"}
      </button>
      <p className="mt-2 text-center font-mono text-[11px] tracking-widest text-muted">
        JPG &middot; PNG &middot; HEIC &middot; ANY CROP
      </p>
    </div>
  );
}
