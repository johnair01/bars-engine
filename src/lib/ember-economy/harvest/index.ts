/**
 * Harvest from mtgoa-game (ember-economy-decompose H1 to H3), pure TypeScript, no React.
 * Each file under ./mtgoa is a copy of its original at the commit named in
 * .specify/specs/ember-economy-decompose/HARVEST.md; only import paths changed.
 *
 *   H1 stress track and contagion: RULES.stress, RULES.contagion, activeShadowCount, shadowsRevealed
 *   H2 element pool: ChannelPool and its operations
 *   H3 sim tests: ./mtgoa/engine/**\/__tests__ (run by vitest.config.ts)
 */
export { RULES } from "./mtgoa/engine/rules";
export { activeShadowCount, shadowsRevealed } from "./mtgoa/engine/combat";
export {
  emptyPool,
  poolGet,
  addToPool,
  generateChannel,
  canSpend,
  spendChannel,
  metabolize,
  exile,
} from "./mtgoa/engine/alchemy";
export { ELEMENTS, nextInCycle, type ChannelPool } from "./mtgoa/data/channels";
