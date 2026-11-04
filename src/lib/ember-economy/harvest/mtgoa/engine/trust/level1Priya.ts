/**
 * Level-1 Priya — the tutorial-difficulty setting of the same machine, tuned so
 * the matched starter deck can provably win it (the L1 principle: match the
 * encounter to the deck). Full boss Priya is the identical loop at harder
 * settings (alternating need, 6 shadows, more her-only components).
 *
 * Narrative source: NPC 008, milestone "Find what's still possible inside the
 * constraint" (the DEI-rollback scenario) — see src/data/npcs.ts.
 */
import type { EncounterConfig } from "./trustTypes";

export const LEVEL1_PRIYA: EncounterConfig = {
  npcId: "npc-008",
  npcName: "Priya",
  level: 1,
  // L1: a single, fixed, hidden need. Attune once to reveal it; it stays put.
  needSequence: ["Water"],
  startingStress: 2,
  shadows: [
    { id: "l1-performed-compliance", name: "Performed Compliance", channel: "Water", text: "Says yes, does nothing." },
    { id: "l1-strategic-withdrawal", name: "Strategic Withdrawal", channel: "Water", text: "Goes quiet." },
    { id: "l1-loyalty-performance", name: "Loyalty Performance", channel: "Water", text: "Performs okayness." },
  ],
  deck: [
    // Inner track — match her Water need to build trust.
    { id: "c-bear-witness", name: "Bear Witness", channel: "Water", kind: "align", text: "Stay present to what's real without fixing it." },
    { id: "c-check-in", name: "Check In", channel: "Water", kind: "align", text: "Reach toward the person who went quiet." },
    { id: "c-name-the-feeling", name: "Name the Feeling", channel: "Water", kind: "align", text: "Put words to what's underneath the performance." },
    // Outer track — engage each domain to solve her problem.
    { id: "d-gather", name: "Reach the People Still Inside", channel: "Water", kind: "domain", domain: "Gather Resources", text: "Find who's still reachable inside the building." },
    { id: "d-aware", name: "See What the Rollback Protects", channel: "Metal", kind: "domain", domain: "Raise Awareness", text: "Understand what's actually at stake." },
    { id: "d-organize", name: "Build the Container", channel: "Earth", kind: "domain", domain: "Skillful Organizing", text: "Make a space to keep doing the real work." },
    // Her-only: the honest communication only lands once she's an ally.
    { id: "d-direct", name: "Communicate It Honestly", channel: "Fire", kind: "domain", domain: "Direct Action", herOnly: true, text: "Say the true thing to the employees — together." },
  ],
  capstone: {
    title: "Find what's still possible inside the constraint",
    body: "With Priya as ally and every domain engaged, you name what integrity looks like from inside this.",
  },
};
