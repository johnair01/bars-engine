/**
 * Alchemy Engine — AI Passage Generation Service
 *
 * General-purpose AI generation service that accepts scene context
 * (phase, channel, emotion, WAVE move) and returns generated passage text
 * via the AI SDK.
 *
 * Covers all 3 arc phases:
 *   - Intake: generates channel-specific dissatisfaction naming prompts
 *   - Action: generates Challenger move framing and commitment prompts
 *   - Reflection: delegates to reflection-generation.ts for 3-suggestion output
 *
 * Design principles:
 *   - Non-AI path is first-class: static content always available as fallback
 *   - Behavior over self-report: prompts foreground actions, not feelings
 *   - Vertical slice: Challenger face + Wake Up WAVE move only
 *   - Phase-locked: generation is scoped to the player's current phase
 *
 * @see reflection-generation.ts — specialized 3-suggestion generation for Reflection phase
 * @see template-bank-types.ts — PassageTemplate, ChannelContentSlot types
 * @see types.ts — ArcPhase, VERTICAL_SLICE, CHALLENGER_MOVE_META
 */

import { z } from 'zod'
import type { EmotionalChannel, GameMasterFace, PersonalMoveType } from '@/lib/quest-grammar/types'
import type { ArcPhase, ChallengerMoveId } from './types'
import { VERTICAL_SLICE, CHALLENGER_MOVE_META } from './types'

// ---------------------------------------------------------------------------
// Scene Context — the input contract
// ---------------------------------------------------------------------------

/**
 * Scene context for AI passage generation.
 * Contains everything the AI needs to generate phase-appropriate content.
 */
export interface SceneContext {
  /** Current arc phase. */
  phase: ArcPhase
  /** Player's emotional channel. */
  channel: EmotionalChannel
  /** GM face for this arc. */
  face: GameMasterFace
  /** WAVE move for this arc. */
  waveMove: PersonalMoveType
  /** Player-provided content from prior phases (for Action/Reflection). */
  priorContent?: PriorPhaseContent
  /** Optional: which Challenger move was selected (Action phase). */
  challengerMoveId?: ChallengerMoveId
}

/** Content from prior phases, used to ground AI generation. */
export interface PriorPhaseContent {
  /** Intake naming text (what the player identified as their dissatisfaction). */
  intakeText?: string
  /** Action commitment text (what the player committed to). */
  actionText?: string
  /** Action move title (e.g. "Issue Challenge"). */
  actionMoveTitle?: string
}

// ---------------------------------------------------------------------------
// Generated Passage — the output contract
// ---------------------------------------------------------------------------

/**
 * AI-generated passage text for a single phase.
 * Replaces or augments the static PassageTemplate content.
 */
export interface GeneratedPassage {
  /** The scene-setting narrative (replaces PassageTemplate.situation). */
  situation: string
  /** The friction point — what's at stake (replaces PassageTemplate.friction). */
  friction: string
  /** The invitation — what the player is being asked (replaces PassageTemplate.invitation). */
  invitation: string
  /** Whether this was AI-generated or static fallback. */
  source: 'ai' | 'static'
  /** Model used for generation (null for static). */
  model: string | null
  /** Generation metadata for logging/debugging. */
  metadata: {
    phase: ArcPhase
    channel: EmotionalChannel
    face: GameMasterFace
    waveMove: PersonalMoveType
    /** Approximate token cost (null for static). */
    estimatedTokens: number | null
  }
}

// ---------------------------------------------------------------------------
// Zod schema for AI structured output
// ---------------------------------------------------------------------------

/** Schema for a single AI-generated passage. */
export const generatedPassageSchema = z.object({
  situation: z.string().min(10).max(600).describe(
    'Scene-setting narrative — 1-3 sentences establishing the emotional context'
  ),
  friction: z.string().min(10).max(600).describe(
    'The friction point — what is at stake, what is uncomfortable, what demands attention'
  ),
  invitation: z.string().min(10).max(600).describe(
    'The invitation — what the player is being asked to consider or do next'
  ),
})

export type GeneratedPassageAIOutput = z.infer<typeof generatedPassageSchema>

// ---------------------------------------------------------------------------
// Channel → Element + Thematic Mapping
// ---------------------------------------------------------------------------

const CHANNEL_CONTEXT: Record<EmotionalChannel, {
  element: string
  dissatisfactionSeed: string
  actionSeed: string
  imagery: string
}> = {
  Fear: {
    element: 'Metal',
    dissatisfactionSeed: 'Something feels risky or uncertain — a threat you can\'t quite name.',
    actionSeed: 'The blade finds its edge when you stop avoiding and start discerning.',
    imagery: 'precision, edges, the moment before a decisive cut',
  },
  Anger: {
    element: 'Fire',
    dissatisfactionSeed: 'A boundary has been crossed, or an obstacle stands in your path.',
    actionSeed: 'The forge burns clean when you honor the boundary instead of swallowing it.',
    imagery: 'forge heat, controlled intensity, transformation through fire',
  },
  Sadness: {
    element: 'Water',
    dissatisfactionSeed: 'Something you care about feels distant or lost.',
    actionSeed: 'The current finds its course when you stop damming what needs to flow.',
    imagery: 'deep currents, release, the weight of what matters',
  },
  Joy: {
    element: 'Wood',
    dissatisfactionSeed: 'There\'s a restlessness — an aliveness that has no outlet yet.',
    actionSeed: 'New shoots break ground when you commit to growth without guarantee.',
    imagery: 'new growth, sprouting, vitality pressing upward',
  },
  Neutrality: {
    element: 'Earth',
    dissatisfactionSeed: 'Everything feels flat — not bad, but not alive either. A numbness.',
    actionSeed: 'The ground holds steady when you stop performing and start integrating.',
    imagery: 'still center, the ground beneath, holding without gripping',
  },
}

// ---------------------------------------------------------------------------
// System prompt builders (per phase)
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for the Challenger face.
 * Common framing used across all phases.
 */
function buildChallengerSystemPreamble(): string[] {
  return [
    'You are the Challenger — a Game Master face that cuts through avoidance and names what is real.',
    'You speak directly: no flattery, no hedging, no therapeutic distance.',
    'You respect the player by refusing to coddle them.',
    '',
    '## WAVE Stage: Wake Up',
    'This is the first awareness move. The player is waking up to something they\'ve been avoiding or haven\'t yet named.',
    'Your job is to help them see it clearly — not to fix it, judge it, or rush past it.',
    '',
  ]
}

/** Build system prompt for Intake phase generation. */
function buildIntakeSystemPrompt(channel: EmotionalChannel): string {
  const ctx = CHANNEL_CONTEXT[channel]
  const lines = buildChallengerSystemPreamble()

  lines.push('## Phase: Intake')
  lines.push('The player is dissatisfied. Something is off. Your job is to help them NAME it.')
  lines.push('')
  lines.push('## Emotional Channel')
  lines.push(`Channel: ${channel} (${ctx.element} element)`)
  lines.push(`Seed: ${ctx.dissatisfactionSeed}`)
  lines.push(`Imagery: ${ctx.imagery}`)
  lines.push('')
  lines.push('## Output Contract')
  lines.push('Generate 3 text fields:')
  lines.push('- situation: Set the emotional scene. 1-3 sentences. Use the channel imagery.')
  lines.push('- friction: Name the friction. What is uncomfortable? What demands attention?')
  lines.push('- invitation: Ask the player to name their dissatisfaction. Direct, not leading.')
  lines.push('')
  lines.push('## Constraints')
  lines.push('- Regulation: dissatisfied → the player starts here. Don\'t minimize it.')
  lines.push('- Keep each field under 3 sentences. Dense, not verbose.')
  lines.push(`- Ground the tone in ${ctx.element} element qualities: ${ctx.imagery}.`)
  lines.push('- The player will provide their own naming — don\'t do it for them.')

  return lines.join('\n')
}

/** Build system prompt for Action phase generation. */
function buildActionSystemPrompt(
  channel: EmotionalChannel,
  challengerMoveId?: ChallengerMoveId,
): string {
  const ctx = CHANNEL_CONTEXT[channel]
  const lines = buildChallengerSystemPreamble()

  lines.push('## Phase: Action')
  lines.push('The player has named their dissatisfaction (Intake). Now they must ACT.')
  lines.push('Regulation is at neutral — naming has happened, but nothing has changed yet.')
  lines.push('')
  lines.push('## Emotional Channel')
  lines.push(`Channel: ${channel} (${ctx.element} element)`)
  lines.push(`Action seed: ${ctx.actionSeed}`)
  lines.push(`Imagery: ${ctx.imagery}`)
  lines.push('')

  // If a specific Challenger move is selected, frame around it
  if (challengerMoveId && CHALLENGER_MOVE_META[challengerMoveId]) {
    const move = CHALLENGER_MOVE_META[challengerMoveId]
    lines.push('## Challenger Move')
    lines.push(`Move: ${move.title} (${move.canonicalMoveId})`)
    lines.push(`Energy: ${move.energyDelta > 0 ? '+' : ''}${move.energyDelta}`)
    lines.push(`Narrative: ${move.narrative}`)
    lines.push('')
  }

  lines.push('## Output Contract')
  lines.push('Generate 3 text fields:')
  lines.push('- situation: Bridge from naming to action. What does the player now face?')
  lines.push('- friction: What makes acting hard? What\'s the cost of NOT acting?')
  lines.push('- invitation: Invite the player to commit. What is the Challenger asking them to do?')
  lines.push('')
  lines.push('## Constraints')
  lines.push('- Regulation: neutral → neutral (action builds capacity but doesn\'t resolve).')
  lines.push('- The player already named their dissatisfaction. Reference their naming, don\'t re-do it.')
  lines.push('- Keep each field under 3 sentences.')
  lines.push(`- Ground the tone in ${ctx.element} element qualities: ${ctx.imagery}.`)

  return lines.join('\n')
}

/** Build system prompt for Reflection phase generation. */
function buildReflectionSystemPrompt(channel: EmotionalChannel): string {
  const ctx = CHANNEL_CONTEXT[channel]
  const lines = buildChallengerSystemPreamble()

  lines.push('## Phase: Reflection')
  lines.push('The player has named (Intake) and acted (Action). Now: what did this arc reveal?')
  lines.push('This is the epiphany threshold. The Reflection BAR IS the epiphany artifact.')
  lines.push('')
  lines.push('## Emotional Channel')
  lines.push(`Channel: ${channel} (${ctx.element} element)`)
  lines.push(`Imagery: ${ctx.imagery}`)
  lines.push('')
  lines.push('## Output Contract')
  lines.push('Generate 3 text fields:')
  lines.push('- situation: Mirror back the arc. What happened in this journey?')
  lines.push('- friction: What is the player on the edge of seeing? What wants to emerge?')
  lines.push('- invitation: Invite the epiphany. Ask the player: what do you see now that you couldn\'t before?')
  lines.push('')
  lines.push('## Constraints')
  lines.push('- Regulation: neutral → satisfied (the epiphany IS the regulation advance).')
  lines.push('- The Reflection BAR is the artifact. Treat this as something worth keeping.')
  lines.push('- Keep each field under 3 sentences.')
  lines.push(`- Ground the tone in ${ctx.element} element qualities: ${ctx.imagery}.`)
  lines.push('- Do NOT write the epiphany for the player. Set up the conditions for THEM to see it.')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// User prompt builders (per phase)
// ---------------------------------------------------------------------------

/** Build user prompt for Intake phase. */
function buildIntakeUserPrompt(ctx: SceneContext): string {
  const channelCtx = CHANNEL_CONTEXT[ctx.channel]
  return [
    `Generate an Intake passage for a player in the ${ctx.channel} channel (${channelCtx.element}).`,
    '',
    'The player is entering the arc dissatisfied — something is off but not yet named.',
    `Their emotional register: ${channelCtx.dissatisfactionSeed}`,
    '',
    'Help them see it clearly enough to name it.',
  ].join('\n')
}

/** Build user prompt for Action phase. */
function buildActionUserPrompt(ctx: SceneContext): string {
  const channelCtx = CHANNEL_CONTEXT[ctx.channel]
  const lines: string[] = []

  lines.push(`Generate an Action passage for a player in the ${ctx.channel} channel (${channelCtx.element}).`)
  lines.push('')

  // Include prior phase content if available
  if (ctx.priorContent?.intakeText) {
    lines.push('### What the player named (Intake):')
    lines.push(truncate(ctx.priorContent.intakeText, 500))
    lines.push('')
  }

  if (ctx.challengerMoveId && CHALLENGER_MOVE_META[ctx.challengerMoveId]) {
    const move = CHALLENGER_MOVE_META[ctx.challengerMoveId]
    lines.push(`### Selected Challenger move: ${move.title}`)
    lines.push(`Pattern: ${move.narrative}`)
    lines.push('')
  }

  lines.push('The player has named their dissatisfaction. Now challenge them to act on it.')

  return lines.join('\n')
}

/** Build user prompt for Reflection phase. */
function buildReflectionUserPrompt(ctx: SceneContext): string {
  const channelCtx = CHANNEL_CONTEXT[ctx.channel]
  const lines: string[] = []

  lines.push(`Generate a Reflection passage for a player in the ${ctx.channel} channel (${channelCtx.element}).`)
  lines.push('')

  if (ctx.priorContent?.intakeText) {
    lines.push('### What they named (Intake):')
    lines.push(truncate(ctx.priorContent.intakeText, 400))
    lines.push('')
  }

  if (ctx.priorContent?.actionMoveTitle) {
    lines.push(`### Their action: ${ctx.priorContent.actionMoveTitle}`)
  }

  if (ctx.priorContent?.actionText) {
    lines.push('### What they committed to (Action):')
    lines.push(truncate(ctx.priorContent.actionText, 400))
    lines.push('')
  }

  lines.push('The arc is nearly complete. Set the stage for the epiphany — what can they now see?')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Prompt router
// ---------------------------------------------------------------------------

/**
 * Build system + user prompts for a given scene context.
 * Routes to the appropriate phase-specific prompt builder.
 */
export function buildPrompts(ctx: SceneContext): { system: string; user: string } {
  switch (ctx.phase) {
    case 'intake':
      return {
        system: buildIntakeSystemPrompt(ctx.channel),
        user: buildIntakeUserPrompt(ctx),
      }
    case 'action':
      return {
        system: buildActionSystemPrompt(ctx.channel, ctx.challengerMoveId),
        user: buildActionUserPrompt(ctx),
      }
    case 'reflection':
      return {
        system: buildReflectionSystemPrompt(ctx.channel),
        user: buildReflectionUserPrompt(ctx),
      }
    default: {
      // Exhaustive check
      const _exhaustive: never = ctx.phase
      throw new Error(`Unknown phase: ${_exhaustive}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Static fallback content
// ---------------------------------------------------------------------------

/**
 * Static passage content for each phase × channel combination.
 * Non-AI first-class: this is always available as a fallback.
 */
export function buildStaticPassage(ctx: SceneContext): GeneratedPassage {
  const channelCtx = CHANNEL_CONTEXT[ctx.channel]

  const phaseContent = STATIC_PHASE_CONTENT[ctx.phase]

  return {
    situation: phaseContent.situation(ctx.channel, channelCtx),
    friction: phaseContent.friction(ctx.channel, channelCtx, ctx.priorContent),
    invitation: phaseContent.invitation(ctx.channel, channelCtx, ctx.priorContent),
    source: 'static',
    model: null,
    metadata: {
      phase: ctx.phase,
      channel: ctx.channel,
      face: ctx.face,
      waveMove: ctx.waveMove,
      estimatedTokens: null,
    },
  }
}

type ChannelCtx = typeof CHANNEL_CONTEXT[EmotionalChannel]

const STATIC_PHASE_CONTENT: Record<ArcPhase, {
  situation: (ch: EmotionalChannel, ctx: ChannelCtx) => string
  friction: (ch: EmotionalChannel, ctx: ChannelCtx, prior?: PriorPhaseContent) => string
  invitation: (ch: EmotionalChannel, ctx: ChannelCtx, prior?: PriorPhaseContent) => string
}> = {
  intake: {
    situation: (ch, ctx) =>
      `Something in the ${ctx.element} register has been building. ${ctx.dissatisfactionSeed} The Challenger sees it — even if you haven't named it yet.`,
    friction: (ch, ctx) =>
      `The discomfort isn't random. ${ch} is a signal, not a problem. What specifically is ${ch === 'Joy' ? 'restless' : ch === 'Fear' ? 'uncertain' : ch === 'Anger' ? 'blocked' : ch === 'Sadness' ? 'missing' : 'flat'}? The Challenger won't let you look away.`,
    invitation: (ch) =>
      `Name it. Not a vague feeling — a specific dissatisfaction. What is the one thing in your ${ch} channel that demands attention right now?`,
  },
  action: {
    situation: (ch, ctx) =>
      `You named it. The ${ctx.element} signal is no longer background noise — it's a named thing. ${ctx.actionSeed}`,
    friction: (_ch, ctx, prior) => {
      const named = prior?.intakeText ? `You said: "${truncate(prior.intakeText, 80)}." ` : ''
      return `${named}Naming is not enough. ${ctx.element} demands action — not reaction, not avoidance, but a deliberate move. What are you willing to do about it?`
    },
    invitation: (_ch, _ctx, prior) => {
      const moveTitle = prior?.actionMoveTitle
      return moveTitle
        ? `The Challenger asks: will you ${moveTitle.toLowerCase()}? Make your commitment specific and immediate.`
        : 'The Challenger asks: what will you actually DO? Not what you hope or wish — what will you commit to right now?'
    },
  },
  reflection: {
    situation: (ch, ctx) =>
      `You named a dissatisfaction in ${ch}. You committed to action. The ${ctx.element} arc is nearly complete.`,
    friction: (_ch, ctx, prior) => {
      const named = prior?.intakeText ? `You named "${truncate(prior.intakeText, 60)}." ` : ''
      const acted = prior?.actionMoveTitle ? `You chose to ${prior.actionMoveTitle.toLowerCase()}. ` : ''
      return `${named}${acted}Something has shifted — or is about to. The ${ctx.element} lesson is on the edge of becoming clear.`
    },
    invitation: () =>
      'What do you see now that you couldn\'t see before? This is the epiphany — the thing that makes the arc worth recording. Name it.',
  },
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------

/**
 * Generate passage text for a scene context using AI.
 *
 * Accepts scene context (phase, channel, emotion, WAVE move) and returns
 * generated passage text via the AI SDK (Vercel AI SDK + OpenAI).
 *
 * Falls back to static content if:
 *   - AI generation fails (network, rate limit, etc.)
 *   - OPENAI_API_KEY is not set
 *   - The `forceStatic` option is true
 *
 * @param ctx - Scene context containing phase, channel, face, WAVE move
 * @param options - Optional configuration
 * @returns Generated passage with source attribution
 */
export async function generatePassage(
  ctx: SceneContext,
  options?: GeneratePassageOptions,
): Promise<GeneratedPassage> {
  // Non-AI path: always available, first-class
  if (options?.forceStatic) {
    return buildStaticPassage(ctx)
  }

  try {
    // Dynamic imports to avoid hard dependency on AI SDK at module level
    const { generateObject } = await import('ai')
    const { getOpenAI } = await import('@/lib/openai')

    const modelName = options?.model ?? 'gpt-4o-mini'
    const { system, user } = buildPrompts(ctx)

    const result = await generateObject({
      model: getOpenAI()(modelName),
      schema: generatedPassageSchema,
      system,
      prompt: user,
    })

    const output = result.object

    return {
      situation: output.situation,
      friction: output.friction,
      invitation: output.invitation,
      source: 'ai',
      model: modelName,
      metadata: {
        phase: ctx.phase,
        channel: ctx.channel,
        face: ctx.face,
        waveMove: ctx.waveMove,
        estimatedTokens: estimateTokens(system, user),
      },
    }
  } catch (error) {
    // AI unavailable — fall back to static (non-AI is first-class)
    console.warn(
      '[alchemy-engine/ai-generation] AI passage generation failed, falling back to static:',
      error instanceof Error ? error.message : String(error),
    )
    return buildStaticPassage(ctx)
  }
}

/** Options for generatePassage. */
export interface GeneratePassageOptions {
  /** Force static (non-AI) generation. Default: false. */
  forceStatic?: boolean
  /** OpenAI model to use. Default: 'gpt-4o-mini'. */
  model?: string
}

/**
 * Generate passage text with caching.
 *
 * Uses the AI response cache to avoid redundant API calls for identical
 * scene contexts. Cache key is derived from phase + channel + face + waveMove
 * + prior content hash.
 *
 * @param ctx - Scene context
 * @param options - Optional configuration including cache TTL
 * @returns Generated passage with cache hit metadata
 */
export async function generatePassageWithCache(
  ctx: SceneContext,
  options?: GeneratePassageWithCacheOptions,
): Promise<GeneratedPassage & { fromCache: boolean }> {
  if (options?.forceStatic) {
    return { ...buildStaticPassage(ctx), fromCache: false }
  }

  try {
    const { generateObjectWithCache } = await import('@/lib/ai-with-cache')
    const { getOpenAI } = await import('@/lib/openai')

    const modelName = options?.model ?? 'gpt-4o-mini'
    const { system, user } = buildPrompts(ctx)
    const inputKey = buildCacheKey(ctx)

    const { object, fromCache } = await generateObjectWithCache<GeneratedPassageAIOutput>({
      feature: 'alchemy_engine_passage',
      inputKey,
      model: modelName,
      schema: generatedPassageSchema,
      system,
      prompt: user,
      getModel: () => getOpenAI()(modelName),
      ttlMs: options?.cacheTtlMs,
    })

    return {
      situation: object.situation,
      friction: object.friction,
      invitation: object.invitation,
      source: 'ai',
      model: modelName,
      metadata: {
        phase: ctx.phase,
        channel: ctx.channel,
        face: ctx.face,
        waveMove: ctx.waveMove,
        estimatedTokens: fromCache ? null : estimateTokens(system, user),
      },
      fromCache,
    }
  } catch (error) {
    console.warn(
      '[alchemy-engine/ai-generation] Cached passage generation failed, falling back to static:',
      error instanceof Error ? error.message : String(error),
    )
    return { ...buildStaticPassage(ctx), fromCache: false }
  }
}

/** Options for generatePassageWithCache. */
export interface GeneratePassageWithCacheOptions extends GeneratePassageOptions {
  /** Cache TTL in milliseconds. Default: 7 days (from ai-with-cache). */
  cacheTtlMs?: number
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Build a stable cache key from scene context. */
function buildCacheKey(ctx: SceneContext): string {
  const parts = [
    ctx.phase,
    ctx.channel,
    ctx.face,
    ctx.waveMove,
    ctx.challengerMoveId ?? 'none',
    ctx.priorContent?.intakeText?.slice(0, 200) ?? '',
    ctx.priorContent?.actionText?.slice(0, 200) ?? '',
  ]
  return parts.join('|')
}

/** Rough token estimate based on character count (1 token ≈ 4 chars). */
function estimateTokens(system: string, user: string): number {
  return Math.ceil((system.length + user.length) / 4)
}

/** Truncate text for prompt interpolation. */
function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength - 1) + '…'
}

// ---------------------------------------------------------------------------
// Convenience: check if AI generation is available
// ---------------------------------------------------------------------------

/**
 * Check whether AI passage generation is likely available.
 * Returns false if OPENAI_API_KEY is not set.
 * Does NOT make an API call — just checks environment.
 */
export function isAIGenerationAvailable(): boolean {
  const key = process.env.OPENAI_API_KEY
  return Boolean(key && key.trim() !== '')
}
