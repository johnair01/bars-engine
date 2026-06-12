/**
 * Trust/Attune encounter model — shared types.
 *
 * This is the redesigned encounter substrate (chosen 2026-06-12): instead of
 * channel-metabolize + a 10-Show-Up victory (proven unwinnable — see
 * engine/__tests__/completability.sim.test.ts), the loop runs on TRUST.
 *
 *   Inner track  — read her live need-channel (hidden until you ATTUNE), play a
 *                  matching card to earn TRUST, spend trust to dissolve shadows,
 *                  convert her at a threshold so she plays WITH you.
 *   Outer track  — engage each of the four Domains; Direct Action is "her-only"
 *                  and unlocks only after conversion. Touch all four + capstone.
 *
 * Win = convert + all four domains engaged + capstone. Reachable by construction.
 */
import type { Element } from "@/data/channels";
import type { DomainName } from "@/data/domains";

/** A player move. `align` cards build trust on the inner track; `domain` cards
 *  engage a domain on the outer track (outer work is NOT alignment-judged). */
export interface TrustCard {
  id: string;
  name: string;
  channel: Element;
  kind: "align" | "domain";
  domain?: DomainName;
  /** Domain that only resolves once the NPC is an ally (e.g. Direct Action). */
  herOnly?: boolean;
  /** Hidden from the playable hand until the NPC is converted, then revealed as a
   *  root-realization beat (the intake "epiphany" card). Optional for the win —
   *  it never gates the capstone, so the completability proof is unaffected. */
  hidden?: boolean;
  text: string;
}

export interface TrustShadow {
  id: string;
  name: string;
  channel: Element;
  text: string;
}

export interface EncounterConfig {
  npcId: string;
  npcName: string;
  /** Difficulty rung. L1 = single fixed need; higher levels alternate (rhythm). */
  level: number;
  /** The live need each turn. Length 1 = constant (L1). Longer = alternating. */
  needSequence: Element[];
  startingStress: number;
  shadows: TrustShadow[];
  deck: TrustCard[];
  capstone: { title: string; body: string };
}
