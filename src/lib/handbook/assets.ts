/**
 * Handbook asset paths + constants. Mirrors `src/lib/oracle/assets.ts`.
 * All paths are root-relative (served from `public/`), like the Oracle deck.
 */

/** The chapter content as data — fetched by HandbookReader, like Oracle's DECK_URL. */
export const CONTENT_URL = "/handbook/front-of-book.json";

/** The four Move icons, reused verbatim from the Oracle suits. */
export const MOVE_ICONS = {
  wakeUp: "/oracle/icons/wake-up.svg",
  cleanUp: "/oracle/icons/clean-up.svg",
  growUp: "/oracle/icons/grow-up.svg",
  showUp: "/oracle/icons/show-up.svg",
} as const;

/** The Headmaster's chop glyph (rendered in the `Ma Shan Zheng` web font, no image). */
export const SEAL = "護";
/** English gloss for the seal glyph — pair it with 護 so the character never stands alone. */
export const SEAL_GLOSS = "Protection";

/** Print-preview spread art. */
export const SPREAD_ART = "/oracle/images/wu-a.png";

/**
 * Resolve cover / Nation tile art. Card art lives at `/card-art/*` in the repo.
 * Accepts either a bare filename ("pyrakanth-bold-heart.png") or a full path.
 */
export function artSrc(file: string): string {
  if (file.startsWith("/")) return file;
  return `/card-art/${file}`;
}
