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

// Checkpoint persistence — Sub-AC 4b
// Named session-level checkpoints, DB record shape, pure state-transition
// helpers, serialisation utilities, abandonment detection, and resume logic.
// Server-action layer: src/actions/orientation-checkpoint.ts
export type {
  CheckpointName,
  OrientationCheckpointRecord,
  CheckpointPayloadOptions,
  ResumeOutcome,
  OrientationResumeResult,
} from './checkpoint'

export {
  CHECKPOINT_SEQUENCE,
  ABANDONMENT_THRESHOLD_MS,
  // Serialisation
  serializePacket,
  deserializePacket,
  // State-transition helpers (pure — no DB writes)
  applyFaceEnter,
  applyPayloadPatch,
  applyFaceSubmit,
  applyFaceSkip,
  applySessionClose,
  // DB payload builder
  buildCheckpointPayload,
  // Abandonment detection
  isSessionAbandoned,
  getSessionAgeMs,
  // Resume utilities
  hasResumableProgress,
  getPacketProgress,
  deriveResumeNodeId,
  buildResumeBanner,
  buildResumeLabel,
  classifySessionForResume,
} from './checkpoint'
