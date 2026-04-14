/**
 * Alchemy Engine — Reflection Aggregator
 *
 * Collects and structures player responses from Intake and Action phases
 * into a summary context object for reflection generation.
 *
 * The Reflection phase needs to synthesize:
 *   1. Intake: what the player named as their dissatisfaction (CYOA selections + freeform)
 *   2. Action: which Challenger move they chose and their commitment response
 *   3. Emotional context: channel, regulation trajectory, face, wave move
 *
 * Non-AI first-class: the aggregated context can drive both:
 *   - CYOA-based reflection prompts (static, no AI)
 *   - AI-augmented reflection generation (optional enhancement)
 *
 * Key invariant: Reflection BAR IS the epiphany artifact.
 * This aggregator produces the raw material from which that BAR is formed.
 *
 * @see src/actions/alchemy-engine.ts — completeIntakePhase, completeActionPhase
 * @see src/lib/alchemy-engine/types.ts — CHALLENGER_MOVE_META, PHASE_REGULATION_MAP
 */

import { db } from '@/lib/db'
import type { EmotionalChannel, GameMasterFace, PersonalMoveType } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import {
  type ArcPhase,
  type ChallengerMoveId,
  PHASE_REGULATION_MAP,
  CHALLENGER_MOVE_META,
  isChallengerMoveId,
  VERTICAL_SLICE,
} from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Structured summary of Intake phase responses. */
export interface IntakePhaseData {
  /** The BAR id created during intake completion. */
  barId: string
  /** BAR title (e.g. "Wake Up — Fear Intake") */
  title: string
  /** Player's intake content — CYOA selection summary or freeform text. */
  content: string
  /** Emotional channel at time of intake. */
  channel: string
  /** Regulation at start of intake (always 'dissatisfied'). */
  regulationFrom: AlchemyAltitude
  /** Regulation after intake completion (always 'neutral'). */
  regulationTo: AlchemyAltitude
  /** When the intake BAR was created. */
  createdAt: Date
}

/** Structured summary of Action phase responses. */
export interface ActionPhaseData {
  /** The BAR id created during action completion. */
  barId: string
  /** BAR title. */
  title: string
  /** Player's action response — their commitment/declaration text. */
  content: string
  /** Which Challenger move was selected. */
  moveId: ChallengerMoveId | null
  /** Display name of the selected move. */
  moveTitle: string
  /** Canonical move ID (e.g. 'fire_transcend'). */
  canonicalMoveId: string | null
  /** Energy delta from the selected move. */
  energyDelta: number
  /** Move narrative (e.g. "Anger → boundary honored"). */
  moveNarrative: string
  /** Emotional channel at time of action. */
  channel: string
  /** Regulation during action (stays 'neutral'). */
  regulationFrom: AlchemyAltitude
  /** Regulation after action completion (stays 'neutral'). */
  regulationTo: AlchemyAltitude
  /** When the action BAR was created. */
  createdAt: Date
}

/**
 * Full arc context aggregated from Intake + Action phases.
 * This is the input for reflection generation (both CYOA and AI paths).
 */
export interface ReflectionContext {
  /** Player ID. */
  playerId: string

  /** Emotional channel for the entire arc. */
  channel: EmotionalChannel

  /** GM face locked for this arc (vertical slice: 'challenger'). */
  face: GameMasterFace

  /** WAVE move locked for this arc (vertical slice: 'wakeUp'). */
  waveMove: PersonalMoveType

  /** Current arc phase (should be 'reflection' when this is called). */
  currentPhase: ArcPhase

  /** When the arc started. */
  arcStartedAt: Date | null

  /** Regulation trajectory: dissatisfied → neutral → (pending) satisfied. */
  regulationTrajectory: {
    intake: { from: AlchemyAltitude; to: AlchemyAltitude }
    action: { from: AlchemyAltitude; to: AlchemyAltitude }
    reflection: { from: AlchemyAltitude; to: AlchemyAltitude }
  }

  /** Intake phase data (BAR + player responses). */
  intake: IntakePhaseData

  /** Action phase data (BAR + player responses + move selection). */
  action: ActionPhaseData

  /**
   * Human-readable arc summary for CYOA reflection prompts.
   * Structured as a narrative thread the player can review before reflecting.
   * No AI needed — purely derived from CYOA selections.
   */
  narrativeSummary: string

  /**
   * Structured prompts for the Reflection phase CYOA.
   * Each prompt is derived from the player's prior selections.
   * Non-AI path uses these directly; AI path can use them as context.
   */
  reflectionPrompts: ReflectionPrompt[]
}

/** A single reflection prompt derived from prior phase data. */
export interface ReflectionPrompt {
  /** Prompt key for identification. */
  key: string
  /** The question/prompt text shown to the player. */
  text: string
  /** Which phase this prompt draws from. */
  sourcePhase: 'intake' | 'action' | 'both'
  /** Optional placeholder text for the response field. */
  placeholder?: string
}

// ---------------------------------------------------------------------------
// Channel case mapping (DB lowercase → type title-case)
// ---------------------------------------------------------------------------

const CHANNEL_DB_TO_TYPE: Record<string, EmotionalChannel> = {
  fear: 'Fear', anger: 'Anger', sadness: 'Sadness', joy: 'Joy', neutrality: 'Neutrality',
}

// ---------------------------------------------------------------------------
// BAR metadata parsing
// ---------------------------------------------------------------------------

interface BarAlchemyMetadata {
  alchemyEngine?: boolean
  arcPhase?: ArcPhase
  channel?: string
  regulation?: { from: string; to: string }
  waveMove?: string
  face?: string
  /** Legacy top-level move ID (may exist in older BARs). */
  challengerMoveId?: string
  /** Nested challenger move object (current format from alchemy-engine actions). */
  challengerMove?: {
    moveId?: string
    canonicalMoveId?: string
    title?: string
    energyDelta?: number
    element?: string
    narrative?: string
  }
}

/** Safely parse strandMetadata JSON from a BAR. */
function parseBarMetadata(raw: string | null): BarAlchemyMetadata {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as BarAlchemyMetadata
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// Narrative summary builder (non-AI, CYOA-derived)
// ---------------------------------------------------------------------------

/**
 * Build a human-readable narrative summary from intake + action data.
 * This is the non-AI reflection path — no language model needed.
 */
function buildNarrativeSummary(
  intake: IntakePhaseData,
  action: ActionPhaseData,
  channel: EmotionalChannel,
  face: GameMasterFace,
): string {
  const lines: string[] = []

  lines.push(`Arc: ${face} face / Wake Up`)
  lines.push(`Channel: ${channel}`)
  lines.push('')

  // Intake summary
  lines.push('--- Intake (What you named) ---')
  lines.push(intake.content || '(No intake content recorded)')
  lines.push('')

  // Action summary
  lines.push('--- Action (What you committed to) ---')
  lines.push(`Move: ${action.moveTitle}`)
  if (action.moveNarrative) {
    lines.push(`Pattern: ${action.moveNarrative}`)
  }
  lines.push(action.content || '(No action response recorded)')
  lines.push('')

  // Trajectory
  lines.push('--- Your Journey ---')
  lines.push(`Started: dissatisfied (something needed naming)`)
  lines.push(`After intake: neutral (the thing was named)`)
  lines.push(`After action: neutral (commitment was made)`)
  lines.push(`Now entering: reflection (what did this reveal?)`)

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Reflection prompt generation (non-AI, CYOA-derived)
// ---------------------------------------------------------------------------

/**
 * Generate reflection prompts tailored to the player's intake + action.
 * These are the CYOA choices/questions for the Reflection phase.
 * Non-AI first-class: all prompts are derived from selections, not generated.
 */
function buildReflectionPrompts(
  intake: IntakePhaseData,
  action: ActionPhaseData,
  channel: EmotionalChannel,
): ReflectionPrompt[] {
  const prompts: ReflectionPrompt[] = []

  // Prompt 1: Bridge intake → action (what did naming it change?)
  prompts.push({
    key: 'naming_impact',
    text: `You named your dissatisfaction in ${channel}. Then you chose to "${action.moveTitle}." What shifted between naming it and acting on it?`,
    sourcePhase: 'both',
    placeholder: 'What changed when you moved from naming to acting...',
  })

  // Prompt 2: Evaluate the action (did it land?)
  const actionSpecificPrompt = action.moveId === 'issue_challenge'
    ? 'You issued a challenge — you named what you\'ve been avoiding. Did the boundary feel real once you said it?'
    : 'You declared an intention — a clear commitment with no hedging. Does the intention still hold now that you\'re looking back?'

  prompts.push({
    key: 'action_evaluation',
    text: actionSpecificPrompt,
    sourcePhase: 'action',
    placeholder: 'Looking back at what I committed to...',
  })

  // Prompt 3: Epiphany seed (the core reflection that becomes the BAR)
  prompts.push({
    key: 'epiphany',
    text: 'What do you see now that you couldn\'t see before this arc? This is the insight — the thing that makes the journey worth recording.',
    sourcePhase: 'both',
    placeholder: 'The thing I see now is...',
  })

  return prompts
}

// ---------------------------------------------------------------------------
// Core aggregator: fetch + structure
// ---------------------------------------------------------------------------

/**
 * Aggregate player responses from Intake and Action phases into a
 * structured ReflectionContext for the Reflection phase.
 *
 * Queries:
 *   1. AlchemyPlayerState for current arc metadata
 *   2. CustomBar records typed as 'intake' and 'action' for this player's current arc
 *
 * Validates:
 *   - Player has an active arc in 'reflection' phase
 *   - Both intake and action BARs exist
 *
 * Returns null with an error string if validation fails.
 */
export async function aggregateReflectionContext(
  playerId: string,
): Promise<{ context: ReflectionContext; error?: never } | { context?: never; error: string }> {
  // ── 1. Load player state ────────────────────────────────────────────────────
  const playerState = await db.alchemyPlayerState.findUnique({
    where: { playerId },
  })

  if (!playerState) {
    return { error: 'No alchemy engine state found. Start an arc first.' }
  }

  if (playerState.arcPhase !== 'reflection') {
    return {
      error: `Cannot aggregate reflection context: current phase is '${playerState.arcPhase ?? 'none'}', expected 'reflection'.`,
    }
  }

  // ── 2. Find Intake + Action BARs for this arc ──────────────────────────────
  // BARs are scoped to this player + arc by:
  //   - creatorId = playerId
  //   - type = 'intake' or 'action'
  //   - created after arcStartedAt
  const arcStartedAt = playerState.arcStartedAt ?? new Date(0)

  const arcBars = await db.customBar.findMany({
    where: {
      creatorId: playerId,
      type: { in: ['intake', 'action'] },
      createdAt: { gte: arcStartedAt },
    },
    orderBy: { createdAt: 'asc' },
  })

  const intakeBar = arcBars.find((b) => b.type === 'intake')
  const actionBar = arcBars.find((b) => b.type === 'action')

  if (!intakeBar) {
    return { error: 'Intake BAR not found for current arc. Complete intake phase first.' }
  }

  if (!actionBar) {
    return { error: 'Action BAR not found for current arc. Complete action phase first.' }
  }

  // ── 3. Parse BAR metadata ──────────────────────────────────────────────────
  const intakeMeta = parseBarMetadata(intakeBar.strandMetadata)
  const actionMeta = parseBarMetadata(actionBar.strandMetadata)

  // ── 4. Resolve move from action BAR metadata ──────────────────────────────
  // Support both legacy `challengerMoveId` and current nested `challengerMove.moveId`
  const rawMoveId = actionMeta.challengerMove?.moveId ?? actionMeta.challengerMoveId ?? null
  const moveId: ChallengerMoveId | null = isChallengerMoveId(rawMoveId) ? rawMoveId : null
  const moveMeta = moveId ? CHALLENGER_MOVE_META[moveId] : null

  // ── 5. Resolve emotional channel ──────────────────────────────────────────
  const channelDb = playerState.channel ?? 'neutrality'
  const channel: EmotionalChannel = CHANNEL_DB_TO_TYPE[channelDb] ?? 'Neutrality'

  // ── 6. Resolve face + wave move ───────────────────────────────────────────
  const face = (playerState.face as GameMasterFace) ?? VERTICAL_SLICE.face
  const waveMove = (playerState.waveMove as PersonalMoveType) ?? VERTICAL_SLICE.waveMove

  // ── 7. Build structured phase data ────────────────────────────────────────
  const intakeData: IntakePhaseData = {
    barId: intakeBar.id,
    title: intakeBar.title,
    content: intakeBar.description,
    channel: channelDb,
    regulationFrom: PHASE_REGULATION_MAP.intake.from,
    regulationTo: PHASE_REGULATION_MAP.intake.to,
    createdAt: intakeBar.createdAt,
  }

  const actionData: ActionPhaseData = {
    barId: actionBar.id,
    title: actionBar.title,
    content: actionBar.description,
    moveId,
    moveTitle: moveMeta?.title ?? 'Unknown Move',
    canonicalMoveId: moveMeta?.canonicalMoveId ?? null,
    energyDelta: moveMeta?.energyDelta ?? 0,
    moveNarrative: moveMeta?.narrative ?? '',
    channel: channelDb,
    regulationFrom: PHASE_REGULATION_MAP.action.from,
    regulationTo: PHASE_REGULATION_MAP.action.to,
    createdAt: actionBar.createdAt,
  }

  // ── 8. Build narrative summary + reflection prompts ───────────────────────
  const narrativeSummary = buildNarrativeSummary(intakeData, actionData, channel, face)
  const reflectionPrompts = buildReflectionPrompts(intakeData, actionData, channel)

  // ── 9. Assemble full context ──────────────────────────────────────────────
  const context: ReflectionContext = {
    playerId,
    channel,
    face,
    waveMove,
    currentPhase: 'reflection',
    arcStartedAt: playerState.arcStartedAt ?? null,
    regulationTrajectory: {
      intake: { from: PHASE_REGULATION_MAP.intake.from, to: PHASE_REGULATION_MAP.intake.to },
      action: { from: PHASE_REGULATION_MAP.action.from, to: PHASE_REGULATION_MAP.action.to },
      reflection: { from: PHASE_REGULATION_MAP.reflection.from, to: PHASE_REGULATION_MAP.reflection.to },
    },
    intake: intakeData,
    action: actionData,
    narrativeSummary,
    reflectionPrompts,
  }

  return { context }
}

// ---------------------------------------------------------------------------
// Pure helpers (no DB, for testing and CYOA rendering)
// ---------------------------------------------------------------------------

/**
 * Build a ReflectionContext from pre-loaded data (no DB access).
 * Useful for testing and for server components that already have the data.
 */
export function buildReflectionContextFromData(params: {
  playerId: string
  channel: EmotionalChannel
  face?: GameMasterFace
  waveMove?: PersonalMoveType
  arcStartedAt?: Date | null
  intake: IntakePhaseData
  action: ActionPhaseData
}): ReflectionContext {
  const face = params.face ?? VERTICAL_SLICE.face
  const waveMove = params.waveMove ?? VERTICAL_SLICE.waveMove

  const narrativeSummary = buildNarrativeSummary(params.intake, params.action, params.channel, face)
  const reflectionPrompts = buildReflectionPrompts(params.intake, params.action, params.channel)

  return {
    playerId: params.playerId,
    channel: params.channel,
    face,
    waveMove,
    currentPhase: 'reflection',
    arcStartedAt: params.arcStartedAt ?? null,
    regulationTrajectory: {
      intake: { from: PHASE_REGULATION_MAP.intake.from, to: PHASE_REGULATION_MAP.intake.to },
      action: { from: PHASE_REGULATION_MAP.action.from, to: PHASE_REGULATION_MAP.action.to },
      reflection: { from: PHASE_REGULATION_MAP.reflection.from, to: PHASE_REGULATION_MAP.reflection.to },
    },
    intake: params.intake,
    action: params.action,
    narrativeSummary,
    reflectionPrompts,
  }
}

/**
 * Extract a one-line epiphany summary from a ReflectionContext.
 * Used for BAR title generation when the player completes reflection.
 *
 * Non-AI path: derives from move + channel.
 * AI path: caller can override with LLM-generated title.
 */
export function deriveEpiphanyTitle(ctx: ReflectionContext): string {
  const moveLabel = ctx.action.moveTitle
  return `${ctx.channel} Epiphany — ${moveLabel} (Wake Up)`
}

// ---------------------------------------------------------------------------
// AI Prompt Formatting — prompt-ready context for AI generation
// ---------------------------------------------------------------------------

/**
 * Structured prompt payload for AI reflection generation.
 * This is the prompt-ready format that can be sent to an LLM.
 *
 * Separates system context (instructions for the AI) from user context
 * (player's actual journey data) following AI SDK conventions.
 */
export interface AIReflectionPrompt {
  /** System message: instructs the AI on role, constraints, and output format. */
  system: string
  /** User message: the player's journey data structured for the AI. */
  user: string
  /** Structured metadata for programmatic access (e.g., token estimation, logging). */
  metadata: {
    playerId: string
    channel: string
    face: string
    waveMove: string
    arcPhase: 'reflection'
    intakeBarId: string
    actionBarId: string
    /** Approximate character count of user message for token budgeting. */
    userMessageLength: number
  }
}

/**
 * Channel-specific thematic context for AI prompt enrichment.
 * Maps each emotional channel to its Wuxing element and alchemical lesson.
 */
const CHANNEL_THEMATIC_CONTEXT: Record<string, { element: string; lesson: string; imagery: string }> = {
  Fear:        { element: 'Metal', lesson: 'Risk or opportunity detected',         imagery: 'cutting edge, clarity through precision' },
  Anger:       { element: 'Fire',  lesson: 'Obstacle present or boundary violated', imagery: 'forge heat, transformation through intensity' },
  Sadness:     { element: 'Water', lesson: 'Something cared about is distant',     imagery: 'deep current, depth through letting go' },
  Joy:         { element: 'Wood',  lesson: 'Vitality detected',                    imagery: 'new growth, expansion through aliveness' },
  Neutrality:  { element: 'Earth', lesson: 'Whole-system perspective',             imagery: 'still center, integration through balance' },
}

/**
 * Format a ReflectionContext into an AI-ready prompt structure.
 *
 * This is the primary interface for AI-augmented reflection generation.
 * The returned prompt follows a structured format that works with the AI SDK:
 *
 *   - `system`: Role instructions + constraints (Challenger face persona)
 *   - `user`: Player's journey data (intake content, action choice, emotional arc)
 *   - `metadata`: Structured data for logging, token budgeting, and provenance
 *
 * Design principles:
 *   - Epiphany IS the Reflection BAR — the AI generates BAR content, not a separate artifact
 *   - Non-AI path is first-class — this function is only called when AI is opted into
 *   - Behavior over self-report — prompt foregrounds player's actions, not self-assessments
 *   - Vertical slice: Challenger face + Wake Up WAVE move persona
 *
 * @param ctx - The aggregated ReflectionContext from Intake + Action phases
 * @returns Structured AI prompt ready for the AI SDK
 */
export function formatReflectionForAI(ctx: ReflectionContext): AIReflectionPrompt {
  const thematic = CHANNEL_THEMATIC_CONTEXT[ctx.channel] ?? CHANNEL_THEMATIC_CONTEXT.Neutrality

  const system = buildAISystemPrompt(ctx, thematic)
  const user = buildAIUserPrompt(ctx, thematic)

  return {
    system,
    user,
    metadata: {
      playerId: ctx.playerId,
      channel: ctx.channel,
      face: ctx.face,
      waveMove: ctx.waveMove,
      arcPhase: 'reflection',
      intakeBarId: ctx.intake.barId,
      actionBarId: ctx.action.barId,
      userMessageLength: user.length,
    },
  }
}

/**
 * Build the system prompt for AI reflection generation.
 * Establishes the Challenger face persona and output constraints.
 */
function buildAISystemPrompt(
  ctx: ReflectionContext,
  thematic: { element: string; lesson: string; imagery: string },
): string {
  const lines: string[] = []

  // Role
  lines.push('You are the Challenger — a Game Master face that cuts through avoidance and names what is real.')
  lines.push('Your role is to help a player see clearly what their journey through this arc has revealed.')
  lines.push('')

  // Context
  lines.push('## Context')
  lines.push(`- Emotional channel: ${ctx.channel} (${thematic.element} element)`)
  lines.push(`- Alchemical lesson: ${thematic.lesson}`)
  lines.push(`- WAVE stage: Wake Up (first awareness)`)
  lines.push(`- Regulation arc: dissatisfied → neutral → satisfied (epiphany)`)
  lines.push('')

  // Constraints
  lines.push('## Constraints')
  lines.push('- Speak as the Challenger: direct, honest, no flattery, no hedging.')
  lines.push('- The output IS the epiphany artifact (a Reflection BAR). Write it as something worth keeping.')
  lines.push('- Ground your response in what the player ACTUALLY wrote — their intake naming and action commitment.')
  lines.push('- Do not invent experiences the player did not describe.')
  lines.push('- Keep the reflection between 2-5 sentences. Dense, not verbose.')
  lines.push(`- Use ${thematic.element} element imagery where natural: ${thematic.imagery}.`)
  lines.push('- End with what the player can now see that they could not see before (the epiphany).')
  lines.push('')

  // Output format
  lines.push('## Output Format')
  lines.push('Respond with ONLY the reflection text. No titles, no headers, no meta-commentary.')
  lines.push('This text becomes the body of the player\'s Reflection BAR — their epiphany artifact.')

  return lines.join('\n')
}

/**
 * Build the user prompt containing the player's actual journey data.
 * Structured to foreground behavior (what they did) over self-report.
 */
function buildAIUserPrompt(
  ctx: ReflectionContext,
  thematic: { element: string; lesson: string; imagery: string },
): string {
  const lines: string[] = []

  lines.push('## My Alchemy Arc')
  lines.push('')

  // Intake phase — what they named
  lines.push('### Intake: What I Named')
  lines.push(`Channel: ${ctx.channel} (${thematic.element})`)
  lines.push(`Regulation: ${ctx.intake.regulationFrom} → ${ctx.intake.regulationTo}`)
  lines.push('')
  lines.push(ctx.intake.content || '(No intake content)')
  lines.push('')

  // Action phase — what they committed to
  lines.push('### Action: What I Committed To')
  lines.push(`Move: ${ctx.action.moveTitle}`)
  if (ctx.action.moveNarrative) {
    lines.push(`Pattern: ${ctx.action.moveNarrative}`)
  }
  lines.push(`Energy: ${ctx.action.energyDelta > 0 ? '+' : ''}${ctx.action.energyDelta}`)
  lines.push('')
  lines.push(ctx.action.content || '(No action response)')
  lines.push('')

  // Journey trajectory
  lines.push('### Journey')
  lines.push(`dissatisfied → named it (intake) → committed (action) → now seeking: what did this reveal?`)
  lines.push('')

  // Direct request
  lines.push('### Reflection Request')
  lines.push('Based on what I named and what I committed to, write my epiphany — the thing I can now see that I couldn\'t see before.')

  return lines.join('\n')
}

/**
 * Extract prompt-ready reflection prompts as a simple key-value map.
 * Useful for non-AI CYOA rendering or for providing structured prompts
 * alongside AI generation.
 */
export function getReflectionPromptMap(ctx: ReflectionContext): Record<string, string> {
  const map: Record<string, string> = {}
  for (const prompt of ctx.reflectionPrompts) {
    map[prompt.key] = prompt.text
  }
  return map
}

/**
 * Compute a compact summary of the arc's emotional trajectory.
 * Useful for BAR metadata, logging, and AI context.
 */
export function summarizeEmotionalArc(ctx: ReflectionContext): string {
  const { channel, face, waveMove, action } = ctx
  return [
    `${channel} arc`,
    `${face} face`,
    `${waveMove} wave`,
    `${action.moveTitle} (${action.energyDelta > 0 ? '+' : ''}${action.energyDelta} energy)`,
    `dissatisfied → neutral → satisfied`,
  ].join(' · ')
}
