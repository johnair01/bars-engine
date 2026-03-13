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
export type { CharacterCreationPacketInput, NationChoice, ArchetypeChoice } from './characterCreationPacket'
export { compileStoryIntroPacket } from './storyIntroPacket'
export type { StoryIntroPacketInput } from './storyIntroPacket'
export { compileMovesGMPacket } from './movesGMPacket'
export {
  compileFaceSubPacket,
  compileShamanFaceSubPacket,
  compileChallengerFaceSubPacket,
  compileRegentFaceSubPacket,
  compileArchitectFaceSubPacket,
  compileDiplomatFaceSubPacket,
  compileSageFaceSubPacket,
  FACE_FIELD_MAP,
  FACE_SUB_PACKET_COMPILERS,
} from './orientationFaceSubPackets'
export type { FaceSubPacketInput } from './orientationFaceSubPackets'
export {
  // Dispatch / compile (Sub-AC 3)
  compileOrientationMetaPacket,
  getOrientationMetaPacketNodeIds,
  // State management (Sub-AC 4)
  ORIENTATION_SUB_PACKET_FACES,
  ORIENTATION_SUB_PACKET_COUNT,
  createInitialMetaPacketState,
  startSubPacket,
  markSubPacketComplete,
  isMetaPacketComplete,
  getCompletedSubPackets,
  getPendingSubPackets,
  getInProgressSubPackets,
  getMetaPacketProgress,
} from './orientationMetaPacket'
export type {
  OrientationMetaPacketInput,
  SubPacketStatus,
  SubPacketState,
  OrientationMetaPacketState,
} from './orientationMetaPacket'
export {
  // Face sub-packet utilities (Sub-AC 3 helpers)
  FACE_TO_CANONICAL_MOVE_ID,
  faceSubPacketPrefix,
  faceSubPacketTerminalId,
  compileFaceSubPacketWithConvergence,
  instantiateAllFaceSubPackets,
} from './orientationFaceSubPacket'
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
export { getArchetypePrimaryWave } from './archetype-wave'
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
  NodeChoiceOverride,
} from './types'
