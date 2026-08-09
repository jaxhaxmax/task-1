# 06 — QA and Launch

---

## 1. Test matrix

Run this on a **physical phone**, not just a desktop emulator. Half of these bugs only exist on real
iOS Safari.

### Images

| Input | Expected |
|---|---|
| Portrait JPEG, phone camera | upright, face in frame, not sideways |
| Landscape JPEG | centred, subject not cut off |
| `.heic` from iPhone | decodes on iOS Safari **and** desktop Chrome |
| PNG with alpha | transparent regions composite over the frame, no black box |
| WEBP | decodes |
| Square 1:1 | no distortion in any format |
| Extreme panorama (5:1) | fills the slot, no letterboxing |
| Extreme vertical (1:4) | fills the slot |
| 12MP / 8MB photo | renders in under 1.5s |
| Face far off to one side | drag-to-reposition recovers it |
| Group photo | at minimum doesn't crash; ideally frames the centre |
| Screenshot (no EXIF) | renders correctly |
| Corrupt / renamed `.txt` | clear error message, app stays usable |
| 40MB file | rejected before decode, with a message |

### Text

| Input | Expected |
|---|---|
| Empty name and role | complete, sensible card renders |
| 1 character | doesn't look broken |
| 30 characters | auto-shrinks, never crosses the perforation |
| Devanagari / Tamil / Arabic name | renders (fonts must cover it or fall back cleanly) |
| Emoji in name | renders or is stripped — never a tofu box |
| Leading/trailing spaces | trimmed before hashing, or the same person gets two serials |
| `<script>alert(1)</script>` | drawn as literal text (canvas is inherently safe; verify the `/f/` page too) |

### Formats

- Switching PFP → Pass → Team keeps the photo and the fields
- Same name + role always yields the same title, serial, and barcode
- Re-roll changes title, rarity, and serial together
- Team with 2 members and with 6 members both lay out correctly
- Removing the middle member of five reflows without a reload

### Share and download

- Downloaded PNG opens at exactly 1000×1000 / 1600×900
- Filename is meaningful, not `download.png`
- iOS Safari: native sheet, image attached, X composer shows the image
- Android Chrome: same
- Desktop Chrome/Safari/Firefox: composer opens with caption + link
- **`/f/{id}` preview shows the actual graphic in a real tweet composer**
- Airplane mode: download still works; share degrades without an unhandled error
- With `BLOB_READ_WRITE_TOKEN` removed: nothing crashes

### Devices

iPhone Safari (14+), Android Chrome, iPad, desktop Chrome, Firefox, Safari. Test at 360px wide, in
landscape, and in dark mode.

---

## 2. Pre-submission checklist

- [ ] Live URL loads in incognito with no console errors
- [ ] Zero login, signup, email capture, or gate of any kind
- [ ] Full flow completes on a phone on cellular in under 30 seconds
- [ ] Downloaded PNG opens in a photo viewer
- [ ] Link preview verified in a real tweet composer
- [ ] `#FrameInGoa` present in the default caption
- [ ] All three formats produce a graphic
- [ ] Lighthouse mobile performance ≥ 90
- [ ] `/dev/*` routes deleted
- [ ] `NEXT_PUBLIC_BASE_URL` points at production, not localhost
- [ ] Form submitted at <https://forms.gle/jM5hTaGvsrfEfixPA>

---

## 3. In-app captions · `lib/caption.ts`

Pre-filled into the X composer. Under 240 characters to leave room for the link.

```ts
export const CAPTIONS = {
  pfp: (title: string) =>
`Got my Hacker House Goa 2026 frame. 🌴

Class: ${title}
28–31 Oct · Goa · 247 builders

Make yours in 5 seconds ↓
#FrameInGoa`,

  idcard: (name: string, title: string, serial: string) =>
`Builder pass secured. ✈️

${name} · ${title}
Seat #${serial}/247 · Boarding 28 Oct

Grab yours ↓
#FrameInGoa`,

  team: (team: string, n: number) =>
`${team} is boarding. ✈️

${n} passengers · 28–31 Oct · Goa

Make your team's pass ↓
#FrameInGoa`,
};
```

Two emoji maximum. More reads as spam and suppresses reach.

---

## 4. The launch post

**This is a graded deliverable, not marketing.** The task page requires a post *with a quick how-to
on generating your own #FrameInGoa post using your generator.* A screenshot dump does not satisfy it.

Post as a thread. Tweet 1 does the work; the rest is the how-to.

### Tweet 1 — the hook (attach the TEAM pass, it's the most striking image)

```
we built a boarding pass generator for Hacker House Goa 2026.

drop a photo → get your pass → post it. no login, no cropping, works on your phone.

here's how to make yours in 15 seconds 🧵

#FrameInGoa
```

### Tweet 2 — the how-to (attach a 3-frame screen recording, muted, under 15s)

```
1. open [your-url]
2. drop any photo — portrait, landscape, uncropped, HEIC from your iPhone. it auto-frames.
3. type your name + stack
4. hit download or share straight to X

that's it. three formats: PFP frame, builder pass, team pass.
```

### Tweet 3 — the detail people reply to

```
your builder class is generated from your name + stack, so it's the same every time.

247 seats, so everyone gets a serial: #042/247

FOUNDER class is a 3% roll. post yours if you land one 👀
```

### Tweet 4 — the loop

```
made for the @247pmstudio HH Goa 2026 open trials.

if you're applying too — make your pass, post it with #FrameInGoa, and drop it below. i'll RT every one.

[your-url]
```

### Why this structure

Score on the Radar tracks engagement, not impressions. Tweet 3 gives people a reason to reply (the
rarity roll). Tweet 4 explicitly asks for replies and offers reciprocity. A thread that ends in a
question outperforms one that ends in a link.

---

## 5. Distribution — the 36 hours after posting

Your teammates own this while you fix bugs.

1. **Post on 12 August, not the 13th.** Score accrues over time.
2. **Post between 7–9pm IST**, peak Indian X activity.
3. **Reply to every existing #FrameInGoa post** with a genuine compliment and your link. Roughly 24
   teams are on the board; that's 24 conversations, each seen by that team's followers.
4. **Get 5–10 people to actually use it and post.** Friends, your cohort, anyone applying. Their
   posts carry your link, and the hashtag makes them count.
5. **Quote-tweet the best card someone else generates** with your tool. That is the single strongest
   proof the thing works, and it costs nothing.
6. **Reply to your own thread** with new cards as they roll in. Keeps the thread surfacing.
7. **Post from whichever teammate has the most reach** — the Radar shows the posting handle and the
   registered handle are allowed to differ.

---

## 6. Known limitations to disclose if asked

Be upfront. Judges respect a clear-eyed answer more than a hand-wave.

- Web Share with files is unsupported on desktop browsers; those users get the OG-link path instead,
  which is why the link preview work was necessary.
- HEIC conversion on desktop needs a ~1.5MB WASM decoder, loaded only when a HEIC is actually
  uploaded.
- Auto-framing is heuristic (upper-third bias), enhanced by native face detection where the browser
  provides it. Manual adjustment is always available.
- Generated images are stored for link previews only. No accounts, no tracking, nothing retained
  beyond the image.
