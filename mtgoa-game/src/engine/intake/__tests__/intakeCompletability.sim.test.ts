/**
 * Completability proof for intake-synthesized encounters.
 *
 * The whole point of building intake on the trust engine is that *any* set of
 * intake answers must yield a winnable encounter — no player can author a
 * softlock. This plays the real trust reducer over encounters built from a
 * representative spread of intake outputs (one stuck channel; two via a compound
 * emotion; three distinct) under the same shared policies that prove Level-1 and
 * Boss Priya, and checks the hidden epiphany card behaves: out of hand until
 * conversion, in hand after, and never required to win.
 *
 * Run: npm test -- intakeCompletability
 */
import { describe, expect, it } from "vitest";

import type { IntakeConfig } from "@/api/intake";
import { buildEncounterFromIntake } from "../buildEncounter";
import {
  initTrustEncounter,
  trustReducer,
  visibleHand,
} from "@/engine/trust/trustEngine";
import { run, smartPolicy, safeFloorPolicy } from "@/engine/trust/simPolicies";

const base: Omit<IntakeConfig, "stuckChannels"> = {
  milestoneTitle: "Find what's still possible",
  milestoneBody: "We keep doing the real work inside the constraint.",
  targetChannel: "Wood",
  epiphany: "They were never safe to grieve out loud.",
  forestSeeds: ["The rollback is already signed.", "Maybe it's too late to matter."],
};

const FIXTURES: { name: string; config: IntakeConfig }[] = [
  { name: "one stuck channel (constant need)", config: { ...base, stuckChannels: ["Water"] } },
  { name: "two via a compound emotion (betrayal)", config: { ...base, stuckChannels: ["Water", "Fire"] } },
  { name: "three distinct stuck channels", config: { ...base, stuckChannels: ["Water", "Fire", "Metal"] } },
];

describe("intake → encounter completability", () => {
  for (const { name, config } of FIXTURES) {
    const encounter = buildEncounterFromIntake(config);

    it(`${name}: smart play reaches a win`, () => {
      const s = run(encounter, smartPolicy);
      console.log(`\n[intake smart · ${name}] result:${s.result} turns:${s.turn} converted:${s.converted} domains:${s.domainsTouched.length}/4`);
      expect(s.result).toBe("win");
    });

    it(`${name}: safe-floor play (attune + show up only) still wins — no dead end`, () => {
      const s = run(encounter, safeFloorPolicy);
      expect(s.result).toBe("win");
    });

    it(`${name}: a careful reader never raises their stress (no forced rupture)`, () => {
      const s = run(encounter, smartPolicy);
      expect(s.npcStress).toBeLessThanOrEqual(encounter.startingStress);
    });

    it(`${name}: Direct Action stays her-only until conversion`, () => {
      let s = initTrustEncounter(encounter);
      s = trustReducer(s, { type: "PLAY", cardId: "ad-direct" });
      expect(s.converted).toBe(false);
      expect(s.domainsTouched).not.toContain("Direct Action");
    });

    it(`${name}: the epiphany is hidden until conversion, then revealed`, () => {
      const before = initTrustEncounter(encounter);
      expect(visibleHand(before).some((c) => c.id === "ac-epiphany")).toBe(false);
      // It also cannot be played early.
      const blocked = trustReducer(before, { type: "PLAY", cardId: "ac-epiphany" });
      expect(blocked.trust).toBe(before.trust);

      // Drive to a win, then confirm it surfaced (smart play converts en route).
      const won = run(encounter, smartPolicy);
      expect(won.converted).toBe(true);
      expect(visibleHand(won).some((c) => c.id === "ac-epiphany")).toBe(true);
    });

    it(`${name}: the win does not require playing the epiphany card`, () => {
      const s = run(encounter, smartPolicy);
      expect(s.result).toBe("win");
      // smartPolicy never plays a hidden align card — the win stands without it.
      expect(s.log.some((l) => l.includes("The Root Realization"))).toBe(false);
    });
  }
});
