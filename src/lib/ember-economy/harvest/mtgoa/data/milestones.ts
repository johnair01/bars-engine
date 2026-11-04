/**
 * Milestone Pool.
 *
 * Canonical source: each NPC's milestone (NPC Test Suite). In Character Select
 * mode a milestone arrives bound to the chosen encounter NPC; in Applied Mode it
 * is produced by the six-question intake (Core Architecture § Two Game Modes).
 *
 * The default victory target is 10 Show Up BARs (Core Architecture § Victory).
 */
import type { Milestone } from "./npcs";
import { NPCS } from "./npcs";

export const DEFAULT_SHOW_UP_TARGET = 10;

/** Every NPC milestone, keyed by NPC id, for the Character Select flow. */
export const MILESTONES_BY_NPC: Record<string, Milestone> = Object.fromEntries(
  NPCS.map((n) => [n.id, n.milestone]),
);

export const MILESTONE_POOL: Milestone[] = NPCS.map((n) => n.milestone);
