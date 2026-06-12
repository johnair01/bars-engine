/**
 * AI Integration Point #2 — NPC Generation.
 *
 * Migration Brief: "Single call — generates fully realized NPC from situation
 * seed. Output: JSON with all six-question answers + game parameters. Can be
 * pre-generated and cached (finite combinatorial space)."
 *
 * The eight test NPCs in src/data/npcs.ts are the canonical, pre-generated cache.
 * This module generates a NEW NPC from a free-text situation seed when an AI
 * backend is available; otherwise it returns null and the caller falls back to
 * the canonical roster.
 */
import { callAi, aiEnabled } from "./client";
import type { NpcProfile } from "@/data/npcs";

export const NPC_GENERATOR_SYSTEM = `You generate a fully realized NPC for "Mastering the Game of Allyship"
from a one-line situation seed. Run the seed through the Six Unpacking Questions and
return a complete NPC profile matching the game's schema:
- face: one of Shaman | Challenger | Regent | Architect | Diplomat | Sage
- superpower: one of Strategist | Connector | Storyteller | Alchemist | Disruptor | Escape Artist
- stuckChannels: one or more of Wood | Fire | Earth | Metal | Water (surface COMPOUND emotions)
- targetChannel: one Wuxing element
- startingStress: 0–7, calibrated to complexity
- sixQuestions, milestone {title, body}, forestSeeds[]
- shadowDeck[] (6 cards, weighted across stuck channels, each with a counter move)
- lightDeck[] (post-conversion cooperation moves)
The NPC must be a node in a network — also an ally to someone else.`;

/** Returns a generated NPC, or null to fall back to the canonical roster. */
export async function generateNpc(situationSeed: string): Promise<NpcProfile | null> {
  if (!aiEnabled()) return null;
  try {
    const { npc } = await callAi<{ npc: NpcProfile }>({
      kind: "npc-generator",
      system: NPC_GENERATOR_SYSTEM,
      input: { situationSeed },
    });
    return npc;
  } catch {
    return null;
  }
}
