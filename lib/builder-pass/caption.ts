/**
 * X CAPTIONS
 *
 * Same register as titles.ts: lowercase, deadpan, no emoji, no
 * exclamation. Rewrite in your own voice — a caption that sounds like a
 * product announcement gets scrolled past.
 *
 * Two structural decisions:
 *
 *  1. A VARIANT POOL, not one string. X quietly suppresses duplicate text,
 *     and the whole growth loop depends on lots of people posting from
 *     this tool within the same 36 hours. Identical captions is the one
 *     way to guarantee that fails.
 *
 *  2. OURO gets its own caption. It's a 3% roll — the flex IS the reply
 *     bait, and the leaderboard scores engagement, not impressions.
 */

import type { GlazeKey } from './tokens';
import { cyrb53 } from './titles';

export type CaptionInput = {
  name?: string;
  title: string;
  glaze: GlazeKey;
};

const PROVERB = '"Quem viu Goa, excusa de ver Lisboa"';

const OURO_CAPTIONS: Array<(t: string) => string> = [
  (t) => `ouro. 3% roll. not touching it again.\n"${t}" — hh goa 2026 builder pass`,
  (t) => `got the gold tiles. "${t}".\nhh goa 2026, 28–31 oct.`,
  (t) => `rolled ouro on the first try, which is the only thing i've done right this week.\n"${t}"`,
];

const CAPTIONS: Array<(t: string, g: string) => string> = [
  (t, g) => `hh goa 2026 builder pass.\nclass came back as "${t}", glaze ${g.toLowerCase()}.`,
  (t) => `made my hh goa 2026 nameplate. it read the room and gave me "${t}".`,
  (t, g) => `"${t}" · ${g.toLowerCase()}\nhh goa 2026, 28–31 oct, 247 of us.`,
  (t) => `the generator assigned me "${t}" and i have no notes, unfortunately.`,
  (t) => `hh goa 2026 builder pass. mine says "${t}". reroll until you're happy or honest.`,
];

/**
 * `url` should be the /f/{id} share link. On the mobile Web Share path the
 * URL goes in the TEXT, not in navigator.share({ url }) — passing url
 * alongside files makes some Android targets silently drop the image.
 */
export function builderPassCaption(input: CaptionInput, url?: string | null): string {
  const seed = cyrb53(`${input.name ?? ''}|${input.title}|${input.glaze}`);

  const head =
    input.glaze === 'OURO'
      ? OURO_CAPTIONS[seed % OURO_CAPTIONS.length]!(input.title)
      : CAPTIONS[seed % CAPTIONS.length]!(input.title, input.glaze);

  const tail = url ? `\nmake yours: ${url}` : '\nmake yours: hhgoa.com';

  return `${head}\n\n${PROVERB}\n${tail}\n#FrameInGoa`;
}

/** Desktop fallback: x.com/intent/post with the link whose preview is the graphic. */
export function builderPassIntentUrl(text: string, url?: string | null): string {
  const p = new URLSearchParams();
  p.set('text', text);
  if (url) p.set('url', url);
  return `https://x.com/intent/post?${p.toString()}`;
}

/** Filename for the download. Real name, not `download (3).png`. */
export function builderPassFilename(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'builder';
  return `hhgoa-2026-${slug}.png`;
}
