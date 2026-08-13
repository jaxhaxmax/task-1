/**
 * BUILDER PASS — 1600 × 900
 *
 * An azulejo nameplate on a lime-washed Goan wall.
 *
 * Why this object: Goa was Portuguese for 451 years. Fontainhas, the Latin
 * Quarter of Panjim, still mounts hand-painted blue-and-white tile plaques
 * beside every front door. "Quem viu Goa, excusa de ver Lisboa" is a
 * 16th-century Portuguese proverb about that city. The line is native to
 * the object rather than pasted onto it — which is the whole difference
 * between a quote that lands and a quote that reads as filler.
 *
 * Why 1600×900: 16:9 is the only aspect ratio X displays uncropped in
 * every client. The pass is made to be POSTED, so it is made to that ratio.
 *
 * Boldness is spent in exactly one place: the tile rail. Everything else
 * is disciplined. No stamps, no spot illustrations, no glassmorphism.
 */

import { PASS, C, GEO, GLAZES, QUOTE, QUOTE_ATTR, EVENT, withAlpha, USE_DEVANAGARI, GOA_DEVANAGARI, GOA_LATIN, type GlazeKey } from './tokens';
import { fD, fM, fDev, ensureBuilderPassFonts } from './fonts';
import {
  type Ctx,
  type PhotoSource,
  type Run,
  roundRect,
  drawTracked,
  measureTracked,
  drawRuns,
  measureRuns,
  fitFont,
  truncateMiddle,
  coverRect,
  dimsOf,
  paintGrain,
  seededRand,
  normaliseHandle,
} from './draw';
import { cyrb53 } from './titles';

export type BuilderPassInput = {
  photo: PhotoSource | null;
  /** 0..1 in source space. Driven by the drag-to-reposition handle. */
  focal?: { x: number; y: number };
  name: string;
  role: string;
  stack: string;
  github?: string;
  linkedin?: string;
  x?: string;
  title: string;
  glaze: GlazeKey;
  /** nanoid from /api/share. Renders as a real, working link in the footer. */
  shareId?: string | null;
};

const PLACEHOLDER = {
  name: 'YOUR NAME',
  role: 'what you do',
  stack: 'your stack',
};

/* ================================================================== */
/* public entry points                                                 */
/* ================================================================== */

/** Sizes the canvas and draws. Await ensureBuilderPassFonts() first. */
export async function renderBuilderPass(
  canvas: HTMLCanvasElement,
  input: BuilderPassInput,
): Promise<void> {
  await ensureBuilderPassFonts();
  canvas.width = PASS.W;
  canvas.height = PASS.H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawBuilderPass(ctx, input);
}

/**
 * Synchronous draw into an existing context at 1600×900.
 * Use this if you are wiring the pass into an engine as a `custom` layer —
 * fonts must already be loaded.
 */
export function drawBuilderPass(ctx: Ctx, input: BuilderPassInput): void {
  const g = GLAZES[input.glaze] ?? GLAZES.INDIGO;
  const seed = cyrb53(`${input.name}|${input.title}|${input.glaze}`);

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.imageSmoothingQuality = 'high';

  paintWall(ctx, g.key === 'OURO');
  paintPlaque(ctx);
  paintRail(ctx, g, seed);
  paintHeader(ctx);
  paintPortrait(ctx, input, g);
  paintPortraitMeta(ctx);
  paintIdentity(ctx, input, g);
  paintPlate(ctx, input, g);
  paintSocials(ctx, input);
  paintQuote(ctx);
  paintFooter(ctx, input);

  ctx.restore();
}

/* ================================================================== */
/* wall + plaque                                                       */
/* ================================================================== */

function paintWall(ctx: Ctx, ouro: boolean): void {
  // Green architrave. Not flat — a painted wall has a lit side.
  const wall = ctx.createLinearGradient(0, 0, PASS.W, PASS.H);
  wall.addColorStop(0, C.green);
  wall.addColorStop(1, C.greenDeep);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, PASS.W, PASS.H);

  paintGrain(ctx, 0, 0, PASS.W, PASS.H, 0.05);

  // Gold pinstripe. OURO thickens and brightens it — a rarity payoff you
  // can read at thumbnail size without any text telling you so.
  const p = GEO.pinstripe;
  ctx.strokeStyle = ouro ? withAlpha(C.ouro, 0.95) : withAlpha(C.ouro, 0.5);
  ctx.lineWidth = ouro ? 4 : 2;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
}

function paintPlaque(ctx: Ctx): void {
  const q = GEO.plaque;

  ctx.save();
  ctx.shadowColor = 'rgba(4, 24, 14, 0.45)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = C.limewash;
  roundRect(ctx, q.x, q.y, q.w, q.h, 4);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, q.x, q.y, q.w, q.h, 4);
  ctx.clip();

  // Morning light off the top-left. Goa at 6am, low sun off the Arabian Sea.
  const wash = ctx.createRadialGradient(q.x + 240, q.y + 90, 40, q.x + 240, q.y + 90, 1050);
  wash.addColorStop(0, 'rgba(255, 214, 140, 0.22)');
  wash.addColorStop(0.55, 'rgba(255, 214, 140, 0.06)');
  wash.addColorStop(1, 'rgba(255, 214, 140, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(q.x, q.y, q.w, q.h);

  // Plaster tooth. This is what stops the cream reading as flat paper.
  paintGrain(ctx, q.x, q.y, q.w, q.h, 0.09);

  // Settled dirt in the bottom-right, the way limewash actually ages.
  const age = ctx.createRadialGradient(
    q.x + q.w,
    q.y + q.h,
    60,
    q.x + q.w,
    q.y + q.h,
    Math.max(q.w, q.h) * 0.9,
  );
  age.addColorStop(0, 'rgba(90, 70, 40, 0.10)');
  age.addColorStop(1, 'rgba(90, 70, 40, 0)');
  ctx.fillStyle = age;
  ctx.fillRect(q.x, q.y, q.w, q.h);

  ctx.restore();
}

/* ================================================================== */
/* the signature element: the azulejo rail                             */
/* ================================================================== */

function paintRail(ctx: Ctx, g: (typeof GLAZES)[GlazeKey], seed: number): void {
  const { x, y, w, h, tiles } = GEO.rail;
  const th = h / tiles;
  const rand = seededRand(seed);
  const crackAt = Math.floor(rand() * tiles);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = C.tile;
  ctx.fillRect(x, y, w, h);

  for (let i = 0; i < tiles; i++) {
    const ty = y + i * th;

    ctx.save();
    // Seeded imperfection. Six identical tiles read as a CSS pattern;
    // six nearly-identical tiles read as fired ceramic set by hand.
    ctx.translate(x + w / 2 + (rand() - 0.5) * 3, ty + th / 2 + (rand() - 0.5) * 3);
    ctx.rotate((rand() - 0.5) * 0.014);
    ctx.globalAlpha = 0.94 + rand() * 0.06;
    drawTileMotif(ctx, w, th, g);
    ctx.restore();

    if (i > 0) {
      ctx.fillStyle = withAlpha(g.motif, 0.16);
      ctx.fillRect(x, ty - 1, w, 2);
    }
    if (i === crackAt) drawCrack(ctx, x, ty, w, th, rand);
  }

  // Glaze. Fired ceramic catches light in a band, not evenly.
  const sheen = ctx.createLinearGradient(x, y, x + w * 1.6, y + h);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
  sheen.addColorStop(0.4, 'rgba(255, 255, 255, 0.03)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0.16)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);

  ctx.restore();

  // Edge and the shadow it throws onto the plaster — this is what makes
  // the rail read as raised tile rather than a printed stripe.
  ctx.fillStyle = C.green;
  ctx.fillRect(x + w - 3, y, 3, h);

  const drop = ctx.createLinearGradient(x + w, 0, x + w + 18, 0);
  drop.addColorStop(0, 'rgba(8, 40, 24, 0.18)');
  drop.addColorStop(1, 'rgba(8, 40, 24, 0)');
  ctx.fillStyle = drop;
  ctx.fillRect(x + w, y, 18, h);
}

/**
 * Origin at the tile centre.
 *
 * Geometric, not floral. A rounded quatrefoil reads as a clover at
 * thumbnail size, and a clover on a builder pass is exactly the register
 * we are trying to avoid. This is `azulejo de padrão` grammar instead:
 * two overlapping squares making an eight-point star, corner arcs that
 * chain into a lattice across the run, one dot of accent in the middle.
 */
function drawTileMotif(ctx: Ctx, tw: number, th: number, g: (typeof GLAZES)[GlazeKey]): void {
  const hw = tw / 2;
  const hh = th / 2;

  ctx.strokeStyle = withAlpha(g.motif, 0.4);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-hw + 13, -hh + 13, tw - 26, th - 26);

  // Corner quarter-arcs. Across six tiles these chain into a continuous lattice.
  ctx.strokeStyle = withAlpha(g.motif, 0.62);
  ctx.lineWidth = 3;
  const r = 30;
  const corners: Array<[number, number, number, number]> = [
    [-hw, -hh, 0, Math.PI / 2],
    [hw, -hh, Math.PI / 2, Math.PI],
    [hw, hh, Math.PI, 1.5 * Math.PI],
    [-hw, hh, 1.5 * Math.PI, 2 * Math.PI],
  ];
  for (const [cx, cy, a0, a1] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
  }

  // Eight-point star: one square, one square at 45°.
  const s = 27;
  ctx.strokeStyle = withAlpha(g.motif, 0.9);
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'miter';
  for (const rot of [0, Math.PI / 4]) {
    ctx.save();
    ctx.rotate(rot);
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.restore();
  }

  // Filled centre lozenge — gives the star a solid core so it survives
  // being scaled to 90px wide in a timeline.
  ctx.fillStyle = withAlpha(g.motif, 0.9);
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-11, -11, 22, 22);
  ctx.restore();

  ctx.fillStyle = g.dot;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
}

/** One tile in every rail is cracked. Deterministic, so it is always the same one for you. */
function drawCrack(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  rand: () => number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(60, 45, 30, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  let px = x + w * (0.15 + rand() * 0.2);
  let py = y;
  ctx.moveTo(px, py);
  const steps = 7;
  for (let i = 1; i <= steps; i++) {
    px += (rand() - 0.35) * 22;
    py = y + (h / steps) * i;
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

/* ================================================================== */
/* header                                                              */
/* ================================================================== */

function paintHeader(ctx: Ctx): void {
  const y = GEO.headBaseline;

  // गोवा sits INSIDE the lockup, between HACKER and HOUSE, the way the
  // event sets it. Devanagari never gets manual tracking — per-glyph
  // drawing detaches the matras.
  const mark: Run = USE_DEVANAGARI
    ? { text: GOA_DEVANAGARI, font: fDev(700, 50), color: C.magenta, gap: 14 }
    : { text: GOA_LATIN, font: fD(700, 52), color: C.magenta, tracking: 2, gap: 14 };

  const runs: Run[] = [
    { text: 'HACKER', font: fD(700, 58), color: C.green, tracking: 1.5, gap: 14 },
    mark,
    { text: 'HOUSE', font: fD(700, 58), color: C.green, tracking: 1.5, gap: 26 },
    { text: '2026', font: fM(700, 30), color: withAlpha(C.green, 0.55), tracking: 3 },
  ];
  drawRuns(ctx, runs, GEO.contentL, y, 'left');

  ctx.font = fM(700, 26);
  ctx.fillStyle = withAlpha(C.oxide, 0.9);
  drawTracked(ctx, EVENT.hashtag, GEO.contentR, y, 1, 'right');

  ctx.fillStyle = withAlpha(C.green, 0.22);
  ctx.fillRect(GEO.contentL, GEO.rule1, GEO.contentR - GEO.contentL, 2);
}

/* ================================================================== */
/* portrait                                                            */
/* ================================================================== */

function paintPortrait(
  ctx: Ctx,
  input: BuilderPassInput,
  g: (typeof GLAZES)[GlazeKey],
): void {
  const p = GEO.photo;

  // Square, not circle. Everyone else circle-crops; a square reads as a
  // tile set into the wall, and it wastes none of the photo.
  ctx.save();
  ctx.shadowColor = 'rgba(7, 38, 22, 0.3)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = C.green;
  roundRect(ctx, p.x - 7, p.y - 7, p.s + 14, p.s + 14, 6);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, p.x, p.y, p.s, p.s, 3);
  ctx.clip();

  if (input.photo) {
    const { w: iw, h: ih } = dimsOf(input.photo);
    if (iw > 0 && ih > 0) {
      const r = coverRect(iw, ih, p.s, p.s, input.focal ?? { x: 0.5, y: 0.36 });
      ctx.drawImage(input.photo, r.sx, r.sy, r.sw, r.sh, p.x, p.y, p.s, p.s);
    }
  } else {
    ctx.fillStyle = C.tile;
    ctx.fillRect(p.x, p.y, p.s, p.s);
    ctx.save();
    ctx.translate(p.x + p.s / 2, p.y + p.s / 2 - 18);
    ctx.globalAlpha = 0.35;
    drawTileMotif(ctx, 140, 141, g);
    ctx.restore();
    ctx.font = fM(600, 20);
    ctx.fillStyle = withAlpha(C.green, 0.45);
    drawTracked(ctx, 'ADD A PHOTO', p.x + p.s / 2, p.y + p.s - 52, 4, 'center');
  }
  ctx.restore();

  ctx.strokeStyle = withAlpha(C.ouro, g.key === 'OURO' ? 0.95 : 0.6);
  ctx.lineWidth = 2;
  roundRect(ctx, p.x + 5, p.y + 5, p.s - 10, p.s - 10, 2);
  ctx.stroke();
}

function paintPortraitMeta(ctx: Ctx): void {
  ctx.font = fM(600, 22);
  ctx.fillStyle = withAlpha(C.green, 0.72);
  drawTracked(ctx, EVENT.datesLine, GEO.contentL, GEO.meta1, 3.5);

  ctx.font = fM(400, 21);
  ctx.fillStyle = withAlpha(C.green, 0.42);
  drawTracked(ctx, EVENT.coords, GEO.contentL, GEO.meta2, 2);
}

/* ================================================================== */
/* identity column                                                     */
/* ================================================================== */

function paintIdentity(
  ctx: Ctx,
  input: BuilderPassInput,
  g: (typeof GLAZES)[GlazeKey],
): void {
  const { x, w } = GEO.col;

  ctx.font = fM(700, 22);
  ctx.fillStyle = withAlpha(g.motif, 0.85);
  drawTracked(ctx, 'BUILDER', x, GEO.eyebrow, 7);

  // Uppercase display. This is the nameplate — the formal register that
  // the lowercase title underneath gets to undercut.
  const hasName = Boolean(input.name.trim());
  const name = (hasName ? input.name : PLACEHOLDER.name).toUpperCase();
  const size = fitFont(ctx, name, w, (s) => fD(900, s), 96, 46, 0.5);
  ctx.font = fD(900, size);
  ctx.fillStyle = hasName ? C.green : withAlpha(C.green, 0.26);
  drawTracked(ctx, name, x, GEO.name, 0.5);

  const hasRole = Boolean(input.role.trim());
  ctx.font = fM(600, 30);
  ctx.fillStyle = withAlpha(C.green, hasRole ? 0.88 : 0.26);
  const role = hasRole ? input.role : PLACEHOLDER.role;
  drawTracked(ctx, truncateMiddle(role, 42), x, GEO.role, 0);

  const hasStack = Boolean(input.stack.trim());
  ctx.font = fM(400, 26);
  ctx.fillStyle = withAlpha(C.green, hasStack ? 0.55 : 0.22);
  const stack = hasStack ? input.stack : PLACEHOLDER.stack;
  drawTracked(ctx, truncateMiddle(stack, 52), x, GEO.stack, 0.5);
}

/* ================================================================== */
/* the title plate                                                     */
/* ================================================================== */

function paintPlate(
  ctx: Ctx,
  input: BuilderPassInput,
  g: (typeof GLAZES)[GlazeKey],
): void {
  const p = GEO.plate;

  // Shrink-to-fit. A fixed-width plate reads as an empty input field;
  // a plate cut to its text reads as a label someone applied on purpose.
  const size = fitFont(ctx, input.title, p.w - 64, (s) => fM(700, s), 44, 26, 0);
  ctx.font = fM(700, size);
  const textW = measureTracked(ctx, input.title, 0);
  const w = Math.max(420, Math.min(p.w, textW + 64));

  // The glaze tag hangs off the plate's own right edge, not the column's,
  // so the two always read as one object.
  ctx.font = fM(700, 18);
  ctx.fillStyle = withAlpha(C.green, 0.42);
  drawTracked(ctx, `GLAZE \u00B7 ${g.label}`, p.x + w, GEO.glazeTag, 4, 'right');

  ctx.save();
  ctx.shadowColor = 'rgba(7, 38, 22, 0.22)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = g.plate;
  roundRect(ctx, p.x, p.y, w, p.h, 6);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = withAlpha(C.ouro, g.key === 'OURO' ? 0.8 : 0.3);
  ctx.lineWidth = 1.5;
  roundRect(ctx, p.x + 6, p.y + 6, w - 12, p.h - 12, 3);
  ctx.stroke();

  ctx.font = fM(700, size);
  ctx.fillStyle = g.plateText;
  drawTracked(ctx, input.title, p.x + 32, p.y + p.h / 2 + size * 0.36, 0);
}

/* ================================================================== */
/* socials                                                             */
/* ================================================================== */

/**
 * One mono line: gh/handle · in/handle · x/handle
 *
 * Not six labelled rows with platform icons — that reads as a link-in-bio.
 * This is how a terminal person writes it, it survives at thumbnail size,
 * and it removes every piece of borrowed platform chrome from the card.
 */
function paintSocials(ctx: Ctx, input: BuilderPassInput): void {
  const { x, w } = GEO.col;

  const entries: Array<[string, string]> = [
    ['gh/', normaliseHandle(input.github ?? '')],
    ['in/', normaliseHandle(input.linkedin ?? '')],
    ['x/', normaliseHandle(input.x ?? '')],
  ].filter(([, v]) => Boolean(v)) as Array<[string, string]>;

  if (!entries.length) return;

  const build = (size: number, cap: number): Run[] => {
    const runs: Run[] = [];
    entries.forEach(([prefix, handle], i) => {
      if (i > 0) {
        runs.push({
          text: '  \u00B7  ',
          font: fM(400, size),
          color: withAlpha(C.green, 0.3),
        });
      }
      runs.push({ text: prefix, font: fM(400, size), color: withAlpha(C.green, 0.42) });
      runs.push({
        text: truncateMiddle(handle, cap),
        font: fM(500, size),
        color: withAlpha(C.green, 0.92),
      });
    });
    return runs;
  };

  let runs = build(27, 24);
  let size = 27;
  while (measureRuns(ctx, runs) > w && size > 19) {
    size -= 1;
    runs = build(size, 24);
  }
  if (measureRuns(ctx, runs) > w) runs = build(size, 15);

  drawRuns(ctx, runs, x, GEO.socials, 'left');
}

/* ================================================================== */
/* the proverb                                                         */
/* ================================================================== */

function paintQuote(ctx: Ctx): void {
  ctx.fillStyle = withAlpha(C.green, 0.18);
  ctx.fillRect(GEO.contentL, GEO.rule2, GEO.contentR - GEO.contentL, 1);

  const text = `\u201C${QUOTE}\u201D`;
  const attrW = (() => {
    ctx.font = fM(600, 18);
    return measureTracked(ctx, QUOTE_ATTR, 3);
  })();
  const maxW = GEO.contentR - GEO.contentL - attrW - 60;

  const size = fitFont(ctx, text, maxW, (s) => fD(600, s, true), 40, 24, 0);
  ctx.font = fD(600, size, true);
  ctx.fillStyle = withAlpha(C.green, 0.92);
  drawTracked(ctx, text, GEO.contentL, GEO.quote, 0);

  ctx.font = fM(600, 18);
  ctx.fillStyle = withAlpha(C.green, 0.4);
  drawTracked(ctx, QUOTE_ATTR, GEO.contentR, GEO.quote, 3, 'right');
}

/* ================================================================== */
/* footer                                                              */
/* ================================================================== */

function paintFooter(ctx: Ctx, input: BuilderPassInput): void {
  ctx.fillStyle = withAlpha(C.green, 0.18);
  ctx.fillRect(GEO.contentL, GEO.rule3, GEO.contentR - GEO.contentL, 1);

  ctx.font = fM(700, 24);
  ctx.fillStyle = withAlpha(C.green, 0.82);
  drawTracked(ctx, EVENT.studio, GEO.contentL, GEO.foot, 2.5);

  // A real, working link. Simply write hhgoa.com
  const link = EVENT.domain;
  ctx.font = fM(400, 22);
  ctx.fillStyle = withAlpha(C.green, 0.5);
  drawTracked(ctx, link, GEO.contentR, GEO.foot, 1, 'right');
}

/* ================================================================== */
/* team pass rendering                                                */
/* ================================================================== */

export type TeamPassInput = {
  photos: (PhotoSource | null)[];
  focals?: { x: number; y: number }[];
  teamName: string;
  memberNames: string[];
};

export async function renderTeamPass(
  canvas: HTMLCanvasElement,
  input: TeamPassInput,
): Promise<void> {
  await ensureBuilderPassFonts();
  canvas.width = PASS.W;
  canvas.height = PASS.H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawTeamPass(ctx, input);
}

export function drawTeamPass(ctx: Ctx, input: TeamPassInput): void {
  const g = GLAZES.VERDE;
  const seed = 20261028;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.imageSmoothingQuality = 'high';

  paintWall(ctx, false);
  paintPlaque(ctx);
  paintRail(ctx, g, seed);
  paintHeader(ctx);
  paintTeamBody(ctx, input, g);
  paintQuote(ctx);
  paintFooter(ctx, { shareId: null, name: '', role: '', stack: '', title: '', glaze: 'VERDE', photo: null });

  ctx.restore();
}

function paintTeamBody(
  ctx: Ctx,
  input: TeamPassInput,
  g: (typeof GLAZES)[GlazeKey],
): void {
  const count = Math.max(2, Math.min(6, input.memberNames.length || input.photos.length || 2));
  
  // Eyebrow label
  ctx.font = fM(700, 22);
  ctx.fillStyle = withAlpha(g.motif, 0.85);
  drawTracked(ctx, `CREW MANIFEST \u00B7 ${count} PASSENGERS`, GEO.contentL, 205, 7);

  // Team Name
  const rawTeam = (input.teamName.trim() || 'YOUR TEAM').toUpperCase();
  const teamNameSize = fitFont(ctx, rawTeam, GEO.contentR - GEO.contentL, (s) => fD(900, s), 64, 32, 0.5);
  ctx.font = fD(900, teamNameSize);
  ctx.fillStyle = C.green;
  drawTracked(ctx, rawTeam, GEO.contentL, 275, 0.5);

  // Divider under team name
  ctx.fillStyle = withAlpha(C.green, 0.22);
  ctx.fillRect(GEO.contentL, 305, GEO.contentR - GEO.contentL, 2);

  // Member photo slots horizontal layout
  const totalW = GEO.contentR - GEO.contentL;
  const colW = totalW / count;
  const slotRadius = Math.min(95, Math.max(55, colW / 2 - 20));
  const slotY = 460; // Center Y of photos

  for (let i = 0; i < count; i++) {
    const cx = GEO.contentL + (i + 0.5) * colW;
    const photo = input.photos[i] ?? null;
    const focal = input.focals?.[i] ?? { x: 0.5, y: 0.36 };
    const memberName = (input.memberNames[i] || `MEMBER ${i + 1}`).toUpperCase();

    // Outer shadow + green ring
    ctx.save();
    ctx.shadowColor = 'rgba(7, 38, 22, 0.3)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(cx, slotY, slotRadius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Inner photo clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, slotY, slotRadius, 0, Math.PI * 2);
    ctx.clip();

    if (photo) {
      const { w: iw, h: ih } = dimsOf(photo);
      if (iw > 0 && ih > 0) {
        const r = coverRect(iw, ih, slotRadius * 2, slotRadius * 2, focal);
        ctx.drawImage(photo, r.sx, r.sy, r.sw, r.sh, cx - slotRadius, slotY - slotRadius, slotRadius * 2, slotRadius * 2);
      }
    } else {
      ctx.fillStyle = C.tile;
      ctx.fillRect(cx - slotRadius, slotY - slotRadius, slotRadius * 2, slotRadius * 2);
      ctx.font = fM(600, 16);
      ctx.fillStyle = withAlpha(C.green, 0.45);
      drawTracked(ctx, `+ PHOTO`, cx, slotY + 6, 2, 'center');
    }
    ctx.restore();

    // Gold pinstripe ring
    ctx.strokeStyle = withAlpha(C.ouro, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, slotY, slotRadius - 3, 0, Math.PI * 2);
    ctx.stroke();

    // Member Name underneath
    const nameSize = fitFont(ctx, memberName, colW - 12, (s) => fM(700, s), 24, 14, 0);
    ctx.font = fM(700, nameSize);
    ctx.fillStyle = C.green;
    drawTracked(ctx, memberName, cx, slotY + slotRadius + 38, 0, 'center');
  }
}
