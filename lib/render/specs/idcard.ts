import { C, EVENT, ASSETS } from "../../brand";
import type { FormatSpec, Layer, RenderInput } from "../../types";
import { fD, fM, fDev } from "../fonts";
import { roundRect, drawArcText, lsText, fitText } from "../helpers";

export const W = 1200;
export const H = 1500;
// Legacies for team.ts
export const PERF_X = 1150;
export const HEADER_H = 120;
export const MARQUEE_Y = 840;

// Export legacy functions unchanged (with [] return) for team.ts
export function misregText(
  value: string | ((i: RenderInput) => string),
  x: number,
  y: number,
  font: string,
  align: CanvasTextAlign = "left",
  maxW?: number,
  minScale = 0.5,
  upper = false,
  letterSpacing = 0,
): Layer[] {
  return [
    {
      kind: "custom",
      draw: (ctx, input) => {
        const text = typeof value === "function" ? value(input) : value;
        const val = upper ? text.toUpperCase() : text;
        ctx.save();
        ctx.font = font; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
        ctx.globalCompositeOperation = "multiply";
        
        ctx.globalAlpha = 0.5; ctx.fillStyle = C.coral; ctx.fillText(val, x - 2, y - 2, maxW);
        ctx.globalAlpha = 0.4; ctx.fillStyle = C.deep; ctx.fillText(val, x + 2, y + 2, maxW);
        
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = C.ink; ctx.fillText(val, x, y, maxW);
        ctx.restore();
      }
    }
  ];
}

export function dataCell(
  x: number,
  label: string,
  value: string | ((i: RenderInput) => string),
  labelY: number = 700,
  valueY: number = 746
): Layer[] {
  return [
    { 
      kind: "custom",
      draw: (ctx) => {
        ctx.font = fM(700, 18); ctx.fillStyle = C.ink; ctx.globalAlpha = 0.55;
        ctx.fillText(label.toUpperCase(), x, labelY);
      }
    },
    { kind: "text", value, x, y: valueY, font: fM(700, 32), color: C.ink }
  ];
}

export function perforationLayers(): Layer[] { return []; }
export function stubLayers(): Layer[] { return []; }
export function marqueeLayer(): Layer { return { kind: "custom", draw: () => {} }; }
export function headerLayers(_centreText?: string): Layer[] { return []; }

// Helper for Ceramic florets
function drawFloret(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const rLobe = r * 0.45;
  const cDist = r - rLobe; 
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.arc(0, -cDist, rLobe, -Math.PI, 0);
  }
  ctx.closePath();
  ctx.fillStyle = C.mango; ctx.fill();
  ctx.strokeStyle = C.deep; ctx.lineWidth = 2; ctx.stroke();
  
  ctx.beginPath(); ctx.arc(0, 0, r*0.2, 0, Math.PI*2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawCeramicBorder(ctx: CanvasRenderingContext2D) {
  const spanX = W - 48;
  const spanY = H - 48;
  const countX = Math.round(spanX / 96);
  const countY = Math.round(spanY / 96);
  const stepX = spanX / countX;
  const stepY = spanY / countY;
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(24, 24, W - 48, H - 48);
  ctx.fillStyle = C.sand; 
  ctx.fill();

  ctx.strokeStyle = C.deep;
  ctx.fillStyle = C.deep;
  ctx.lineWidth = 3;
  
  for (let ix = 0; ix <= countX; ix++) {
    for (let iy = 0; iy <= countY; iy++) {
       if (ix > 1 && ix < countX - 1 && iy > 1 && iy < countY - 1) continue;
       const cx = 24 + ix * stepX;
       const cy = 24 + iy * stepY;
       
       if (ix < countX && iy < countY) {
         ctx.beginPath();
         ctx.arc(cx + stepX/2, cy + stepY/2, 34, 0, Math.PI * 2);
         ctx.stroke();
       }
       ctx.beginPath();
       ctx.moveTo(cx, cy - 3.5); ctx.lineTo(cx + 3.5, cy);
       ctx.lineTo(cx, cy + 3.5); ctx.lineTo(cx - 3.5, cy);
       ctx.fill();
    }
  }
  ctx.restore();
  
  ctx.save();
  ctx.strokeStyle = C.deep; ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeRect(120, 120, W - 240, H - 240);
  ctx.restore();
}

function drawPanel(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, label: string, val: string) {
   const w = x1 - x0, h = y1 - y0;
   ctx.fillStyle = C.sand; 
   ctx.beginPath(); roundRect(ctx, x0, y0, w, h, 6); ctx.fill();
   ctx.lineWidth = 2; ctx.strokeStyle = C.deep; ctx.stroke();
   ctx.lineWidth = 1; 
   ctx.beginPath(); roundRect(ctx, x0 + 8, y0 + 8, w - 16, h - 16, 4); ctx.stroke();
   
   drawFloret(ctx, x0 + w/2, y0, 9);
   
   ctx.fillStyle = "rgba(27,107,63,0.55)"; 
   ctx.font = fM(700, 18); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
   lsText(ctx, label, x0 + w/2, 1130, 5, "center");
   
   ctx.fillStyle = C.deep; ctx.font = fD(600, 30);
   let fitted = val;
   if (ctx.measureText(val).width > 350) {
      const ft = fitText(ctx, val, fD(600, 30), 350, 0.6);
      ctx.font = ft.font; fitted = ft.text;
   }
   ctx.fillText(fitted, x0 + w/2, 1184);
}

export function backgroundLayers(): Layer[] {
  return [
    { kind: "fill", color: C.sand },
    { kind: "custom", draw: drawCeramicBorder },
    // Corner florets inside inner field (x 120 -> 1080, y 120 -> 1380)
    { kind: "custom", draw: (ctx) => {
        drawFloret(ctx, 146, 146, 20);
        drawFloret(ctx, 1054, 146, 20);
        drawFloret(ctx, 146, 1354, 20);
        drawFloret(ctx, 1054, 1354, 20);
    }}
  ];
}

export function idcardSpec(): FormatSpec {
  const foreground: Layer[] = [
    // Header
    { kind: "text", value: "EST. 2026 · 2:47 PM STUDIO", x: 600, y: 178, font: fM(600, 18), color: C.deep, align: "center", letterSpacing: 6, opacity: 0.6 },
    { kind: "text", value: "HACKER HOUSE GOA", x: 600, y: 240, font: fD(800, 62), color: C.deep, align: "center", maxW: 860 },
    { kind: "custom", draw: (ctx) => {
        ctx.strokeStyle = C.deep; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(380, 266); ctx.lineTo(820, 266); ctx.stroke();
        ctx.fillStyle = C.coral;
        ctx.beginPath(); ctx.moveTo(600, 266 - 7); ctx.lineTo(600 + 7, 266); ctx.lineTo(600, 266 + 7); ctx.lineTo(600 - 7, 266); ctx.fill();
    }},
    { kind: "text", value: "गोवा", x: 600, y: 310, font: fDev(700, 32), color: C.coral, align: "center" },

    // Photo nested rings and inner vignette
    { kind: "custom", draw: (ctx) => {
        ctx.beginPath(); ctx.arc(600, 560, 222, 0, Math.PI*2); ctx.strokeStyle = C.deep; ctx.lineWidth = 6; ctx.stroke();
        ctx.beginPath(); ctx.arc(600, 560, 234, 0, Math.PI*2); ctx.strokeStyle = C.coral; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(600, 560, 244, 0, Math.PI*2); ctx.strokeStyle = C.deep; ctx.lineWidth = 2; ctx.stroke();
        for(const deg of [45, 135, 225, 315]) {
           const rad = deg * (Math.PI/180);
           drawFloret(ctx, 600 + Math.cos(rad)*244, 560 + Math.sin(rad)*244, 14);
        }
        
        ctx.save();
        ctx.beginPath(); ctx.arc(600, 560, 210, 0, Math.PI*2); ctx.clip();
        const grd = ctx.createRadialGradient(600, 560, 184, 600, 560, 210);
        grd.addColorStop(0, "rgba(0,0,0,0)");
        grd.addColorStop(1, "rgba(27,107,63,0.14)"); // deep at 14%
        ctx.fillStyle = grd;
        ctx.fillRect(390, 350, 420, 420);
        ctx.restore();
    }},

    // Seal
    { kind: "custom", draw: (ctx, i) => {
        ctx.save();
        ctx.translate(392, 726); ctx.rotate(-8 * Math.PI/180);
        ctx.lineWidth = 3; ctx.strokeStyle = C.coral; ctx.fillStyle = C.coral;
        ctx.beginPath(); ctx.arc(0, 0, 94, 0, Math.PI*2); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 78, 0, Math.PI*2); ctx.stroke();
        
        drawArcText(ctx, "HACKER HOUSE GOA", 0, 0, 86, -Math.PI/2, { font: fM(700, 18), color: C.coral });
        drawArcText(ctx, "SELECTED · 2026", 0, 0, 86, Math.PI/2, { font: fM(700, 18), color: C.coral, flip: true });
        
        ctx.font = fD(800, 50); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("247", 0, 0);
        
        ctx.globalCompositeOperation = "destination-out";
        let s = (i.name && i.name.length > 0 ? i.name.charCodeAt(0) : 1) * 31337;
        const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
        for(let j=0; j<520; j++) {
           ctx.beginPath();
           ctx.arc((rnd()-0.5)*94*2.1, (rnd()-0.5)*94*2.1, rnd()*2.4 + 0.5, 0, Math.PI*2);
           ctx.fill();
        }
        ctx.restore();
    }},

    // Cartouche Name
    { kind: "custom", draw: (ctx) => {
        ctx.fillStyle = C.ink; ctx.beginPath(); roundRect(ctx, 180, 812, 1020-180, 902-812, 8); ctx.fill();
        ctx.strokeStyle = C.sand; ctx.lineWidth = 2;
        ctx.beginPath(); roundRect(ctx, 187, 819, 1020-180-14, 902-812-14, 4); ctx.stroke();
    }},
    { kind: "text", value: (i) => i.name || "YOUR NAME", x: 600, y: 872, font: fD(800, 66), color: C.sand, align: "center", maxW: 780 },

    // Discipline
    { kind: "text", value: (i) => (i.role || "STACK").toUpperCase(), x: 600, y: 952, font: fD(600, 34), color: C.deep, align: "center", maxW: 700 },
    { kind: "custom", draw: (ctx, i) => {
        ctx.font = fD(600, 34);
        const text = (i.role || "STACK").toUpperCase();
        let tw = ctx.measureText(text).width;
        if (tw > 700) tw = 700; 
        const dx = tw/2 + 32;
        ctx.fillStyle = C.coral;
        for(let sign of [-1, 1]) {
           const px = 600 + sign*dx;
           const py = 944;
           ctx.beginPath(); ctx.moveTo(px, py - 5); ctx.lineTo(px + 5, py); 
           ctx.lineTo(px, py + 5); ctx.lineTo(px - 5, py); ctx.fill();
        }
    }},

    // Class chip
    { kind: "custom", draw: (ctx, i) => {
        const classMap: Record<string, string> = { common: "BUILDER", rare: "SHIPPER", epic: "ARCHITECT", legendary: "FOUNDER" };
        const label = classMap[i.rarity] || "BUILDER";
        ctx.font = fM(700, 26);
        const tw = ctx.measureText(label).width;
        const w = tw + 60; const h = 62; // 984 -> 1046
        const x = 600 - w/2; const y = 984;
        
        ctx.beginPath(); roundRect(ctx, x, y, w, h, 31);
        ctx.fillStyle = label === "FOUNDER" ? C.coral : C.mango; 
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.deep; ctx.stroke();
        
        ctx.fillStyle = label === "FOUNDER" ? C.sand : C.deep;
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText(label, 600, 1026);
    }},

    // Painted Panels
    { kind: "custom", draw: (ctx, i) => {
        const valA = i.role || "STACK";
        const valB = i.shipping || "ONCHAIN AGENTS";
        drawPanel(ctx, 180, 586, 1086, 1236, "STACK", valA.toUpperCase());
        drawPanel(ctx, 614, 1020, 1086, 1236, "SHIPPING", valB.toUpperCase());
    }},

    // Term line
    { kind: "custom", draw: (ctx) => {
        ctx.fillStyle = "rgba(27,107,63,0.70)"; ctx.font = fM(700, 21);
        lsText(ctx, "28–31 OCT 2026 · 247 BUILDERS · 15.30°N 74.12°E", 600, 1284, 4, "center");
    }},

    // Quote ribbon
    { kind: "custom", draw: (ctx) => {
        ctx.fillStyle = C.coral;
        ctx.beginPath(); roundRect(ctx, 150, 1300, 900, 80, 4); ctx.fill();
        
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath(); ctx.moveTo(150, 1328); ctx.lineTo(162, 1340); ctx.lineTo(150, 1352); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1050, 1328); ctx.lineTo(1038, 1340); ctx.lineTo(1050, 1352); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        
        ctx.fillStyle = C.sand;
        ctx.font = fD(600, 27); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText("Quem viu Goa, escusa de ver Lisboa", 600, 1340);
        
        ctx.fillStyle = "rgba(245,236,215,0.70)"; 
        ctx.font = fM(500, 13);
        lsText(ctx, "HE WHO HAS SEEN GOA NEED NOT SEE LISBON", 600, 1364, 3, "center");
    }},

    // Maker's mark
    { kind: "custom", draw: (ctx) => {
        ctx.fillStyle = C.sand; ctx.strokeStyle = C.deep; ctx.lineWidth = 2;
        ctx.beginPath(); roundRect(ctx, 450, 1408, 300, 64, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.deep; ctx.font = fM(700, 24); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText("#FrameInGoa", 600, 1448);
    }},

    // Crackle glaze & Grain
    { kind: "custom", draw: (ctx, i) => {
        ctx.save();
        ctx.beginPath(); ctx.rect(120, 120, 960, 1260); ctx.clip();
        
        ctx.strokeStyle = "rgba(27,107,63,0.04)"; 
        ctx.lineWidth = 1;
        let s = (i.name && i.name.length > 0 ? i.name.charCodeAt(0) : 1) * 12345;
        const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
        
        for(let j=0; j<140; j++) {
           const lx = 120 + rnd() * 960;
           const ly = 120 + rnd() * 1260;
           const len = 40 + rnd() * 100;
           let ang = rnd() * Math.PI * 2;
           
           ctx.beginPath(); ctx.moveTo(lx, ly);
           let cx = lx, cy = ly;
           const segments = 5;
           const l = len / segments;
           for (let k = 0; k < segments; k++) {
             ang += (rnd()-0.5)*1.2;
             cx += Math.cos(ang) * l;
             cy += Math.sin(ang) * l;
             ctx.lineTo(cx, cy);
           }
           ctx.stroke();
        }
        ctx.restore();
    }},
    { kind: "grain", opacity: 0.035 }
  ];

  return {
    id: "idcard",
    w: W,
    h: H,
    background: backgroundLayers(),
    photoSlots: [
      {
        x: 390,
        y: 350,
        w: 420,
        h: 420,
        shape: "circle",
        filter: "contrast(1.08) saturate(1.06)"
      },
    ],
    foreground,
  };
}
