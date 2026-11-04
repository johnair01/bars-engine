/**
 * Boss Priya — the full-difficulty setting of the same trust/attune machine that
 * Level-1 Priya tutorialises. Same loop, harder settings (the L-up principle:
 * the boss is the basic loop turned up, not a new system):
 *
 *   - Alternating live need (a rhythm, not a fixed channel). Her defendedness
 *     moves Water → Fire → Metal, so you must RE-READ before each response.
 *   - Higher starting stress (4 vs 2): less margin before a misread ruptures.
 *   - Six shadows instead of three: more defense to read, though conversion is
 *     still the same threshold — the extra shadows are weight, not a wall.
 *   - More her-only domain work: both Direct Action AND the honest
 *     awareness-raising only land once she is an ally.
 *
 * Rhythm note: the need is authored in *pairs* (Water, Water, Fire, Fire, …).
 * ATTUNE reveals the live need and spends the turn; the matching response lands
 * on the second beat of the pair while that need is still live. This is the
 * read-then-respond cadence — and it keeps the boss winnable by construction
 * (proven in __tests__/bossPriyaCompletability.sim.test.ts).
 *
 * Narrative source: NPC 008, milestone "Find what's still possible inside the
 * constraint" (the DEI-rollback scenario) — see src/data/npcs.ts. This is the
 * climactic version of that encounter; Level-1 is the tuned-down rehearsal.
 */
import type { EncounterConfig } from "./trustTypes";

export const BOSS_PRIYA: EncounterConfig = {
  npcId: "npc-008",
  npcName: "Priya",
  level: 2,
  // Full boss: a moving need. Paired so each channel gets a read-beat and a
  // respond-beat. Cycles Water → Fire → Metal — grief, suppressed anger, the
  // need to keep control — and repeats.
  needSequence: ["Water", "Water", "Fire", "Fire", "Metal", "Metal"],
  startingStress: 4,
  shadows: [
    { id: "boss-performed-compliance", name: "Performed Compliance", channel: "Water", text: "Says yes in the meeting, does nothing after." },
    { id: "boss-strategic-withdrawal", name: "Strategic Withdrawal", channel: "Water", text: "Goes quiet to stay safe." },
    { id: "boss-managed-anger", name: "Managed Anger", channel: "Fire", text: "Smiles through it so no one calls her difficult." },
    { id: "boss-scorched-cynicism", name: "Scorched Cynicism", channel: "Fire", text: "Why try — it always rolls back." },
    { id: "boss-loyalty-performance", name: "Loyalty Performance", channel: "Metal", text: "Performs okayness to keep her standing." },
    { id: "boss-iron-control", name: "Iron Control", channel: "Metal", text: "Holds the line so tightly nothing real gets through." },
  ],
  deck: [
    // Inner track — align cards for each channel in her rhythm.
    { id: "bc-bear-witness", name: "Bear Witness", channel: "Water", kind: "align", text: "Stay present to the grief without fixing it." },
    { id: "bc-check-in", name: "Check In", channel: "Water", kind: "align", text: "Reach toward the person who went quiet." },
    { id: "bc-name-the-anger", name: "Name the Anger", channel: "Fire", kind: "align", text: "Say the rage is legitimate — out loud, with her." },
    { id: "bc-honor-control", name: "Honor the Control", channel: "Metal", kind: "align", text: "Respect what the grip is protecting before you ask her to loosen it." },
    // Outer track — engage each domain to solve her problem.
    { id: "bd-gather", name: "Reach the People Still Inside", channel: "Water", kind: "domain", domain: "Gather Resources", text: "Find who's still reachable inside the building." },
    { id: "bd-organize", name: "Build the Container", channel: "Earth", kind: "domain", domain: "Skillful Organizing", text: "Make a space to keep doing the real work." },
    // Her-only: the truth-telling only lands once she trusts you.
    { id: "bd-aware", name: "See What the Rollback Protects", channel: "Metal", kind: "domain", domain: "Raise Awareness", herOnly: true, text: "Name what's actually at stake — credibly, because she's beside you." },
    { id: "bd-direct", name: "Communicate It Honestly", channel: "Fire", kind: "domain", domain: "Direct Action", herOnly: true, text: "Say the true thing to the employees — together." },
  ],
  capstone: {
    title: "Find what's still possible inside the constraint",
    body: "With Priya as ally and every domain engaged — even the ones only she could unlock — you name what integrity looks like from inside this.",
  },
};
