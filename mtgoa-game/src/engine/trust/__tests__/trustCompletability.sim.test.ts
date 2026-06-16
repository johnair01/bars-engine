/**
 * Completability proof for the trust/attune ladder — Levels 1 and 2.
 *
 * The channel-engine sim found 0/6 winnable paths (softlock). This one plays the
 * real trust reducer and proves reachable wins for both rungs:
 *   - L1 = a single fixed need.
 *   - L2 = a paired Water/Fire rhythm (read-then-respond).
 * A smart policy wins; the safe-floor policy (only ever attune + show up honestly
 * + dissolve) still wins — so neither rung has a dead end. The loss exists but is
 * choice-driven (repeated misreads rupture).
 *
 * Boss Priya has its own proof in bossPriyaCompletability.sim.test.ts.
 *
 * Run: npm test -- trustCompletability
 */
import { describe, expect, it } from "vitest";

import { LEVEL1_PRIYA } from "../level1Priya";
import { LEVEL2_PRIYA } from "../level2Priya";
import type { EncounterConfig } from "../trustTypes";
import { allDomainsTouched, initTrustEncounter, trustReducer } from "../trustEngine";
import { run, smartPolicy, safeFloorPolicy, TURN_CAP } from "../simPolicies";

const RUNGS: { name: string; config: EncounterConfig }[] = [
  { name: "L1 (fixed need)", config: LEVEL1_PRIYA },
  { name: "L2 (paired rhythm)", config: LEVEL2_PRIYA },
];

describe("trust engine — L1/L2 completability", () => {
  for (const { name, config } of RUNGS) {
    it(`${name}: smart play reaches a win`, () => {
      const s = run(config, smartPolicy);
      // eslint-disable-next-line no-console
      console.log(`\n[${name} smart]      result:${s.result} turns:${s.turn} converted:${s.converted} domains:${s.domainsTouched.length}/4`);
      expect(s.result).toBe("win");
      expect(allDomainsTouched(s)).toBe(true);
    });

    it(`${name}: safe-floor play (attune + show up honestly only) still reaches a win — no dead end`, () => {
      const s = run(config, safeFloorPolicy);
      // eslint-disable-next-line no-console
      console.log(`[${name} safe-floor] result:${s.result} turns:${s.turn} converted:${s.converted} domains:${s.domainsTouched.length}/4`);
      expect(s.result).toBe("win");
    });
  }

  it("a careful reader never raises her stress (no forced rupture)", () => {
    for (const { name, config } of RUNGS) {
      const s = run(config, smartPolicy);
      expect(s.npcStress, name).toBeLessThanOrEqual(config.startingStress);
    }
  });

  it("the loss exists but is choice-driven: repeated misreads rupture", () => {
    // A deck whose only card mismatches every need in L2's rhythm — forced misreads.
    const reckless: EncounterConfig = {
      ...LEVEL2_PRIYA,
      deck: [{ id: "wrong", name: "Push the Agenda", channel: "Wood", kind: "align", text: "Wrong register, every beat." }],
    };
    let s = initTrustEncounter(reckless);
    let guard = 0;
    while (s.result === null && guard < TURN_CAP) {
      s = s.needRevealed
        ? trustReducer(s, { type: "PLAY", cardId: "wrong" })
        : trustReducer(s, { type: "ATTUNE" });
      guard += 1;
    }
    expect(s.result).toBe("loss-rupture");
  });
});
