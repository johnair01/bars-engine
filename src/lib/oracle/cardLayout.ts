/** Printable card face zones (300×420) — see SPEC-oracle-card-framing.md */
export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 420;

export const ZONE_HEADER_H = Math.round(CARD_HEIGHT * 0.08);
export const ZONE_IMAGE_H = Math.round(CARD_HEIGHT * 0.62);
export const ZONE_TITLE_H = Math.round(CARD_HEIGHT * 0.07);
export const ZONE_TITLE_PADDING_X = "0.35rem";
export const ZONE_CONTENT_H =
  CARD_HEIGHT - ZONE_HEADER_H - ZONE_IMAGE_H - ZONE_TITLE_H;

export const OPAQUE_GREEN = "#0F3B2F";
export const GOLD = "#C9A84C";
export const CREAM = "#F6F1E8";

export type Crop = { x: number; y: number; zoom: number };

export const DEFAULT_CROP: Crop = { x: 50, y: 50, zoom: 1 };

export function clampCrop(c: Crop): Crop {
  return {
    x: Math.min(100, Math.max(0, c.x)),
    y: Math.min(100, Math.max(0, c.y)),
    zoom: Math.min(3, Math.max(1, c.zoom)),
  };
}

export function cropFromCard(card: {
  crop?: { x?: number; y?: number; zoom?: number };
}): Crop {
  const c = card.crop;
  return clampCrop({
    x: c?.x ?? 50,
    y: c?.y ?? 50,
    zoom: c?.zoom ?? 1,
  });
}
