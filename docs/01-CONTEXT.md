# 01 — Context, Research, and Why

Everything here was gathered from primary sources (hhgoa.com, hhgoa.com/radar, the task PDF, and
live competitor submissions) in early August 2026. Read it before you form opinions about the design
or the architecture.

---

## 1. The event

Hacker House Goa 2026, run by **2:47 PM Studio** (a Web3 ecosystem growth and venture studio
covering APAC & MENA).

| Fact | Value | Where it should show up |
|---|---|---|
| Dates | 28–31 October 2026 | every format |
| Location | Goa, India (private beach resort) | every format |
| Cohort size | **247 builders** selected | serial numbers, "seat 247" |
| Studio | 2:47 PM Studio | the `2:47 PM` timestamp motif |
| Tagline | "Less noise. More signal." | footer marquee |
| Secondary line | "4 days. one rhythm. everything intentional." | landing page copy |
| Theme | AI × Crypto, multichain | builder-title vocabulary |
| Day names | genesis day / day of triangle / build day / launch day | optional easter egg |
| Coordinates | 15.2993° N, 74.1240° E | data rows on the pass |
| Hashtag | **#FrameInGoa** | every caption, non-negotiable |
| Site | hhgoa.com | footer marquee |
| Handle | @247pmstudio | caption mention |

**The 247 motif is the highest-leverage branding device available.** It is simultaneously the cohort
size and the studio name. Using it as a serial number (`#042 / 247`) makes every generated card feel
like a numbered edition rather than a template fill. Nobody outside this event would understand it,
which is exactly what "unmistakably this event" means.

Scale context, from a town hall the organisers held in early August: over 20,500 people registered
and 5,000+ are actively working through selection tasks. Open Trials (August) are the first filter,
intended to cut the pool to roughly 30–40%. This is a high-volume filter, so the submission has to
survive a fast skim.

---

## 2. The task brief has two versions and they differ

The PDF the operator received lists Format A (PFP overlay) and Format B (Builder ID card), and says
"pick one or build both."

**The task card on hhgoa.com asks for more.** It says: design your own HH Goa 2026 themed photo frame
generator, *use that same generator to bring your teammates into one combined frame*, then post it on
X with *a quick how-to on generating your own #FrameInGoa post using your generator*.

Two requirements that only appear on the site:

- **A team / combined-frame mode.** Multiple people, one graphic. This is why the build scope is
  three formats, not two. Most submissions will only read the PDF and miss this.
- **The X post itself is a graded deliverable.** It must be a how-to, teaching other people to use
  *your* generator. Not a screenshot dump. See `06-QA-AND-LAUNCH.md`.

The site also lists these as explicit criteria:

- Instantly recognizable HH Goa 2026 identity
- 1-click download + 1-click Share to X
- Works on any photo — no manual cropping
- Personalized: name, stack, a generated builder class
- Seconds from upload to shareable output
- Use #FrameInGoa to get featured in the Radar

---

## 3. Scoring is public, and it is not view count

There is a live leaderboard at **hhgoa.com/radar** ("W Celeb Radar"), listing every team with their X
profile, their post, view count, and a **Score**. Sample rows observed:

| Rank | Team | Views | Score |
|---|---|---|---|
| 1 | Craftorā | 451 | 60 |
| 2 | Team Gravity | 1.6K | 38 |
| 3 | Tech Hawks | 525 | 30 |
| 11 | TEAM EX | 937 | 5 |
| 24 | TEAM MODERN | 12 | 0 |

**Score does not track views.** The #1 team has a quarter of the views of the #2 team and a much
higher score; a team with 937 views scores 5. Score is therefore engagement-weighted (likes,
reposts, replies, quotes) and/or carries a manual quality component.

### What this means for the build

- Optimising for impressions is the wrong objective. Optimise for **replies and quote-tweets**, which
  means optimise for *other people generating and posting their own card with your tool*.
- Every share must carry a working link back to the tool. The share link is the growth loop.
- The generated graphic must look good *in-feed at thumbnail size*, because that is what determines
  whether anyone stops scrolling. This directly drives the aspect-ratio decisions in §6.
- A "re-roll your builder title" affordance is worth more than it looks: it produces repeat posts
  from the same user and gives people a reason to reply to each other ("I got Legendary").

Also observed: several leaderboard rows have a **profile handle that differs from the posting
handle** (e.g. team registered under one account, post made from a teammate's). Posting from whoever
has the most reach is permitted.

Only ~24 teams were on the board at time of research. It will fill fast. Post early — score accrues
over time, so a post live for 36 hours beats an identical post live for 4.

---

## 4. Competitive landscape

Several submissions are already live. Observed patterns:

- `hacker-house-goa.pages.dev` — format picker before upload, emoji-prefixed builder titles from a
  dropdown, manual scale/X/Y/rotate sliders, a visible "Processing Image…" state. Crucially its own
  UI says: *"Click Share on X to open a pre-filled post. Make sure to attach your downloaded graphic
  to your post."*
- `framein-hhgoa.vercel.app` — four modes (Profile / Builder ID / Banner / Team), step-numbered flow.
- `hhgoa-builder.vercel.app` — two modes, states that "POST ON X saves the graphic and opens the X
  composer with your caption."
- `hhg-t1.vercel.app` — strong copy, uses the coordinates and "LESS NOISE. MORE SIGNAL." marquee.

### The gap every one of them has

**They all make the user manually attach the image to the tweet.** That is the flow X's web intent
forces on you, and it breaks the brief's "one pass, start to finish" requirement. The brief
anticipates exactly this and specifies the fix: *if you share via link rather than direct image
attach, make sure the link preview (OG image) actually shows the generated graphic, not a
blank/default thumbnail.*

**Solving this properly is the single biggest differentiator available.** It is also the reason the
stack is Next.js and not a static build. See `05-CRITICAL-CODE.md` §5.

Second gap: **visual sameness.** They are all dark cards with neon accents and a logo. "On-brand: it
should be unmistakably this event, not a generic badge with a logo pasted on" is a stated
requirement, and the field is failing it.

---

## 5. The share problem, stated precisely

X's web intent endpoint (`x.com/intent/post`) **cannot attach an image.** There is no parameter for
it. Any flow built purely on the intent URL will produce a text-only tweet.

Three mechanisms exist. Implement all three, in this priority order:

**A. Web Share API Level 2 (mobile — the primary path).**
`navigator.share({ files: [File] })` opens the native share sheet with the image already attached.
The user picks X and the image is in the composer. Supported on iOS Safari 15+, Android Chrome 75+.
This is the real answer for the "most people will use this from their phone" requirement.
*Gotcha:* the call must happen inside a live user gesture. Awaiting a network request first will
throw `NotAllowedError` on iOS. Prepare the `File` object eagerly at render time.

**B. Dynamic OG link (desktop — and the growth loop).**
Upload the generated PNG to blob storage, mint `/f/{id}`, and have that route emit
`og:image` / `twitter:image` pointing at the stored PNG with
`twitter:card = summary_large_image`. Pass that URL to the intent link. The tweet shows a large
image card of the actual graphic, and clicking it lands on a page that says "make yours."
This is the requirement the brief calls out by name.

**C. Clipboard + download fallback.**
`navigator.clipboard.write([new ClipboardItem({'image/png': blob})])` plus an automatic download,
then open the composer. Last resort, for browsers with neither A nor B.

---

## 6. Aspect-ratio research (drives the design)

**PFP:** X crops profile pictures to a **circle**. Therefore the brandable region of a square PFP is
the **annulus** between the inscribed circle and the photo, not the corners. A rectangular border
frame is invisible where it matters. The frame must be a ring. Corners still get filled (they show
when the image is posted as a normal square image) but carry no essential information.

**In-feed single images:** 16:9 displays uncropped in every X client. Taller formats get cropped in
at least some surfaces. Since the ID card and team card are meant to be *posted*, they are
**1600×900**. This is also why the horizontal boarding-pass layout is the right call — it is a
distinctive layout that happens to fit the only universally-safe ratio.

**Link preview cards:** `summary_large_image` renders at approximately **1.91:1**. A 16:9 graphic
gets letterboxed or edge-cropped. So the OG image is a **separate 1200×630 composite** that places
the generated graphic on a branded backdrop with a call to action. It renders from the existing
canvas in milliseconds and doubles as free advertising in every feed it appears in.

Summary of output sizes:

| Artifact | Size | Purpose |
|---|---|---|
| PFP | 1000×1000 | download, becomes an X avatar |
| Builder pass | 1600×900 | download, posted in-feed |
| Team pass | 1600×900 | download, posted in-feed |
| OG composite | 1200×630 | `og:image` on `/f/{id}` only, never downloaded |

---

## 7. Decision log

Short form, so you don't relitigate these.

| Decision | Why | Rejected alternative |
|---|---|---|
| Next.js App Router + Vercel | Dynamic per-image OG metadata requires a server | Vite static SPA — cannot emit per-URL meta tags |
| Client-side canvas render | "Near-instant," no server round trip, zero cold-start risk | Server-side render (@vercel/og / satori) — adds 300–800ms and a failure mode |
| One engine + declarative specs | Three formats solo in 2.5 days | Three bespoke components — will not finish |
| Boarding-pass layout | Distinctive, event-specific, fits 16:9, gives a signature element | Vertical badge — gets cropped in-feed, and is what everyone else is building |
| Annular PFP frame | X circle-crops avatars | Rectangular border — invisible on X |
| Heuristic upper-third crop | Zero dependencies, works everywhere, ~90% correct | MediaPipe/BlazeFace — 2MB WASM, half a day of work, marginal gain |
| Deterministic hashed builder title | Feels like a reveal, drives re-rolls and replies | Dropdown picker — a form field, generates no engagement |
| Two blobs per share (art + OG) | 16:9 art, 1.91:1 card — different jobs | One blob — the link preview would crop badly |
| PNG output | Crisp text, no JPEG ringing on the mono type | JPEG — smaller but visibly degrades small monospace |

---

## 8. Assets available from hhgoa.com

Observed on the live site (get official versions from the Brand Kit link in the footer):

- Sunrise illustration, palm/tree silhouettes, "Hacker house" wordmark
- **A Devanagari गोवा logotype** — highly distinctive, use it as a corner mark on every format
- The `2:47 pm Studio` lockup
- Marquee copy: "LESS NOISE. MORE SIGNAL." · "HHGOA.COM"

Self-host everything under `public/brand/`. Do not hotlink.
