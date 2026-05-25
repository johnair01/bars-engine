export const CARD_BACK = "/oracle/card-back.png";
export const DECK_URL = "/oracle/deck.json";

const SUIT_ICONS: Record<string, string> = {
  WU: "/oracle/icons/wake-up.svg",
  CU: "/oracle/icons/clean-up.svg",
  GU: "/oracle/icons/grow-up.svg",
  SU: "/oracle/icons/show-up.svg",
};

export function suitIconPath(code: string): string | undefined {
  return SUIT_ICONS[code];
}

/** Resolve card art path from published deck.json */
export function cardImageSrc(imageFile: string | undefined): string | null {
  if (!imageFile) return null;
  if (imageFile.startsWith("/oracle/")) return imageFile;
  return null;
}
