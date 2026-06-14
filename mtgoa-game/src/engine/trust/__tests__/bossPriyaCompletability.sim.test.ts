/**
 * Completability proof for full-difficulty Boss Priya.
 *
 * Same guarantee as Level-1 (trustCompletability.sim.test.ts), held under the
 * harder settings: an alternating live need (read-then-respond rhythm), higher
 * starting stress, six shadows, and two her-only domains. A smart policy wins;
 * the safe-floor policy (only ever attune + show up honestly + dissolve) still
 * wins — so the boss has no dead end. The loss exists but is choice-driven.
 *
 * Run: npm test -- bossPriyaCompletability
 */
import { describe, expect, it } from "vitest";

import { BOSS_PRIYA } from "../bossPriya";
import type { EncounterConfig } from "../trustTypes";
import { allDomainsTouched, initTrustEncounter, trustReducer } from "../trustEngine";
import { run, smartPolicy, safeFloorPolicy, TURN_CAP } from "../simPolicies";

describe("trust engine — Boss Priya completability", () => {
  it("smart play reaches a win", () => {
    const s = run(BOSS_PRIYA, smartPolicy);
    // eslint-disable-next-line no-console
    console.log(`\n[boss smart]      result:${s.result} turns:${s.turn} converted:${s.converted} domains:${s.domainsTouched.length}/4`);
    expect(s.result).toBe("win");
    expect(allDomainsTouched(s)).toBe(true);
  });

  it("safe-floor play (attune + show up honestly only) still reaches a win — no dead end", () => {
    const s = run(BOSS_PRIYA, safeFloorPolicy);
    // eslint-disable-next-line no-console
    console.log(`[boss safe-floor] result:${s.result} turns:${s.turn} converted:${s.converted} domains:${s.domainsTouched.length}/4`);
    expect(s.result).toBe("win");
  });

  it("the need actually moves — a smart reader attunes to more than one channel", () => {
    const s = run(BOSS_PRIYA, smartPolicy);
    const distinctNeeds = new Set(s.needTrail);
    expect(distinctNeeds.size).toBeGreaterThan(1);
  });

  it("a careful reader never raises her stress above the boss's higher start", () => {
    const s = run(BOSS_PRIYA, smartPolicy);
    expect(s.npcStress).toBeLessThanOrEqual(BOSS_PRIYA.startingStress);
  });

  it("both her-only domains stay locked until conversion", () => {
    let s = initTrustEncounter(BOSS_PRIYA);
    s = trustReducer(s, { type: "PLAY", cardId: "bd-aware" });
    s = trustReducer(s, { type: "PLAY", cardId: "bd-direct" });
    expect(s.converted).toBe(false);
    expect(s.domainsTouched).not.toContain("Raise Awareness");
    expect(s.domainsTouched).not.toContain("Direct Action");
  });

  it("the loss exists but is choice-driven: repeated misreads rupture", () => {
    // A deck whose only card mismatches every need in her rhythm — forced misreads.
    const reckless: EncounterConfig = {
      ...BOSS_PRIYA,
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
