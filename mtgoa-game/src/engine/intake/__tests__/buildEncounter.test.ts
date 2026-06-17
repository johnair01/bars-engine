/**
 * Unit checks for buildEncounterFromIntake — the structural guarantees the
 * completability sim relies on (paired needs, ≥2 shadows, hidden epiphany,
 * her-only Direct Action), plus the intakeMachine mapping (compound emotions,
 * finalize).
 */
import { describe, expect, it } from "vitest";

import type { IntakeConfig } from "@/api/intake";
import { TRUST_RULES as R } from "@/engine/trust/trustRules";
import { buildEncounterFromIntake, buildNeedSequence, distinctNeeds } from "../buildEncounter";
import {
  emptyAnswers,
  feelingsToChannels,
  finalizeIntake,
  canFinalize,
} from "../intakeMachine";

const cfg = (stuckChannels: IntakeConfig["stuckChannels"]): IntakeConfig => ({
  milestoneTitle: "Keep the work alive",
  milestoneBody: "We hold the line together.",
  targetChannel: "Wood",
  stuckChannels,
  epiphany: "It was never safe to say it out loud.",
  forestSeeds: ["Already signed.", "Too late?"],
});

describe("buildEncounter — need rhythm", () => {
  it("a single stuck channel is a constant need", () => {
    expect(buildNeedSequence(["Water"])).toEqual(["Water"]);
  });

  it("two or three stuck channels are paired ([a,a,b,b,…])", () => {
    expect(buildNeedSequence(["Water", "Fire"])).toEqual(["Water", "Water", "Fire", "Fire"]);
    expect(buildNeedSequence(["Water", "Fire", "Metal"])).toEqual([
      "Water", "Water", "Fire", "Fire", "Metal", "Metal",
    ]);
  });

  it("distinct needs dedupe and cap at three", () => {
    expect(distinctNeeds(["Water", "Water", "Fire", "Metal", "Earth", "Wood"])).toEqual([
      "Water", "Fire", "Metal",
    ]);
  });

  it("empty stuck channels fall back to a default need", () => {
    expect(distinctNeeds([])).toEqual(["Water"]);
  });
});

describe("buildEncounter — structure", () => {
  it("always emits at least the convert-threshold of shadows", () => {
    const e = buildEncounterFromIntake(cfg(["Water"]));
    expect(e.shadows.length).toBeGreaterThanOrEqual(R.shadow.convertThreshold);
  });

  it("has an align card for every distinct need", () => {
    const e = buildEncounterFromIntake(cfg(["Water", "Fire", "Metal"]));
    for (const ch of ["Water", "Fire", "Metal"] as const) {
      expect(e.deck.some((c) => c.kind === "align" && c.channel === ch && !c.hidden)).toBe(true);
    }
  });

  it("includes all four domains with Direct Action her-only", () => {
    const e = buildEncounterFromIntake(cfg(["Water"]));
    const direct = e.deck.find((c) => c.domain === "Direct Action");
    expect(direct?.herOnly).toBe(true);
    for (const d of ["Gather Resources", "Raise Awareness", "Skillful Organizing", "Direct Action"] as const) {
      expect(e.deck.some((c) => c.kind === "domain" && c.domain === d)).toBe(true);
    }
  });

  it("carries the epiphany as exactly one hidden align card", () => {
    const e = buildEncounterFromIntake(cfg(["Water"]));
    const hidden = e.deck.filter((c) => c.hidden);
    expect(hidden).toHaveLength(1);
    expect(hidden[0].kind).toBe("align");
    expect(hidden[0].text).toContain("never safe");
  });

  it("uses milestone as the capstone and keeps starting stress survivable", () => {
    const e = buildEncounterFromIntake(cfg(["Water"]));
    expect(e.capstone.title).toBe("Keep the work alive");
    expect(e.startingStress).toBeLessThan(R.stress.ruptureAt);
  });

  it("colours shadows with forest seeds when present", () => {
    const e = buildEncounterFromIntake(cfg(["Water"]));
    expect(e.shadows[0].text).toBe("Already signed.");
  });

  it("respects an explicit npcName", () => {
    const e = buildEncounterFromIntake(cfg(["Water"]), { npcName: "Priya" });
    expect(e.npcName).toBe("Priya");
  });
});

describe("intakeMachine — mapping", () => {
  it("expands a compound feeling into two channels", () => {
    expect(feelingsToChannels(["betrayed"])).toEqual(["Water", "Fire"]);
    expect(feelingsToChannels(["ashamed"])).toEqual(["Water", "Metal"]);
  });

  it("needs an experience and at least one feeling to finalize", () => {
    const a = emptyAnswers();
    expect(canFinalize(a)).toBe(false);
    a.experience = "Make it safe to grieve";
    a.feelings = ["sad"];
    expect(canFinalize(a)).toBe(true);
  });

  it("finalizes scripted answers into the IntakeConfig contract", () => {
    const a = emptyAnswers();
    a.experience = "Make it safe to do the real work again";
    a.targetChannel = "Wood";
    a.stakes = "Everyone is performing okayness.";
    a.feelings = ["betrayed"];
    a.epiphany = "They were punished last time they spoke up.";
    a.reservations = "Maybe it's already too late.";
    const out = finalizeIntake(a);
    expect(out.stuckChannels).toEqual(["Water", "Fire"]);
    expect(out.forestSeeds).toEqual(["Everyone is performing okayness.", "Maybe it's already too late."]);
    expect(out.epiphany).toContain("punished");
    expect(out.milestoneTitle.length).toBeGreaterThan(0);
  });
});
