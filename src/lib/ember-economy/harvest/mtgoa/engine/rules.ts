/**
 * Tunable rules / constants.
 *
 * Values marked CANONICAL are stated explicitly in the design docs. Values marked
 * PROVISIONAL are sensible defaults for numbers the docs leave to the designer
 * (e.g. exact metabolize/exile channel costs); they live here so balancing never
 * requires touching engine logic.
 */

export const RULES = {
  // CANONICAL — Stress system (Core Architecture § The Stress System)
  stress: {
    min: 0,
    max: 7,
    contagionThreshold: 3, // player stress ≥ 3 dysregulates the NPC
    sympatheticThreshold: 5, // can spend but cannot receive satisfaction
    dysregulationThreshold: 7, // skip action phase until source resolved
  },

  // CANONICAL — NPC shadow activation by NPC stress (Core Architecture)
  npcShadowActivation: [
    { min: 0, max: 2, active: 0 },
    { min: 3, max: 4, active: 1 },
    { min: 5, max: 6, active: 2 },
    { min: 7, max: 7, active: 3 },
  ],

  // CANONICAL — Conversion threshold (Core Architecture § NPC Conversion)
  conversion: {
    shadowsToMetabolize: 3, // of 6 → NPC crosses threshold → becomes ally
    totalShadows: 6,
  },

  // CANONICAL — Starting deck composition (Core Architecture § Deck Size)
  startingDeck: {
    light: 5,
    shadow: 4,
    free: 3,
    total: 12,
  },

  // CANONICAL — Victory (Core Architecture § Victory Structure)
  victory: {
    defaultShowUpTarget: 10,
  },

  // PROVISIONAL — Alchemy cost ladder. Docs specify "matching channel cost" to
  // metabolize and "higher channel cost" to exile, without exact numbers.
  alchemy: {
    metabolizeCost: 1, // PROVISIONAL: pay 1 matching channel to flip shadow → light
    exileCost: 2, // PROVISIONAL: pay 2 matching channel to remove permanently
    shadowPlayStress: 1, // CANONICAL: playing a shadow as-is adds 1 stress
  },

  // CANONICAL — Stress contagion deltas (Core Architecture § Stress Contagion)
  contagion: {
    playerShadowToNpc: 1, // player shadow played → NPC stress +1
    npcShadowToPlayer: 1, // NPC shadow played → player stress +1
    metabolizeNpcShadow: -1, // player metabolizes NPC shadow → NPC stress -1
    npcLightToPlayer: -1, // NPC light move → player stress -1
  },
} as const;
