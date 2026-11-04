/**
 * Trust/Attune tunables. All numbers live here so balancing never touches engine
 * logic. Level-1 starting balance (strawman from the design interview, 2026-06-12).
 */
export const TRUST_RULES = {
  trust: {
    floor: 0,
    alignedGain: 3, // play a card matching her live need
    misreadLoss: 1, // channel mismatch
    basicGain: 1, // "Show Up Honestly" after attuning — always safe, never negative
  },
  stress: {
    min: 0,
    start: 2, // L1 starting defendedness (full Priya boss is higher)
    misreadGain: 1, // a misread raises her walls
    dissolveRelief: 1, // dissolving a shadow releases a defense
    ruptureAt: 8, // she walls off and leaves (only reachable via repeated misreads)
  },
  shadow: {
    dissolveCost: 2, // trust to dissolve one shadow
    convertThreshold: 2, // shadows dissolved → she crosses to ally (L1: 2 of 3)
  },
} as const;
