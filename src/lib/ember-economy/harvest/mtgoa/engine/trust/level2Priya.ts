/**
 * Level-2 Priya — the rhythm rung, between the L1 tutorial (a single fixed need)
 * and full Boss Priya (a three-channel moving need). Her live need now ALTERNATES
 * Water (the grief under the betrayal) and Fire (the anger).
 *
 * The need is authored in PAIRS (Water, Water, Fire, Fire). Because attuning
 * spends the turn, you read on the first beat of a pair and respond on the second
 * while that need is still live — the read-then-respond cadence. An expert who has
 * learned the oscillation responds on both beats without pausing to read; that
 * tempo edge is the skill L2 introduces, and Boss Priya turns up.
 *
 * Harder than L1: 4 shadows across both channels, convert at 3, higher starting
 * defendedness, and two her-only domains (Skillful Organizing + Direct Action).
 */
import type { EncounterConfig } from "./trustTypes";

export const LEVEL2_PRIYA: EncounterConfig = {
  npcId: "npc-008",
  npcName: "Priya",
  level: 2,
  // Alternating, paired so each channel gets a read-beat and a respond-beat.
  needSequence: ["Water", "Water", "Fire", "Fire"],
  startingStress: 3,
  convertThreshold: 3,
  shadows: [
    { id: "l2-performed-compliance", name: "Performed Compliance", channel: "Water", text: "Says yes, does nothing." },
    { id: "l2-strategic-withdrawal", name: "Strategic Withdrawal", channel: "Water", text: "Goes quiet." },
    { id: "l2-righteous-detachment", name: "Righteous Detachment", channel: "Fire", text: "Makes it about principle." },
    { id: "l2-pre-emptive-exit", name: "Pre-emptive Exit", channel: "Fire", text: "Starts looking for the door." },
  ],
  deck: [
    // Inner — meet whichever channel is live this beat.
    { id: "c-bear-witness", name: "Bear Witness", channel: "Water", kind: "align", text: "Stay present to the grief under the performance." },
    { id: "c-check-in", name: "Check In", channel: "Water", kind: "align", text: "Reach toward her when she goes quiet." },
    { id: "c-name-the-pattern", name: "Name the Pattern", channel: "Fire", kind: "align", text: "Name the principle-as-armor without attacking her." },
    { id: "c-speak-up", name: "Speak Up", channel: "Fire", kind: "align", text: "Say the true thing before the door closes." },
    // Outer — two domains are her-only now (she has to be an ally first).
    { id: "d-gather", name: "Reach the People Still Inside", channel: "Water", kind: "domain", domain: "Gather Resources", text: "Find who's still reachable inside the building." },
    { id: "d-aware", name: "See What the Rollback Protects", channel: "Metal", kind: "domain", domain: "Raise Awareness", text: "Understand what's actually at stake." },
    { id: "d-organize", name: "Build the Container", channel: "Earth", kind: "domain", domain: "Skillful Organizing", herOnly: true, text: "Build the space to keep the real work alive — with her." },
    { id: "d-direct", name: "Communicate It Honestly", channel: "Fire", kind: "domain", domain: "Direct Action", herOnly: true, text: "Say the true thing to the employees — together." },
  ],
  capstone: {
    title: "Find what's still possible inside the constraint",
    body: "Having met both her grief and her anger, with Priya as ally and every domain engaged, you name what integrity looks like from inside this.",
  },
};
