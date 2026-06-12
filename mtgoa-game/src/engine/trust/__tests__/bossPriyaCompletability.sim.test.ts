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
import { TRUST_RULES as R } from "../trustRules";
import type { EncounterConfig } from "../trustTypes";
import {
  allDomainsTouched,
  currentNeed,
  initTrustEncounter,
  trustReducer,
  type TrustAction,
  type TrustState,
} from "../trustEngine";

const TURN_CAP = 120;

type Policy = (s: TrustState) => TrustAction | null;

function run(config: EncounterConfig, policy: Policy) {
  let s = initTrustEncounter(config);
  let guard = 0;
  while (s.result === null && guard < TURN_CAP) {
    const action = policy(s);
    if (!action) break;
    s = trustReducer(s, action);
    guard += 1;
  }
  return s;
}

/** Read the moving need, respond in-channel to bank trust, dissolve to convert,
 *  then engage all four domains (including the two her-only ones), then capstone. */
const smartPolicy: Policy = (s) => {
  if (s.converted && allDomainsTouched(s)) return { type: "CAPSTONE" };
  if (!s.needRevealed) return { type: "ATTUNE" };
  if (!s.converted) {
    if (s.trust >= R.shadow.dissolveCost && s.shadows.length > 0) {
      return { type: "DISSOLVE", shadowId: s.shadows[0].id };
    }
    const need = currentNeed(s);
    const aligner = s.config.deck.find((c) => c.kind === "align" && c.channel === need);
    return aligner ? { type: "PLAY", cardId: aligner.id } : { type: "BASIC" };
  }
  const domain = s.config.deck.find(
    (c) => c.kind === "domain" && c.domain && !s.domainsTouched.includes(c.domain),
  );
  return domain ? { type: "PLAY", cardId: domain.id } : null;
};

/** Never plays an align card — only attunes and "shows up honestly" to bank trust.
 *  Proves the floor: even a player who never risks a read-response still completes. */
const safeFloorPolicy: Policy = (s) => {
  if (s.converted && allDomainsTouched(s)) return { type: "CAPSTONE" };
  if (!s.needRevealed) return { type: "ATTUNE" };
  if (!s.converted) {
    if (s.trust >= R.shadow.dissolveCost && s.shadows.length > 0) {
      return { type: "DISSOLVE", shadowId: s.shadows[0].id };
    }
    return { type: "BASIC" };
  }
  const domain = s.config.deck.find(
    (c) => c.kind === "domain" && c.domain && !s.domainsTouched.includes(c.domain),
  );
  return domain ? { type: "PLAY", cardId: domain.id } : null;
};

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
