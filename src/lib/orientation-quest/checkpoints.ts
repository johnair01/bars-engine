/**
 * Orientation Quest — Checkpoint Schema & Sub-Packet Stage Annotations
 *
 * Sub-AC 4a: Data model layer.
 *
 * Each of the 6 GM-face sub-packets is a linear journey of 7 nodes:
 *
 *   entry (intro) → field_1 → field_2 → field_3 → field_4 → synthesis → submitted (terminal)
 *
 * This module defines:
 *   1. CheckpointMarker   — static annotation on a single sub-packet node
 *   2. SubPacketCheckpoint — runtime record: which node the player has last reached
 *   3. CheckpointedSubPacketState — extends SubPacketState with checkpoint tracking
 *   4. OrientationCheckpointState — full checkpoint layer over the meta-packet
 *   5. FACE_CHECKPOINT_REGISTRY — static lookup: face → ordered CheckpointEntry[]
 *   6. Pure utilities: lookup, navigation, factory, progress helpers
 *
 * Design constraints honoured:
 *   - Static at compile time — no runtime DB query, no AI, no Prisma.
 *   - Node IDs match the pattern established by compileSubPacketNodes()
 *     in orientationFaceSubPackets.ts: `orient_${face}_${beatId}` plus
 *     a terminal at `orient_${face}_terminal`.
 *   - All checkpoint state is serializable (no function references).
 *   - Integrates with SubPacketState from orientationMetaPacket.ts — adds
 *     checkpoint fields without replacing the existing state model.
 *
 * @see src/lib/quest-grammar/orientationFaceSubPackets.ts — beat definitions
 * @see src/lib/quest-grammar/orientationMetaPacket.ts    — SubPacketState
 * @see src/lib/orientation-quest/types.ts                — FaceSubPacketPayload
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { SubPacketState, SubPacketStatus } from '@/lib/quest-grammar/orientationMetaPacket'

// ===========================================================================
// SECTION 1 — CHECKPOINT MARKER TYPES (static, compile-time)
// ===========================================================================

/**
 * Functional role of a node within a face sub-packet's linear journey.
 *
 * - entry:     The introductory node — sets the face's lens and orients the player.
 *              Always ordinal 0. This is the resume target when a sub-packet is
 *              'in_progress' but no further progress has been recorded.
 * - field:     A field-elicitation node — invites the player to author one or more
 *              TransformationMove fields. Carries a `fieldKey` pointing to the
 *              FaceSubPacketPayload field(s) elicited at this node.
 * - synthesis: The pre-submission review node — player reviews what they have authored
 *              and confirms readiness to submit. Always the penultimate node.
 * - submitted: The terminal node — the face contribution has been recorded.
 *              Reached after the player confirms submission at the synthesis node.
 */
export type SubPacketCheckpointStage = 'entry' | 'field' | 'synthesis' | 'submitted'

/**
 * Static annotation on a single node within a face sub-packet.
 *
 * CheckpointMarkers are defined at compile time in FACE_CHECKPOINT_REGISTRY.
 * They do not change at runtime — they are structural metadata about the
 * quest packet shape, not player state.
 *
 * Properties:
 *   - stage:       Functional role of this node in the sub-packet journey.
 *   - ordinal:     Zero-based position in the ordered node sequence.
 *                  (0 = entry, 1–N = field nodes, N+1 = synthesis, N+2 = submitted)
 *   - fieldKey:    Dot-notation path into FaceSubPacketPayload for the field(s)
 *                  elicited at this node. Present only for 'field' stage nodes.
 *                  Matches the field_key conventions in FaceFieldSlot
 *                  (face-context-index.ts), including dotted sub-paths such as
 *                  'quest_usage.suggested_follow_up_moves'.
 *   - isSavePoint: Whether reaching this node must trigger a state persistence
 *                  flush (e.g. write checkpoint to DB / session store).
 *                  True for all nodes — every beat is a save boundary.
 *   - resumeLabel: Short player-facing label used to describe this point in UI
 *                  resume prompts (e.g. "Continue from Purpose").
 */
export interface CheckpointMarker {
  stage: SubPacketCheckpointStage
  ordinal: number
  fieldKey?: string
  isSavePoint: boolean
  resumeLabel: string
}

/**
 * A paired (nodeId, CheckpointMarker) entry — the unit stored in
 * FACE_CHECKPOINT_REGISTRY per face. Using a named entry (rather than a plain
 * Record) preserves ordinal ordering and allows O(N) sequence traversal.
 */
export interface CheckpointEntry {
  /** Full node ID as produced by compileSubPacketNodes(): `orient_${face}_${beatId}`. */
  nodeId: string
  /** Static annotation for this node. */
  marker: CheckpointMarker
}

// ===========================================================================
// SECTION 2 — RUNTIME CHECKPOINT STATE
// ===========================================================================

/**
 * A player's checkpoint record within a single face sub-packet.
 *
 * Records which node the player has most recently reached, along with the
 * timestamp of that reach event and an optional payload version for
 * optimistic concurrency on the FaceSubPacketPayload.
 *
 * This is the RUNTIME counterpart of CheckpointMarker. It is serializable
 * and safe to store as JSON in a DB session field or server-side cache.
 *
 * Properties:
 *   - face:                  Which GM face this checkpoint belongs to.
 *   - nodeId:                The node the player has reached (last saved position).
 *   - stage:                 The CheckpointMarker.stage for nodeId.
 *   - ordinal:               The CheckpointMarker.ordinal for nodeId.
 *   - fieldKey:              Present when stage === 'field' (for payload writes).
 *   - reachedAt:             ISO 8601 timestamp when the player reached this node.
 *   - payloadVersion:        Monotonically incrementing counter on FaceSubPacketPayload
 *                            mutations. Incremented each time a field node's
 *                            response is written to the payload. Starts at 0.
 */
export interface SubPacketCheckpoint {
  face: GameMasterFace
  nodeId: string
  stage: SubPacketCheckpointStage
  ordinal: number
  fieldKey?: string
  reachedAt: string
  payloadVersion: number
}

/**
 * Extends SubPacketState (from orientationMetaPacket.ts) with checkpoint tracking.
 *
 * - currentCheckpoint: The most recently persisted checkpoint. Undefined until
 *                      the player has entered the face sub-packet.
 * - checkpointHistory: Ordered log of all checkpoints reached in this session.
 *                      Useful for training signals and resume UX.
 *
 * NOTE: This type composes with SubPacketState rather than replacing it.
 * The base SubPacketState.status field remains the authoritative lifecycle flag;
 * checkpoints provide finer-grained progress within each status phase.
 */
export interface CheckpointedSubPacketState extends SubPacketState {
  /** Last persisted checkpoint for this face sub-packet. */
  currentCheckpoint?: SubPacketCheckpoint
  /**
   * Ordered log of all checkpoints reached. Appended-only.
   * Empty until the player enters this sub-packet.
   */
  checkpointHistory: SubPacketCheckpoint[]
}

/**
 * Full checkpoint layer over the orientation meta-packet.
 *
 * Mirrors OrientationMetaPacketState (orientationMetaPacket.ts) but replaces
 * SubPacketState entries with CheckpointedSubPacketState.
 *
 * This is the shape stored in the session layer (not quest_proposals — that
 * table carries the submitted proposal record, not the in-session journey state).
 */
export interface OrientationCheckpointState {
  /** Stable ID matching OrientationMetaPacketState.packetId. */
  packetId: string
  /**
   * Per-face checkpoint states, all 6 faces always present.
   * Keyed by GameMasterFace for O(1) lookup.
   */
  subPackets: Record<GameMasterFace, CheckpointedSubPacketState>
  /**
   * ISO timestamp set when ALL 6 sub-packets have a checkpoint with
   * stage === 'submitted'. Undefined until fully complete.
   */
  completedAt?: string
}

// ===========================================================================
// SECTION 3 — FACE CHECKPOINT REGISTRY (static, compile-time)
// ===========================================================================
//
// Node IDs follow the pattern from compileSubPacketNodes() in
// orientationFaceSubPackets.ts:
//
//   prefix  = `orient_${face}`                         e.g. 'orient_shaman'
//   beatId  = the id field from the face's BEATS array  e.g. 'shaman_intro'
//   nodeId  = `${prefix}_${beatId}`                    e.g. 'orient_shaman_shaman_intro'
//   terminal= `${prefix}_terminal`                     e.g. 'orient_shaman_terminal'
//
// Each face has exactly 7 checkpoint entries:
//   ordinal 0: entry         (intro node)
//   ordinal 1: field         (field elicitation node 1)
//   ordinal 2: field         (field elicitation node 2)
//   ordinal 3: field         (field elicitation node 3)
//   ordinal 4: field         (field elicitation node 4)
//   ordinal 5: synthesis     (review / pre-submission node)
//   ordinal 6: submitted     (terminal / completion node)
//
// ===========================================================================

// ---------------------------------------------------------------------------
// Shaman: description, purpose, compatible_emotion_channels, safety_notes
// ---------------------------------------------------------------------------

const SHAMAN_CHECKPOINTS: CheckpointEntry[] = [
  {
    nodeId: 'orient_shaman_shaman_intro',
    marker: {
      stage: 'entry',
      ordinal: 0,
      isSavePoint: true,
      resumeLabel: 'Introduction — The Shaman's Threshold',
    },
  },
  {
    nodeId: 'orient_shaman_shaman_description',
    marker: {
      stage: 'field',
      ordinal: 1,
      fieldKey: 'description',
      isSavePoint: true,
      resumeLabel: 'Continue from Description',
    },
  },
  {
    nodeId: 'orient_shaman_shaman_purpose',
    marker: {
      stage: 'field',
      ordinal: 2,
      fieldKey: 'purpose',
      isSavePoint: true,
      resumeLabel: 'Continue from Purpose',
    },
  },
  {
    nodeId: 'orient_shaman_shaman_emotions',
    marker: {
      stage: 'field',
      ordinal: 3,
      fieldKey: 'compatible_emotion_channels',
      isSavePoint: true,
      resumeLabel: 'Continue from Emotional Channels',
    },
  },
  {
    nodeId: 'orient_shaman_shaman_safety',
    marker: {
      stage: 'field',
      ordinal: 4,
      fieldKey: 'safety_notes',
      isSavePoint: true,
      resumeLabel: 'Continue from Safety Notes',
    },
  },
  {
    nodeId: 'orient_shaman_shaman_synthesis',
    marker: {
      stage: 'synthesis',
      ordinal: 5,
      isSavePoint: true,
      resumeLabel: 'Review & Submit Shaman Contribution',
    },
  },
  {
    nodeId: 'orient_shaman_terminal',
    marker: {
      stage: 'submitted',
      ordinal: 6,
      isSavePoint: true,
      resumeLabel: 'Shaman Contribution Recorded',
    },
  },
]

// ---------------------------------------------------------------------------
// Challenger: wcgs_stage, target_effect, compatible_lock_types, bar_integration
// ---------------------------------------------------------------------------

const CHALLENGER_CHECKPOINTS: CheckpointEntry[] = [
  {
    nodeId: 'orient_challenger_challenger_intro',
    marker: {
      stage: 'entry',
      ordinal: 0,
      isSavePoint: true,
      resumeLabel: 'Introduction — The Challenger's Proving Ground',
    },
  },
  {
    nodeId: 'orient_challenger_challenger_stage',
    marker: {
      stage: 'field',
      ordinal: 1,
      fieldKey: 'wcgs_stage',
      isSavePoint: true,
      resumeLabel: 'Continue from Development Stage',
    },
  },
  {
    nodeId: 'orient_challenger_challenger_target_effect',
    marker: {
      stage: 'field',
      ordinal: 2,
      fieldKey: 'target_effect',
      isSavePoint: true,
      resumeLabel: 'Continue from Target Effect',
    },
  },
  {
    nodeId: 'orient_challenger_challenger_locks',
    marker: {
      stage: 'field',
      ordinal: 3,
      fieldKey: 'compatible_lock_types',
      isSavePoint: true,
      resumeLabel: 'Continue from Lock Types',
    },
  },
  {
    nodeId: 'orient_challenger_challenger_bar',
    marker: {
      stage: 'field',
      ordinal: 4,
      fieldKey: 'bar_integration',
      isSavePoint: true,
      resumeLabel: 'Continue from BAR Integration',
    },
  },
  {
    nodeId: 'orient_challenger_challenger_synthesis',
    marker: {
      stage: 'synthesis',
      ordinal: 5,
      isSavePoint: true,
      resumeLabel: 'Review & Submit Challenger Contribution',
    },
  },
  {
    nodeId: 'orient_challenger_terminal',
    marker: {
      stage: 'submitted',
      ordinal: 6,
      isSavePoint: true,
      resumeLabel: 'Challenger Contribution Recorded',
    },
  },
]

// ---------------------------------------------------------------------------
// Regent: move_category, quest_usage, compatible_nations, quest_usage.suggested_follow_up_moves
// ---------------------------------------------------------------------------

const REGENT_CHECKPOINTS: CheckpointEntry[] = [
  {
    nodeId: 'orient_regent_regent_intro',
    marker: {
      stage: 'entry',
      ordinal: 0,
      isSavePoint: true,
      resumeLabel: 'Introduction — The Regent's Order',
    },
  },
  {
    nodeId: 'orient_regent_regent_category',
    marker: {
      stage: 'field',
      ordinal: 1,
      fieldKey: 'move_category',
      isSavePoint: true,
      resumeLabel: 'Continue from Move Category',
    },
  },
  {
    nodeId: 'orient_regent_regent_quest_usage',
    marker: {
      stage: 'field',
      ordinal: 2,
      fieldKey: 'quest_usage',
      isSavePoint: true,
      resumeLabel: 'Continue from Quest Usage',
    },
  },
  {
    nodeId: 'orient_regent_regent_nations',
    marker: {
      stage: 'field',
      ordinal: 3,
      fieldKey: 'compatible_nations',
      isSavePoint: true,
      resumeLabel: 'Continue from Compatible Nations',
    },
  },
  {
    nodeId: 'orient_regent_regent_suggested_follows',
    marker: {
      stage: 'field',
      ordinal: 4,
      fieldKey: 'quest_usage.suggested_follow_up_moves',
      isSavePoint: true,
      resumeLabel: 'Continue from Suggested Follow-Up Moves',
    },
  },
  {
    nodeId: 'orient_regent_regent_synthesis',
    marker: {
      stage: 'synthesis',
      ordinal: 5,
      isSavePoint: true,
      resumeLabel: 'Review & Submit Regent Contribution',
    },
  },
  {
    nodeId: 'orient_regent_terminal',
    marker: {
      stage: 'submitted',
      ordinal: 6,
      isSavePoint: true,
      resumeLabel: 'Regent Contribution Recorded',
    },
  },
]

// ---------------------------------------------------------------------------
// Architect: move_name, description, prompt_templates, typical_output_type
// ---------------------------------------------------------------------------

const ARCHITECT_CHECKPOINTS: CheckpointEntry[] = [
  {
    nodeId: 'orient_architect_architect_intro',
    marker: {
      stage: 'entry',
      ordinal: 0,
      isSavePoint: true,
      resumeLabel: 'Introduction — The Architect's Blueprint',
    },
  },
  {
    nodeId: 'orient_architect_architect_name',
    marker: {
      stage: 'field',
      ordinal: 1,
      fieldKey: 'move_name',
      isSavePoint: true,
      resumeLabel: 'Continue from Move Name',
    },
  },
  {
    nodeId: 'orient_architect_architect_description',
    marker: {
      stage: 'field',
      ordinal: 2,
      fieldKey: 'description',
      isSavePoint: true,
      resumeLabel: 'Continue from Description',
    },
  },
  {
    nodeId: 'orient_architect_architect_templates',
    marker: {
      stage: 'field',
      ordinal: 3,
      fieldKey: 'prompt_templates',
      isSavePoint: true,
      resumeLabel: 'Continue from Prompt Templates',
    },
  },
  {
    nodeId: 'orient_architect_architect_output_type',
    marker: {
      stage: 'field',
      ordinal: 4,
      fieldKey: 'typical_output_type',
      isSavePoint: true,
      resumeLabel: 'Continue from Output Type',
    },
  },
  {
    nodeId: 'orient_architect_architect_synthesis',
    marker: {
      stage: 'synthesis',
      ordinal: 5,
      isSavePoint: true,
      resumeLabel: 'Review & Submit Architect Contribution',
    },
  },
  {
    nodeId: 'orient_architect_terminal',
    marker: {
      stage: 'submitted',
      ordinal: 6,
      isSavePoint: true,
      resumeLabel: 'Architect Contribution Recorded',
    },
  },
]

// ---------------------------------------------------------------------------
// Diplomat: compatible_archetypes, compatible_emotion_channels, safety_notes,
//           quest_usage.suggested_follow_up_moves
// ---------------------------------------------------------------------------

const DIPLOMAT_CHECKPOINTS: CheckpointEntry[] = [
  {
    nodeId: 'orient_diplomat_diplomat_intro',
    marker: {
      stage: 'entry',
      ordinal: 0,
      isSavePoint: true,
      resumeLabel: 'Introduction — The Diplomat's Relational Field',
    },
  },
  {
    nodeId: 'orient_diplomat_diplomat_archetypes',
    marker: {
      stage: 'field',
      ordinal: 1,
      fieldKey: 'compatible_archetypes',
      isSavePoint: true,
      resumeLabel: 'Continue from Compatible Archetypes',
    },
  },
  {
    nodeId: 'orient_diplomat_diplomat_emotions',
    marker: {
      stage: 'field',
      ordinal: 2,
      fieldKey: 'compatible_emotion_channels',
      isSavePoint: true,
      resumeLabel: 'Continue from Emotional Channels',
    },
  },
  {
    nodeId: 'orient_diplomat_diplomat_safety',
    marker: {
      stage: 'field',
      ordinal: 3,
      fieldKey: 'safety_notes',
      isSavePoint: true,
      resumeLabel: 'Continue from Safety Notes',
    },
  },
  {
    nodeId: 'orient_diplomat_diplomat_followups',
    marker: {
      stage: 'field',
      ordinal: 4,
      fieldKey: 'quest_usage.suggested_follow_up_moves',
      isSavePoint: true,
      resumeLabel: 'Continue from Follow-Up Moves',
    },
  },
  {
    nodeId: 'orient_diplomat_diplomat_synthesis',
    marker: {
      stage: 'synthesis',
      ordinal: 5,
      isSavePoint: true,
      resumeLabel: 'Review & Submit Diplomat Contribution',
    },
  },
  {
    nodeId: 'orient_diplomat_terminal',
    marker: {
      stage: 'submitted',
      ordinal: 6,
      isSavePoint: true,
      resumeLabel: 'Diplomat Contribution Recorded',
    },
  },
]

// ---------------------------------------------------------------------------
// Sage: quest_usage, bar_integration, purpose, quest_usage.can_stand_alone
// ---------------------------------------------------------------------------

const SAGE_CHECKPOINTS: CheckpointEntry[] = [
  {
    nodeId: 'orient_sage_sage_intro',
    marker: {
      stage: 'entry',
      ordinal: 0,
      isSavePoint: true,
      resumeLabel: 'Introduction — The Sage's Whole View',
    },
  },
  {
    nodeId: 'orient_sage_sage_arc_fit',
    marker: {
      stage: 'field',
      ordinal: 1,
      fieldKey: 'quest_usage',
      isSavePoint: true,
      resumeLabel: 'Continue from Arc Fit',
    },
  },
  {
    nodeId: 'orient_sage_sage_bar_integration',
    marker: {
      stage: 'field',
      ordinal: 2,
      fieldKey: 'bar_integration',
      isSavePoint: true,
      resumeLabel: 'Continue from BAR Integration',
    },
  },
  {
    nodeId: 'orient_sage_sage_purpose',
    marker: {
      stage: 'field',
      ordinal: 3,
      fieldKey: 'purpose',
      isSavePoint: true,
      resumeLabel: 'Continue from Purpose',
    },
  },
  {
    nodeId: 'orient_sage_sage_standalone',
    marker: {
      stage: 'field',
      ordinal: 4,
      fieldKey: 'quest_usage.can_stand_alone',
      isSavePoint: true,
      resumeLabel: 'Continue from Standalone Assessment',
    },
  },
  {
    nodeId: 'orient_sage_sage_synthesis',
    marker: {
      stage: 'synthesis',
      ordinal: 5,
      isSavePoint: true,
      resumeLabel: 'Review & Submit Sage Contribution',
    },
  },
  {
    nodeId: 'orient_sage_terminal',
    marker: {
      stage: 'submitted',
      ordinal: 6,
      isSavePoint: true,
      resumeLabel: 'Sage Contribution Recorded',
    },
  },
]

// ---------------------------------------------------------------------------
// FACE_CHECKPOINT_REGISTRY — the canonical static lookup
// ---------------------------------------------------------------------------

/**
 * FACE_CHECKPOINT_REGISTRY
 *
 * Static, compile-time registry mapping each GameMasterFace to an ordered
 * array of CheckpointEntry records. Entries are ordered by ordinal (0 → 6).
 *
 * Usage:
 *   import { FACE_CHECKPOINT_REGISTRY } from '@/lib/orientation-quest/checkpoints'
 *   const entries = FACE_CHECKPOINT_REGISTRY['shaman']
 *   // entries[0].nodeId   === 'orient_shaman_shaman_intro'
 *   // entries[0].marker.stage === 'entry'
 *   // entries[0].marker.ordinal === 0
 *
 * Constraints:
 *   - Read-only — cast `as const` to prevent accidental mutation.
 *   - Exactly 7 entries per face (entry + 4 field + synthesis + submitted).
 *   - Node IDs match the output of compileSubPacketNodes() in
 *     orientationFaceSubPackets.ts. Any rename to beat IDs must be reflected here.
 */
export const FACE_CHECKPOINT_REGISTRY: Readonly<Record<GameMasterFace, ReadonlyArray<CheckpointEntry>>> = {
  shaman: SHAMAN_CHECKPOINTS,
  challenger: CHALLENGER_CHECKPOINTS,
  regent: REGENT_CHECKPOINTS,
  architect: ARCHITECT_CHECKPOINTS,
  diplomat: DIPLOMAT_CHECKPOINTS,
  sage: SAGE_CHECKPOINTS,
} as const

/** Total number of checkpoints per face sub-packet (entry + fields + synthesis + submitted). */
export const CHECKPOINTS_PER_FACE = 7 as const

// ===========================================================================
// SECTION 4 — PURE UTILITY FUNCTIONS
// ===========================================================================

/**
 * Look up the CheckpointEntry for a given node within a face sub-packet.
 * Returns `undefined` if the nodeId is not registered for that face.
 *
 * O(N) scan over 7 entries — no caching needed at this scale.
 */
export function getCheckpointEntry(
  face: GameMasterFace,
  nodeId: string
): CheckpointEntry | undefined {
  return FACE_CHECKPOINT_REGISTRY[face].find((entry) => entry.nodeId === nodeId)
}

/**
 * Returns the next CheckpointEntry after the given nodeId for a face.
 * Returns `undefined` if nodeId is the terminal (last) entry.
 *
 * Used by the runtime to determine the next save point after the player
 * advances from the current node.
 */
export function getNextCheckpointEntry(
  face: GameMasterFace,
  currentNodeId: string
): CheckpointEntry | undefined {
  const entries = FACE_CHECKPOINT_REGISTRY[face]
  const idx = entries.findIndex((e) => e.nodeId === currentNodeId)
  if (idx === -1 || idx === entries.length - 1) return undefined
  return entries[idx + 1]
}

/**
 * Returns the first CheckpointEntry (stage === 'entry', ordinal === 0) for a face.
 * This is the resume target when a sub-packet is 'in_progress' with no checkpoint yet.
 */
export function getEntryCheckpoint(face: GameMasterFace): CheckpointEntry {
  const entry = FACE_CHECKPOINT_REGISTRY[face][0]
  // Safety: registry is guaranteed to have at least one entry per face
  if (!entry) {
    throw new Error(`[checkpoints] No entry checkpoint registered for face: ${face}`)
  }
  return entry
}

/**
 * Returns the CheckpointEntry for the synthesis node (ordinal === 5) for a face.
 * This is the last checkpoint before submission — used to validate readiness.
 */
export function getSynthesisCheckpoint(face: GameMasterFace): CheckpointEntry {
  const entries = FACE_CHECKPOINT_REGISTRY[face]
  const synthesis = entries.find((e) => e.marker.stage === 'synthesis')
  if (!synthesis) {
    throw new Error(`[checkpoints] No synthesis checkpoint registered for face: ${face}`)
  }
  return synthesis
}

/**
 * Returns the CheckpointEntry for the terminal/submitted node (ordinal === 6) for a face.
 */
export function getSubmittedCheckpoint(face: GameMasterFace): CheckpointEntry {
  const entries = FACE_CHECKPOINT_REGISTRY[face]
  const submitted = entries.find((e) => e.marker.stage === 'submitted')
  if (!submitted) {
    throw new Error(`[checkpoints] No submitted checkpoint registered for face: ${face}`)
  }
  return submitted
}

/**
 * Returns all field-stage CheckpointEntries for a face, in ordinal order.
 * Useful for structural completeness validation: each field entry must have
 * a corresponding populated key in the FaceSubPacketPayload.
 */
export function getFieldCheckpoints(face: GameMasterFace): ReadonlyArray<CheckpointEntry> {
  return FACE_CHECKPOINT_REGISTRY[face].filter((e) => e.marker.stage === 'field')
}

/**
 * Returns all expected fieldKeys for a face, derived from the field-stage
 * checkpoint entries. Includes dotted sub-paths (e.g. 'quest_usage.suggested_follow_up_moves').
 *
 * NOTE: fieldKeys may have duplicates across faces (e.g. both shaman and architect
 * elicit 'description'). This function returns only the keys owned by the given face.
 */
export function getExpectedFieldKeys(face: GameMasterFace): string[] {
  return getFieldCheckpoints(face)
    .map((e) => e.marker.fieldKey)
    .filter((k): k is string => k !== undefined)
}

// ===========================================================================
// SECTION 5 — CHECKPOINT FACTORY (runtime, pure)
// ===========================================================================

/**
 * Create a SubPacketCheckpoint record when the player reaches a node.
 *
 * Derives stage, ordinal, and fieldKey from the static FACE_CHECKPOINT_REGISTRY.
 * Throws if the nodeId is not registered for the given face (programming error).
 *
 * @param face           The GameMasterFace whose sub-packet is being navigated.
 * @param nodeId         The node the player has just reached.
 * @param payloadVersion Current payload mutation counter (0-based).
 * @param now            Optional ISO timestamp — defaults to new Date().toISOString().
 */
export function createSubPacketCheckpoint(
  face: GameMasterFace,
  nodeId: string,
  payloadVersion: number = 0,
  now?: string
): SubPacketCheckpoint {
  const entry = getCheckpointEntry(face, nodeId)
  if (!entry) {
    throw new Error(
      `[checkpoints] Node "${nodeId}" is not a registered checkpoint for face "${face}". ` +
      `Check FACE_CHECKPOINT_REGISTRY.`
    )
  }
  return {
    face,
    nodeId,
    stage: entry.marker.stage,
    ordinal: entry.marker.ordinal,
    fieldKey: entry.marker.fieldKey,
    reachedAt: now ?? new Date().toISOString(),
    payloadVersion,
  }
}

// ===========================================================================
// SECTION 6 — CHECKPOINTED STATE FACTORIES (pure)
// ===========================================================================

/**
 * Create an initial CheckpointedSubPacketState for a face.
 * Status is 'pending'; no checkpoints have been reached yet.
 *
 * Used when initialising OrientationCheckpointState at session start.
 */
export function createInitialCheckpointedSubPacketState(
  face: GameMasterFace
): CheckpointedSubPacketState {
  return {
    face,
    status: 'pending' as SubPacketStatus,
    checkpointHistory: [],
  }
}

/**
 * Create the initial OrientationCheckpointState for a new session.
 * All 6 faces initialised to pending with empty checkpoint history.
 *
 * @param packetId Stable ID matching OrientationMetaPacketState.packetId.
 */
export function createInitialOrientationCheckpointState(
  packetId: string
): OrientationCheckpointState {
  const ALL_FACES: GameMasterFace[] = [
    'shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage',
  ]
  const subPackets = Object.fromEntries(
    ALL_FACES.map((face) => [face, createInitialCheckpointedSubPacketState(face)])
  ) as Record<GameMasterFace, CheckpointedSubPacketState>

  return { packetId, subPackets }
}

/**
 * Advance the CheckpointedSubPacketState for a face by recording that the
 * player has reached `nodeId`. Returns a new state object (pure — no mutation).
 *
 * Behaviour:
 *   - Looks up the CheckpointMarker for nodeId from FACE_CHECKPOINT_REGISTRY.
 *   - Appends a new SubPacketCheckpoint to checkpointHistory.
 *   - Sets currentCheckpoint to the new record.
 *   - Updates status:
 *       'entry'     node → 'in_progress' (if currently 'pending')
 *       'field'     node → 'in_progress' (preserves existing 'in_progress')
 *       'synthesis' node → 'in_progress' (preserves existing 'in_progress')
 *       'submitted' node → 'complete'
 *   - Records startedAt when transitioning from 'pending'.
 *   - Records completedAt when transitioning to 'complete'.
 *
 * @param state          Current checkpointed sub-packet state.
 * @param nodeId         Node the player has just reached.
 * @param payloadVersion Current payload mutation counter.
 * @param now            Optional ISO timestamp.
 */
export function advanceCheckpoint(
  state: CheckpointedSubPacketState,
  nodeId: string,
  payloadVersion: number = 0,
  now?: string
): CheckpointedSubPacketState {
  const face = state.face
  const entry = getCheckpointEntry(face, nodeId)
  if (!entry) {
    // Unknown node — return unchanged state rather than throw, to be resilient
    // against quest packet recompilation that changes node IDs.
    return state
  }

  const timestamp = now ?? new Date().toISOString()
  const checkpoint = createSubPacketCheckpoint(face, nodeId, payloadVersion, timestamp)

  // Determine new status
  let newStatus: SubPacketStatus = state.status
  let startedAt = state.startedAt
  let completedAt = state.completedAt

  if (entry.marker.stage === 'submitted') {
    newStatus = 'complete'
    completedAt = completedAt ?? timestamp
    startedAt = startedAt ?? timestamp
  } else if (state.status === 'pending') {
    newStatus = 'in_progress'
    startedAt = timestamp
  }
  // 'in_progress' stays 'in_progress' for entry/field/synthesis nodes

  return {
    ...state,
    status: newStatus,
    startedAt,
    completedAt,
    currentCheckpoint: checkpoint,
    checkpointHistory: [...state.checkpointHistory, checkpoint],
  }
}

// ===========================================================================
// SECTION 7 — PROGRESS QUERIES (pure)
// ===========================================================================

/**
 * Returns the percentage progress through a face sub-packet based on
 * the highest ordinal checkpoint reached.
 *
 * 0 = not started, 100 = terminal (submitted) reached.
 *
 * Calculation: (highestOrdinal / (CHECKPOINTS_PER_FACE - 1)) * 100
 *   ordinal 0 (entry)     →  0%
 *   ordinal 3 (field mid) → ~43%
 *   ordinal 5 (synthesis) → ~83%
 *   ordinal 6 (submitted) → 100%
 */
export function getSubPacketProgress(state: CheckpointedSubPacketState): {
  ordinal: number
  percentComplete: number
  stage: SubPacketCheckpointStage | 'not_started'
} {
  if (!state.currentCheckpoint) {
    return { ordinal: -1, percentComplete: 0, stage: 'not_started' }
  }
  const { ordinal, stage } = state.currentCheckpoint
  const percentComplete = Math.round((ordinal / (CHECKPOINTS_PER_FACE - 1)) * 100)
  return { ordinal, percentComplete, stage }
}

/**
 * Returns the best resume nodeId for a face sub-packet:
 *   - If no checkpoint yet → the entry node
 *   - If 'complete' → the submitted terminal node
 *   - Otherwise → currentCheckpoint.nodeId (last reached node)
 *
 * Consumers use this to restore the player's position after a session reload.
 */
export function getResumeNodeId(
  face: GameMasterFace,
  state: CheckpointedSubPacketState
): string {
  if (state.status === 'complete') {
    return getSubmittedCheckpoint(face).nodeId
  }
  if (state.currentCheckpoint) {
    return state.currentCheckpoint.nodeId
  }
  // Not yet started — return the entry node
  return getEntryCheckpoint(face).nodeId
}

/**
 * Returns true if the player has reached at least the synthesis node for
 * this face sub-packet. Used to gate the submit action in the player UI.
 */
export function hasReachedSynthesis(state: CheckpointedSubPacketState): boolean {
  if (!state.currentCheckpoint) return false
  return state.currentCheckpoint.ordinal >= getSynthesisCheckpoint(state.face).marker.ordinal
}

/**
 * Returns a human-readable resume prompt for the player UI.
 * Derived from CheckpointMarker.resumeLabel of the last checkpoint reached.
 *
 * Returns a generic "Begin [Face] path" string if no checkpoint exists yet.
 */
export function getResumeLabel(
  face: GameMasterFace,
  state: CheckpointedSubPacketState
): string {
  if (state.currentCheckpoint) {
    const entry = getCheckpointEntry(face, state.currentCheckpoint.nodeId)
    return entry?.marker.resumeLabel ?? `Continue ${face} path`
  }
  return `Begin ${face.charAt(0).toUpperCase() + face.slice(1)} path`
}
