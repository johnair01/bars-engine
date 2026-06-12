/**
 * Deck Builder — constructs the player's starting deck by Superpower.
 *
 * Canonical source: "MTGOA Game — Core Architecture" § Card Acquisition / Deck
 * Size (start: 12 cards = 5 light, 4 shadow, 3 alchemy-type free).
 *
 * Light cards are seeded from the canonical counter moves whose channel matches
 * the archetype's affinity, then topped up with provisional channel cards. Shadow
 * cards come from the archetype's documented shadow names. Provisional cards are
 * flagged on the card (`provisional`) and are NOT canonical balance.
 */
import type { MoveCard } from "@/data/moves";
import { COUNTER_MOVES, provisionalMove, shadowSeedsForSuperpower } from "@/data/moves";
import type { SuperpowerName } from "@/data/superpowers";
import { SUPERPOWERS } from "@/data/superpowers";
import type { Element } from "@/data/channels";
import { RULES } from "./rules";

export interface PlayerDeck {
  superpower: SuperpowerName;
  cards: MoveCard[];
}

function pickLightCards(channels: [Element, Element], count: number): MoveCard[] {
  // Prefer canonical counter moves in the archetype's channels.
  const onAffinity = COUNTER_MOVES.filter((c) => channels.includes(c.channel));
  const chosen: MoveCard[] = [...onAffinity].slice(0, count);

  // Top up with provisional light cards alternating across the two channels.
  let i = 0;
  while (chosen.length < count) {
    const channel = channels[i % channels.length];
    const type = i % 2 === 0 ? "relational" : "cognitive";
    chosen.push(provisionalMove(channel, type, "light", `${channel} Opening ${i + 1}`));
    i += 1;
  }
  return chosen.map((c, idx) => ({ ...c, id: `${c.id}-d${idx}` }));
}

/** Three "alchemy-type" free cards (Earth/Water holding moves). Provisional. */
function freeCards(count: number): MoveCard[] {
  const elements: Element[] = ["Water", "Earth", "Water"];
  return Array.from({ length: count }, (_, i) =>
    provisionalMove(elements[i % elements.length], "emotional", "light", `Alchemy Free ${i + 1}`),
  );
}

export function buildStartingDeck(superpower: SuperpowerName): PlayerDeck {
  const def = SUPERPOWERS[superpower];
  const { light, shadow, free } = RULES.startingDeck;

  const lightCards = pickLightCards(def.channels, light);
  const shadowCards = shadowSeedsForSuperpower(superpower).slice(0, shadow);
  // Pad shadows if the archetype has fewer than `shadow` documented names.
  while (shadowCards.length < shadow) {
    const channel = def.channels[shadowCards.length % def.channels.length];
    shadowCards.push(provisionalMove(channel, "emotional", "shadow", `${channel} Shadow ${shadowCards.length + 1}`));
  }
  const freeCardList = freeCards(free);

  return {
    superpower,
    cards: [...lightCards, ...shadowCards, ...freeCardList],
  };
}
