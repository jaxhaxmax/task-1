# Kickoff prompt

Drop the whole `framein-goa-spec/` folder into your repo root, then paste this as your first message
to the agent.

---

```
You are building "Frame in Goa" — a web tool for the Hacker House Goa 2026 shortlisting task.
Users upload a photo and instantly get a branded HH Goa 2026 graphic they can download and post
to X. Deadline: 13 August 2026.

The complete specification is in ./framein-goa-spec/. Read all seven files in order before
writing any code:

  README.md              — build order, non-negotiables, anti-patterns
  01-CONTEXT.md          — research, real judging criteria, decision rationale
  02-ARCHITECTURE.md     — stack, file tree, type contracts, data flow
  03-DESIGN-SPEC.md      — brand tokens, typography, exact pixel layouts
  04-BUILD-PHASES.md     — ordered tasks with acceptance gates
  05-CRITICAL-CODE.md    — working code for the seven things that break
  06-QA-AND-LAUNCH.md    — test matrix, launch copy

How to work:

1. Read all seven files. Then tell me, in under 200 words, what you're building and the three
   riskiest parts. Do not start coding until I confirm.

2. Work phase by phase (P0 → P7 in 04-BUILD-PHASES.md). At the end of each phase, stop, state
   which acceptance gate you're at, and tell me exactly what to verify in the browser. Do not
   proceed past a failed gate.

3. Follow 03-DESIGN-SPEC.md literally. The pixel coordinates, the palette, and the boarding-pass
   concept are deliberate and researched. If a coordinate genuinely doesn't work once rendered,
   say so and propose a fix — but do not silently redesign, and do not substitute the default
   dark-card-with-neon-border look. That is explicitly what this design avoids.

4. Use the code in 05-CRITICAL-CODE.md as written. Where a comment says a line is load-bearing,
   it is. Those seven sections are pre-solved bugs.

5. Every colour and font must come from lib/brand.ts. Never a literal hex in a spec file. The
   official brand kit lands later and must be a one-file swap.

6. Deploy to Vercel at the end of P2, not at the end of the project.

Constraints, in priority order:
  - No login, signup, or gate of any kind, anywhere
  - Upload to visible result under 2 seconds
  - Real downloadable PNG file
  - Share link preview must show the actual generated graphic (05-CRITICAL-CODE.md §5–7)
  - Mobile first — build at 390px before you look at desktop

Start with step 1.
```

---

## Per-phase follow-ups

**Starting a phase:**
```
Proceed with P{n} from 04-BUILD-PHASES.md. Stop at GATE {n} and tell me what to verify.
```

**When a gate fails:**
```
GATE {n} failed: {what you observed}. Diagnose before changing code — tell me the cause first,
then the fix. Do not work around it by changing the spec.
```

**Guarding against silent redesign** (worth sending once around P3):
```
Before continuing: confirm the render output still matches 03-DESIGN-SPEC.md. Specifically —
is the perforation with notches present, is the distressed stamp drawn with the destination-out
pass, is the footer marquee there, and is every colour coming from lib/brand.ts?
```

**Brand kit swap, once the operator has it:**
```
The official HH Goa brand kit is in public/brand/. Update lib/brand.ts to use the real palette
and fonts, and swap the placeholder assets. Change nothing else — every spec file references
tokens, so this should be a single-file edit plus asset replacement.
```
