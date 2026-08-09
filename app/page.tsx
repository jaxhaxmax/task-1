"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EVENT } from "@/lib/brand";
import { builderTitle } from "@/lib/builder-title";
import { caption } from "@/lib/caption";
import { defaultFocal } from "@/lib/image/crop";
import { detectFocal } from "@/lib/image/faces";
import { ImageLoadError, loadImage } from "@/lib/image/load";
import { renderSpec } from "@/lib/render/engine";
import { idcardSpec } from "@/lib/render/specs/idcard";
import { ogSpec } from "@/lib/render/specs/og";
import { pfpSpec } from "@/lib/render/specs/pfp";
import { teamSpec } from "@/lib/render/specs/team";
import {
  downloadBlob,
  prepareShare,
  shareToX,
  toBlob,
  type SharePayload,
} from "@/lib/share";
import type { Focal, FormatId, RenderInput } from "@/lib/types";

import { Field, TitleReveal } from "@/components/Fields";
import { FormatTabs } from "@/components/FormatTabs";
import { Preview } from "@/components/Preview";
import { ShareBar } from "@/components/ShareBar";
import { TeamRoster } from "@/components/TeamRoster";
import { Toast, type ToastKind } from "@/components/Toast";
import { Uploader } from "@/components/Uploader";

type Fmt = Exclude<FormatId, "og">;

const LS_KEY = "framein-goa:v1";

export default function Page() {
  const [format, setFormat] = useState<Fmt>("pfp");
  const [photos, setPhotos] = useState<(ImageBitmap | null)[]>([null]);
  const [focals, setFocals] = useState<Focal[]>([{ x: 0.5, y: 0.32, zoom: 1 }]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>(["", ""]);
  const [salt, setSalt] = useState(0);

  const [decoding, setDecoding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind }>({
    msg: "",
    kind: "info",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareRef = useRef<SharePayload | null>(null);

  const say = useCallback((msg: string, kind: ToastKind = "info") => {
    setToast({ msg, kind });
    if (msg) setTimeout(() => setToast({ msg: "", kind: "info" }), 4000);
  }, []);

  
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { name?: string; role?: string; team?: string };
      if (d.name) setName(d.name);
      if (d.role) setRole(d.role);
      if (d.team) setTeam(d.team);
    } catch {
          }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ name, role, team }));
    } catch {
          }
  }, [name, role, team]);

  
  const { title, rarity, serial } = useMemo(
    () => builderTitle(name, role, salt),
    [name, role, salt],
  );

  const memberCount = memberNames.length;

  const spec = useMemo(() => {
    if (format === "pfp") return pfpSpec();
    if (format === "idcard") return idcardSpec();
    return teamSpec(memberCount);
    
  }, [format, memberCount]);

  const input: RenderInput = useMemo(
    () => ({
      photos,
      focals,
      name,
      role,
      team,
      memberNames,
      title,
      rarity,
      serial,
    }),
    [photos, focals, name, role, team, memberNames, title, rarity, serial],
  );

  
  const handleFile = useCallback(
    async (file: File, index = 0) => {
      setDecoding(true);
      if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
        say("Converting from HEIC\u2026");
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
          typeof spec.photoSlots === "function"
            ? spec.photoSlots(input)
            : spec.photoSlots;
        const slot = slots[index] ?? slots[0];
        const base = defaultFocal(bmp.width, bmp.height, slot?.w ?? 1, slot?.h ?? 1);

        setFocals((prev) => {
          const next = [...prev];
          next[index] = base;
          return next;
        });
        setActiveIndex(index);
        say("");

        // Never block the first paint on face detection.
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
          e instanceof ImageLoadError
            ? e.message
            : "That file did not decode. Try a JPG or PNG.",
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
      await renderSpec(spec, input, c);
      if (!cancelled) setReady(true);
    }, 90);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [spec, input]);

    
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const c = canvasRef.current;
      if (!c || !ready) return;
      try {
        const og = await renderSpec(
          ogSpec(c, (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/^https?:\/\//, "")),
          input,
        );
        if (cancelled) return;
        shareRef.current = await prepareShare(c, og, format, serial);
      } catch {
        shareRef.current = null;
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ready, input, format, serial]);

  /* ------------------------------------------------------------- actions */

  const onDownload = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    const blob = await toBlob(c);
    downloadBlob(blob, `framein-goa-${format}-${serial}.png`);
    say("Downloaded.", "success");
  }, [format, serial, say]);

  const onShare = useCallback(async () => {
    setSharing(true);
    try {
      const text = caption(format, {
        name,
        title,
        serial,
        team,
        members: memberCount,
      });
      const res = await shareToX(shareRef.current, text);
      if (res === "link-fallback") {
        say("Composer open. Attach the downloaded image to your post.", "info");
      }
    } finally {
      setSharing(false);
    }
  }, [format, name, title, serial, team, memberCount, say]);

  const onTeamPhoto = useCallback(
    (i: number, f: File) => handleFile(f, i),
    [handleFile],
  );

  const hasPhoto = photos.some(Boolean);

  
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 lg:py-12">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight lg:text-4xl">
          FRAME IN GOA
        </h1>
        <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-muted">
          {EVENT.datesPretty} &middot; {EVENT.gate} &middot; {EVENT.cohort} BUILDERS
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
        <div className="flex flex-col gap-4">
          <FormatTabs value={format} onChange={setFormat} />
          <Preview
            canvasRef={canvasRef}
            activeIndex={format === "team" ? activeIndex : 0}
            focals={focals}
            setFocals={setFocals}
            enabled={hasPhoto}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Uploader
            onFile={(f) => handleFile(f, format === "team" ? activeIndex : 0)}
            hasPhoto={hasPhoto}
            busy={decoding}
          />

          {format === "idcard" && (
            <>
              <Field
                label="NAME"
                value={name}
                onChange={setName}
                placeholder="Arjun Mehta"
                maxLength={28}
              />
              <Field
                label="STACK / ROLE"
                value={role}
                onChange={setRole}
                placeholder="full-stack \u00B7 solidity"
              />
              <TitleReveal
                title={title}
                rarity={rarity}
                serial={serial}
                onReroll={() => setSalt((s) => s + 1)}
              />
            </>
          )}

          {format === "pfp" && (
            <Field
              label="NAME (FOR YOUR CLASS)"
              value={name}
              onChange={setName}
              placeholder="Arjun Mehta"
              maxLength={28}
            />
          )}

          {format === "team" && (
            <>
              <Field
                label="TEAM NAME"
                value={team}
                onChange={setTeam}
                placeholder="Team Gravity"
                maxLength={24}
              />
              <TeamRoster
                names={memberNames}
                onNames={setMemberNames}
                photos={photos}
                onPickPhoto={onTeamPhoto}
                activeIndex={activeIndex}
                onActive={setActiveIndex}
              />
            </>
          )}

          <Toast msg={toast.msg} kind={toast.kind} />

          <ShareBar
            onDownload={onDownload}
            onShare={onShare}
            busy={sharing}
            ready={ready}
          />

          <p className="text-center font-mono text-[10px] leading-relaxed tracking-[0.15em] text-muted">
            NO LOGIN &middot; NOTHING STORED BUT THE IMAGE &middot; {EVENT.hashtag}
          </p>
        </div>
      </div>
    </main>
  );
}
