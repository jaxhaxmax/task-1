# 03 — Design Spec

> **Placeholder warning.** The palette and typefaces below are a considered proposal, not the
> official brand. The operator is downloading the Brand Kit from the hhgoa.com footer. When it
> arrives, overwrite `lib/brand.ts` and nothing else. Every colour and font in the render specs must
> reference a token — never a literal hex — so the swap is a one-file change.

---

## 1. Design thesis

**The graphic is a travel document, not a badge.**

The default answer for this brief is a dark rounded rectangle with a neon-green border, a
glassmorphic panel, and a logo in the corner. Around twenty other submissions are building that. It
is not tied to this event in any way — swap the logo and it's any hackathon on earth.

This event has a real, specific artifact in its world: **you are flying to Goa on 28 October, staying
four days, and you are one of 247 people who got a seat.** So the card is a boarding pass. It gives
us, honestly and without decoration:

- a **perforated stub** with a serial number — the signature element
- **monospace data rows** (GATE / BOARDING / SEAT), because transit documents are monospaced
- an **inked entry stamp**, rotated and imperfect, reading `ADMITTED · GOA · 28 OCT 2026`
- a **numbered edition** feel from `#042 / 247`

The one real aesthetic risk: the **rubber stamp**. A distressed, semi-transparent, off-angle ink
stamp overlapping the photo is a physical, analogue gesture in a category that is uniformly digital
and glossy. It is the thing people will screenshot. Spend the boldness there and keep everything
else disciplined.

The palette takes a second risk: **it is warm, not cyberpunk.** Sunrise over the Arabian Sea at 6am —
ink navy, coral, mango, sea-foam, sand. Every competitor will be black-and-neon. Warmth reads as
Goa; neon reads as a generic dark-mode template.

---

## 2. Tokens — `lib/brand.ts`

```ts
export const C = {
  ink:    '#0D1B2A',   // pre-dawn navy — primary surface
  deep:   '#173A5E',   // ocean blue — secondary surface, panels
  coral:  '#FF5A36',   // sunrise coral — PRIMARY ACCENT
  mango:  '#FFB238',   // golden hour — secondary accent, gradient partner
  foam:   '#7FD1C1',   // sea foam — tertiary, use sparingly (data labels only)
  sand:   '#F2E8D5',   // paper/sand — primary text on dark, card stock
  stampInk:'#C1361F',  // stamp red — the stamp element ONLY, nowhere else
  muted:  '#8AA0B4',   // muted labels
} as const;

export const GRAD = {
  sunrise: [[0,'#FF5A36'],[0.55,'#FF8A3D'],[1,'#FFB238']] as [number,string][],
  dusk:    [[0,'#0D1B2A'],[1,'#173A5E']] as [number,string][],
  foamline:[[0,'#7FD1C1'],[1,'#FFB238']] as [number,string][],
};

export const RARITY = {
  common:    { label: 'STANDARD',  color: C.foam,  chance: 60 },
  rare:      { label: 'PRIORITY',  color: C.mango, chance: 25 },
  epic:      { label: 'BUSINESS',  color: C.coral, chance: 12 },
  legendary: { label: 'FOUNDER',   color: C.sand,  chance:  3 },
} as const;

export const EVENT = {
  name: 'HACKER HOUSE GOA',
  short: 'HH GOA',
  year: '2026',
  dates: '28–31 OCT 2026',
  boarding: '28 OCT 2026',
  gate: 'GOA',
  coords: '15.2993°N 74.1240°E',
  cohort: 247,
  tagline: 'LESS NOISE. MORE SIGNAL.',
  site: 'HHGOA.COM',
  handle: '@247pmstudio',
  hashtag: '#FrameInGoa',
} as const;
```

Note the rarity labels are **fare classes**, not gaming tiers. STANDARD / PRIORITY / BUSINESS /
FOUNDER is consistent with the boarding-pass world; Common/Rare/Epic/Legendary is borrowed from
loot boxes and would break the concept. This is what "structure encodes something true about the
content" means in practice.

---

## 3. Typography

Two faces on the graphic. A third for app chrome only.

| Role | Face | Weights | Used for |
|---|---|---|---|
| Display | **Bricolage Grotesque** | 700, 800 | names, wordmark, headline text |
| Data | **JetBrains Mono** | 400, 700 | every label, serial, coordinate, marquee, stamp |
| App UI | **Inter** | 400, 500, 600 | buttons, inputs, helper text — **never on the canvas** |

All three are on Google Fonts and load via `next/font/google`. Bricolage Grotesque is a variable
grotesque with genuine character — it is not Inter, not Anton, not Space Grotesk, and it will not
read as a default. JetBrains Mono does the transit-document work.

The rule that keeps it coherent: **display type carries identity, mono type carries data.** A name is
display. A date is mono. Never mix.

Loading, in `app/layout.tsx`:

```ts
import { Bricolage_Grotesque, JetBrains_Mono, Inter } from 'next/font/google';
export const display = Bricolage_Grotesque({ subsets:['latin'], weight:['700','800'],
  variable:'--f-display', display:'block' });
export const mono = JetBrains_Mono({ subsets:['latin'], weight:['400','700'],
  variable:'--f-mono', display:'block' });
```

`display: 'block'` matters — `swap` lets a fallback render, and if the canvas paints during that
window your text is set in Arial. Combined with `await document.fonts.ready` in the engine, this is
what prevents the single most common canvas bug in this kind of tool.

In canvas font shorthand the family name must match exactly:
`'800 88px "Bricolage Grotesque", sans-serif'` and `'700 26px "JetBrains Mono", monospace'`.

---

## 4. Format A — PFP · 1000 × 1000

X circle-crops avatars, so all essential branding lives in the ring between r=500 and r=418.

```
        ┌───────────────────────────────────┐
        │ ·  ·  ink + grain in the corners  │
        │      ╭────── ring ──────╮         │
        │    ╱   HACKER HOUSE GOA  ╲        │   arc text, top, r=459
        │   │  ╭─────────────────╮  │       │
        │   │  │                 │  │       │
        │   │  │      PHOTO      │  │       │   circle clip, r=418
        │   │  │                 │  │       │
        │   │  ╰─────────────────╯  │       │
        │    ╲  28–31 OCT · 2026   ╱        │   arc text, bottom, flipped
        │      ╰───── [247] ──────╯         │   chip, overlaps ring
        │  गोवा                             │   corner mark, bottom-left
        └───────────────────────────────────┘
```

**background**
1. `fill` → `C.ink`
2. `radialGradient` cx 500 cy 300 r0 0 r1 900, stops `[[0,'rgba(255,90,54,0.28)'],[1,'transparent']]`
   — a sunrise glow behind the head
3. `grain` opacity 0.05

**photoSlots** — one slot: `{ x:82, y:82, w:836, h:836, shape:'circle' }`
(centre 500,500 → radius 418)

**foreground**
1. **Ring.** `custom` layer: annulus between r=418 and r=500, filled with a conic-style sweep. Canvas
   2D has no conic gradient in all targets, so build it as an arc stroke with `lineWidth: 82` and a
   `createLinearGradient(0,1000,1000,0)` using `GRAD.sunrise`. Stroke a circle at r=459.
2. **Inner hairline.** 3px stroke at r=418, colour `rgba(13,27,42,0.55)` — separates photo from ring.
3. **Arc text, top.** `arcText` value `HACKER HOUSE GOA · BUILDER · 2026`,
   cx 500 cy 500 r 459, centerAngle `-Math.PI/2`, font `'700 34px "JetBrains Mono"'`,
   color `C.ink`, letterSpacing 3.
4. **Arc text, bottom.** value `28–31 OCT · GOA · 15.29°N`, centerAngle `Math.PI/2`,
   **`flip: true`** (otherwise it renders upside down), same font, color `C.ink`.
5. **247 chip.** Rounded rect centred at (500, 946), w 168 h 62, radius 31, fill `C.ink`,
   stroke `C.mango` 3px. Text `247` centred, `'700 34px "JetBrains Mono"'`, `C.mango`.
   It overlaps the ring's outer edge — that overlap is what stops the ring reading as a plain circle.
6. **गोवा mark.** Brand asset, 96px wide, bottom-left corner at (56, 880), opacity 0.75.
   Lives outside the circle, so it is an easter egg for anyone who sees the square version.
7. **`#FrameInGoa`** top-right corner, `'400 24px "JetBrains Mono"'`, `rgba(242,232,213,0.5)`.

Default focal for the PFP slot: `{ x: 0.5, y: 0.3, zoom: 1 }` — faces sit high in portraits.

---

## 5. Format B — Builder Pass · 1600 × 900

```
 x=0                                              x=1150 ┊ x=1600
 ┌──────────────────────────────────────────────────────┬──────────┐ y=0
 │ ▮ HH GOA          BUILDER BOARDING PASS        गोवा  ┊ #042/247 │ y=112 header rule
 ├──────────────────────────────────────────────────────┤          │
 │ ┌──────────┐   ARJUN MEHTA                           ┊  F       │
 │ │          │   full-stack · solidity                 ┊  R       │
 │ │  PHOTO   │   ┌──────────────────────┐              ┊  A       │
 │ │          │   │ PROTOCOL PIONEER     │  ◆ PRIORITY  ┊  M       │
 │ └──────────┘   └──────────────────────┘              ┊  E       │
 │        [ADMITTED ·GOA· stamp, -9°]                   ┊          │
 │                                                      ┊  2:47 PM │
 │  GATE          BOARDING         SEAT       CLASS     ┊          │
 │  GOA           28 OCT 2026      247        2026      ┊ ▮▮ ▮ ▮▮▮ │
 ├──────────────────────────────────────────────────────┴──────────┤ y=852
 │ LESS NOISE. MORE SIGNAL. · HHGOA.COM · LESS NOISE. MORE SIGNAL. │ y=900
 └─────────────────────────────────────────────────────────────────┘
```

**background**
1. `linearGradient` 0,0 → 1600,900 with `GRAD.dusk`
2. `radialGradient` cx 1150 cy 0 r0 0 r1 1100, `[[0,'rgba(255,178,56,0.22)'],[1,'transparent']]`
3. `asset` palm silhouette, bottom-right, opacity 0.10, blend `'screen'` (from Brand Kit; skip if
   unavailable — do not substitute an emoji)
4. `grain` 0.045

**photoSlots** — one: `{ x:76, y:196, w:420, h:420, shape:'rect', radius:20,
ring:{ width:5, colors:[C.coral, C.mango] } }`

**foreground**

*Header, y 0–112*
- `rect` 0,0,1600,112 fill `rgba(13,27,42,0.55)`
- `rect` 0,110,1600,2 fill via `GRAD.sunrise` (a 2px gradient rule under the header)
- HH GOA wordmark asset at (56, 34), height 44
- `BUILDER BOARDING PASS` centred at x 700 y 56, `'700 30px "JetBrains Mono"'`, `C.sand`,
  letterSpacing 7
- गोवा mark right-aligned at x 1094, height 40, opacity 0.8

*Identity block*
- **Name** at (556, 300), `'800 92px "Bricolage Grotesque"'`, `C.sand`, `maxW: 560`, auto-shrink,
  `upper: true`, baseline `'alphabetic'`
- **Role** at (556, 356), `'400 32px "JetBrains Mono"'`, `C.muted`, `maxW: 560`
- **Title chip**: `rect` (556, 404, auto-width, 76), radius 38, fill `rgba(255,90,54,0.14)`,
  stroke `C.coral` 2px. Text inside, `'700 40px "Bricolage Grotesque"'`, `C.coral`, padded 32px each
  side. Compute the chip width from `ctx.measureText(title).width + 64`.
- **Fare class** immediately right of the chip: `◆ ` + `RARITY[rarity].label`,
  `'700 26px "JetBrains Mono"'`, colour `RARITY[rarity].color`, letterSpacing 4.
  When rarity is `legendary`, also stroke the whole card with a 4px `C.sand` inset border at
  inset 14 — a rare visual payoff that makes people re-roll.

*Stamp — the signature element*
- `stamp` layer at (300, 560), w 400, h 190, rotate `-9°`, colour `C.stampInk` at 0.62 alpha
- Two nested rounded rects (outer 4px stroke, inner 2px stroke, 8px gap)
- Lines: `ADMITTED` (`'700 52px "JetBrains Mono"'`, letterSpacing 6) and
  `GOA · 28 OCT 2026` (`'400 26px "JetBrains Mono"'`)
- **Distress:** after drawing, set `globalCompositeOperation = 'destination-out'` and punch 500
  random 1–3px circles across the stamp bounds, seeded from the serial so it is deterministic.
  Then restore. This is what makes it read as ink rather than clipart. Do not skip it.
- Draw the stamp **over** the photo edge — the overlap is deliberate.

*Data row, y 720–800*
- Four columns at x = 76, 396, 716, 1000
- Label: `'400 22px "JetBrains Mono"'`, `C.foam`, letterSpacing 5, `upper`
  → `GATE` · `BOARDING` · `SEAT` · `CLASS`
- Value at +42px y: `'700 40px "JetBrains Mono"'`, `C.sand`
  → `GOA` · `28 OCT 2026` · `247` · `2026`

*Perforation, x = 1150*
- `dashed` from (1150, 130) to (1150, 838), dash `[14, 12]`, `rgba(242,232,213,0.45)`, width 3
- `notch` at (1150, 112) r 22 fill `C.ink`, and (1150, 852) r 22 fill `C.ink`
  — semicircular punch-outs, the detail that sells the perforation

*Stub, x 1150–1600*
- `rect` 1150,0,450,900 fill `rgba(255,255,255,0.035)`
- **Serial** `#042 / 247` at (1375, 176) centred, `'700 44px "JetBrains Mono"'`, `C.mango`
- **Vertical `FRAME IN GOA`** — `custom` layer: translate to (1375, 500), rotate `Math.PI/2`,
  draw centred, `'800 66px "Bricolage Grotesque"'`, `rgba(242,232,213,0.22)`, letterSpacing 12
- `2:47 PM` at (1375, 700) centred, `'400 30px "JetBrains Mono"'`, `C.muted`
- **Barcode** at (1206, 760, 338, 62): `custom` layer drawing vertical bars of pseudo-random width
  seeded from the serial, fill `C.sand`. Deterministic, so the same person always gets the same
  barcode.

*Footer marquee, y 852–900*
- `marquee` — `rect` fill `C.coral`, text `LESS NOISE. MORE SIGNAL. · HHGOA.COM · ` repeated until
  the width is covered, `'700 26px "JetBrains Mono"'`, `C.ink`, letterSpacing 4, vertically centred.
  Static, not animated — it is a still image.

---

## 6. Format C — Team Pass · 1600 × 900

Same chrome. Header centre reads `GROUP BOARDING · {n} PASSENGERS`. Reuse the header, perforation,
stub, data row, and marquee **by importing them from `idcard.ts`**, not by copying.

**photoSlots — computed, 2 to 6 members**

```ts
const n = memberCount;                        // 2..6
const r = Math.min(150, (1180 / n) / 2 - 24); // radius shrinks as n grows
const gap = 1180 / n;
const slots = Array.from({ length: n }, (_, i) => ({
  x: 40 + gap * i + gap / 2 - r,
  y: 250 - r + 150,
  w: r * 2, h: r * 2,
  shape: 'circle' as const,
  ring: { width: 5, colors: [C.coral, C.mango] },
}));
```

Circles in a row, **not overlapping** — overlapping avatars look good but make per-person names
impossible, and named members are what make people tag each other, which is what drives replies.

**foreground additions**
- Member name under each circle, centred on the slot's x-centre at `slot.y + slot.h + 46`,
  `'400 26px "JetBrains Mono"'`, `C.sand`, `maxW: gap - 24`, auto-shrink
- **Team name** centred at (595, 700), `'800 84px "Bricolage Grotesque"'`, `C.sand`, `maxW: 1000`,
  auto-shrink, `upper`
- Data row collapses to three columns: `GATE / GOA`, `BOARDING / 28 OCT 2026`,
  `PARTY / {n}` — at x 76, 476, 876, y 790
- Stamp moves to (860, 620), rotate `+7°`, same distress
- Stub serial is derived from the **team name**, so a team always gets the same number

---

## 7. Format D — OG composite · 1200 × 630

Never downloaded. Only ever the `og:image` on `/f/{id}`. Renders from the already-drawn art canvas.

```
┌──────────────────────────────────────────────────────┐
│  ▮ HH GOA 2026                          #FrameInGoa  │
│   ┌────────────────────────────────────────────┐     │
│   │        the generated graphic, contained     │     │
│   └────────────────────────────────────────────┘     │
│  MAKE YOURS  →  framein.xyz                          │
└──────────────────────────────────────────────────────┘
```

- background `GRAD.dusk` + `grain` 0.04
- art drawn **contained** (not covered) inside (120, 84, 960, 420) — letterbox rather than crop, so
  no part of someone's face gets cut off in the preview
- 8px `C.coral` rule down the left edge, x 0–8, full height
- `MAKE YOURS →` at (120, 566), `'800 44px "Bricolage Grotesque"'`, `C.sand`
- domain at (1080, 566) right-aligned, `'400 30px "JetBrains Mono"'`, `C.mango`

---

## 8. Builder titles

40 titles across four fare classes, deterministic from `cyrb53(name + '|' + role + '|' + salt)`.
Vocabulary is AI × Crypto × Goa, matching the event's actual tracks. **No emoji** — emoji in the
title makes the chip look like a Discord role and breaks the document concept.

```ts
export const TITLES = {
  common: [   // 60%
    'Terminal Native','Commit Machine','Stack Wrangler','Ship Cycle','Late Night Push',
    'Prompt Smith','Merge Conflict','Localhost Loyalist','Rubber Duck','Green Squares',
    'Semicolon Optional','Cache Warmer','Off By One','Hot Reload','Draft PR',
  ],
  rare: [     // 25%
    'Latency Hunter','Schema Whisperer','Rollup Regular','Context Window','Zero Knowledge',
    'Gas Optimizer','Edge Runtime','Token Bender','Consensus Builder','Inference Runner',
  ],
  epic: [     // 12%
    'Protocol Pioneer','Mainnet Survivor','Silent Refactor','Chain Reorg','Model Collapse',
    'Bytecode Poet','Liquidity Ghost','Signal Over Noise',
  ],
  legendary: [ // 3%
    'The 247th','Genesis Block','First Commit','Founder Class','Ships On Fridays',
  ],
};
```

```ts
export function builderTitle(name: string, role: string, salt = 0) {
  const key = `${name.trim().toLowerCase()}|${role.trim().toLowerCase()}|${salt}`;
  const h = cyrb53(key);
  const roll = h % 100;
  const tier: Rarity =
    roll < 3  ? 'legendary' :
    roll < 15 ? 'epic'      :
    roll < 40 ? 'rare'      : 'common';
  const pool = TITLES[tier];
  return {
    title: pool[Math.floor(h / 100) % pool.length],
    rarity: tier,
    serial: String((h % 247) + 1).padStart(3, '0'),
  };
}
```

Empty name and role must still produce a valid title — the preview has to look complete before the
user types anything. Use `'BUILDER'` / `'HACKER HOUSE GOA'` as placeholder display values while the
fields are blank, but keep hashing the empty string so the title is stable.

**The reveal matters.** When the title changes, animate the chip: 180ms scale from 0.92 to 1 plus a
brief `C.mango` flash. Respect `prefers-reduced-motion`. The re-roll button sits next to it and reads
**Re-roll** — not "Randomize," not a dice emoji.

---

## 9. App UI

The interface is a frame around the graphic. It should be quiet — the card is the hero.

**Layout, mobile (390px), single column:**
```
  FRAME IN GOA                    ← wordmark, 28px display
  Drop a photo. Get your pass.    ← 15px Inter, C.muted

  [ PFP ] [ BUILDER PASS ] [ TEAM ]   ← segmented, mono 13px, uppercase

  ┌─────────────────────────┐
  │      canvas preview     │      ← full width, drag to reposition
  └─────────────────────────┘
    Drag to reposition · pinch to zoom

  [ Add a photo ]                  ← primary, C.coral, full width, 52px tall
  JPG · PNG · HEIC · any crop

  Name        [____________]
  Stack       [____________]
  Class       PROTOCOL PIONEER  ↻  ← reveal + re-roll

  [ Download ]  [ Share to X ]     ← 50/50 split, both 52px
```

Desktop: two columns, canvas left at 62%, controls right. Same components.

**Copy rules.** Active voice. Buttons name the action and the resulting toast uses the same word —
`Download` → `Downloaded`. Errors state what happened and what to do:
*"That file didn't decode. Try a JPG or PNG."* not *"Error processing image."*
Empty state is an invitation, not a placeholder: the canvas renders the frame with a silhouette
where the photo goes, so the user sees what they're getting before uploading.

**Do not** number the steps in the UI. A three-step wizard adds ceremony to a flow that should feel
like one motion, and the brief asks for one pass, start to finish.
