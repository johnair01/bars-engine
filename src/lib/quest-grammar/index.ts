/**
 * Quest Grammar Compiler
 *
 * Compiles 6 Unpacking Questions + Aligned Action into QuestPacket.
 * Export public API.
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
export { compileQuest } from './compileQuestCore'
export { toSkeletonPacket } from './compileQuestSkeleton'
export { compileCharacterCreationPacket } from './characterCreationPacket'
export type { CharacterCreationPacketInput, NationChoice, PlaybookChoice } from './characterCreationPacket'
export { compileStoryIntroPacket } from './storyIntroPacket'
export type { StoryIntroPacketInput } from './storyIntroPacket'
export { compileMovesGMPacket } from './movesGMPacket'
export { questPacketToTwee } from './questPacketToTwee'
export {
  buildQuestPromptContext,
  buildQuestPromptContextObject,
} from './buildQuestPromptContext'
export type { BuildQuestPromptContextInput, PlayerPOV } from './buildQuestPromptContext'
export { deriveMovementPerNode, DEFAULT_MOVEMENT_PER_NODE } from './emotional-alchemy'
export { ELEMENTS, channelToElement, elementToChannel } from './elements'
export {
  ALL_CANONICAL_MOVES,
  TRANSCEND_MOVES,
  GENERATIVE_MOVES,
  CONTROL_MOVES,
  getMoveById,
  getEnergyDelta,
} from './move-engine'
export { getMovesForLens } from './lens-moves'
export type { LensKey } from './lens-moves'
export { resolveMoveForContext } from './resolveMoveForContext'
export type { ResolveMoveForContextParams } from './resolveMoveForContext'
export { getPlaybookPrimaryWave } from './playbook-wave'
export { generateRandomUnpacking } from './random-unpacking'
export type { RandomUnpackingResult, RandomUnpackingPlayerContext } from './random-unpacking'
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
} from './types'
