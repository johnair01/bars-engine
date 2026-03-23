/**
 * Quest Grammar Compiler — Pure Core Exports
 *
 * No Prisma/DB dependencies. Safe for any runtime.
 * DB-coupled wrappers (buildQuestPromptContext, getArchetypePrimaryWave,
 * compileQuestWithPrivileging) remain in the main app's src/lib/quest-grammar/.
 */

export {
  UNPACKING_QUESTIONS,
  STEPS,
  EXPERIENCE_OPTIONS,
  SATISFACTION_OPTIONS,
  DISSATISFACTION_OPTIONS,
  SHADOW_VOICE_OPTIONS,
  MOVE_OPTIONS,
  LIFE_STATE_OPTIONS,
  Q3_SEP,
  FACE_OPTIONS,
  baseInputClass,
} from './unpacking-constants'
export { deriveMetadata321 } from './deriveMetadata321'
export type { Metadata321, Phase3Taxonomic, Phase1Identification } from './deriveMetadata321'
export { deriveBarDraftFrom321 } from './deriveBarDraftFrom321'
export type { BarDraftFrom321 } from './deriveBarDraftFrom321'
export { compileQuest } from './compileQuestCore'
export { toSkeletonPacket } from './compileQuestSkeleton'
export { compileCharacterCreationPacket } from './characterCreationPacket'
export type { CharacterCreationPacketInput, NationChoice, ArchetypeChoice } from './characterCreationPacket'
export { compileStoryIntroPacket } from './storyIntroPacket'
export type { StoryIntroPacketInput } from './storyIntroPacket'
export { compileMovesGMPacket } from './movesGMPacket'
export { questPacketToTwee } from './questPacketToTwee'
export { deriveMovementPerNode, DEFAULT_MOVEMENT_PER_NODE } from './emotional-alchemy'
export { ELEMENTS, channelToElement, elementToChannel } from './elements'
export type { ElementKey } from './elements'
export {
  ALL_CANONICAL_MOVES,
  TRANSCEND_MOVES,
  GENERATIVE_MOVES,
  CONTROL_MOVES,
  getMoveById,
  getEnergyDelta,
} from './move-engine'
export type { CanonicalMove } from './move-engine'
export { getMovesForLens } from './lens-moves'
export type { LensKey } from './lens-moves'
export { resolveMoveForContext } from './resolveMoveForContext'
export type { ResolveMoveForContextParams } from './resolveMoveForContext'
export { generateRandomUnpacking } from './random-unpacking'
export type { RandomUnpackingResult, RandomUnpackingPlayerContext } from './random-unpacking'
export { buildChoicePrivilegingContext } from './choice-privileging-context'
export { getLabelsForMove, pickExperienceForPlayer } from './canonical-kernel'
export type {
  QuestCompileInput,
  QuestPacket,
  SerializableQuestPacket,
  QuestNode,
  EmotionalAlchemySignature,
  UnpackingAnswers,
  SegmentVariant,
  EmotionalChannel,
  BeatType,
  PersonalMoveType,
  WaveStage,
  TranslateCategory,
  MoveMap,
  ActionType,
  IChingContext,
  NodeChoiceOverride,
} from './types'
