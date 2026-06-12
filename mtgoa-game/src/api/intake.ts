/**
 * AI Integration Point #1 — Applied Mode Intake.
 *
 * Migration Brief: "Conversational — guides player through 6 unpacking questions.
 * Final output: structured JSON game config." Core Architecture § Six Unpacking
 * Questions maps each answer to a game parameter.
 *
 * This module owns the system prompt and the structured output contract. The
 * conversational UI (IntakeConversation) calls `intakeStep` per turn; the final
 * turn returns a `config`. Without an AI backend, intake is unavailable and the
 * UI should route the player to Character Select instead (dual-track).
 */
import { callAi, aiEnabled } from "./client";
import type { Element } from "@/data/channels";

export const INTAKE_SYSTEM = `You are the intake guide for "Mastering the Game of Allyship" (Applied Mode).
Walk the player through the Six Unpacking Questions, one at a time, conversationally:
1. What experience do you want to create?            → milestone
2. What satisfied emotional state will that get you? → target channel
3. Compared to that, what is life like right now?    → stakes / forest pressure
4. How does it feel to live here?                    → stuck channel(s) (surface COMPOUND emotions: betrayal = Water+Fire, shame = Water+Metal)
5. What would have to be true for someone to feel this way? → root epiphany (hidden card)
6. What reservations do you have about your creation?      → forest seeds

Ask warmly, reflect back, and only advance when the answer is real. After question 6,
emit the final structured game config. Channels are the five Wuxing elements:
Wood, Fire, Earth, Metal, Water.`;

export interface IntakeConfig {
  milestoneTitle: string;
  milestoneBody: string;
  targetChannel: Element;
  stuckChannels: Element[];
  epiphany: string;
  forestSeeds: string[];
}

export interface IntakeTurn {
  /** Assistant message to show the player. */
  message: string;
  /** Present only on the final turn. */
  config?: IntakeConfig;
}

export interface IntakeHistoryItem {
  role: "assistant" | "user";
  text: string;
}

export async function intakeStep(history: IntakeHistoryItem[]): Promise<IntakeTurn> {
  if (!aiEnabled()) {
    throw new Error(
      "Applied Mode intake requires an AI backend. Use Character Select mode instead.",
    );
  }
  return callAi<IntakeTurn>({ kind: "intake", system: INTAKE_SYSTEM, input: { history } });
}
