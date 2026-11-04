/**
 * NPC Roster — the eight pre-generated encounter characters.
 *
 * Canonical source: "MTGOA Game — NPC Test Suite". Each NPC was run through the
 * Six Unpacking Questions and is a node in a network (also an ally to someone).
 *
 * Priya (NPC 008) is the hardest test case and the only NPC whose light/shadow
 * decks are fully specified in the docs; her decks are encoded verbatim. The
 * other seven carry full six-question profiles, milestones, and forest seeds;
 * their decks are generated at encounter time from their channels + face (see
 * engine/combat.ts) until canonical decks are authored.
 */
import type { Element } from "./channels";
import type { SuperpowerName } from "./superpowers";
import type { DomainName } from "./domains";

/** Six Faces — NPC developmental altitudes (Core Architecture § The Six Faces). */
export type Face =
  | "Shaman"
  | "Challenger"
  | "Regent"
  | "Architect"
  | "Diplomat"
  | "Sage";

export const FACES: Record<Face, { coreQuestion: string }> = {
  Shaman: { coreQuestion: "What matters?" },
  Challenger: { coreQuestion: "Can I assert agency?" },
  Regent: { coreQuestion: "Can I create order?" },
  Architect: { coreQuestion: "Can I create effectiveness?" },
  Diplomat: { coreQuestion: "Can we belong together?" },
  Sage: { coreQuestion: "How does everything fit?" },
};

/** The six-question intake profile (Core Architecture § NPC Architecture). */
export interface SixQuestions {
  experience: string; // Q1 → milestone
  satisfiedState: string; // Q2 → target channel
  currentLife: string; // Q3 → stakes / forest pressure
  howItFeels: string; // Q4 → stuck channel(s)
  epiphany: string; // Q5 → root epiphany (hidden card)
  reservations: string[]; // Q6 → forest seeds
}

/** Structured mechanical effect of an NPC shadow card (canonical for Priya). */
export interface NpcShadowEffect {
  /** Blocks the player's relational moves this round. */
  blockRelational?: boolean;
  /** No milestone progress is possible this round. */
  skipProgress?: boolean;
  /** Appears to progress but yields nothing real. */
  falseProgress?: boolean;
  /** Player loses N of the named channel. */
  drainChannel?: { element: Element; amount: number };
  /** Named card-type costs +N of the named channel to play this round. */
  channelTax?: { element: Element; amount: number; affects: "action" };
  /** Player gains N stress immediately. */
  playerStress?: number;
}

export interface NpcShadowCard {
  id: string;
  name: string;
  channel: Element;
  text: string;
  effect: NpcShadowEffect;
  /** Name of the player move that metabolizes this shadow. */
  counter: string;
}

/** Structured mechanical effect of an NPC light card (post-conversion). */
export interface NpcLightEffect {
  /** Player gains N of the named channel. */
  playerChannel?: { element: Element; amount: number };
  /** Player stress delta (negative = relief). */
  playerStress?: number;
  /** Reveals the epiphany card. */
  revealEpiphany?: boolean;
  /** Grants a Show Up BAR (victory point), optionally to both. */
  showUpBar?: { both: boolean };
  /** Advances the milestone by N. */
  milestoneDelta?: number;
}

export interface NpcLightCard {
  id: string;
  name: string;
  text: string;
  effect: NpcLightEffect;
}

export interface Milestone {
  title: string;
  body: string;
}

export interface NpcProfile {
  id: string; // e.g. "npc-008"
  name: string;
  age: string;
  face: Face;
  superpower: SuperpowerName;
  /** One stuck element, or a compound (e.g. Priya = Water + Fire = betrayal). */
  stuckChannels: Element[];
  targetChannel: Element;
  startingStress: number;
  alsoAllyingWith: string;
  note?: string;
  sixQuestions: SixQuestions;
  milestone: Milestone;
  domainRelevance?: Partial<Record<DomainName, string>>;
  forestSeeds: string[];
  /** Fully authored only for Priya; empty arrays = generated at encounter time. */
  shadowDeck: NpcShadowCard[];
  lightDeck: NpcLightCard[];
}

// ---------------------------------------------------------------------------
// NPC 001 — DARA
// ---------------------------------------------------------------------------
const DARA: NpcProfile = {
  id: "npc-001",
  name: "Dara",
  age: "late 30s",
  face: "Diplomat",
  superpower: "Connector",
  stuckChannels: ["Water"],
  targetChannel: "Earth",
  startingStress: 2,
  alsoAllyingWith: "Someone in the coalition who feels unheard",
  sixQuestions: {
    experience:
      "A space where people who disagree can still work together toward something real.",
    satisfiedState: "Relief. Like the ground is solid again. Like I can breathe.",
    currentLife:
      "Every meeting ends in a smaller room than it started. People are choosing sides and I'm watching the thing I built fall apart.",
    howItFeels:
      "Exhausted and invisible. Like I'm holding something together that doesn't want to be held.",
    epiphany: "What if belonging doesn't require agreement — only shared stakes?",
    reservations: [
      "If I name the conflict directly it will make things worse",
      "I'm the wrong person to bridge this — I'm too close to one side",
      "The people who are leaving have already decided",
    ],
  },
  milestone: {
    title: "Hold the coalition together",
    body: "Your community organization is fracturing. People you've worked alongside for years are choosing sides. You're at the center of it — which means you're also the only one positioned to hold it.",
  },
  domainRelevance: {
    "Gather Resources":
      "Find the relational bandwidth to stay present with people who are pulling away",
    "Raise Awareness":
      "Understand what the conflict is actually about beneath the presenting issue",
    "Direct Action": "Name what's happening and create a container for the harder conversation",
    "Skillful Organizing":
      "Build agreements that can hold disagreement without dissolving the coalition",
  },
  forestSeeds: [
    "The conflict names itself before you're ready",
    "A key member announces they're leaving",
    "You lose your own center mid-facilitation",
  ],
  shadowDeck: [],
  lightDeck: [],
};

// ---------------------------------------------------------------------------
// NPC 002 — MARCUS
// ---------------------------------------------------------------------------
const MARCUS: NpcProfile = {
  id: "npc-002",
  name: "Marcus",
  age: "mid 40s",
  face: "Regent",
  superpower: "Strategist",
  stuckChannels: ["Metal"],
  targetChannel: "Fire",
  startingStress: 3,
  alsoAllyingWith: "The person who was harmed in that meeting",
  sixQuestions: {
    experience:
      "To have addressed it in a way that creates safety rather than just covering myself.",
    satisfiedState: "Integrity. Like my inside and outside match.",
    currentLife: "I keep telling myself the moment passed. But it didn't pass — I let it pass.",
    howItFeels: "Shame wearing the costume of pragmatism.",
    epiphany: "The window didn't close — I closed it. And I can open it again.",
    reservations: [
      "Going back to it now will make it about me, not them",
      "I don't know enough about what the affected person actually needs",
      "Naming it publicly will embarrass the person who said it and create more conflict",
    ],
  },
  milestone: {
    title: "Go back to what you didn't address",
    body: "Three weeks ago something harmful was said in a meeting you led. You said nothing. The moment didn't pass — you let it pass. You want to go back to it. You're not sure how.",
  },
  domainRelevance: {
    "Gather Resources": "Build the clarity and courage to re-open something that feels closed",
    "Raise Awareness":
      "Understand what the person most affected actually needs — not what you assume",
    "Direct Action": "Make contact. Name what happened. Create space for what comes next.",
    "Skillful Organizing": "Establish new norms in your team so this has less room to happen again",
  },
  forestSeeds: [
    "The affected person seems to have moved on",
    "Your own guilt makes it about you",
    "A colleague tells you to let it go",
  ],
  shadowDeck: [],
  lightDeck: [],
};

// ---------------------------------------------------------------------------
// NPC 003 — YUKI
// ---------------------------------------------------------------------------
const YUKI: NpcProfile = {
  id: "npc-003",
  name: "Yuki",
  age: "late 20s",
  face: "Challenger",
  superpower: "Disruptor",
  stuckChannels: ["Fire"],
  targetChannel: "Earth",
  startingStress: 3,
  alsoAllyingWith: "A colleague who privately agreed but publicly stayed silent",
  sixQuestions: {
    experience:
      "To stay in this organization and keep telling the truth without it costing me everything.",
    satisfiedState:
      "Grounded. Like I can stand somewhere solid and not have to choose between integrity and survival.",
    currentLife:
      "I said the true thing and the room went cold. Now I'm technically included and functionally invisible.",
    howItFeels: "Like I'm being slowly edited out of my own presence.",
    epiphany:
      "The organization didn't reject my truth — it revealed something about its relationship to truth.",
    reservations: [
      "Speaking up again will confirm I'm a problem",
      "The people with power have already made their assessment",
      "I don't have enough standing yet to push on this",
    ],
  },
  milestone: {
    title: "Stay true without disappearing",
    body: "You spoke up early and paid a social price. Now you're navigating how to remain yourself inside a system that has quietly signaled it prefers a smaller version of you.",
  },
  domainRelevance: {
    "Gather Resources": "Find the allies and inner resources to stay grounded in contested ground",
    "Raise Awareness": "Understand the system you're in clearly enough to move skillfully within it",
    "Direct Action": "Speak again — differently, strategically, without swallowing the truth",
    "Skillful Organizing": "Build relationships that can hold your full presence over time",
  },
  forestSeeds: [
    "A second truth gets dismissed",
    "An ally goes quiet",
    "You start self-censoring without noticing",
  ],
  shadowDeck: [],
  lightDeck: [],
};

// ---------------------------------------------------------------------------
// NPC 004 — BEV
// ---------------------------------------------------------------------------
const BEV: NpcProfile = {
  id: "npc-004",
  name: "Bev",
  age: "early 60s",
  face: "Sage",
  superpower: "Storyteller",
  stuckChannels: ["Water"],
  targetChannel: "Wood",
  startingStress: 1,
  alsoAllyingWith: "A community member who stopped coming to meetings",
  sixQuestions: {
    experience: "I want the organization to find its way back to the people it forgot.",
    satisfiedState:
      "Like the work means what it used to mean. Like I'm not the only one who notices.",
    currentLife:
      "Meetings are full of the right language and empty of the people that language is supposed to be about.",
    howItFeels: "Grief. And a kind of tired loyalty I haven't figured out how to put down.",
    epiphany: "Memory is an act of allyship when everyone else has moved on.",
    reservations: [
      "I've raised this before and nothing changed",
      "The people making decisions now weren't here for what I'm describing",
      "I might be romanticizing the past",
    ],
  },
  milestone: {
    title: "Bring the organization back to itself",
    body: "You remember what this org was built for. The current leadership doesn't — or has forgotten. You want to close the gap between the mission on paper and the community being served.",
  },
  forestSeeds: [
    "Leadership reframes your concern as nostalgia",
    "A key community member stops showing up",
    "Your own grief makes it hard to be strategic",
  ],
  shadowDeck: [],
  lightDeck: [],
};

// ---------------------------------------------------------------------------
// NPC 005 — THEO
// ---------------------------------------------------------------------------
const THEO: NpcProfile = {
  id: "npc-005",
  name: "Theo",
  age: "early 30s",
  face: "Architect",
  superpower: "Escape Artist",
  stuckChannels: ["Metal"],
  targetChannel: "Fire",
  startingStress: 2,
  alsoAllyingWith: "A user who is directly affected by the accessibility gap",
  sixQuestions: {
    experience:
      "One real conversation where this gets treated as a structural issue, not a nice-to-have.",
    satisfiedState: "Like I'm working somewhere that means what it says about inclusion.",
    currentLife:
      "Every workaround I build gets shipped as a feature. The underlying problem stays untouched.",
    howItFeels: "Complicit. Like my competence is being used to paper over something I believe is wrong.",
    epiphany: "The backlog isn't where good ideas go to wait. It's where accountability goes to die.",
    reservations: [
      "I don't have enough organizational capital to push on this",
      "The right people will hear it as criticism rather than problem-solving",
      "If I make it a values issue I'll be seen as difficult",
    ],
  },
  milestone: {
    title: "Make the invisible harm visible",
    body: "You keep fixing symptoms of an accessibility problem that isn't getting fixed. You want one real conversation that treats this as a structural issue — not a feature request, not a backlog item.",
  },
  forestSeeds: [
    "Your fix gets shipped without the conversation",
    "A sympathetic leader gets reassigned",
    "You get labeled as the accessibility person and quietly sidelined",
  ],
  shadowDeck: [],
  lightDeck: [],
};

// ---------------------------------------------------------------------------
// NPC 006 — AMARA
// ---------------------------------------------------------------------------
const AMARA: NpcProfile = {
  id: "npc-006",
  name: "Amara",
  age: "mid 30s",
  face: "Shaman",
  superpower: "Alchemist",
  stuckChannels: ["Earth"],
  targetChannel: "Water",
  startingStress: 2,
  alsoAllyingWith: "Her friend who is grieving",
  sixQuestions: {
    experience: "To be genuinely present for her without my own stuff getting in the way.",
    satisfiedState:
      "Clear. Like I'm actually with her instead of managing the distance between us.",
    currentLife:
      "I catch myself giving her interventions instead of presence. I'm being a therapist when she needs a friend.",
    howItFeels: "Split. Professionally competent and personally unavailable.",
    epiphany:
      "The training that taught me to hold space taught me to hold distance. I need to unlearn enough of it to actually show up.",
    reservations: [
      "If I let myself feel my own grief I won't be able to hold hers",
      "She doesn't know I'm struggling too — telling her would make it about me",
      "I've been performing presence for so long I'm not sure I know what the real thing feels like",
    ],
  },
  milestone: {
    title: "Be a friend, not a therapist",
    body: "Someone you love is grieving. You have every tool for holding pain — and they're getting in the way of actually being with her. You want to show up as yourself, not your training.",
  },
  forestSeeds: [
    "Your friend asks for advice and you default to the clinical frame",
    "Your own grief surfaces at the wrong moment",
    "She notices the distance and names it",
  ],
  shadowDeck: [],
  lightDeck: [],
};

// ---------------------------------------------------------------------------
// NPC 007 — JEROME (compound stuck: Metal + Water)
// ---------------------------------------------------------------------------
const JEROME: NpcProfile = {
  id: "npc-007",
  name: "Jerome",
  age: "late 40s",
  face: "Challenger",
  superpower: "Connector",
  stuckChannels: ["Metal", "Water"],
  targetChannel: "Wood",
  startingStress: 4,
  alsoAllyingWith: "The family facing eviction",
  note: "Jerome's stuck state is compound. The fear (Metal) of failure combines with the sadness (Water) of anticipated loss. His shadow deck draws from both channels.",
  sixQuestions: {
    experience:
      "To get this family housed. And to do it in a way that doesn't burn out the people who keep showing up.",
    satisfiedState: "Like the community I've been building actually works when it matters.",
    currentLife: "I have a network. I have relationships. I keep not making the ask.",
    howItFeels: "Like I'm standing in front of a door I built and can't open.",
    epiphany:
      "The ask feels like a burden because I haven't let myself believe the community wants to give.",
    reservations: [
      "People are tapped out — I've asked too recently",
      "If this doesn't work it will prove something I don't want proved",
      "Asking for someone else feels less legitimate than asking for a cause",
    ],
  },
  milestone: {
    title: "Make the ask before the 72 hours run out",
    body: "A family needs housing in 72 hours. You have a network that could make this happen. The only thing between the resource and the need is you making the ask. You haven't made it yet.",
  },
  forestSeeds: [
    "The first three asks come back as no",
    "You second-guess the framing mid-send",
    "Someone asks why you're doing this and not a formal org",
  ],
  shadowDeck: [],
  lightDeck: [],
};

// ---------------------------------------------------------------------------
// NPC 008 — PRIYA (compound stuck: Water + Fire = betrayal) — FULLY AUTHORED
// ---------------------------------------------------------------------------
const PRIYA: NpcProfile = {
  id: "npc-008",
  name: "Priya",
  age: "early 40s",
  face: "Diplomat",
  superpower: "Storyteller",
  stuckChannels: ["Water", "Fire"],
  targetChannel: "Fire",
  startingStress: 4,
  alsoAllyingWith: "An employee whose advancement depended on the programs being cut",
  note: "Priya is the hardest test case. Compound stuck emotions (betrayal = sadness + anger), high starting stress, Diplomat shadow patterns. If mechanics work for her they work for everyone.",
  sixQuestions: {
    experience:
      "To protect what's actually working and find a way to keep doing the real work inside a hostile container.",
    satisfiedState: "Purposeful. Like I'm still moving something that matters even when the ground shifts.",
    currentLife:
      "The announcement was made without me in the room. I'm being asked to communicate a decision I wasn't part of.",
    howItFeels: "Betrayed. And unsure whether staying is integrity or complicity.",
    epiphany:
      "The institution was never the mission. The people are the mission. The question is whether I can still reach them from here.",
    reservations: [
      "Staying means being the face of something I didn't choose",
      "Leaving means abandoning the people who have no one else",
      "Whatever I say publicly will be used to legitimize the decision",
    ],
  },
  milestone: {
    title: "Find what's still possible inside the constraint",
    body: "Your company rolled back the DEI programs you built. You weren't in the room. Now you're being asked to communicate the decision. You need to figure out what integrity looks like from inside this.",
  },
  forestSeeds: [
    "A colleague you trust announces they're leaving",
    "You're asked to present the rollback positively to employees",
    "Someone you've supported publicly calls you out for staying",
  ],
  // Shadow Deck (Water + Fire compound) — verbatim from NPC Test Suite.
  shadowDeck: [
    {
      id: "priya-s-performed-compliance",
      name: "Performed Compliance",
      channel: "Water",
      text: "Says yes, does nothing. Blocks relational moves.",
      effect: { blockRelational: true },
      counter: "Bear Witness",
    },
    {
      id: "priya-s-strategic-withdrawal",
      name: "Strategic Withdrawal",
      channel: "Water",
      text: "Goes quiet. No progress this round.",
      effect: { skipProgress: true },
      counter: "Check In",
    },
    {
      id: "priya-s-loyalty-performance",
      name: "Loyalty Performance",
      channel: "Water",
      text: "Performs okayness. Looks like progress but isn't.",
      effect: { falseProgress: true },
      counter: "Name the Feeling",
    },
    {
      id: "priya-s-managed-distance",
      name: "Managed Distance",
      channel: "Water",
      text: "Stays but unavailable. Player loses 1 Water channel.",
      effect: { drainChannel: { element: "Water", amount: 1 } },
      counter: "Sit With It",
    },
    {
      id: "priya-s-righteous-detachment",
      name: "Righteous Detachment",
      channel: "Fire",
      text: "Makes it about principle. Action moves cost +1 Fire.",
      effect: { channelTax: { element: "Fire", amount: 1, affects: "action" } },
      counter: "Name the Pattern",
    },
    {
      id: "priya-s-pre-emptive-exit",
      name: "Pre-emptive Exit",
      channel: "Fire",
      text: "Starts looking for the door. Player +2 Stress.",
      effect: { playerStress: 2 },
      counter: "Speak Up",
    },
  ],
  // Light Deck (post-conversion) — verbatim from NPC Test Suite.
  lightDeck: [
    {
      id: "priya-l-names-it-first",
      name: "She Names It First",
      text: "Stops performing, names what happened. +1 Fire for player.",
      effect: { playerChannel: { element: "Fire", amount: 1 } },
    },
    {
      id: "priya-l-stays-in-the-room",
      name: "She Stays in the Room",
      text: "Her presence stabilizes. Player -1 Stress.",
      effect: { playerStress: -1 },
    },
    {
      id: "priya-l-shares-the-real-thing",
      name: "She Shares the Real Thing",
      text: "Says the true thing. Epiphany revealed.",
      effect: { revealEpiphany: true },
    },
    {
      id: "priya-l-makes-the-ask",
      name: "She Makes the Ask",
      text: "Requests what she needs. Show Up BAR for both.",
      effect: { showUpBar: { both: true } },
    },
    {
      id: "priya-l-chooses-to-stay",
      name: "She Chooses to Stay",
      text: "Decides to fight from inside. Milestone +2.",
      effect: { milestoneDelta: 2 },
    },
  ],
};

export const NPCS: NpcProfile[] = [
  DARA,
  MARCUS,
  YUKI,
  BEV,
  THEO,
  AMARA,
  JEROME,
  PRIYA,
];

export const NPCS_BY_ID: Record<string, NpcProfile> = Object.fromEntries(
  NPCS.map((n) => [n.id, n]),
);

export function getNpc(id: string): NpcProfile | undefined {
  return NPCS_BY_ID[id];
}
