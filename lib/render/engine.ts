import type { Dyn, FormatSpec, Layer, PhotoSlot, RenderInput } from "../types";
import { coverRect } from "../image/crop";
import { getAsset, loadAsset } from "./assets";
import { ensureFonts } from "./fonts";
import {
  drawArcText,
  drawBarcode,
  drawGrain,
  drawMarquee,
  drawStamp,
  fitText,
  linGrad,
  lsText,
  measureLs,
  radGrad,
  roundRect,
} from "./helpers";
import { C } from "../brand";

function resolve<T>(v: Dyn<T>, i: RenderInput): T {
  return typeof v === "function" ? (v as (i: RenderInput) => T)(i) : v;
}


function clipToSlot(ctx: CanvasRenderingContext2D, slot: PhotoSlot) {
  if (slot.shape === "circle") {
    ctx.beginPath();
    ctx.arc(
      slot.x + slot.w / 2,
      slot.y + slot.h / 2,
      Math.min(slot.w, slot.h) / 2,
      0,
      Math.PI * 2,
    );
    ctx.closePath();
  } else {
    roundRect(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius ?? 0);
  }
  ctx.clip();
}

function drawRing(ctx: CanvasRenderingContext2D, slot: PhotoSlot) {
  if (!slot.ring) return;
  const { width, colors } = slot.ring;
  ctx.save();
  ctx.lineWidth = width;
  ctx.strokeStyle = linGrad(
    ctx,
    slot.x,
    slot.y + slot.h,
    slot.x + slot.w,
    slot.y,
    colors.map((c, idx) => [idx / Math.max(1, colors.length - 1), c] as [number, string]),
  );
  const inset = width / 2;
  if (slot.shape === "circle") {
    ctx.beginPath();
    ctx.arc(
      slot.x + slot.w / 2,
      slot.y + slot.h / 2,
      Math.min(slot.w, slot.h) / 2 - inset,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  } else {
    roundRect(
      ctx,
      slot.x + inset,
      slot.y + inset,
      slot.w - width,
      slot.h - width,
      Math.max(0, (slot.radius ?? 0) - inset),
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, slot: PhotoSlot) {
  ctx.save();
  clipToSlot(ctx, slot);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

  
  const cx = slot.x + slot.w / 2;
  const headR = slot.w * 0.16;
  const headY = slot.y + slot.h * 0.36;
  ctx.fillStyle = "rgba(242,232,213,0.16)";
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, headY + headR * 2.9, headR * 1.95, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}


function drawLayer(
  ctx: CanvasRenderingContext2D,
  l: Layer,
  input: RenderInput,
  spec: FormatSpec,
) {
  switch (l.kind) {
    case "fill": {
      ctx.fillStyle = l.color;
      ctx.fillRect(0, 0, spec.w, spec.h);
      break;
    }

    case "linearGradient": {
      ctx.fillStyle = linGrad(ctx, l.x0, l.y0, l.x1, l.y1, l.stops);
      ctx.fillRect(0, 0, spec.w, spec.h);
      break;
    }

    case "radialGradient": {
      ctx.fillStyle = radGrad(ctx, l.cx, l.cy, l.r0, l.r1, l.stops);
      ctx.fillRect(0, 0, spec.w, spec.h);
      break;
    }

    case "asset": {
      const img = getAsset(l.src);
      if (!img) break; 
      ctx.save();
      ctx.globalAlpha = l.opacity ?? 1;
      if (l.blend) ctx.globalCompositeOperation = l.blend;
      if (l.fit === "contain") {
        const s = Math.min(l.w / img.width, l.h / img.height);
        const w = img.width * s;
        const h = img.height * s;
        ctx.drawImage(img, l.x + (l.w - w) / 2, l.y + (l.h - h) / 2, w, h);
      } else {
        ctx.drawImage(img, l.x, l.y, l.w, l.h);
      }
      ctx.restore();
      break;
    }

    case "rect": {
      ctx.save();
      ctx.globalAlpha = l.opacity ?? 1;
      roundRect(ctx, l.x, l.y, l.w, l.h, l.radius ?? 0);
      if (l.fill) {
        ctx.fillStyle = l.fill;
        ctx.fill();
      }
      if (l.stroke) {
        ctx.strokeStyle = l.stroke;
        ctx.lineWidth = l.lineWidth ?? 2;
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case "gradientRect": {
      ctx.save();
      roundRect(ctx, l.x, l.y, l.w, l.h, l.radius ?? 0);
      ctx.fillStyle = l.vertical
        ? linGrad(ctx, l.x, l.y, l.x, l.y + l.h, l.stops)
        : linGrad(ctx, l.x, l.y, l.x + l.w, l.y, l.stops);
      ctx.fill();
      ctx.restore();
      break;
    }

    case "dashed": {
      ctx.save();
      ctx.setLineDash(l.dash);
      ctx.strokeStyle = l.color;
      ctx.lineWidth = l.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(l.x0, l.y0);
      ctx.lineTo(l.x1, l.y1);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case "notch": {
      ctx.save();
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.arc(l.cx, l.cy, l.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case "marquee": {
      drawMarquee(
        ctx,
        l.text,
        l.y,
        l.h,
        spec.w,
        l.font,
        l.color,
        l.bg,
        l.letterSpacing ?? 4,
      );
      break;
    }

    case "arcText": {
      drawArcText(ctx, resolve(l.value, input), l.cx, l.cy, l.r, l.centerAngle, {
        font: l.font,
        color: l.color,
        letterSpacing: l.letterSpacing,
        flip: l.flip,
      });
      break;
    }

    case "stamp": {
      drawStamp(
        ctx,
        l.x,
        l.y,
        l.w,
        l.h,
        l.rotate,
        [resolve(l.lines[0], input), resolve(l.lines[1], input)],
        l.color,
        resolve(l.seed, input),
        l.fonts,
      );
      break;
    }

    case "grain": {
      drawGrain(ctx, spec.w, spec.h, l.opacity);
      break;
    }

    case "text": {
      const raw = resolve(l.value, input);
      if (!raw) break;
      const value = l.upper ? raw.toUpperCase() : raw;

      ctx.save();
      ctx.globalAlpha = l.opacity ?? 1;
      ctx.font = l.font;
      ctx.fillStyle = resolve(l.color, input);
      ctx.textBaseline = l.baseline ?? "alphabetic";

      let text = value;
      if (l.maxW) {
        const ls = l.letterSpacing ?? 0;
        
        const budget = l.maxW - ls * Math.max(0, value.length - 1);
        const fitted = fitText(ctx, value, l.font, budget, l.minScale ?? 0.6);
        ctx.font = fitted.font;
        text = fitted.text;
      }

      lsText(ctx, text, l.x, l.y, l.letterSpacing ?? 0, l.align ?? "left");
      ctx.restore();
      break;
    }

    case "chip": {
      const raw = resolve(l.value, input);
      if (!raw) break;

      ctx.save();
      ctx.font = l.font;
      let text = raw;
      let font = l.font;
      if (l.maxW) {
        const fitted = fitText(ctx, raw, l.font, l.maxW - l.padX * 2, 0.7);
        font = fitted.font;
        text = fitted.text;
        ctx.font = font;
      }
      const tw = ctx.measureText(text).width;
      const w = tw + l.padX * 2;

      roundRect(ctx, l.x, l.y, w, l.h, l.h / 2);
      ctx.fillStyle = resolve(l.bg, input);
      ctx.fill();
      ctx.strokeStyle = resolve(l.border, input);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = resolve(l.color, input);
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(text, l.x + l.padX, l.y + l.h / 2 + 1);
      ctx.restore();
      break;
    }

    case "vertText": {
      const value = resolve(l.value, input);
      ctx.save();
      ctx.translate(l.cx, l.cy);
      ctx.rotate(Math.PI / 2);
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      ctx.textBaseline = "middle";
      lsText(ctx, value, 0, 0, l.letterSpacing ?? 0, "center");
      ctx.restore();
      break;
    }

    case "barcode": {
      drawBarcode(ctx, l.x, l.y, l.w, l.h, l.color, resolve(l.seed, input));
      break;
    }

    case "custom": {
      ctx.save();
      l.draw(ctx, input);
      ctx.restore();
      break;
    }

    case "when": {
      if (l.cond(input)) for (const sub of l.layers) drawLayer(ctx, sub, input, spec);
      break;
    }
  }
}


export function specAssets(spec: FormatSpec, input: RenderInput): string[] {
  const out: string[] = [];
  const walk = (layers: Layer[]) => {
    for (const l of layers) {
      if (l.kind === "asset") out.push(l.src);
      else if (l.kind === "when") walk(l.layers);
    }
  };
  walk(spec.background);
  walk(typeof spec.foreground === "function" ? spec.foreground(input) : spec.foreground);
  return out;
}

export async function renderSpec(
  spec: FormatSpec,
  input: RenderInput,
  target?: HTMLCanvasElement,
): Promise<HTMLCanvasElement> {
  await ensureFonts(); 
  await Promise.all(specAssets(spec, input).map(loadAsset));

  const canvas = target ?? document.createElement("canvas");
  if (canvas.width !== spec.w) canvas.width = spec.w;
  if (canvas.height !== spec.h) canvas.height = spec.h;

  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.clearRect(0, 0, spec.w, spec.h);
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, spec.w, spec.h);

  for (const l of spec.background) drawLayer(ctx, l, input, spec);

  const slots =
    typeof spec.photoSlots === "function" ? spec.photoSlots(input) : spec.photoSlots;

  slots.forEach((slot, i) => {
    const bmp = input.photos[i];
    if (!bmp) {
      drawPlaceholder(ctx, slot);
      if (slot.ring) drawRing(ctx, slot);
      return;
    }
    const f = input.focals[i] ?? { x: 0.5, y: 0.32, zoom: 1 };
    const { sx, sy, sw, sh } = coverRect(bmp.width, bmp.height, slot.w, slot.h, f);
    ctx.save();
    clipToSlot(ctx, slot);
    ctx.drawImage(bmp, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
    if (slot.ring) drawRing(ctx, slot);
  });

  const fg =
    typeof spec.foreground === "function" ? spec.foreground(input) : spec.foreground;
  for (const l of fg) drawLayer(ctx, l, input, spec);

  return canvas;
}

export { measureLs };
