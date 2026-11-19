// elder regalia round 3 (his notes on er-regalia-look-2: the beard "needs to be on bones so that it flows"; hanging cloth is
// bone-driven and uses held tools). The held tool is the bone chain of heaven's motion.js (bars #868, public/sect/cult): N
// nodes down a part, node 0 held, each other node a damped spring toward the skinned place, kept at its rest length from the
// node above, and every point of the part follows its two nearest nodes like a bone. `chainOf` picks a part's chain by its
// NAME, so the regalia's hanging pieces are named here and nothing in the shell code is a solver of its own:
//   beard                 four nodes from the jaw to the tip: it swings from the chin and lags the head (3 cm at most)
//   outer-bellL / R       the Elder over-robe's sleeve bells below the elbow: four nodes from the elbow out to the mouth
//   robe-bellL / R        the same for a robe with a bell
//   stole                 the woman's stole: shoulders and chest stay skinned, the tails below the sash swing
// motion.js changes by one line to take a bell along the forearm like a sleeve: its sleeve test
// `/^(robe|outer)-sleeve([LR])$/` becomes `/^(robe|outer)-(sleeve|bell)([LR])$/` (the side is then match 3). Until #868 merges,
// registerRegaliaChains(MO) adds these entries to its CHAINS table from outside.
export const REGALIA_CHAINS = {
  beard: { n: 4, hz: 1.6, zeta: 0.32, max: 0.03 },
  'outer-bellL': { n: 4, hz: 1.4, zeta: 0.3, max: 0.06, from: 0.0, soft: [0.1, 0.5] }, 'outer-bellR': { n: 4, hz: 1.4, zeta: 0.3, max: 0.06, from: 0.0, soft: [0.1, 0.5] },
  'robe-bellL': { n: 4, hz: 1.4, zeta: 0.3, max: 0.06, from: 0.0, soft: [0.1, 0.5] }, 'robe-bellR': { n: 4, hz: 1.4, zeta: 0.3, max: 0.06, from: 0.0, soft: [0.1, 0.5] },
  stole: { n: 4, hz: 1.1, zeta: 0.25, max: 0.1, soft: [0.45, 0.75] }, // the stole runs from the shoulders; only its tails below the sash (the lower half) swing
};
export function registerRegaliaChains(MO) { Object.assign(MO.CHAINS, REGALIA_CHAINS); return MO; }
