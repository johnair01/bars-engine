/**
 * Scripted Applied Mode intake — the Six Unpacking Questions as a deterministic,
 * no-AI state machine. This is the dual-track floor: intake works with zero model
 * access (the LLM enhancer in api/intake.ts is optional polish, not a dependency),
 * which is why Applied Mode can be un-gated in ModeSelect.
 *
 * Each question maps to a field of the existing IntakeConfig contract
 * (api/intake.ts) so the downstream synthesizer (buildEncounterFromIntake) is
 * unchanged whether the answers came from a person clicking or from a model:
 *
 *   Q1 experience        → milestoneTitle / milestoneBody
 *   Q2 satisfied state   → targetChannel        (thematic only)
 *   Q3 life right now    → forest pressure        (a forest seed)
 *   Q4 how it feels      → stuckChannels          (compound emotions expand)
 *   Q5 what'd be true    → epiphany               (the hidden card)
 *   Q6 reservations      → forest seeds
 */
import { COMPOUND_EMOTIONS, type Element } from "@/data/channels";
import type { IntakeConfig } from "@/api/intake";

/** A felt-word the player can pick in Q4. Compound feelings expand to two channels. */
export interface Feeling {
  id: string;
  label: string;
  channels: Element[];
  blurb: string;
}

export const FEELINGS: Feeling[] = [
  { id: "sad", label: "Sad · grieving", channels: ["Water"], blurb: "Loss, longing, the ache of what's gone." },
  { id: "angry", label: "Angry · frustrated", channels: ["Fire"], blurb: "Heat at a line that got crossed." },
  { id: "afraid", label: "Afraid · anxious", channels: ["Metal"], blurb: "The need to stay sharp, to control." },
  { id: "numb", label: "Numb · stuck in the middle", channels: ["Earth"], blurb: "Frozen between sides, unable to move." },
  { id: "restless", label: "Restless · blocked from growing", channels: ["Wood"], blurb: "Wanting to reach but held back." },
  { id: "betrayed", label: "Betrayed", channels: COMPOUND_EMOTIONS.Betrayal, blurb: "Sadness and anger braided together." },
  { id: "ashamed", label: "Ashamed", channels: COMPOUND_EMOTIONS.Shame, blurb: "Sadness and fear braided together." },
];

/** Q2 target-state options — the five Wuxing channels by their emotional register. */
export const TARGET_CHANNELS: { channel: Element; label: string }[] = [
  { channel: "Wood", label: "Joy · growth and possibility" },
  { channel: "Fire", label: "Clear action · a boundary held" },
  { channel: "Earth", label: "Groundedness · steady center" },
  { channel: "Metal", label: "Clarity · precision and perspective" },
  { channel: "Water", label: "Peace · flow and repair" },
];

export interface IntakeAnswers {
  experience: string; // Q1
  targetChannel: Element | null; // Q2
  stakes: string; // Q3
  feelings: string[]; // Q4 — Feeling ids
  epiphany: string; // Q5
  reservations: string; // Q6
}

export function emptyAnswers(): IntakeAnswers {
  return { experience: "", targetChannel: null, stakes: "", feelings: [], epiphany: "", reservations: "" };
}

export type IntakeStepKind = "text" | "channel" | "feelings";

export interface IntakeStep {
  id: number;
  field: keyof IntakeAnswers;
  kind: IntakeStepKind;
  prompt: string;
  helper: string;
  placeholder?: string;
}

/** The six questions, in order. The UI walks this list; the machine is otherwise
 *  stateless (answers live in one object). */
export const INTAKE_STEPS: IntakeStep[] = [
  { id: 1, field: "experience", kind: "text", prompt: "What experience do you want to create?", helper: "The outcome you're reaching for — name it as if it already happened.", placeholder: "I want to…" },
  { id: 2, field: "targetChannel", kind: "channel", prompt: "What satisfied state would that get you?", helper: "Pick the felt-quality you'd be living in once it's real.", },
  { id: 3, field: "stakes", kind: "text", prompt: "Compared to that, what is life like right now?", helper: "The gap is the pressure the encounter runs on. Be concrete.", placeholder: "Right now…" },
  { id: 4, field: "feelings", kind: "feelings", prompt: "How does it feel to live here?", helper: "Pick everything that fits — these become what you'll have to read and meet. (Up to three register.)", },
  { id: 5, field: "epiphany", kind: "text", prompt: "What would have to be true for someone to feel this way?", helper: "The root realization. It stays hidden until you've earned their trust — then it surfaces.", placeholder: "For someone to feel this, it would have to be true that…" },
  { id: 6, field: "reservations", kind: "text", prompt: "What reservations do you have about your creation?", helper: "Doubts and second-guesses. They show up as the defenses you'll dissolve.", placeholder: "I'm not sure that…" },
];

/** Expand selected feelings into stuck channels (compound feelings → two channels). */
export function feelingsToChannels(ids: string[]): Element[] {
  const out: Element[] = [];
  for (const id of ids) {
    const f = FEELINGS.find((x) => x.id === id);
    if (f) out.push(...f.channels);
  }
  return out;
}

/** Has the player answered enough to synthesize an encounter? Q1 and Q4 carry the
 *  load-bearing parameters (milestone + stuck channels); the rest are optional. */
export function canFinalize(a: IntakeAnswers): boolean {
  return a.experience.trim().length > 0 && a.feelings.length > 0;
}

/** Collapse the scripted answers into the IntakeConfig contract. */
export function finalizeIntake(a: IntakeAnswers): IntakeConfig {
  const experience = a.experience.trim();
  const title = experience.length > 64 ? `${experience.slice(0, 61).trimEnd()}…` : experience;
  const forestSeeds = [a.stakes, a.reservations].map((s) => s.trim()).filter((s) => s.length > 0);
  return {
    milestoneTitle: title || "What you set out to create",
    milestoneBody: experience || "What you set out to create.",
    targetChannel: a.targetChannel ?? "Water",
    stuckChannels: feelingsToChannels(a.feelings),
    epiphany: a.epiphany.trim(),
    forestSeeds,
  };
}
