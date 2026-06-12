/**
 * Completability proof for the trust/attune ladder — Levels 1 and 2.
 *
 * The channel-engine sim found 0/6 winnable paths (softlock). This one plays the
 * real trust reducer and proves reachable wins under several play styles:
 *   - novice : attune (spending the beat), then respond on the next beat
 *   - expert : never attune — respond straight from the learned rhythm
 *   - floor  : only attune + "show up honestly" (the dead-end guarantee)
 * It also proves the loss exists but is choice-driven (repeated misreads rupture).
 *
 * Boss Priya has its own proof in bossPriyaCompletability.sim.test.ts.
 *
 * Run: npm test -- trustCompletability
 */
import { describe, expect, it } from "vitest";

import { LEVEL1_PRIYA } from "../level1Priya";
import { LEVEL2_PRIYA } from "../level2Priya";
import { TRUST_RULES as R } from "../trustRules";
import type { EncounterConfig } from "../trustTypes";
import {
  allDomainsTouched,
  convertThreshold,
  currentNeed,
  initTrustEncounter,
  trustReducer,
  type TrustAction,
  type TrustState,
} from "../trustEngine";

const TURN_CAP = 160;

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

const matchingAligner = (s: TrustState) => {
  const need = currentNeed(s);
  return s.config.deck.find((c) => c.kind === "align" && c.channel === need);
};
const untouchedDomain = (s: TrustState) =>
  s.config.deck.find((c) => c.kind === "domain" && c.domain && !s.domainsTouched.includes(c.domain));
const canConvert = (s: TrustState) => s.dissolvedShadowIds.length < convertThreshold(s.config);

/** Novice: read the beat (attune), then meet it; dissolve when affordable. */
const novice: Policy = (s) => {
  if (s.converted && allDomainsTouched(s)) return { type: "CAPSTONE" };
  if (s.converted) return untouchedDomain(s) ? { type: "PLAY", cardId: untouchedDomain(s)!.id } : null;
  if (s.trust >= R.shadow.dissolveCost && s.shadows.length > 0 && canConvert(s)) {
    return { type: "DISSOLVE", shadowId: s.shadows[0].id };
  }
  if (!s.needRevealed) return { type: "ATTUNE" };
  const aligner = matchingAligner(s);
  return aligner ? { type: "PLAY", cardId: aligner.id } : { type: "BASIC" };
};

/** Expert: never attunes — meets each beat's need straight from the rhythm. */
const expert: Policy = (s) => {
  if (s.converted && allDomainsTouched(s)) return { type: "CAPSTONE" };
  if (s.converted) return untouchedDomain(s) ? { type: "PLAY", cardId: untouchedDomain(s)!.id } : null;
  if (s.trust >= R.shadow.dissolveCost && s.shadows.length > 0 && canConvert(s)) {
    return { type: "DISSOLVE", shadowId: s.shadows[0].id };
  }
  const aligner = matchingAligner(s);
  return aligner ? { type: "PLAY", cardId: aligner.id } : null;
};

/** Floor: no align cards — only attune + "show up honestly" to bank trust. */
const floor: Policy = (s) => {
  if (s.converted && allDomainsTouched(s)) return { type: "CAPSTONE" };
  if (s.converted) return untouchedDomain(s) ? { type: "PLAY", cardId: untouchedDomain(s)!.id } : null;
  if (s.trust >= R.shadow.dissolveCost && s.shadows.length > 0 && canConvert(s)) {
    return { type: "DISSOLVE", shadowId: s.shadows[0].id };
  }
  if (!s.needRevealed) return { type: "ATTUNE" };
  return { type: "BASIC" };
};

const LEVELS = [
  { name: "L1 (fixed need)", config: LEVEL1_PRIYA },
  { name: "L2 (paired rhythm)", config: LEVEL2_PRIYA },
];
const STYLES: { label: string; policy: Policy }[] = [
  { label: "novice", policy: novice },
  { label: "expert", policy: expert },
  { label: "floor", policy: floor },
];

describe("trust engine — completability across L1 & L2", () => {
  it("every level is winnable under every play style", () => {
    // eslint-disable-next-line no-console
    console.log("\n=== Trust ladder completability (L1 & L2) ===");
    let winnable = 0;
    let total = 0;
    for (const lvl of LEVELS) {
      for (const style of STYLES) {
        const s = run(lvl.config, style.policy);
        total += 1;
        if (s.result === "win") winnable += 1;
        // eslint-disable-next-line no-console
        console.log(
          `${lvl.name.padEnd(20)} ${style.label.padEnd(7)} | ${String(s.result).padEnd(5)} ` +
            `| turns:${String(s.turn - 1).padStart(3)} | attunes:${s.needTrail.length} ` +
            `| converted:${s.converted ? "Y" : "n"} domains:${s.domainsTouched.length}/4`,
        );
        expect(s.result, `${lvl.name} / ${style.label}`).toBe("win");
      }
    }
    // eslint-disable-next-line no-console
    console.log(`\nWINNABLE PATHS FOUND: ${winnable} / ${total}\n`);
    expect(winnable).toBe(total);
  });

  it("L2 is learnable: an expert wins without ever attuning (reads the rhythm)", () => {
    const s = run(LEVEL2_PRIYA, expert);
    expect(s.result).toBe("win");
    expect(s.needTrail.length).toBe(0); // never attuned
  });

  it("the L2 need actually moves — a novice reads more than one channel", () => {
    const s = run(LEVEL2_PRIYA, novice);
    expect(new Set(s.needTrail).size).toBeGreaterThan(1);
  });

  it("a careful reader never raises her stress (no forced rupture)", () => {
    for (const lvl of LEVELS) {
      const s = run(lvl.config, expert);
      expect(s.npcStress, lvl.name).toBeLessThanOrEqual(lvl.config.startingStress);
    }
  });

  it("her-only domains will not engage before conversion", () => {
    let s = initTrustEncounter(LEVEL2_PRIYA);
    s = trustReducer(s, { type: "PLAY", cardId: "d-organize" });
    s = trustReducer(s, { type: "PLAY", cardId: "d-direct" });
    expect(s.domainsTouched).not.toContain("Skillful Organizing");
    expect(s.domainsTouched).not.toContain("Direct Action");
  });

  it("the loss exists but is choice-driven: repeated misreads rupture", () => {
    const reckless: EncounterConfig = {
      ...LEVEL1_PRIYA,
      deck: [{ id: "wrong", name: "Push the Agenda", channel: "Fire", kind: "align", text: "Wrong register." }],
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
