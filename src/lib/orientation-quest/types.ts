/**
 * Orientation Quest System — Type Definitions
 *
 * Defines OrientationMetaPacket and FaceSubPacket structures for the GM-face-guided
 * TransformationMove co-creation orientation quest. Players traverse GM-face sub-packets
 * to collaboratively propose new TransformationMoves through the quest_proposals lifecycle.
 *
 * Design notes:
 * - OrientationMetaPacket is the top-level container: one per player orientation session.
 * - Each FaceSubPacket corresponds to one GameMasterFace and carries its own completion
 *   state, admin-authored natural-language constraints, and the evolving proposal payload.
 * - SubmissionPath determines which of the four review-equivalent paths produced the record.
 * - CompositeQualityScore aggregates the three signal sources into the final score written
 *   to quest_proposals.confidenceScore.
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type {
  MoveCategory,
  WcgsStage,
  TypicalOutputType,
  LockType,
  EmotionChannel,
  BarIntegration,
  QuestUsage,
  PromptTemplate,
} from '@/lib/transformation-move-registry/types'

// ---------------------------------------------------------------------------
// Submission path — four equivalent paths, identical review lifecycle
// ---------------------------------------------------------------------------

/**
 * The four co-creation submission paths. All four enter the same
 * quest_proposals reviewStatus lifecycle (pending → approved/rejected/deferred).
 * No path receives a shortened or bypassed review.
 */
export type SubmissionPath =
  | 'player_direct'     // Player authors the move proposal unaided via the quest UI
  | 'player_assisted'   // Player completes a challenger.py-backfilled partial draft
  | 'admin_authored'    // Admin authors the face sub-packet constraints; player assembles
  | 'ai_autonomous'     // challenger.py autonomous proposal generation (SLA fallback)

// ---------------------------------------------------------------------------
// Face sub-packet completion state
// ---------------------------------------------------------------------------

/**
 * Lifecycle of a single face sub-packet during the orientation quest session.
 * - pending:     Sub-packet exists but the player has not entered this face path yet.
 * - in_progress: Player has entered this path; draft payload is partially populated.
 * - complete:    Player has submitted a proposal from this face path.
 * - skipped:     Player explicitly bypassed this face during the session.
 */
export type FaceSubPacketState = 'pending' | 'in_progress' | 'complete' | 'skipped'

// ---------------------------------------------------------------------------
// Proposal payload — partial draft of a TransformationMove
// ---------------------------------------------------------------------------

/**
 * Partial draft of a TransformationMove proposal being assembled within a face
 * sub-packet. All fields are optional during authoring; structural completeness
 * is validated at submission time by the structural agent scorer.
 *
 * The fields mirror TransformationMove from the canonical registry so that an
 * approved proposal can be promoted into CANONICAL_MOVES with no shape change.
 *
 * move_id is omitted here — it is assigned by the submission pipeline after approval.
 * parent_move_id is non-null for remix proposals (lineage traceability).
 */
export interface FaceSubPacketPayload {
  // Core identity fields — populated early in the face path
  move_name?: string
  move_category?: MoveCategory
  wcgs_stage?: WcgsStage
  description?: string
  purpose?: string

  // Output and effect fields — populated mid-path
  target_effect?: string
  typical_output_type?: TypicalOutputType
  prompt_templates?: PromptTemplate[]

  // Compatibility fields — populated late in the path or by admin constraints
  compatible_lock_types?: LockType[]
  compatible_emotion_channels?: EmotionChannel[]
  compatible_nations?: string[]
  compatible_archetypes?: string[]

  // Integration and usage — populated last; may be backfilled by challenger.py
  bar_integration?: Partial<BarIntegration>
  quest_usage?: Partial<QuestUsage>
  safety_notes?: string[]

  // Remix lineage — present when player is extending an existing canonical move
  parent_move_id?: string
}

/**
 * Branch-to-field mapping for field-mapping choice type nodes.
 * Each branch key maps to the TransformationMove field the player's choice populates.
 * This lookup is static at compile time — no runtime resolution.
 */
export type BranchFieldMapping = Partial<Record<string, keyof FaceSubPacketPayload>>

// ---------------------------------------------------------------------------
// Extended choiceType — adds 'field_mapping' to the existing union
// ---------------------------------------------------------------------------

/**
 * Extended choiceType for orientation quest nodes.
 * - altitudinal:   Standard 6-face depth branch (existing pattern).
 * - horizontal:    Standard 4-WAVE move branch (existing pattern).
 * - field_mapping: New orientation-quest-specific type; each branch maps to a
 *                  TransformationMove field on the active FaceSubPacketPayload.
 *                  Branch-to-field mapping is a static lookup (BranchFieldMapping).
 */
export type OrientationChoiceType = 'altitudinal' | 'horizontal' | 'field_mapping'

// ---------------------------------------------------------------------------
// Admin-authored face sub-packet constraints
// ---------------------------------------------------------------------------

/**
 * Natural-language constraints authored by an admin in the admin UI.
 * Saved verbatim to the DB; injected into the agent prompt context at
 * prompt-construction time for the relevant face path.
 *
 * No structured schema enforcement here — the admin writes free text that
 * the agent interprets. The admin UI surfaces these constraints inline.
 */
export interface FaceSubPacketConstraints {
  /** Free-text narrative constraint authored by the admin. */
  constraintText: string
  /** ISO 8601 timestamp when the constraint was authored. */
  authoredAt: string
  /** DB user ID of the admin who authored this constraint. */
  authoredByAdminId: string
}

// ---------------------------------------------------------------------------
// Face sub-packet — core building block
// ---------------------------------------------------------------------------

/**
 * A face sub-packet represents one Game Master face's contribution path within
 * the orientation quest. One sub-packet exists per GameMasterFace per session.
 *
 * - face:              Which of the 6 Game Master faces guides this sub-packet.
 * - state:             Lifecycle state (pending → in_progress → complete | skipped).
 * - questNodeIds:      Ordered IDs of the QuestNodes compiled for this face path;
 *                      used to reconstruct the UI path and resume mid-session.
 * - adminConstraints:  Optional admin-authored constraints injected into agent prompts.
 * - payload:           The evolving TransformationMove proposal content.
 * - questProposalId:   Set when the player submits; references quest_proposals.id.
 * - submittedAt:       ISO 8601 timestamp when the proposal was submitted.
 */
export interface FaceSubPacket {
  face: GameMasterFace
  state: FaceSubPacketState
  questNodeIds: string[]
  adminConstraints?: FaceSubPacketConstraints
  payload: FaceSubPacketPayload
  questProposalId?: string
  submittedAt?: string
}

// ---------------------------------------------------------------------------
// Composite quality score
// ---------------------------------------------------------------------------

/**
 * Three-signal composite quality score. Written to quest_proposals.confidenceScore
 * as the sum: adminScore + structuralAgentScore + livePerformanceSignal.
 *
 * - adminScore:            0.0–1.0 score authored by admin in the admin UI review.
 * - structuralAgentScore:  0.0–1.0 score from challenger.py structural completeness
 *                          check (validates all required TransformationMove fields).
 * - livePerformanceSignal: 0.0–1.0 signal derived from player interaction telemetry
 *                          (engagement depth, revisit rate, completion rate).
 * - compositeScore:        Sum of the three signals, normalised to 0.0–1.0.
 */
export interface CompositeQualityScore {
  adminScore: number
  structuralAgentScore: number
  livePerformanceSignal: number
  /** Normalised sum: (adminScore + structuralAgentScore + livePerformanceSignal) / 3 */
  compositeScore: number
  /** ISO 8601 timestamp when the composite was last computed. */
  computedAt: string
}

// ---------------------------------------------------------------------------
// Orientation meta-packet — top-level session container
// ---------------------------------------------------------------------------

/**
 * The OrientationMetaPacket is the top-level container for a player's orientation
 * quest session. It aggregates all six face sub-packets, tracks the active face,
 * records which submission path is in use, and carries the composite quality score
 * once at least one sub-packet is submitted.
 *
 * One OrientationMetaPacket exists per player orientation quest instance.
 * It is serializable (no function references) and safe to store in the DB as JSON.
 */
export interface OrientationMetaPacket {
  /** Unique ID for this orientation quest session (cuid). */
  packetId: string

  /** Player who owns this orientation session. */
  playerId: string

  /**
   * Schema version for forward-compatibility.
   * Increment when the shape of FaceSubPacket or payload changes.
   */
  version: 1

  /**
   * The six face sub-packets, keyed by GameMasterFace.
   * Initialised with state='pending' and empty payload for all 6 faces.
   */
  faceSubPackets: Record<GameMasterFace, FaceSubPacket>

  /**
   * The currently active face path, or null when the player is at the meta level
   * (choosing which face to enter or reviewing completed sub-packets).
   */
  activeFace: GameMasterFace | null

  /**
   * Which of the four submission paths is operative for this session.
   * Recorded at session-init time; does not change mid-session.
   */
  submissionPath: SubmissionPath

  /**
   * Overall session completion state.
   * - active:    Session is open; at least one sub-packet is in progress.
   * - submitted: At least one sub-packet has been submitted (questProposalId set).
   * - closed:    Session explicitly closed by the player or SLA fallback.
   */
  sessionState: 'active' | 'submitted' | 'closed'

  /**
   * Composite quality score — populated after the first sub-packet submission
   * and updated whenever any of the three signals changes.
   */
  qualityScore?: CompositeQualityScore

  /** ISO 8601 timestamp when this meta-packet was created. */
  createdAt: string

  /** ISO 8601 timestamp of the most recent update to any sub-packet. */
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Orientation quest compile input — mirrors QuestCompileInput for the new packet
// ---------------------------------------------------------------------------

/**
 * Input to compileOrientationPacket(). Extends the face-sub-packet structure
 * with per-face node overrides and the static branch-to-field mapping table.
 */
export interface OrientationPacketCompileInput {
  playerId: string
  submissionPath: SubmissionPath

  /**
   * Per-face admin constraints injected at compile time.
   * Only present for the admin_authored path.
   */
  faceConstraints?: Partial<Record<GameMasterFace, FaceSubPacketConstraints>>

  /**
   * Static branch-to-field mapping table for field_mapping choice nodes.
   * Key: nodeId, Value: BranchFieldMapping for that node's choices.
   * Resolved at compile time — no runtime DB lookup.
   */
  fieldMappings?: Record<string, BranchFieldMapping>

  /**
   * Optional subset of faces to include in this orientation instance.
   * Defaults to all 6 when omitted.
   */
  enabledFaces?: GameMasterFace[]
}

// ---------------------------------------------------------------------------
// Type guard helpers
// ---------------------------------------------------------------------------

/** Narrows a string to SubmissionPath. */
export function isSubmissionPath(v: unknown): v is SubmissionPath {
  return (
    v === 'player_direct' ||
    v === 'player_assisted' ||
    v === 'admin_authored' ||
    v === 'ai_autonomous'
  )
}

/** Narrows a string to FaceSubPacketState. */
export function isFaceSubPacketState(v: unknown): v is FaceSubPacketState {
  return v === 'pending' || v === 'in_progress' || v === 'complete' || v === 'skipped'
}

/**
 * Returns a brand-new FaceSubPacket for a given face with all defaults applied.
 * Used by compileOrientationPacket() to initialise each face entry.
 */
export function makeFaceSubPacket(face: GameMasterFace): FaceSubPacket {
  return {
    face,
    state: 'pending',
    questNodeIds: [],
    payload: {},
  }
}

/**
 * Returns a brand-new OrientationMetaPacket with all six face sub-packets
 * initialised to pending/empty. Caller must supply packetId (cuid).
 */
export function makeOrientationMetaPacket(
  packetId: string,
  playerId: string,
  submissionPath: SubmissionPath,
  enabledFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
): OrientationMetaPacket {
  const now = new Date().toISOString()
  const faceSubPackets = {} as Record<GameMasterFace, FaceSubPacket>
  for (const face of enabledFaces) {
    faceSubPackets[face] = makeFaceSubPacket(face)
  }
  return {
    packetId,
    playerId,
    version: 1,
    faceSubPackets,
    activeFace: null,
    submissionPath,
    sessionState: 'active',
    createdAt: now,
    updatedAt: now,
  }
}
