/**
 * Combat — NPC turn logic: shadow activation, conversion, card selection.
 *
 * Canonical source: "MTGOA Game — Core Architecture" (§ Stress System, § NPC
 * Architecture, § NPC Conversion Threshold) and the Migration Brief (§ NPC
 * Architecture). Priya ships with fully authored decks; the other seven NPCs get
 * decks generated from their channels + face here (flagged provisional) until
 * canonical decks are authored.
 */
import type { Element } from "@/data/channels";
import type {
  NpcLightCard,
  NpcProfile,
  NpcShadowCard,
} from "@/data/npcs";
import { RULES } from "./rules";

/** How many of the NPC's shadow cards are active, by NPC stress. */
export function activeShadowCount(npcStress: number): number {
  const band = RULES.npcShadowActivation.find(
    (b) => npcStress >= b.min && npcStress <= b.max,
  );
  return band?.active ?? 0;
}

/** Shadows reveal once NPC stress ≥ contagion threshold (Migration Brief). */
export function shadowsRevealed(npcStress: number): boolean {
  return npcStress >= RULES.stress.contagionThreshold;
}

/** NPC crosses to ally once enough shadows are metabolized (3 of 6). */
export function isConverted(metabolizedShadowIds: string[]): boolean {
  return metabolizedShadowIds.length >= RULES.conversion.shadowsToMetabolize;
}

// --- Deck generation for NPCs without authored decks (all but Priya) ---------

function genShadowDeck(npc: NpcProfile): NpcShadowCard[] {
  const channels = npc.stuckChannels;
  // Spread six provisional shadows across the NPC's stuck channel(s).
  return Array.from({ length: RULES.conversion.totalShadows }, (_, i) => {
    const channel: Element = channels[i % channels.length];
    return {
      id: `${npc.id}-s-${i}`,
      name: `${channel} Resistance ${i + 1}`,
      channel,
      text: `Provisional ${channel} shadow for ${npc.name}. Generate ${channel}; player +1 Stress.`,
      effect: { playerStress: 1 },
      counter: "—",
    };
  });
}

function genLightDeck(npc: NpcProfile): NpcLightCard[] {
  const target = npc.targetChannel;
  const cards: NpcLightCard[] = [
    {
      id: `${npc.id}-l-0`,
      name: `${npc.name} Names It`,
      text: `Provisional light move. +1 ${target} for player.`,
      effect: { playerChannel: { element: target, amount: 1 } },
    },
    {
      id: `${npc.id}-l-1`,
      name: `${npc.name} Stays Present`,
      text: "Provisional light move. Player -1 Stress.",
      effect: { playerStress: -1 },
    },
    {
      id: `${npc.id}-l-2`,
      name: `${npc.name} Shares the Real Thing`,
      text: "Provisional light move. Epiphany revealed.",
      effect: { revealEpiphany: true },
    },
    {
      id: `${npc.id}-l-3`,
      name: `${npc.name} Makes the Ask`,
      text: "Provisional light move. Show Up BAR for both.",
      effect: { showUpBar: { both: true } },
    },
    {
      id: `${npc.id}-l-4`,
      name: `${npc.name} Commits`,
      text: "Provisional light move. Milestone +2.",
      effect: { milestoneDelta: 2 },
    },
  ];
  return cards;
}

export interface NpcDecks {
  shadow: NpcShadowCard[];
  light: NpcLightCard[];
  /** True when decks were generated (provisional), false for authored (Priya). */
  generated: boolean;
}

/** Returns the NPC's decks, generating provisional ones when none are authored. */
export function resolveNpcDecks(npc: NpcProfile): NpcDecks {
  if (npc.shadowDeck.length > 0 && npc.lightDeck.length > 0) {
    return { shadow: npc.shadowDeck, light: npc.lightDeck, generated: false };
  }
  return { shadow: genShadowDeck(npc), light: genLightDeck(npc), generated: true };
}

// --- NPC card selection ------------------------------------------------------

export interface NpcTurnContext {
  npc: NpcProfile;
  decks: NpcDecks;
  npcStress: number;
  converted: boolean;
  /** Shadow ids already metabolized (excluded from shadow selection). */
  metabolizedShadowIds: string[];
  /** Light card ids already played (so light moves don't repeat). */
  playedLightIds: string[];
}

export type NpcPlay =
  | { kind: "shadow"; card: NpcShadowCard }
  | { kind: "light"; card: NpcLightCard }
  | { kind: "none" };

/**
 * Decide the NPC's play for the turn.
 *  - Post-conversion: play a light move if one remains, else a shadow.
 *  - Pre-conversion: play the next active, un-metabolized shadow (if any active).
 */
export function npcChooseCard(ctx: NpcTurnContext): NpcPlay {
  if (ctx.converted) {
    const nextLight = ctx.decks.light.find((c) => !ctx.playedLightIds.includes(c.id));
    if (nextLight) return { kind: "light", card: nextLight };
  }

  const activeCount = activeShadowCount(ctx.npcStress);
  if (activeCount === 0) return { kind: "none" };

  const available = ctx.decks.shadow.filter(
    (c) => !ctx.metabolizedShadowIds.includes(c.id),
  );
  const active = available.slice(0, activeCount);
  if (active.length === 0) return { kind: "none" };

  return { kind: "shadow", card: active[active.length - 1] };
}
