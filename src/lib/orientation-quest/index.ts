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

// Checkpoint schema — Sub-AC 4a
// Static checkpoint markers, runtime checkpoint state, and pure utilities
// for tracking player progress within each face sub-packet.
export type {
  SubPacketCheckpointStage,
  CheckpointMarker,
  CheckpointEntry,
  SubPacketCheckpoint,
  CheckpointedSubPacketState,
  OrientationCheckpointState,
} from './checkpoints'

export {
  FACE_CHECKPOINT_REGISTRY,
  CHECKPOINTS_PER_FACE,
  // Lookup helpers
  getCheckpointEntry,
  getNextCheckpointEntry,
  getEntryCheckpoint,
  getSynthesisCheckpoint,
  getSubmittedCheckpoint,
  getFieldCheckpoints,
  getExpectedFieldKeys,
  // Factory
  createSubPacketCheckpoint,
  // State factories and transitions
  createInitialCheckpointedSubPacketState,
  createInitialOrientationCheckpointState,
  advanceCheckpoint,
  // Progress queries
  getSubPacketProgress,
  getResumeNodeId,
  hasReachedSynthesis,
  getResumeLabel,
} from './checkpoints'
