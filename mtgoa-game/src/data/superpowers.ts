/**
 * Superpower Archetypes — the player's identity and deck archetype.
 *
 * Canonical source: "MTGOA Game — Core Architecture" § Superpower Archetypes.
 * Each Superpower determines channel affinity, what the player perceives, their
 * shadow patterns, and a synergy bonus triggered by 3 matching cards in one turn.
 */
import type { Element } from "./channels";

export type SuperpowerName =
  | "Strategist"
  | "Connector"
  | "Storyteller"
  | "Alchemist"
  | "Disruptor"
  | "Escape Artist";

export interface SuperpowerDef {
  name: SuperpowerName;
  /** Two-element channel affinity. */
  channels: [Element, Element];
  /** What this archetype perceives most readily. */
  sees: string;
  /** Characteristic shadow patterns (used to weight the starting shadow deck). */
  shadows: string[];
  /** Triggered when 3 matching-channel cards are played in one turn. */
  synergyBonus: string;
}

export const SUPERPOWERS: Record<SuperpowerName, SuperpowerDef> = {
  Strategist: {
    name: "Strategist",
    channels: ["Metal", "Earth"],
    sees: "Leverage and structure",
    shadows: ["Overcautious Analysis", "Detached Competence", "Analysis Paralysis"],
    synergyBonus: "Reveal one face-down NPC shadow card",
  },
  Connector: {
    name: "Connector",
    channels: ["Water", "Wood"],
    sees: "Relationships and belonging",
    shadows: ["Conflict Avoidance", "Performed Warmth", "Loyalty Bind"],
    synergyBonus: "+2 to all relational moves this round",
  },
  Storyteller: {
    name: "Storyteller",
    channels: ["Wood", "Fire"],
    sees: "Narratives and meaning",
    shadows: ["Narrative Takeover", "Performed Emotion", "Story Collapse"],
    synergyBonus: "Next scenario card costs 1 less power to resolve",
  },
  Alchemist: {
    name: "Alchemist",
    channels: ["Water", "Earth"],
    sees: "Transformations",
    shadows: ["Spiritual Bypass", "Premature Resolution", "Holding Too Long"],
    synergyBonus: "Metabolize one NPC shadow card for free",
  },
  Disruptor: {
    name: "Disruptor",
    channels: ["Fire", "Metal"],
    sees: "Contradictions and what needs naming",
    shadows: ["Righteous Detachment", "Bulldozing", "Confrontation for Its Own Sake"],
    synergyBonus: "Counter any NPC shadow card regardless of type",
  },
  "Escape Artist": {
    name: "Escape Artist",
    channels: ["Wood", "Metal"],
    sees: "Alternatives and exits",
    shadows: ["Premature Pivot", "Avoidant Reframe", "Clever Deflection"],
    synergyBonus: "Treat one exhausted domain as having 1 card remaining",
  },
};

export const SUPERPOWER_NAMES: SuperpowerName[] = [
  "Strategist",
  "Connector",
  "Storyteller",
  "Alchemist",
  "Disruptor",
  "Escape Artist",
];
