/**
 * OG COMPOSITE — 1200 × 630
 *
 * X renders `summary_large_image` at roughly 1.91:1. A 16:9 pass dropped
 * straight into that slot gets letterboxed or edge-cropped, and edge-cropped
 * means somebody's face is cut off in every feed the link appears in.
 *
 * So this is a SEPARATE artifact: the pass drawn *contained* — never
 * cropped — on the green wall, with a call to action. It costs about
 * twenty lines and it is the single thing every competitor is failing.
 *
 * This image is never downloaded. It exists only as og:image on /f/{id}.
 */

import { OG, PASS, C, EVENT, QUOTE, withAlpha, USE_DEVANAGARI, GOA_DEVANAGARI, GOA_LATIN } from './tokens';
import { fD, fM, fDev, ensureBuilderPassFonts } from './fonts';
import { drawBuilderPass, drawTeamPass, type BuilderPassInput, type TeamPassInput } from './render';
import { type Ctx, type Run, drawTracked, drawRuns, roundRect, paintGrain } from './draw';

/** Reused across renders — allocating a 1600×900 canvas per keystroke is wasteful. */
let scratch: HTMLCanvasElement | null = null;

function getScratch(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (!scratch) {
    scratch = document.createElement('canvas');
    scratch.width = PASS.W;
    scratch.height = PASS.H;
  }
  return scratch;
}

const BOX = { x: 170, y: 82, w: 860, h: 484 } as const; // 860 / (16/9) = 483.75

export async function renderBuilderPassOG(
  canvas: HTMLCanvasElement,
  input: BuilderPassInput,
): Promise<void> {
  await ensureBuilderPassFonts();
  canvas.width = OG.W;
  canvas.height = OG.H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.imageSmoothingQuality = 'high';

  paintOgWall(ctx);
  paintOgPass(ctx, (sctx) => drawBuilderPass(sctx, input));
  paintOgChrome(ctx);

  ctx.restore();
}

export async function renderTeamPassOG(
  canvas: HTMLCanvasElement,
  input: TeamPassInput,
): Promise<void> {
  await ensureBuilderPassFonts();
  canvas.width = OG.W;
  canvas.height = OG.H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.imageSmoothingQuality = 'high';

  paintOgWall(ctx);
  paintOgPass(ctx, (sctx) => drawTeamPass(sctx, input));
  paintOgChrome(ctx);

  ctx.restore();
}

function paintOgWall(ctx: Ctx): void {
  const wall = ctx.createLinearGradient(0, 0, OG.W, OG.H);
  wall.addColorStop(0, C.green);
  wall.addColorStop(1, C.greenDeep);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, OG.W, OG.H);

  const wash = ctx.createRadialGradient(180, 40, 20, 180, 40, 780);
  wash.addColorStop(0, 'rgba(255, 214, 140, 0.16)');
  wash.addColorStop(1, 'rgba(255, 214, 140, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, OG.W, OG.H);

  paintGrain(ctx, 0, 0, OG.W, OG.H, 0.05);
}

function paintOgPass(ctx: Ctx, drawFn: (sctx: Ctx) => void): void {
  const s = getScratch();
  if (!s) return;
  const sctx = s.getContext('2d');
  if (!sctx) return;

  sctx.clearRect(0, 0, PASS.W, PASS.H);
  drawFn(sctx);

  const h = BOX.w / (PASS.W / PASS.H);
  const y = BOX.y + (BOX.h - h) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(3, 18, 10, 0.55)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = C.green;
  roundRect(ctx, BOX.x, y, BOX.w, h, 4);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(s, BOX.x, y, BOX.w, h);

  ctx.strokeStyle = withAlpha(C.ouro, 0.55);
  ctx.lineWidth = 2;
  roundRect(ctx, BOX.x, y, BOX.w, h, 4);
  ctx.stroke();
}

function paintOgChrome(ctx: Ctx): void {
  const runs: Run[] = [
    { text: 'HACKER', font: fD(700, 30), color: C.limewash, tracking: 1, gap: 8 },
    USE_DEVANAGARI
      ? { text: GOA_DEVANAGARI, font: fDev(700, 26), color: C.magenta, gap: 8 }
      : { text: GOA_LATIN, font: fD(700, 28), color: C.magenta, tracking: 1.5, gap: 8 },
    { text: 'HOUSE', font: fD(700, 30), color: C.limewash, tracking: 1, gap: 16 },
    { text: '2026', font: fM(700, 18), color: withAlpha(C.limewash, 0.6), tracking: 3 },
  ];
  drawRuns(ctx, runs, 60, 52, 'left');

  ctx.font = fM(700, 20);
  ctx.fillStyle = withAlpha(C.ouro, 0.95);
  drawTracked(ctx, EVENT.hashtag, OG.W - 60, 52, 1, 'right');

  ctx.font = fM(700, 26);
  ctx.fillStyle = C.limewash;
  drawTracked(ctx, 'MAKE YOURS \u2192', 60, 600, 3);

  ctx.font = fD(600, 22, true);
  ctx.fillStyle = withAlpha(C.limewash, 0.5);
  drawTracked(ctx, `\u201C${QUOTE}\u201D`, OG.W - 60, 600, 0, 'right');
}
