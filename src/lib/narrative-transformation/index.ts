/**
 * Narrative Transformation Engine v0 — public surface
 * Spec: .specify/specs/narrative-transformation-engine/spec.md
 */

export type {
  NarrativeParseResult,
  NarrativeQuestSeed,
  NarrativeTransformationMove,
  LockType,
  ParsedNarrative,
} from './types'
export type { DefaultMoveIdBundle } from './moves/selectMoves'
export type { BuildQuestSeedOptions } from './seedFromNarrative'
export type { NarrativeTransformationHints, Shadow321PromptTriad } from './alchemyHints'
export { inferEmotionChannel, buildTransformationHints } from './alchemyHints'
export { parseNarrative } from './parse'
export { detectLockType } from './lockDetection'
export { selectDefaultMoveIds } from './moves/selectMoves'
export { buildQuestSeedFromParsed, buildQuestSeedFromText } from './seedFromNarrative'
export { runNarrativeTransformationFull } from './fullPipeline'
export type { NationMoveProfile, NationMoveProfileV1, NationMoveIdBundle } from './moves/nation-profiles'
export {
  applyNationOverlay,
  applyNationQuestFlavor,
  getNationMoveProfile,
  NATION_MOVE_PROFILES,
  NATION_STAGE_MOVE_PREFERENCE,
} from './moves/nation-profiles'
export type { ArchetypeMoveStyle } from './moves/archetype-move-styles'
export {
  applyArchetypeOverlay,
  applyArchetypeQuestFlavor,
  ARCHETYPE_MOVE_STYLES,
  getArchetypeMoveStyle,
} from './moves/archetype-move-styles'
