/**
 * Harvested from mtgoa-game/src/api/intake.ts at the commit named in HARVEST.md.
 * Only the IntakeConfig contract is kept: the engine reads it. The AI client call
 * (`intakeStep`, `INTAKE_SYSTEM`) is not harvested; it retires with the app.
 */
import type { Element } from "../data/channels";

export interface IntakeConfig {
  milestoneTitle: string;
  milestoneBody: string;
  targetChannel: Element;
  stuckChannels: Element[];
  epiphany: string;
  forestSeeds: string[];
}
