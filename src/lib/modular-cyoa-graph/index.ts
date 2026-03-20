/**
 * CYOA Modular Authoring (CMA) v0 — modular quest graph types & validation.
 */

export type {
  CmaEdge,
  CmaFragment,
  CmaNode,
  CmaNodeKind,
  CmaStory,
} from './types'
export { CMA_NODE_KINDS } from './types'
export type {
  QuestGraphIssue,
  QuestGraphValidationCode,
  ValidateQuestGraphResult,
} from './validateQuestGraph'
export { validateQuestGraph } from './validateQuestGraph'
export { cmaStoryToTwee } from './cmaStoryToTwee'
export { cmaStoryToIrNodes, cmaNodeToIrBody } from './cmaStoryToIr'
export { suggestBlocksFromCharge } from './suggestBlocksFromCharge'
export type { ChargeBlockSuggestions, ChargeLike } from './suggestBlocksFromCharge'
export {
  CMA_KIND_LABELS,
  CMA_MVP_KINDS,
  cmaKindsForAdminPalette,
} from './cmaPaletteLabels'
