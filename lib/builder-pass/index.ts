/**
 * BUILDER PASS — public surface.
 *
 * Everything the app needs is here. Nothing inside lib/builder-pass
 * imports from outside lib/builder-pass, so this drops into any project
 * that can give it a 2D canvas context.
 */

export { PASS, OG, C, GEO, GLAZES, GLAZE_ORDER, QUOTE, QUOTE_ATTR, EVENT, withAlpha } from './tokens';
export type { Glaze, GlazeKey } from './tokens';

export { ensureBuilderPassFonts, fD, fM, fDev, fontReport } from './fonts';

export { rollBuilderTitle, seedFrom, cyrb53, ALL_TITLES, TITLE_COUNT } from './titles';
export type { Roll } from './titles';

export { renderBuilderPass, drawBuilderPass, renderTeamPass, drawTeamPass } from './render';
export type { BuilderPassInput, TeamPassInput } from './render';

export { renderBuilderPassOG, renderTeamPassOG } from './og';

export { builderPassCaption, builderPassIntentUrl, builderPassFilename } from './caption';
export type { CaptionInput } from './caption';

export { normaliseHandle, coverRect, containRect, truncateMiddle } from './draw';
export type { PhotoSource } from './draw';
