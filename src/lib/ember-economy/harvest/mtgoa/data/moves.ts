/**
 * Move Cards — player-side card definitions and shared card primitives.
 *
 * Canonical source: "MTGOA Game — Core Architecture" (channels, card types,
 * superpower shadows) and "NPC Test Suite" (the six named counter moves that
 * appear in Priya's shadow deck).
 *
 * SCOPE NOTE: The docs specify the four card-TYPE colors, the per-superpower
 * shadow NAMES, and the six canonical counter moves. They do NOT enumerate the
 * full tiered player move catalog with channel costs/effects — that detail lived
 * in the ~900-line artifact and is a deliberate design space. Cards below marked
 * `provisional: true` are scaffolding stand-ins (clearly flagged, not canonical
 * balance) so the engine is exercisable; canonical cards omit that flag.
 */
import type { Element } from "./channels";
import type { SuperpowerName } from "./superpowers";
import { SUPERPOWERS } from "./superpowers";

/** Card-type taxonomy (colors from the design-system tokens). */
export type CardType = "emotional" | "relational" | "cognitive" | "action";

/** Light = cooperation/capacity move. Shadow = resistance/dysregulation move. */
export type CardState = "light" | "shadow";

export type CardTier = 1 | 2 | 3;

export interface MoveCard {
  id: string;
  name: string;
  state: CardState;
  /** Primary Wuxing channel this card operates in / generates. */
  channel: Element;
  type: CardType;
  tier: CardTier;
  /** Player-facing description of what the card does. */
  text: string;
  /**
   * If set, playing this move counters/metabolizes the NPC shadow card whose
   * `counter` field names this move. Canonical for the six named counters.
   */
  counters?: string;
  /** True for scaffolding stand-ins whose numbers are not canonical design. */
  provisional?: boolean;
}

/**
 * The six canonical counter moves, named in Priya's shadow deck (NPC Test Suite).
 * Each metabolizes a specific shadow. Channel is inferred from the shadow family
 * it answers (Water shadows ← Water/Earth holding moves; Fire shadows ← Fire
 * naming moves), consistent with the Alchemy metabolize rule (pay matching channel).
 */
export const COUNTER_MOVES: MoveCard[] = [
  {
    id: "bear-witness",
    name: "Bear Witness",
    state: "light",
    channel: "Water",
    type: "emotional",
    tier: 1,
    text: "Stay present to what is real without fixing it. Metabolizes Performed Compliance.",
    counters: "Performed Compliance",
  },
  {
    id: "check-in",
    name: "Check In",
    state: "light",
    channel: "Water",
    type: "relational",
    tier: 1,
    text: "Reach toward the person who went quiet. Metabolizes Strategic Withdrawal.",
    counters: "Strategic Withdrawal",
  },
  {
    id: "name-the-feeling",
    name: "Name the Feeling",
    state: "light",
    channel: "Water",
    type: "emotional",
    tier: 1,
    text: "Put words to what is underneath the performance. Metabolizes Loyalty Performance.",
    counters: "Loyalty Performance",
  },
  {
    id: "sit-with-it",
    name: "Sit With It",
    state: "light",
    channel: "Earth",
    type: "emotional",
    tier: 1,
    text: "Hold the distance without rushing to close it. Metabolizes Managed Distance.",
    counters: "Managed Distance",
  },
  {
    id: "name-the-pattern",
    name: "Name the Pattern",
    state: "light",
    channel: "Fire",
    type: "cognitive",
    tier: 1,
    text: "Name the principle-as-armor without attacking the person. Metabolizes Righteous Detachment.",
    counters: "Righteous Detachment",
  },
  {
    id: "speak-up",
    name: "Speak Up",
    state: "light",
    channel: "Fire",
    type: "action",
    tier: 1,
    text: "Say the true thing before the door closes. Metabolizes Pre-emptive Exit.",
    counters: "Pre-emptive Exit",
  },
];

/**
 * Provisional generic player moves, one per element in each card type, used by
 * the deck builder to fill out a starting hand when no canonical superpower
 * catalog is available. NUMBERS/EFFECTS ARE SCAFFOLDING, NOT CANONICAL DESIGN.
 */
function provisionalMove(
  channel: Element,
  type: CardType,
  state: CardState,
  label: string,
): MoveCard {
  return {
    id: `prov-${state}-${channel}-${type}-${label}`.toLowerCase().replace(/\s+/g, "-"),
    name: label,
    state,
    channel,
    type,
    tier: 1,
    text:
      state === "light"
        ? `Generate ${channel} channel. (Provisional move — replace with canonical ${channel} card.)`
        : `Generate ${channel} channel but add 1 Stress. (Provisional shadow — replace with canonical card.)`,
    provisional: true,
  };
}

/**
 * Provisional shadow cards seeded from a Superpower's documented shadow names.
 * The names are canonical; the channel mapping uses the archetype's affinity and
 * the effects are provisional.
 */
export function shadowSeedsForSuperpower(name: SuperpowerName): MoveCard[] {
  const def = SUPERPOWERS[name];
  return def.shadows.map((shadowName, i) => ({
    id: `shadow-${name}-${i}`.toLowerCase().replace(/\s+/g, "-"),
    name: shadowName,
    state: "shadow" as const,
    channel: def.channels[i % def.channels.length],
    type: "emotional" as CardType,
    tier: 1 as CardTier,
    text: `${shadowName}: generate ${def.channels[i % def.channels.length]} channel but add 1 Stress until metabolized. (Effect provisional.)`,
    provisional: true,
  }));
}

export { provisionalMove };
