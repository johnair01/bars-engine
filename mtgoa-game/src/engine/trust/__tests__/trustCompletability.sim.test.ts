/**
 * Completability proof for the trust/attune rebuild.
 *
 * The channel-engine sim found 0/6 winnable paths (softlock). This one plays the
 * real trust reducer for Level-1 Priya and proves a reachable win — under a smart
 * policy AND under a safe-floor policy that only ever attunes + shows up honestly
 * (the dead-end guarantee). It also proves the loss exists but is choice-driven.
 *
 * Run: npm test -- trustCompletability
 */
import { describe, expect, it } from "vitest";

import { LEVEL1_PRIYA } from "../level1Priya";
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

const TURN_CAP = 60;

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

/** Convert first (align → dissolve ×2), then engage all four domains, then capstone. */
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
 *  Proves the floor: even a player with no good cards still completes. */
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

describe("trust engine — Level-1 Priya completability", () => {
  it("smart play reaches a win", () => {
    const s = run(LEVEL1_PRIYA, smartPolicy);
    // eslint-disable-next-line no-console
    console.log(`\n[smart]      result:${s.result} turns:${s.turn} converted:${s.converted} domains:${s.domainsTouched.length}/4`);
    expect(s.result).toBe("win");
  });

  it("safe-floor play (attune + show up honestly only) still reaches a win — no dead end", () => {
    const s = run(LEVEL1_PRIYA, safeFloorPolicy);
    // eslint-disable-next-line no-console
    console.log(`[safe-floor] result:${s.result} turns:${s.turn} converted:${s.converted} domains:${s.domainsTouched.length}/4`);
    expect(s.result).toBe("win");
  });

  it("a careful reader never raises her stress (no forced rupture)", () => {
    const s = run(LEVEL1_PRIYA, smartPolicy);
    expect(s.npcStress).toBeLessThanOrEqual(LEVEL1_PRIYA.startingStress);
  });

  it("Direct Action is her-only — it will not engage before conversion", () => {
    let s = initTrustEncounter(LEVEL1_PRIYA);
    s = trustReducer(s, { type: "PLAY", cardId: "d-direct" });
    expect(s.domainsTouched).not.toContain("Direct Action");
    expect(s.converted).toBe(false);
  });

  it("the loss exists but is choice-driven: repeated misreads rupture", () => {
    // A deck whose only card mismatches her Water need — forced misreads.
    const reckless: EncounterConfig = {
      ...LEVEL1_PRIYA,
      deck: [{ id: "wrong", name: "Push the Agenda", channel: "Fire", kind: "align", text: "Wrong register." }],
    };
    let s = initTrustEncounter(reckless);
    s = trustReducer(s, { type: "ATTUNE" });
    let guard = 0;
    while (s.result === null && guard < TURN_CAP) {
      s = trustReducer(s, { type: "PLAY", cardId: "wrong" });
      guard += 1;
    }
    expect(s.result).toBe("loss-rupture");
  });
});
