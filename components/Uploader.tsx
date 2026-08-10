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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [over, setOver] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);

  const pick = useCallback(() => inputRef.current?.click(), []);

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

  const startCamera = async () => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      alert("Camera access is not supported in this browser environment.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCamStream(stream);
      setCamOpen(true);
    } catch (e: any) {
      console.error("Camera error:", e);
      alert(`Camera error: ${e?.message || e?.name || "Access denied or unavailable"}`);
    }
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (camStream) {
      vid.srcObject = camStream;
    } else {
      vid.srcObject = null;
    }
  }, [camStream]);

  const stopCamera = useCallback(() => {
    if (camStream) {
      camStream.getTracks().forEach((t) => t.stop());
    }
    setCamStream(null);
    setCamOpen(false);
  }, [camStream]);

  const snapPhoto = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          onFile(file);
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  }, [onFile, stopCamera]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      camStream?.getTracks().forEach((t) => t.stop());
    };
  }, [camStream]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className="relative flex flex-col"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      {/* ── UPLOAD BUTTONS ── */}
      <div style={{ display: camOpen ? "none" : undefined }}>
        <div className="flex w-full">
          {/* Main upload button */}
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className="flex-1 relative overflow-hidden transition-all duration-150 disabled:opacity-50 border-4 border-[#2C1810]"
            style={{
              padding: "24px",
              background: hasPhoto ? "#F5ECD7" : "#E8A838", // Warm sand if has photo, else golden
              color: "#2C1810",
              fontFamily: "var(--f-display)",
              fontSize: "26px",
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              boxShadow: over ? "inset 0 0 0 6px #1B6B3F" : "6px 6px 0px #1B6B3F", // chunky green shadow
              transform: over ? "translate(2px, 2px)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.background = "#1B6B3F";
                e.currentTarget.style.color = "#F5ECD7";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = hasPhoto ? "#F5ECD7" : "#E8A838";
              e.currentTarget.style.color = "#2C1810";
            }}
          >
            {/* Halftone texture */}
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(44,24,16,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "6px 6px",
              }}
            />
            {/* Inner dashed border */}
            <span
              aria-hidden
              className="absolute inset-2 pointer-events-none border-2 border-dashed border-[#2C1810] opacity-30"
            />
            <span className="relative z-10 flex items-center justify-center gap-3">
              <span className="text-3xl">{hasPhoto ? "🔄" : "🌅"}</span>
              {busy ? "READING IMAGE…" : hasPhoto ? "UPDATE PHOTO" : "DROP A PHOTO"}
            </span>
          </button>

          {/* Camera button container for consistent spacing */}
          <div className="pl-4">
            <button
              type="button"
              onClick={startCamera}
              disabled={busy}
              className="h-full px-6 flex items-center justify-center transition-all bg-sand disabled:opacity-50 border-4 border-[#2C1810]"
              title="Take a selfie"
              style={{
                background: "#E85D3A", // Coral red
                color: "#F5ECD7",
                position: "relative",
                overflow: "hidden",
                boxShadow: "4px 4px 0px #2C1810", // hard brown shadow
              }}
              onMouseEnter={(e) => {
                if (!busy) {
                  e.currentTarget.style.background = "#E8A838";
                  e.currentTarget.style.color = "#2C1810";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E85D3A";
                e.currentTarget.style.color = "#F5ECD7";
              }}
            >
              <span className="relative z-10 text-3xl">📸</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CAMERA VIEW ── */}
      <div
        style={{
          display: camOpen ? "flex" : "none",
          flexDirection: "column",
          border: "6px solid #2C1810",
          background: "#2C1810",
          position: "relative",
          boxShadow: "10px 10px 0px #E85D3A" // coral shadow for pop
        }}
        className="tropic-enter"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: "block",
            width: "100%",
            height: 300,
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />

        <div className="flex border-t-[4px] border-[#2C1810]">
          <button
            type="button"
            onClick={stopCamera}
            className="flex-1 py-5 font-display text-xl font-black tracking-widest uppercase transition-all"
            style={{ background: "#F5ECD7", color: "#2C1810", borderRight: "4px solid #2C1810" }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={snapPhoto}
            className="flex-2 py-5 px-10 font-display text-2xl font-black uppercase tracking-widest transition-all bg-[#1B6B3F] text-[#F5ECD7]"
            onMouseEnter={(e) => { e.currentTarget.style.background = "#E8A838"; e.currentTarget.style.color = "#2C1810"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1B6B3F"; e.currentTarget.style.color = "#F5ECD7"; }}
          >
            📸 SNAP
          </button>
        </div>
      </div>
    </div>
  );
}
