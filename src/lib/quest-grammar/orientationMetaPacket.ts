/**
 * Orientation Quest Meta-Packet — Dispatch, Compile & Completion Tracking
 *
 * Two responsibilities in one module:
 *
 *   1. COMPILE / DISPATCH (Sub-AC 3):
 *      compileOrientationMetaPacket() produces a SerializableQuestPacket.
 *      Dispatch logic resolves and emits all 6 GM-face sub-packets,
 *      wiring the face-selection hub to each sub-packet's start node.
 *      @see orientationFaceSubPacket.ts — individual face sub-packet compiler
 *
 *   2. STATE MANAGEMENT (Sub-AC 4):
 *      Pure state transitions for any-order sub-packet completion tracking.
 *      The meta-packet marks itself complete when ALL 6 sub-packets finish.
 *
 * @see Goal: orientation quest system / AC 1
 * @see src/lib/quest-grammar/types.ts — GameMasterFace, GAME_MASTER_FACES
 */

import { GAME_MASTER_FACES, FACE_META } from './types'
import { compileFaceSubPacketWithConvergence } from './orientationFaceSubPacket'
import type {
  GameMasterFace,
  SerializableQuestPacket,
  QuestNode,
  Choice,
  SegmentVariant,
} from './types'

// ===========================================================================
// SECTION 1 — COMPILE / DISPATCH LOGIC (Sub-AC 3)
// ===========================================================================

export interface OrientationMetaPacketInput {
  segment?: SegmentVariant
  /**
   * Restrict which faces appear in the dispatch hub.
   * Defaults to all 6 GAME_MASTER_FACES.
   * Supports I Ching hexagram filtering (mirrors compileQuestCore pattern).
   */
  enabledFaces?: GameMasterFace[]
}

// ── Node text constants ────────────────────────────────────────────────────

const ORIENTATION_INTRO_TEXT = [
  `**The Orientation Quest** — You are entering the BARs Engine.`,
  ``,
  `Six Game Master Faces await. Each offers a different lens for transformation.`,
  `Choose a face to begin co-creating a TransformationMove proposal — a real`,
  `contribution to the shared move registry that guides how players grow.`,
].join('\n')

const FACE_HUB_TEXT =
  '**Choose your Game Master face.** Which lens will guide your TransformationMove proposal?'

const ORIENTATION_TERMINAL_TEXT = [
  `**Proposal submitted.** Your TransformationMove draft has entered the review queue.`,
  ``,
  `When approved, your move joins the canon — shaping how every future player`,
  `encounters transformation in the BARs Engine.`,
].join('\n')

// ── Meta-packet compiler ───────────────────────────────────────────────────

/**
 * Compile the orientation quest meta-packet.
 *
 * Dispatch logic wiring:
 *
 *   orient_intro
 *       │ Continue
 *       ▼
 *   orient_face_hub  ──┬─ Shaman     ──▶ orient_shaman_shaman_intro         ──▶ … ──▶ orient_terminal
 *   (dispatch hub)     ├─ Challenger ──▶ orient_challenger_challenger_intro  ──▶ … ──▶ orient_terminal
 *                      ├─ Regent     ──▶ orient_regent_regent_intro          ──▶ … ──▶ orient_terminal
 *                      ├─ Architect  ──▶ orient_architect_architect_intro    ──▶ … ──▶ orient_terminal
 *                      ├─ Diplomat   ──▶ orient_diplomat_diplomat_intro      ──▶ … ──▶ orient_terminal
 *                      └─ Sage       ──▶ orient_sage_sage_intro              ──▶ … ──▶ orient_terminal
 *
 *   orient_terminal  (shared convergence — no further choices)
 *
 * Each face sub-packet contains 6 content beats + 1 terminal node.
 * The terminal node is patched during dispatch to point to orient_terminal.
 *
 * Algorithm:
 *   1. Pre-compile all enabled face sub-packets (gets actual startNodeIds)
 *   2. Build dispatch hub choices using compiled startNodeIds
 *   3. Include all face nodes in the unified packet
 *   4. Append shared terminal
 */
export function compileOrientationMetaPacket(
  input: OrientationMetaPacketInput = {}
): SerializableQuestPacket {
  const { segment = 'player', enabledFaces = GAME_MASTER_FACES } = input
  const nodes: QuestNode[] = []

  // ── STEP 1: Pre-compile face sub-packets ─────────────────────────────────
  // Compile each face sub-packet first so we have actual startNodeIds for
  // the hub choices. Terminals are patched to converge to 'orient_terminal'.
  const faceResults = new Map<GameMasterFace, { nodes: QuestNode[]; startNodeId: string }>()
  for (const face of enabledFaces) {
    const result = compileFaceSubPacketWithConvergence(face, 'orient_terminal', segment)
    faceResults.set(face, result)
  }

  // ── STEP 2: Intro node ───────────────────────────────────────────────────
  nodes.push({
    id: 'orient_intro',
    beatType: 'orientation',
    wordCountEstimate: 60,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: ORIENTATION_INTRO_TEXT,
    choices: [{ text: 'Choose my face', targetId: 'orient_face_hub' }],
    anchors: { goal: 'orientation' },
  })

  // ── STEP 3: Dispatch hub — wired to each face's actual startNodeId ────────
  // Hub choices use the real startNodeIds returned from compileFaceSubPacket,
  // not hardcoded IDs. This ensures the wiring survives any naming changes
  // in the face sub-packet compilers.
  const hubChoices: Choice[] = enabledFaces.map((face) => {
    const meta = FACE_META[face]
    const result = faceResults.get(face)!
    return {
      text: `${meta?.label ?? face}: ${meta?.role ?? ''}`,
      targetId: result.startNodeId,
    }
  })

  nodes.push({
    id: 'orient_face_hub',
    beatType: 'tension',
    wordCountEstimate: 30,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: FACE_HUB_TEXT,
    choices: hubChoices,
    anchors: {},
    choiceType: 'altitudinal',
    enabledFaces,
  })

  // ── STEP 4: Emit all face sub-packet nodes ────────────────────────────────
  // Each face sub-packet is fully compiled at this point (not lazily).
  // Sub-packet terminals are already patched to converge to 'orient_terminal'.
  for (const face of enabledFaces) {
    const result = faceResults.get(face)!
    nodes.push(...result.nodes)
  }

  // ── STEP 5: Shared terminal convergence ──────────────────────────────────
  // All face sub-packet terminal nodes point here (patched in step 1).
  nodes.push({
    id: 'orient_terminal',
    beatType: 'consequence',
    wordCountEstimate: 35,
    emotional: { channel: 'Joy', movement: 'translate' },
    text: ORIENTATION_TERMINAL_TEXT,
    choices: [],
    anchors: {
      identityCue: 'co-creator',
      consequenceCue: 'proposal queued',
    },
  })

  return {
    signature: {
      primaryChannel: 'Neutrality',
      dissatisfiedLabels: [],
      satisfiedLabels: [],
      movementPerNode: [],
      shadowVoices: [],
    },
    nodes,
    segmentVariant: segment,
    startNodeId: 'orient_intro',
  }
}

/**
 * Return the expected node IDs for a compiled orientation meta-packet.
 * Compiles each face sub-packet to get actual node IDs (not hardcoded).
 * Useful for validation, testing, and link-checking.
 *
 * @param faces - Defaults to all 6 GAME_MASTER_FACES.
 * @param segment - Segment variant (affects sub-packet compilation).
 */
export function getOrientationMetaPacketNodeIds(
  faces: GameMasterFace[] = GAME_MASTER_FACES,
  segment: SegmentVariant = 'player'
): string[] {
  // Compile the full packet to get accurate node IDs
  const packet = compileOrientationMetaPacket({ enabledFaces: faces, segment })
  return packet.nodes.map((n) => n.id)
}

// ===========================================================================
// SECTION 2 — STATE MANAGEMENT (Sub-AC 4)
// ===========================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The 6 GM-face sub-packets that compose the orientation meta-packet. */
export const ORIENTATION_SUB_PACKET_FACES: readonly GameMasterFace[] = GAME_MASTER_FACES

/** Total number of sub-packets required for meta-packet completion. */
export const ORIENTATION_SUB_PACKET_COUNT = ORIENTATION_SUB_PACKET_FACES.length // 6

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Lifecycle state of a single GM-face sub-packet. */
export type SubPacketStatus = 'pending' | 'in_progress' | 'complete'

/** State record for one GM-face sub-packet. */
export interface SubPacketState {
  /** Which GM face this sub-packet belongs to. */
  face: GameMasterFace
  /** Current lifecycle status. */
  status: SubPacketStatus
  /** ISO timestamp set when status transitions to 'complete'. */
  completedAt?: string
  /** ISO timestamp set when status first transitions to 'in_progress'. */
  startedAt?: string
}

/**
 * State for the orientation meta-packet.
 *
 * Sub-packets are keyed by GameMasterFace and tracked independently —
 * no ordering constraint is imposed. The meta-packet's own `completedAt`
 * is set automatically when every sub-packet reaches 'complete'.
 */
export interface OrientationMetaPacketState {
  /** Stable ID for this meta-packet instance (e.g. cuid or player-scoped key). */
  packetId: string
  /**
   * Independent state for each of the 6 GM-face sub-packets.
   * All 6 faces are always present; none are optional.
   */
  subPackets: Record<GameMasterFace, SubPacketState>
  /**
   * ISO timestamp set when ALL 6 sub-packets have reached 'complete'.
   * Undefined until the meta-packet itself is complete.
   */
  completedAt?: string
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create the initial meta-packet state with all 6 sub-packets in 'pending'.
 *
 * @param packetId - Stable identifier for this orientation meta-packet.
 */
export function createInitialMetaPacketState(packetId: string): OrientationMetaPacketState {
  const subPackets = Object.fromEntries(
    ORIENTATION_SUB_PACKET_FACES.map((face) => [
      face,
      { face, status: 'pending' as SubPacketStatus },
    ])
  ) as Record<GameMasterFace, SubPacketState>

  return { packetId, subPackets }
}

// ---------------------------------------------------------------------------
// State transitions (pure — always return new state objects)
// ---------------------------------------------------------------------------

/**
 * Transition a sub-packet from 'pending' to 'in_progress'.
 *
 * - Idempotent if the sub-packet is already 'in_progress'.
 * - No-op (returns unchanged state) if the sub-packet is already 'complete'.
 *
 * @param state  Current meta-packet state.
 * @param face   The GM face whose sub-packet is being started.
 * @param now    Optional ISO timestamp (defaults to `new Date().toISOString()`).
 */
export function startSubPacket(
  state: OrientationMetaPacketState,
  face: GameMasterFace,
  now?: string
): OrientationMetaPacketState {
  const current = state.subPackets[face]

  // Already complete — no regression
  if (current.status === 'complete') return state
  // Already in progress — idempotent
  if (current.status === 'in_progress') return state

  const timestamp = now ?? new Date().toISOString()
  return {
    ...state,
    subPackets: {
      ...state.subPackets,
      [face]: { ...current, status: 'in_progress', startedAt: timestamp },
    },
  }
}

/**
 * Mark a GM-face sub-packet as complete and, if all 6 are now complete,
 * seal the meta-packet itself by setting `completedAt`.
 *
 * - Idempotent: marking an already-complete sub-packet returns unchanged state.
 * - Any-order: all 6 faces are independent; there is no required sequence.
 *
 * @param state  Current meta-packet state.
 * @param face   The GM face whose sub-packet has been completed.
 * @param now    Optional ISO timestamp (defaults to `new Date().toISOString()`).
 */
export function markSubPacketComplete(
  state: OrientationMetaPacketState,
  face: GameMasterFace,
  now?: string
): OrientationMetaPacketState {
  const current = state.subPackets[face]

  // Idempotent — already complete
  if (current.status === 'complete') return state

  const timestamp = now ?? new Date().toISOString()

  const updatedSubPackets: Record<GameMasterFace, SubPacketState> = {
    ...state.subPackets,
    [face]: {
      ...current,
      status: 'complete',
      completedAt: timestamp,
      // Preserve startedAt; if the sub-packet was never explicitly started,
      // record the completion time as the implicit start too.
      startedAt: current.startedAt ?? timestamp,
    },
  }

  // Check whether ALL 6 sub-packets are now complete
  const allComplete = ORIENTATION_SUB_PACKET_FACES.every(
    (f) => updatedSubPackets[f].status === 'complete'
  )

  return {
    ...state,
    subPackets: updatedSubPackets,
    completedAt: allComplete ? (state.completedAt ?? timestamp) : state.completedAt,
  }
}

// ---------------------------------------------------------------------------
// Read-only queries (pure)
// ---------------------------------------------------------------------------

/**
 * Returns `true` when every GM-face sub-packet has reached 'complete'.
 *
 * This is the canonical completion predicate for the orientation meta-packet.
 */
export function isMetaPacketComplete(state: OrientationMetaPacketState): boolean {
  return ORIENTATION_SUB_PACKET_FACES.every(
    (face) => state.subPackets[face].status === 'complete'
  )
}

/** Returns the set of GM faces whose sub-packets have been completed, in completion order. */
export function getCompletedSubPackets(state: OrientationMetaPacketState): GameMasterFace[] {
  return ORIENTATION_SUB_PACKET_FACES.filter(
    (face) => state.subPackets[face].status === 'complete'
  ).sort((a, b) => {
    const ta = state.subPackets[a].completedAt ?? ''
    const tb = state.subPackets[b].completedAt ?? ''
    return ta < tb ? -1 : ta > tb ? 1 : 0
  })
}

/** Returns the set of GM faces whose sub-packets have NOT yet been completed. */
export function getPendingSubPackets(state: OrientationMetaPacketState): GameMasterFace[] {
  return ORIENTATION_SUB_PACKET_FACES.filter(
    (face) => state.subPackets[face].status !== 'complete'
  )
}

/** Returns the set of GM faces whose sub-packets are currently in progress. */
export function getInProgressSubPackets(state: OrientationMetaPacketState): GameMasterFace[] {
  return ORIENTATION_SUB_PACKET_FACES.filter(
    (face) => state.subPackets[face].status === 'in_progress'
  )
}

/**
 * Returns a progress summary: how many sub-packets are complete out of the total.
 *
 * @example
 *   const { completed, total } = getMetaPacketProgress(state)
 *   // => { completed: 3, total: 6 }
 */
export function getMetaPacketProgress(state: OrientationMetaPacketState): {
  completed: number
  total: number
  percentComplete: number
} {
  const completed = getCompletedSubPackets(state).length
  const total = ORIENTATION_SUB_PACKET_COUNT
  return {
    completed,
    total,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}
