/**
 * MTGOA Design System — Theme
 *
 * Dark-mode game theme. Maps semantic roles to design tokens so the rest of the
 * app references intent ("element channel", "superpower accent") rather than raw
 * hex. Channel/superpower lookups are keyed by the canonical names used in the
 * data layer.
 */
import { colors } from "./tokens";
import type { Element } from "@/data/channels";

/** Wuxing element → channel color. */
export const channelColor: Record<Element, string> = {
  Wood: colors.wood,
  Fire: colors.fire,
  Earth: colors.earth,
  Metal: colors.metal,
  Water: colors.water,
};

/** Tailwind text/border/bg class fragments per element (no inline styles). */
export const channelClass: Record<Element, { text: string; border: string; bg: string }> = {
  Wood: { text: "text-wood", border: "border-wood", bg: "bg-wood" },
  Fire: { text: "text-fire", border: "border-fire", bg: "bg-fire" },
  Earth: { text: "text-earth", border: "border-earth", bg: "bg-earth" },
  Metal: { text: "text-metal", border: "border-metal", bg: "bg-metal" },
  Water: { text: "text-water", border: "border-water", bg: "bg-water" },
};

export const theme = {
  mode: "dark" as const,
  surface: {
    page: colors.bg,
    raised: colors.surf,
    card: colors.card,
    border: colors.border,
  },
  textColor: {
    primary: colors.text,
    dim: colors.dim,
    muted: colors.muted,
    accent: colors.accent,
  },
} as const;
