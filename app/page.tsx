"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { EVENT } from "@/lib/brand";
import { builderTitle } from "@/lib/builder-title";
import { caption } from "@/lib/caption";
import { defaultFocal } from "@/lib/image/crop";
import { detectFocal } from "@/lib/image/faces";
import { ImageLoadError, loadImage } from "@/lib/image/load";
import { renderSpec } from "@/lib/render/engine";
import { idcardSpec } from "@/lib/render/specs/idcard";
import { ogSpec } from "@/lib/render/specs/og";
import { renderPFP, toPFPRarity } from "@/lib/render/pfp-renderer";
import { ensureFonts } from "@/lib/render/fonts";
import { teamSpec } from "@/lib/render/specs/team";
import {
  renderBuilderPass, renderBuilderPassOG,
  renderTeamPass, renderTeamPassOG,
  builderPassCaption, builderPassFilename,
} from "@/lib/builder-pass";
import {
  downloadBlob,
  prepareShare,
  shareToX,
  toBlob,
  type SharePayload,
} from "@/lib/share";
import type { Focal, FormatId, RenderInput } from "@/lib/types";

import { Field, TitleReveal } from "@/components/Fields";
import BuilderPassFields, {
  EMPTY_FIELDS, useBuilderPassRoll, type BuilderPassFieldValues,
} from "@/components/BuilderPassFields";
import { FormatTabs } from "@/components/FormatTabs";
import { Preview } from "@/components/Preview";
import { ShareBar } from "@/components/ShareBar";
import { TeamRoster } from "@/components/TeamRoster";
import { Toast, type ToastKind } from "@/components/Toast";
import { Uploader } from "@/components/Uploader";
import { useMechanicalSounds } from "@/components/useAudio";

type Fmt = Exclude<FormatId, "og">;
const LS_KEY = "framein-goa:v2";

export default function Page() {
  const [format, setFormat] = useState<Fmt>("pfp");
  const [photos, setPhotos] = useState<(ImageBitmap | null)[]>([null]);
  const [focals, setFocals] = useState<Focal[]>([{ x: 0.5, y: 0.32, zoom: 1 }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [shipping, setShipping] = useState("");
  const [team, setTeam] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>(["", ""]);
  const [salt, setSalt] = useState(0);
  const [fields, setFields] = useState<BuilderPassFieldValues>(EMPTY_FIELDS);
  const roll = useBuilderPassRoll(fields);
  const [decoding, setDecoding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind }>({ msg: "", kind: "info" });
  const [isPrinting, setIsPrinting] = useState(false);
  const { playSound } = useMechanicalSounds();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareRef = useRef<SharePayload | null>(null);

  const say = useCallback((msg: string, kind: ToastKind = "info") => {
    setToast({ msg, kind });
    if (msg) setTimeout(() => setToast({ msg: "", kind: "info" }), 4000);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@/lib/builder-pass").then((m) => console.log("[pass fonts]", m.fontReport()));
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { name?: string; role?: string; shipping?: string; team?: string };
      if (d.name) setName(d.name);
      if (d.role) setRole(d.role);
      if (d.shipping) setShipping(d.shipping);
      if (d.team) setTeam(d.team);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ name, role, shipping, team }));
    } catch {}
  }, [name, role, shipping, team]);

  const { title, rarity, serial } = useMemo(
    () => builderTitle(name, role, salt),
    [name, role, salt],
  );

  const memberCount = memberNames.length;

  const spec = useMemo(() => {
    if (format === "idcard") return idcardSpec();
    return teamSpec(memberCount);
  }, [format, memberCount]);

  const input: RenderInput = useMemo(
    () => ({ photos, focals, name, role, shipping, team, memberNames, title, rarity, serial }),
    [photos, focals, name, role, shipping, team, memberNames, title, rarity, serial],
  );

  const handleFile = useCallback(
    async (file: File, index = 0) => {
      setDecoding(true);
      if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
        say("Converting from HEIC…");
      }
      try {
        const bmp = await loadImage(file);
        setPhotos((prev) => {
          const next = [...prev];
          next[index]?.close?.();
          next[index] = bmp;
          return next;
        });
        const slots =
          typeof spec.photoSlots === "function" ? spec.photoSlots(input) : spec.photoSlots;
        const slot = slots[index] ?? slots[0];
        const base = defaultFocal(bmp.width, bmp.height, slot?.w ?? 1, slot?.h ?? 1);
        setFocals((prev) => {
          const next = [...prev];
          next[index] = base;
          return next;
        });
        setActiveIndex(index);
        say("");
        detectFocal(bmp).then((f) => {
          if (!f) return;
          setFocals((prev) => {
            const next = [...prev];
            next[index] = { ...f, zoom: prev[index]?.zoom ?? 1 };
            return next;
          });
        });
      } catch (e) {
        say(
          e instanceof ImageLoadError ? e.message : "That file did not decode. Try a JPG or PNG.",
          "error",
        );
      } finally {
        setDecoding(false);
      }
    },
    [say, spec, input],
  );

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const c = canvasRef.current;
      if (!c) return;

      if (format === "pfp") {
        await ensureFonts();
        const photo = photos[0];
        // renderPFP requires a photo source; fall back to a blank if none yet
        if (photo) {
          renderPFP(c, {
            photo,
            rarity: toPFPRarity(rarity),
            serial,
            focal: focals[0] ? { x: focals[0].x, y: focals[0].y } : undefined,
          });
        } else {
          // Draw placeholder: dark ring with no photo
          c.width = 1000;
          c.height = 1000;
          const pCtx = c.getContext("2d");
          if (pCtx) {
            pCtx.fillStyle = "#0D1B2A";
            pCtx.fillRect(0, 0, 1000, 1000);
            pCtx.beginPath();
            pCtx.arc(500, 500, 418, 0, Math.PI * 2);
            pCtx.fillStyle = "#173A5E";
            pCtx.fill();
          }
        }
      } else if (format === "idcard") {
        const photo = photos[0] ?? null;
        const focal = focals[0] ? { x: focals[0].x, y: focals[0].y } : { x: 0.5, y: 0.36 };
        const builderInput = { photo, focal, ...fields, title: roll.title, glaze: roll.glaze, shareId: serial };
        await renderBuilderPass(c, builderInput);
      } else if (format === "team") {
        const teamInput = { photos, focals, teamName: team, memberNames };
        await renderTeamPass(c, teamInput);
      } else {
        await renderSpec(spec, input, c);
      }

      if (!cancelled) setReady(true);
    }, 90);
    return () => { cancelled = true; clearTimeout(t); };
  }, [format, spec, input, photos, focals, rarity, serial, fields, roll.title, roll.glaze, team, memberNames]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const c = canvasRef.current;
      if (!c || !ready) return;
      try {
        let og: HTMLCanvasElement;
        if (format === "idcard") {
          og = document.createElement("canvas");
          const photo = photos[0] ?? null;
          const focal = focals[0] ? { x: focals[0].x, y: focals[0].y } : { x: 0.5, y: 0.36 };
          const builderInput = { photo, focal, ...fields, title: roll.title, glaze: roll.glaze, shareId: serial };
          await renderBuilderPassOG(og, builderInput);
        } else if (format === "team") {
          og = document.createElement("canvas");
          const teamInput = { photos, focals, teamName: team, memberNames };
          await renderTeamPassOG(og, teamInput);
        } else {
          og = await renderSpec(
            ogSpec(c, (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/^https?:\/\//, "")),
            input,
          );
        }
        if (cancelled) return;
        shareRef.current = await prepareShare(c, og, format, serial);
      } catch {
        shareRef.current = null;
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [ready, input, format, serial, fields, roll.title, roll.glaze, photos, focals, team, memberNames]);

  const onDownload = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    playSound("print");
    setIsPrinting(true);
    setTimeout(async () => {
      try {
        const blob = await toBlob(c);
        const filename = format === "idcard" ? builderPassFilename(fields.name) : `framein-goa-${format}-${serial}.png`;
        downloadBlob(blob, filename);
        say("Downloaded.", "success");
      } finally {
        setIsPrinting(false);
      }
    }, 800);
  }, [format, serial, say, playSound]);

  const onShare = useCallback(async () => {
    setSharing(true);
    try {
      let text;
      if (format === "idcard") {
        text = builderPassCaption({ name: fields.name, title: roll.title, glaze: roll.glaze });
      } else {
        text = caption(format, { name, title, serial, team, members: memberCount });
      }
      await shareToX(shareRef.current, text);
      say("X opened — just hit Post! 🚀", "success");
    } finally { setSharing(false); }
  }, [format, name, title, serial, team, memberCount, say, fields.name, roll.title, roll.glaze]);

  const onTeamPhoto = useCallback((i: number, f: File) => handleFile(f, i), [handleFile]);
  const hasPhoto = photos.some(Boolean);

  return (
    <div className="relative min-h-screen w-full bg-[#E8A838] overflow-hidden flex items-center justify-center p-4 lg:p-12">
      {/* ── 1. The Lush AI Illustration Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="/brand/goa-bg.png"
          alt="Goa beach scene"
          fill
          className="object-cover opacity-90"
          priority
        />
        {/* Grain overlay for printing texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            opacity: 0.15,
            mixBlendMode: "multiply"
          }}
        />
        {/* Gradient vignette to draw focus to center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0)_20%,_rgba(44,24,16,0.3)_100%)]" />
      </div>

      {/* ── 2. The Main Poster Card ── */}
      <main 
        className="relative z-10 w-full max-w-6xl mx-auto rounded-[32px] overflow-visible"
        style={{
          background: "#F5ECD7", // Warm cream/sand
          border: "8px solid #1B6B3F", // Thick forest green border
          boxShadow: "16px 16px 0px 0px #2C1810", // Hard brown shadow
          backgroundImage: "radial-gradient(circle, rgba(44,24,16,0.06) 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px"
        }}
      >
        {/* Decorative inner border track (like a ticket) */}
        <div 
          className="absolute inset-3 pointer-events-none rounded-[20px]"
          style={{ border: "2px dashed #E8A838", opacity: 0.8 }}
        />

        {/* ── Absolute Decorative Assets ── */}
        {/* Top Left Stamp */}
        <div className="absolute top-4 left-4 w-28 h-28 pointer-events-none z-20 mix-blend-multiply opacity-75 rotate-[-8deg]">
          <Image src="/brand/goa-stamp.png" alt="Goa stamp" fill className="object-contain" />
        </div>
        
        {/* Top Right Signpost — parallel in top right corner with matching size */}
        <div className="absolute top-4 right-4 w-28 h-28 pointer-events-none z-20 mix-blend-multiply opacity-80 rotate-[8deg] hidden md:block">
          <Image src="/brand/goa-signpost.png" alt="Beach signpost" fill className="object-contain" />
        </div>

        {/* Bottom Left decorative abstract block */}
        <div className="absolute -bottom-6 -left-6 z-20 w-32 h-32 rounded-full border-[6px] border-[#2C1810] bg-[#E85D3A] flex items-center justify-center rotate-[-12deg] shadow-[6px_6px_0px_#1B6B3F]">
          <span className="font-display font-black text-[#F5ECD7] text-4xl text-center leading-none" style={{textShadow: "2px 2px 0 #2C1810"}}>
            SHIP<br/>IT.
          </span>
        </div>

        <div className="relative z-10 p-6 md:p-10 lg:p-12">
          
          {/* Header section inside the card */}
          <header className="flex flex-col md:flex-row items-center justify-between border-b-4 border-[#2C1810] pb-8 mb-8 gap-6">
            <div className="flex-1 text-center md:text-left pl-0 md:pl-16">
              <h1 
                className="font-display font-black uppercase text-[clamp(40px,7vw,80px)] leading-[0.85] text-[#2C1810] tracking-tighter"
                style={{
                  textShadow: "3px 3px 0 #E8A838, 6px 6px 0 #1B6B3F",
                }}
              >
                Hacker <span className="text-[#E85D3A] font-serif italic tracking-normal" style={{textShadow: "none"}}>House</span>
                <br/>Goa <span className="text-[0.6em] tracking-normal mb-8">2026</span>
              </h1>
              <p className="font-mono text-[#8B7B5E] text-xs md:text-sm tracking-[0.2em] mt-6 flex items-center justify-center md:justify-start gap-4">
                <span>{EVENT.datesPretty}</span>
                <span className="w-2 h-2 rounded-full bg-[#E85D3A]" />
                <span>{EVENT.gate}</span>
                <span className="w-2 h-2 rounded-full bg-[#E85D3A]" />
                <span>#{EVENT.hashtag}</span>
              </p>
            </div>
          </header>

          <div
            className="grid gap-8 lg:gap-12"
            style={{ gridTemplateColumns: "1fr", alignItems: "start" }}
          >
            <div
              className="lg:grid lg:gap-12"
              style={{
                gridTemplateColumns: "1.3fr 1fr",
                display: "grid",
              }}
            >
              {/* ── LEFT: Canvas preview ── */}
              <div className={`flex flex-col gap-6 relative ${isPrinting ? "printing-active" : ""}`}>
                <FormatTabs value={format} onChange={setFormat} />
                <Preview
                  canvasRef={canvasRef}
                  activeIndex={format === "team" ? activeIndex : 0}
                  focals={focals}
                  setFocals={setFocals}
                  enabled={hasPhoto}
                />
              </div>

              {/* ── RIGHT: Controls panel ── */}
              <div className="flex flex-col gap-6">
                
                {/* ── Upload ── */}
                <Uploader
                  onFile={(f) => handleFile(f, format === "team" ? activeIndex : 0)}
                  hasPhoto={hasPhoto}
                  busy={decoding}
                />

                {/* ── Conditional fields ── */}
                {format === "idcard" && (
                  <div className="flex flex-col gap-5 p-5 bg-[#EDE4CC] border-4 border-[#2C1810] shadow-[6px_6px_0_#1B6B3F]">
                    <BuilderPassFields values={fields} onChange={setFields} roll={roll} onReroll={roll.reroll} />
                  </div>
                )}

                {format === "pfp" && (
                  <div className="flex flex-col gap-5 p-5 bg-[#EDE4CC] border-4 border-[#2C1810] shadow-[6px_6px_0_#1B6B3F]">
                    <Field label="NAME (FOR YOUR CLASS)" value={name} onChange={setName} placeholder="Arjun Mehta" maxLength={28} />
                    <TitleReveal title={title} rarity={rarity} serial={serial} onReroll={() => setSalt((s) => s + 1)} />
                  </div>
                )}

                {format === "team" && (
                  <div className="flex flex-col gap-5 p-5 bg-[#EDE4CC] border-4 border-[#2C1810] shadow-[6px_6px_0_#1B6B3F]">
                    <Field label="TEAM NAME" value={team} onChange={setTeam} placeholder="Team Gravity" maxLength={24} />
                    <TeamRoster
                      names={memberNames}
                      onNames={setMemberNames}
                      photos={photos}
                      onPickPhoto={onTeamPhoto}
                      activeIndex={activeIndex}
                      onActive={setActiveIndex}
                    />
                  </div>
                )}

                {/* ── Toast ── */}
                <Toast msg={toast.msg} kind={toast.kind} />

                {/* ── Share bar ── */}
                <ShareBar onDownload={onDownload} onShare={onShare} busy={sharing} ready={ready} />

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
