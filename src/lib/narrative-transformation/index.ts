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
export type { DefaultMoveIdBundle } from './moves'
export type { BuildQuestSeedOptions } from './seedFromNarrative'
export type { NarrativeTransformationHints, Shadow321PromptTriad } from './alchemyHints'
export { inferEmotionChannel, buildTransformationHints } from './alchemyHints'
export { parseNarrative } from './parse'
export { detectLockType } from './lockDetection'
export { selectDefaultMoveIds } from './moves'
export { buildQuestSeedFromParsed, buildQuestSeedFromText } from './seedFromNarrative'
export { runNarrativeTransformationFull } from './fullPipeline'
