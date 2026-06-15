import type { WallKey } from "@/lib/event/barn-raising";

/**
 * Spoke → July 18 funnel map (the card-face ribbon for the MtGoA deck menu).
 *
 * Derived from the six-faces analysis:
 * `.specify/specs/mtgoa-menu-skeuomorphic-cyoa/SIX_FACES_FUNNEL_ANALYSIS.md`.
 *
 * Central finding: the spokes' Kotter arc (1→8) IS the funnel ladder, so each hook is the
 * spoke's *natural* destination, not a bolt-on. Every ask is **refusable** (non-pressure);
 * free doors outnumber asks on first read. The ribbon is quiet wayfinding — the real ask
 * lives inside the spoke. Color comes from the spoke's `wallTint` mapped to a `BARN_WALLS`
 * token by the component (kept semantic; the card frame stays the player's nation element).
 */
export type FunnelBand = "free-door" | "first-gift" | "become" | "co-create";

export interface SpokeFunnel {
  /** 0-based spoke index (matches `loadAllMtgoaSpokes`). */
  spokeIndex: number;
  /** Display numeral I…VIII. */
  numeral: string;
  band: FunnelBand;
  /** Short ribbon label shown on the card face. */
  ribbon: string;
  /** Where the congruent hook ultimately points. */
  href: string;
  /** Wall whose token tints the ribbon; `null` = neutral (a free door). */
  wallTint: WallKey | null;
}

export const SPOKE_FUNNEL_MAP: readonly SpokeFunnel[] = [
  {
    spokeIndex: 0,
    numeral: "I",
    band: "free-door",
    ribbon: "Begin free",
    href: "/handbook",
    wallTint: null,
  },
  {
    spokeIndex: 1,
    numeral: "II",
    band: "free-door",
    ribbon: "Play free",
    href: "/game/",
    wallTint: null,
  },
  {
    spokeIndex: 2,
    numeral: "III",
    band: "free-door",
    ribbon: "Go deeper",
    href: "/event/barn",
    wallTint: "runway",
  },
  {
    spokeIndex: 3,
    numeral: "IV",
    band: "first-gift",
    ribbon: "Make your move",
    href: "/event/donate?dswPath=money&wall=car",
    wallTint: "car",
  },
  {
    spokeIndex: 4,
    numeral: "V",
    band: "become",
    ribbon: "Choose your role",
    href: "/event/donate/wizard?wall=runway",
    wallTint: "runway",
  },
  {
    spokeIndex: 5,
    numeral: "VI",
    band: "become",
    ribbon: "Get your tools",
    href: "/pricing",
    wallTint: "presale",
  },
  {
    spokeIndex: 6,
    numeral: "VII",
    band: "co-create",
    ribbon: "Complete a quest",
    href: "/adventures",
    wallTint: "car",
  },
  {
    spokeIndex: 7,
    numeral: "VIII",
    band: "co-create",
    ribbon: "Design with us",
    href: "/event/donate/wizard?wall=runway",
    wallTint: "runway",
  },
] as const;

/** Lookup the funnel ribbon for a spoke index (0–7); null if out of range. */
export function funnelForSpoke(spokeIndex: number): SpokeFunnel | null {
  return SPOKE_FUNNEL_MAP.find((s) => s.spokeIndex === spokeIndex) ?? null;
}

/** Human-friendly band labels (for the card ribbon / aria). */
export const FUNNEL_BAND_LABEL: Record<FunnelBand, string> = {
  "free-door": "Free door",
  "first-gift": "First gift",
  become: "Become",
  "co-create": "Co-create",
};
