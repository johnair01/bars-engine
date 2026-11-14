/**
 * Shared trust-engine simulation harness — the `run` loop and the two reference
 * policies used by every completability proof (Level-1, Boss, and intake-built
 * encounters). Extracted so the proofs do not each re-declare them, and so any
 * new EncounterConfig can be checked against the exact same definition of
 * "winnable by construction."
 *
 *   smartPolicy     — convert first (align → dissolve ×2), then engage every
 *                     domain, then capstone. Plays the inner track well.
 *   safeFloorPolicy — never plays an align card; only attunes + "shows up
 *                     honestly" to bank trust. Proves the floor: a player with no
 *                     good cards still completes (the dead-end guarantee).
 */
import { TRUST_RULES as R } from "./trustRules";
import type { EncounterConfig } from "./trustTypes";
import {
  allDomainsTouched,
  currentNeed,
  initTrustEncounter,
  trustReducer,
  type TrustAction,
  type TrustState,
} from "./trustEngine";

export const TURN_CAP = 120;

export type Policy = (s: TrustState) => TrustAction | null;

/** Drive a config to a terminal state (or the turn cap) under a policy. */
export function run(config: EncounterConfig, policy: Policy): TrustState {
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
export const smartPolicy: Policy = (s) => {
  if (s.converted && allDomainsTouched(s)) return { type: "CAPSTONE" };
  if (!s.needRevealed) return { type: "ATTUNE" };
  if (!s.converted) {
    if (s.trust >= R.shadow.dissolveCost && s.shadows.length > 0) {
      return { type: "DISSOLVE", shadowId: s.shadows[0].id };
    }
    const need = currentNeed(s);
    const aligner = s.config.deck.find(
      (c) => c.kind === "align" && c.channel === need && (!c.hidden || s.converted),
    );
    return aligner ? { type: "PLAY", cardId: aligner.id } : { type: "BASIC" };
  }
  const domain = s.config.deck.find(
    (c) => c.kind === "domain" && c.domain && !s.domainsTouched.includes(c.domain),
  );
  return domain ? { type: "PLAY", cardId: domain.id } : null;
};

/** Never plays an align card — only attunes and "shows up honestly" to bank trust.
 *  Proves the floor: even a player with no good cards still completes. */
export const safeFloorPolicy: Policy = (s) => {
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
