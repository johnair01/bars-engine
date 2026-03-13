/**
 * Orientation Quest — Module Index
 *
 * Re-exports from the orientation-quest subsystem.
 * This module grows as additional AC sub-tasks are implemented.
 */

export {
  FACE_CONTEXT_INDEX,
  ORDERED_FACES,
  getPrimaryFieldKeys,
  getAllOwnedFieldKeys,
  scoreFacesByText,
  getFaceForField,
  validateFieldSlotCoverage,
} from './face-context-index'

export type {
  FaceContextIndex,
  FaceContextEntry,
  FaceSemanticIntent,
  FaceFieldSlot,
  FaceMappingCues,
} from './face-context-index'

// Core data models (Sub-AC 1 — OrientationMetaPacket + FaceSubPacket schemas)
export type {
  SubmissionPath,
  FaceSubPacketState,
  FaceSubPacketPayload,
  BranchFieldMapping,
  OrientationChoiceType,
  FaceSubPacketConstraints,
  FaceSubPacket,
  CompositeQualityScore,
  OrientationMetaPacket,
  OrientationPacketCompileInput,
} from './types'

export {
  isSubmissionPath,
  isFaceSubPacketState,
  makeFaceSubPacket,
  makeOrientationMetaPacket,
} from './types'
