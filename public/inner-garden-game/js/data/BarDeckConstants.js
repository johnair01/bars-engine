/**
 * BAR / deck enums — Chapter 1 spec: single source for `kind` and `source` strings.
 * @see vault: `06 Specs/inner-garden-chapter1-bar-deck/SPEC.md`
 */

/** @enum {string} */
export const CARD_KIND = {
    WITNESS: 'witness',
};

/** @enum {string} */
export const BAR_SOURCE = {
    PLAYER: 'player',
    IMPORT: 'import',
};

/** Max BarRecord rows per save (Phase A soft cap; SPEC §Integrated 6-face). */
export const MAX_BARS_CHAPTER_1 = 24;
