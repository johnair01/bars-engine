/**
 * Alchemy Engine — Channel-Typed BAR Artifact Production
 *
 * Creates and persists BAR artifacts for each phase of the 3-phase CYOA arc.
 * Each BAR is channel-typed: tagged with the emotional channel from the player's
 * alchemy state plus metadata from the Challenger move (for Action phase).
 *
 * BAR channel typing means:
 *   - `type` field: 'intake' | 'action' | 'reflection' (phase identity)
 *   - `nation`: lowercase emotional channel (fear, anger, sadness, joy, neutrality)
 *   - `emotionalAlchemyTag`: same as nation (for query alignment)
 *   - `moveType`: WAVE move (e.g. 'wakeUp')
 *   - `gameMasterFace`: GM face (e.g. 'challenger')
 *   - `strandMetadata`: JSON with full arc provenance
 *
 * Action phase specifically adds Challenger move metadata to the BAR:
 *   - canonicalMoveId (e.g. 'fire_transcend')
 *   - energyDelta
 *   - move element (e.g. 'fire')
 *   - move narrative
 *
 * Non-AI first-class: all BAR production is deterministic from CYOA selections.
 *
 * @see src/actions/alchemy-engine.ts — completeActionPhase uses this module
 * @see src/lib/alchemy-engine/types.ts — CHALLENGER_MOVE_META, PHASE_BAR_CHANNEL_TYPE
 */

import type { EmotionalChannel, GameMasterFace, PersonalMoveType } from '@/lib/quest-grammar/types'
import {
  type ArcPhase,
  type ChallengerMoveId,
  type RegulationState,
  PHASE_BAR_CHANNEL_TYPE,
  PHASE_REGULATION_MAP,
  CHALLENGER_MOVE_META,
  VERTICAL_SLICE,
} from './types'

// ---------------------------------------------------------------------------
// Channel mapping — DB uses lowercase, quest-grammar uses title-case
// ---------------------------------------------------------------------------

const CHANNEL_TYPE_TO_DB: Record<EmotionalChannel, string> = {
  Fear: 'fear', Anger: 'anger', Sadness: 'sadness', Joy: 'joy', Neutrality: 'neutrality',
}

// ---------------------------------------------------------------------------
// BAR Data types (pure, no Prisma dependency)
// ---------------------------------------------------------------------------

/** The data needed to create a channel-typed BAR for any phase. */
export interface BarCreateData {
  creatorId: string
  title: string
  description: string
  /** Phase type: 'intake' | 'action' | 'reflection' */
  type: string
  /** WAVE move (e.g. 'wakeUp') */
  moveType: string
  /** GM face (e.g. 'challenger') */
  gameMasterFace: string
  /** BAR lifecycle status */
  status: 'seed' | 'draft' | 'active'
  /** Emotional channel as lowercase nation tag */
  nation: string
  /** Emotional channel alignment tag */
  emotionalAlchemyTag: string
  /** JSON-encoded arc provenance metadata */
  strandMetadata: string
}

/** Parsed strandMetadata for an Action phase BAR. */
export interface ActionBarMetadata {
  alchemyEngine: true
  arcPhase: 'action'
  channel: EmotionalChannel
  regulation: { from: string; to: string }
  waveMove: string
  face: string
  challengerMoveId: ChallengerMoveId
  challengerMove: {
    moveId: ChallengerMoveId
    canonicalMoveId: string
    title: string
    energyDelta: number
    element: string
    narrative: string
  }
}

/** Parsed strandMetadata for an Intake phase BAR. */
export interface IntakeBarMetadata {
  alchemyEngine: true
  arcPhase: 'intake'
  channel: EmotionalChannel
  regulation: { from: string; to: string }
  waveMove: string
  face: string
}

/** Parsed strandMetadata for a Reflection phase BAR. */
export interface ReflectionBarMetadata {
  alchemyEngine: true
  arcPhase: 'reflection'
  channel: EmotionalChannel
  regulation: { from: string; to: string }
  waveMove: string
  face: string
  /** Reflection BAR IS the epiphany — no separate model */
  isEpiphany: true
  /** References to intake + action BAR IDs for traceability */
  intakeBarId?: string
  actionBarId?: string
  /**
   * Provenance of how the reflection content was created.
   * Tracks the player's creative process: CYOA selection, editing, or freeform.
   * This is metadata — it does not affect the BAR content itself.
   */
  reflectionSource?: {
    /** How the player created their reflection: CYOA selection or freeform writing */
    mode: 'cyoa' | 'freeform'
    /** If CYOA mode, which completion template was selected */
    selectedCompletionId?: string
    /** If CYOA mode, whether the player customized/edited the selected completion */
    isCustomized?: boolean
  }
}

// ---------------------------------------------------------------------------
// Pure data builders (no DB, testable)
// ---------------------------------------------------------------------------

/** Context for building an Action phase BAR. */
export interface ActionBarContext {
  playerId: string
  channel: EmotionalChannel
  moveId: ChallengerMoveId
  response: string
  responseTitle?: string
  waveMove?: PersonalMoveType
  face?: GameMasterFace
}

/**
 * Build the data payload for an Action phase BAR.
 *
 * This is the core channel-typing logic:
 *   1. Maps the emotional channel to lowercase DB format for nation + tag
 *   2. Resolves the Challenger move's canonical metadata
 *   3. Generates a title from the move + channel if not provided
 *   4. Packages full provenance in strandMetadata JSON
 *
 * Pure function — no DB access, fully testable.
 */
export function buildActionBarData(ctx: ActionBarContext): BarCreateData {
  const moveMeta = CHALLENGER_MOVE_META[ctx.moveId]
  const channelDb = CHANNEL_TYPE_TO_DB[ctx.channel]
  const waveMove = ctx.waveMove ?? VERTICAL_SLICE.waveMove
  const face = ctx.face ?? VERTICAL_SLICE.face

  const title = ctx.responseTitle || `${moveMeta.title} — ${ctx.channel} Action`

  const metadata: ActionBarMetadata = {
    alchemyEngine: true,
    arcPhase: 'action',
    channel: ctx.channel,
    regulation: {
      from: PHASE_REGULATION_MAP.action.from,
      to: PHASE_REGULATION_MAP.action.to,
    },
    waveMove,
    face,
    challengerMoveId: ctx.moveId,
    challengerMove: {
      moveId: ctx.moveId,
      canonicalMoveId: moveMeta.canonicalMoveId,
      title: moveMeta.title,
      energyDelta: moveMeta.energyDelta,
      element: moveMeta.element,
      narrative: moveMeta.narrative,
    },
  }

  return {
    creatorId: ctx.playerId,
    title,
    description: ctx.response,
    type: PHASE_BAR_CHANNEL_TYPE.action,
    moveType: waveMove,
    gameMasterFace: face,
    status: 'seed',
    nation: channelDb,
    emotionalAlchemyTag: channelDb,
    strandMetadata: JSON.stringify(metadata),
  }
}

/** Context for building an Intake phase BAR. */
export interface IntakeBarContext {
  playerId: string
  channel: EmotionalChannel
  content: string
  title?: string
  waveMove?: PersonalMoveType
  face?: GameMasterFace
}

/**
 * Build the data payload for an Intake phase BAR.
 * Pure function — no DB access.
 */
export function buildIntakeBarData(ctx: IntakeBarContext): BarCreateData {
  const channelDb = CHANNEL_TYPE_TO_DB[ctx.channel]
  const waveMove = ctx.waveMove ?? VERTICAL_SLICE.waveMove
  const face = ctx.face ?? VERTICAL_SLICE.face

  const title = ctx.title || `Wake Up — ${ctx.channel} Intake`

  const metadata: IntakeBarMetadata = {
    alchemyEngine: true,
    arcPhase: 'intake',
    channel: ctx.channel,
    regulation: {
      from: PHASE_REGULATION_MAP.intake.from,
      to: PHASE_REGULATION_MAP.intake.to,
    },
    waveMove,
    face,
  }

  return {
    creatorId: ctx.playerId,
    title,
    description: ctx.content.trim() || 'Intake phase completed.',
    type: PHASE_BAR_CHANNEL_TYPE.intake,
    moveType: waveMove,
    gameMasterFace: face,
    status: 'seed',
    nation: channelDb,
    emotionalAlchemyTag: channelDb,
    strandMetadata: JSON.stringify(metadata),
  }
}

/** Context for building a Reflection phase BAR (the epiphany artifact). */
export interface ReflectionBarContext {
  playerId: string
  channel: EmotionalChannel
  content: string
  title?: string
  waveMove?: PersonalMoveType
  face?: GameMasterFace
  /** Reference to intake BAR for provenance chain. */
  intakeBarId?: string
  /** Reference to action BAR for provenance chain. */
  actionBarId?: string
  /**
   * How the reflection content was created.
   * Passed through to strandMetadata.reflectionSource for provenance tracking.
   */
  reflectionSource?: {
    mode: 'cyoa' | 'freeform'
    selectedCompletionId?: string
    isCustomized?: boolean
  }
}

/**
 * Build the data payload for a Reflection phase BAR.
 *
 * Key invariant: this BAR IS the epiphany. No separate Epiphany model.
 * The `isEpiphany: true` flag in strandMetadata marks this.
 *
 * Pure function — no DB access.
 */
export function buildReflectionBarData(ctx: ReflectionBarContext): BarCreateData {
  const channelDb = CHANNEL_TYPE_TO_DB[ctx.channel]
  const waveMove = ctx.waveMove ?? VERTICAL_SLICE.waveMove
  const face = ctx.face ?? VERTICAL_SLICE.face

  const title = ctx.title || `${ctx.channel} Epiphany — Wake Up`

  const metadata: ReflectionBarMetadata = {
    alchemyEngine: true,
    arcPhase: 'reflection',
    channel: ctx.channel,
    regulation: {
      from: PHASE_REGULATION_MAP.reflection.from,
      to: PHASE_REGULATION_MAP.reflection.to,
    },
    waveMove,
    face,
    isEpiphany: true,
    intakeBarId: ctx.intakeBarId,
    actionBarId: ctx.actionBarId,
    ...(ctx.reflectionSource ? { reflectionSource: ctx.reflectionSource } : {}),
  }

  return {
    creatorId: ctx.playerId,
    title,
    description: ctx.content.trim() || 'Reflection phase completed.',
    type: PHASE_BAR_CHANNEL_TYPE.reflection,
    moveType: waveMove,
    gameMasterFace: face,
    status: 'seed',
    nation: channelDb,
    emotionalAlchemyTag: channelDb,
    strandMetadata: JSON.stringify(metadata),
  }
}

// ---------------------------------------------------------------------------
// DB persistence (used within Prisma transactions)
// ---------------------------------------------------------------------------

/**
 * Persist a channel-typed BAR within a Prisma transaction.
 *
 * Takes the pure BarCreateData from a build*BarData() function
 * and writes it to the CustomBar table.
 *
 * @param tx - Prisma transaction client
 * @param data - BAR data payload from buildActionBarData/buildIntakeBarData/buildReflectionBarData
 * @returns The created BAR's id
 */
export async function persistBarInTransaction(
  tx: any, // Prisma transaction client type
  data: BarCreateData,
): Promise<string> {
  // AC 8: Enforce that all alchemy engine BARs are typed to Wake Up
  assertWakeUpTyping(data)

  const bar = await tx.customBar.create({
    data: {
      creatorId: data.creatorId,
      title: data.title,
      description: data.description,
      type: data.type,
      moveType: data.moveType,
      gameMasterFace: data.gameMasterFace,
      status: data.status,
      nation: data.nation,
      emotionalAlchemyTag: data.emotionalAlchemyTag,
      strandMetadata: data.strandMetadata,
    },
  })
  return bar.id
}

// ---------------------------------------------------------------------------
// Vertical slice guard: All 3 BARs must be typed to Wake Up (AC 8)
// ---------------------------------------------------------------------------

/**
 * Validate that a BarCreateData is correctly typed to the vertical slice WAVE move.
 * Throws if the BAR's moveType doesn't match VERTICAL_SLICE.waveMove.
 *
 * This enforces AC 8: "All 3 BARs typed to Wake Up".
 */
export function assertWakeUpTyping(data: BarCreateData): void {
  if (data.moveType !== VERTICAL_SLICE.waveMove) {
    throw new Error(
      `BAR moveType must be '${VERTICAL_SLICE.waveMove}' (Wake Up) for vertical slice, got '${data.moveType}'`,
    )
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Parse the strandMetadata JSON from a BAR to extract alchemy engine provenance.
 * Returns null if the BAR is not an alchemy engine BAR.
 */
export function parseBarAlchemyMetadata(
  strandMetadata: string | null,
): ActionBarMetadata | IntakeBarMetadata | ReflectionBarMetadata | null {
  if (!strandMetadata) return null
  try {
    const parsed = JSON.parse(strandMetadata)
    if (parsed?.alchemyEngine !== true) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Check if a BAR is a channel-typed alchemy engine BAR.
 */
export function isAlchemyBar(strandMetadata: string | null): boolean {
  return parseBarAlchemyMetadata(strandMetadata) !== null
}

/**
 * Get the Challenger move from an Action BAR's metadata.
 * Returns null if the BAR is not an action-phase alchemy BAR.
 */
export function getActionBarChallengerMove(
  strandMetadata: string | null,
): ActionBarMetadata['challengerMove'] | null {
  const meta = parseBarAlchemyMetadata(strandMetadata)
  if (!meta || meta.arcPhase !== 'action') return null
  return (meta as ActionBarMetadata).challengerMove ?? null
}

/**
 * Derive the canonical move element from a Challenger move ID.
 * Used to determine the Wuxing element associated with the BAR.
 */
export function getChallengerMoveElement(moveId: ChallengerMoveId): string {
  return CHALLENGER_MOVE_META[moveId].element
}

/**
 * Derive the energy delta from a Challenger move ID.
 */
export function getChallengerMoveEnergyDelta(moveId: ChallengerMoveId): number {
  return CHALLENGER_MOVE_META[moveId].energyDelta
}
