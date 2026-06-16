/**
 * AI Integration Point #3 — Resolution Narrative.
 *
 * Migration Brief: "Called after each successful situation resolution. Context:
 * milestone + domain + moves played + NPC state. Output: 2–3 sentence narrative
 * confirmation. This is the emotional payoff moment — needs to feel personal."
 *
 * Degrades gracefully to a deterministic, template-built narrative when no AI
 * backend is configured.
 */
import { callAi, aiEnabled } from "./client";
import type { NpcProfile } from "@/data/npcs";

export const RESOLUTION_SYSTEM = `You write the emotional payoff narration for "Mastering the Game of Allyship".
Given a milestone, the move just played, and the NPC's state, write 2–3 sentences
confirming what just happened between the player and the NPC. Second person, present
tense, grounded and specific — never generic. Honor the NPC's developmental Face and
their compound emotional state. Do not summarize game mechanics; describe the human moment.`;

export interface ResolutionContext {
  npc: Pick<NpcProfile, "name" | "face" | "milestone">;
  moveName: string;
  converted: boolean;
  npcStress: number;
}

export async function resolutionNarrative(ctx: ResolutionContext): Promise<string> {
  if (aiEnabled()) {
    try {
      const { text } = await callAi<{ text: string }>({
        kind: "resolution",
        system: RESOLUTION_SYSTEM,
        input: ctx,
      });
      return text;
    } catch {
      // fall through to deterministic narration
    }
  }
  return fallbackResolution(ctx);
}

function fallbackResolution(ctx: ResolutionContext): string {
  const { npc, moveName, converted } = ctx;
  if (converted) {
    return `${npc.name} stops performing and meets your eyes. Something shifts — the wall they built isn't gone, but for the first time you're on the same side of it. "${npc.milestone.title}" suddenly feels possible.`;
  }
  return `You play ${moveName}. ${npc.name} doesn't soften all at once, but the room loosens by a degree. You're still in it together, and that's the point.`;
}
