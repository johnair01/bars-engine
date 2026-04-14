/**
 * Alchemy Engine — Reflection Completion Generation
 *
 * AI prompt template and generation function that takes aggregated
 * ReflectionContext and produces 3 channel-typed CYOA completion
 * suggestions with appropriate emotional resolution framing.
 *
 * Each suggestion represents a different "angle" on the player's epiphany:
 *   1. Channel-aligned: directly in the player's emotional channel
 *   2. Adjacent-channel: from the shēng (generative) neighbor
 *   3. Cross-channel: from the kè (control/challenge) neighbor
 *
 * This produces 3 possible Reflection BARs. The player picks one.
 * The chosen suggestion becomes the Reflection BAR — the epiphany artifact.
 *
 * Non-AI first-class: `buildStaticCompletionSuggestions()` provides
 * deterministic suggestions derived from CYOA selections alone.
 * AI path: `generateReflectionCompletions()` calls an LLM for richer output.
 *
 * @see reflection-aggregator.ts — produces the ReflectionContext input
 * @see bar-production.ts — buildReflectionBarData() consumes the chosen suggestion
 */

import { z } from 'zod'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import type { ReflectionContext } from './reflection-aggregator'
import { VERTICAL_SLICE } from './types'

// ---------------------------------------------------------------------------
// Wuxing neighbor maps (for channel-typed suggestion diversity)
// ---------------------------------------------------------------------------

/**
 * shēng (生) generative cycle: each channel nourishes the next.
 * Wood→Fire→Earth→Metal→Water→Wood
 * Mapped to emotional channels via Wuxing element correspondence.
 */
const SHENG_NEIGHBOR: Record<EmotionalChannel, EmotionalChannel> = {
  Joy:        'Anger',      // Wood → Fire
  Anger:      'Neutrality', // Fire → Earth
  Neutrality: 'Fear',       // Earth → Metal
  Fear:       'Sadness',    // Metal → Water
  Sadness:    'Joy',        // Water → Wood
}

/**
 * kè (克) control cycle: each channel challenges/transforms another.
 * Wood→Earth→Water→Fire→Metal→Wood
 */
const KE_NEIGHBOR: Record<EmotionalChannel, EmotionalChannel> = {
  Joy:        'Neutrality', // Wood overcomes Earth
  Neutrality: 'Sadness',    // Earth overcomes Water
  Sadness:    'Anger',      // Water overcomes Fire
  Anger:      'Fear',       // Fire overcomes Metal
  Fear:       'Joy',        // Metal overcomes Wood
}

// ---------------------------------------------------------------------------
// Suggestion type (the output contract)
// ---------------------------------------------------------------------------

/**
 * A single CYOA completion suggestion for the Reflection phase.
 * The player chooses one; the chosen one becomes the Reflection BAR.
 */
export interface ReflectionCompletionSuggestion {
  /** Unique key for this suggestion (e.g. 'channel_aligned', 'adjacent', 'cross'). */
  key: 'channel_aligned' | 'adjacent' | 'cross'

  /** Display label for the CYOA choice. */
  label: string

  /** The emotional channel this suggestion is typed to. */
  channel: EmotionalChannel

  /** Wuxing element corresponding to the suggestion's channel. */
  element: string

  /** The suggested epiphany title (becomes BAR title if chosen). */
  title: string

  /** The suggested epiphany body (becomes BAR description if chosen). */
  body: string

  /**
   * Framing flavor — which cycle produced this suggestion.
   * - 'direct': same channel as the player's arc
   * - 'generative': from the shēng (nourishing) neighbor
   * - 'challenging': from the kè (overcoming) neighbor
   */
  framing: 'direct' | 'generative' | 'challenging'
}

/** The complete set of 3 suggestions returned by generation. */
export interface ReflectionCompletionSet {
  /** The 3 channel-typed suggestions, one per framing. */
  suggestions: [ReflectionCompletionSuggestion, ReflectionCompletionSuggestion, ReflectionCompletionSuggestion]

  /** Source of generation ('static' = non-AI, 'ai' = LLM-generated). */
  source: 'static' | 'ai'

  /** The ReflectionContext used to generate these suggestions. */
  contextSummary: {
    playerId: string
    channel: EmotionalChannel
    face: string
    waveMove: string
    intakeBarId: string
    actionBarId: string
  }
}

// ---------------------------------------------------------------------------
// Channel → element + thematic mapping
// ---------------------------------------------------------------------------

const CHANNEL_THEME: Record<EmotionalChannel, {
  element: string
  noun: string
  verb: string
  imagery: string
  resolution: string
}> = {
  Fear: {
    element: 'Metal',
    noun: 'clarity',
    verb: 'discerning',
    imagery: 'the blade finds its edge',
    resolution: 'What once felt like risk is now a clear signal.',
  },
  Anger: {
    element: 'Fire',
    noun: 'boundary',
    verb: 'forging',
    imagery: 'the forge burns clean',
    resolution: 'What once felt like an obstacle is now a boundary honored.',
  },
  Sadness: {
    element: 'Water',
    noun: 'depth',
    verb: 'releasing',
    imagery: 'the current finds its course',
    resolution: 'What once felt like distance is now depth acknowledged.',
  },
  Joy: {
    element: 'Wood',
    noun: 'aliveness',
    verb: 'growing',
    imagery: 'new shoots break ground',
    resolution: 'What once felt like restlessness is now vitality recognized.',
  },
  Neutrality: {
    element: 'Earth',
    noun: 'integration',
    verb: 'centering',
    imagery: 'the ground holds steady',
    resolution: 'What once felt like numbness is now a whole-system perspective.',
  },
}

// ---------------------------------------------------------------------------
// Static (non-AI) suggestion builder
// ---------------------------------------------------------------------------

/**
 * Build 3 channel-typed completion suggestions deterministically from
 * the player's CYOA selections. No AI needed.
 *
 * Suggestion 1: Channel-aligned (direct) — same emotional channel
 * Suggestion 2: Adjacent (generative) — shēng neighbor channel
 * Suggestion 3: Cross (challenging) — kè neighbor channel
 *
 * Each suggestion synthesizes the player's intake naming + action
 * commitment into an epiphany framed through that channel's lens.
 */
export function buildStaticCompletionSuggestions(
  ctx: ReflectionContext,
): ReflectionCompletionSet {
  const primaryChannel = ctx.channel
  const adjacentChannel = SHENG_NEIGHBOR[primaryChannel]
  const crossChannel = KE_NEIGHBOR[primaryChannel]

  const primaryTheme = CHANNEL_THEME[primaryChannel]
  const adjacentTheme = CHANNEL_THEME[adjacentChannel]
  const crossTheme = CHANNEL_THEME[crossChannel]

  // Extract key player data for template interpolation
  const intakeContent = ctx.intake.content || 'something unnamed'
  const actionMove = ctx.action.moveTitle
  const actionContent = ctx.action.content || 'a commitment made'

  // Truncate content for suggestion body if needed
  const intakeBrief = truncateForSuggestion(intakeContent, 120)
  const actionBrief = truncateForSuggestion(actionContent, 120)

  const suggestions: [ReflectionCompletionSuggestion, ReflectionCompletionSuggestion, ReflectionCompletionSuggestion] = [
    // ── Suggestion 1: Channel-aligned (direct) ─────────────────────────
    {
      key: 'channel_aligned',
      label: `${primaryTheme.element} Insight — ${primaryTheme.noun}`,
      channel: primaryChannel,
      element: primaryTheme.element,
      title: `${primaryChannel} Epiphany — ${actionMove} (Wake Up)`,
      body: buildDirectBody(primaryChannel, primaryTheme, intakeBrief, actionMove, actionBrief),
      framing: 'direct',
    },

    // ── Suggestion 2: Adjacent (generative / shēng) ────────────────────
    {
      key: 'adjacent',
      label: `${adjacentTheme.element} Insight — ${adjacentTheme.noun} (from ${adjacentChannel})`,
      channel: adjacentChannel,
      element: adjacentTheme.element,
      title: `${adjacentChannel} Resonance — ${actionMove} (Wake Up)`,
      body: buildAdjacentBody(primaryChannel, adjacentChannel, primaryTheme, adjacentTheme, intakeBrief, actionMove),
      framing: 'generative',
    },

    // ── Suggestion 3: Cross (challenging / kè) ─────────────────────────
    {
      key: 'cross',
      label: `${crossTheme.element} Insight — ${crossTheme.noun} (from ${crossChannel})`,
      channel: crossChannel,
      element: crossTheme.element,
      title: `${crossChannel} Challenge — ${actionMove} (Wake Up)`,
      body: buildCrossBody(primaryChannel, crossChannel, primaryTheme, crossTheme, intakeBrief, actionMove),
      framing: 'challenging',
    },
  ]

  return {
    suggestions,
    source: 'static',
    contextSummary: {
      playerId: ctx.playerId,
      channel: ctx.channel,
      face: ctx.face,
      waveMove: ctx.waveMove,
      intakeBarId: ctx.intake.barId,
      actionBarId: ctx.action.barId,
    },
  }
}

// ---------------------------------------------------------------------------
// Body builders for static suggestions
// ---------------------------------------------------------------------------

function buildDirectBody(
  channel: EmotionalChannel,
  theme: typeof CHANNEL_THEME[EmotionalChannel],
  intakeBrief: string,
  actionMove: string,
  actionBrief: string,
): string {
  return [
    `You named "${intakeBrief}" — and ${theme.imagery}.`,
    `Through "${actionMove}" you discovered ${theme.noun} where there was confusion.`,
    theme.resolution,
    `The ${theme.element} lesson: ${channel} was never the problem. It was the fuel.`,
  ].join(' ')
}

function buildAdjacentBody(
  primary: EmotionalChannel,
  adjacent: EmotionalChannel,
  primaryTheme: typeof CHANNEL_THEME[EmotionalChannel],
  adjacentTheme: typeof CHANNEL_THEME[EmotionalChannel],
  intakeBrief: string,
  actionMove: string,
): string {
  return [
    `You started in ${primary} — but ${primaryTheme.element} generates ${adjacentTheme.element}.`,
    `The act of ${primaryTheme.verb} opened a door to ${adjacentTheme.noun}.`,
    `Naming "${intakeBrief}" and choosing "${actionMove}" didn't just resolve the original tension —`,
    `it revealed ${adjacentTheme.imagery}.`,
    `${adjacent} was waiting underneath.`,
  ].join(' ')
}

function buildCrossBody(
  primary: EmotionalChannel,
  cross: EmotionalChannel,
  primaryTheme: typeof CHANNEL_THEME[EmotionalChannel],
  crossTheme: typeof CHANNEL_THEME[EmotionalChannel],
  intakeBrief: string,
  actionMove: string,
): string {
  return [
    `Here's what ${primary} was protecting you from seeing: ${crossTheme.noun}.`,
    `${primaryTheme.element} controls ${crossTheme.element} — your ${primary} was keeping ${cross} at bay.`,
    `But when you named "${intakeBrief}" and chose "${actionMove}",`,
    `the control softened. ${crossTheme.imagery}.`,
    `The challenge: can you hold both ${primaryTheme.noun} and ${crossTheme.noun} at once?`,
  ].join(' ')
}

// ---------------------------------------------------------------------------
// AI generation — structured output via generateObject
// ---------------------------------------------------------------------------

/** Zod schema for a single AI-generated suggestion. */
const aiSuggestionSchema = z.object({
  title: z.string().min(1).max(120).describe('Epiphany title for the BAR artifact'),
  body: z.string().min(20).max(800).describe('Epiphany body text — 2-5 dense sentences'),
})

/** Zod schema for the complete set of 3 AI-generated suggestions. */
export const aiCompletionSetSchema = z.object({
  channel_aligned: aiSuggestionSchema.describe(
    'Direct insight through the player\'s primary emotional channel',
  ),
  adjacent: aiSuggestionSchema.describe(
    'Insight through the generative (shēng) neighbor channel',
  ),
  cross: aiSuggestionSchema.describe(
    'Insight through the challenging (kè) control channel',
  ),
})

export type AICompletionSetOutput = z.infer<typeof aiCompletionSetSchema>

/**
 * Build the system prompt for AI completion generation.
 *
 * Establishes the Challenger face persona and the 3-suggestion output
 * contract with channel-typing and emotional resolution framing.
 */
export function buildCompletionSystemPrompt(ctx: ReflectionContext): string {
  const primaryTheme = CHANNEL_THEME[ctx.channel]
  const adjacentChannel = SHENG_NEIGHBOR[ctx.channel]
  const adjacentTheme = CHANNEL_THEME[adjacentChannel]
  const crossChannel = KE_NEIGHBOR[ctx.channel]
  const crossTheme = CHANNEL_THEME[crossChannel]

  const lines: string[] = []

  // Role
  lines.push('You are the Challenger — a Game Master face that cuts through avoidance and names what is real.')
  lines.push('You are generating 3 possible epiphany completions for a player finishing an emotional alchemy arc.')
  lines.push('')

  // Arc context
  lines.push('## Arc Context')
  lines.push(`- WAVE stage: Wake Up (first awareness — the player is waking up to something)`)
  lines.push(`- Regulation trajectory: dissatisfied → neutral → satisfied (epiphany)`)
  lines.push(`- The player named a dissatisfaction, committed to an action, and now seeks what the journey revealed.`)
  lines.push('')

  // Channel typing
  lines.push('## Channel-Typed Suggestions')
  lines.push('Generate 3 distinct epiphany framings. Each is typed to a different emotional channel:')
  lines.push('')
  lines.push(`1. **channel_aligned** — ${ctx.channel} (${primaryTheme.element} element)`)
  lines.push(`   Direct resolution in the player's own channel.`)
  lines.push(`   Lesson: ${primaryTheme.resolution}`)
  lines.push(`   Imagery: ${primaryTheme.imagery}`)
  lines.push('')
  lines.push(`2. **adjacent** — ${adjacentChannel} (${adjacentTheme.element} element)`)
  lines.push(`   Generative insight: ${primaryTheme.element} nourishes ${adjacentTheme.element} in the shēng cycle.`)
  lines.push(`   The player's ${ctx.channel} work generated ${adjacentTheme.noun}.`)
  lines.push(`   Imagery: ${adjacentTheme.imagery}`)
  lines.push('')
  lines.push(`3. **cross** — ${crossChannel} (${crossTheme.element} element)`)
  lines.push(`   Challenging insight: ${primaryTheme.element} controls ${crossTheme.element} in the kè cycle.`)
  lines.push(`   What the player's ${ctx.channel} was keeping at bay: ${crossTheme.noun}.`)
  lines.push(`   Imagery: ${crossTheme.imagery}`)
  lines.push('')

  // Constraints
  lines.push('## Constraints')
  lines.push('- Speak as the Challenger: direct, honest, no flattery, no hedging.')
  lines.push('- Each suggestion is a potential Reflection BAR — an artifact worth keeping.')
  lines.push('- Ground every suggestion in what the player ACTUALLY wrote. Do not invent experiences.')
  lines.push('- Each body should be 2-5 dense sentences. No filler.')
  lines.push('- Titles should be concise (under 80 characters) and meaningful.')
  lines.push('- Each suggestion must feel genuinely different — not 3 rewordings of the same insight.')
  lines.push('- The emotional resolution should feel earned, not given. The player did the work.')

  return lines.join('\n')
}

/**
 * Build the user prompt containing the player's journey data for AI completion generation.
 */
export function buildCompletionUserPrompt(ctx: ReflectionContext): string {
  const primaryTheme = CHANNEL_THEME[ctx.channel]
  const adjacentChannel = SHENG_NEIGHBOR[ctx.channel]
  const crossChannel = KE_NEIGHBOR[ctx.channel]

  const lines: string[] = []

  lines.push('## My Alchemy Arc')
  lines.push('')
  lines.push(`Channel: ${ctx.channel} (${primaryTheme.element})`)
  lines.push(`Face: ${ctx.face} / Wake Up`)
  lines.push('')

  // Intake
  lines.push('### What I Named (Intake)')
  lines.push(ctx.intake.content || '(No intake content)')
  lines.push('')

  // Action
  lines.push('### What I Committed To (Action)')
  lines.push(`Move: ${ctx.action.moveTitle}`)
  if (ctx.action.moveNarrative) {
    lines.push(`Pattern: ${ctx.action.moveNarrative}`)
  }
  lines.push(ctx.action.content || '(No action response)')
  lines.push('')

  // Player's reflection responses (if they answered the CYOA prompts)
  if (ctx.reflectionPrompts.length > 0) {
    lines.push('### My Reflection Responses')
    for (const prompt of ctx.reflectionPrompts) {
      lines.push(`- ${prompt.key}: "${prompt.text}"`)
    }
    lines.push('')
  }

  // Journey
  lines.push('### Journey')
  lines.push('dissatisfied → named it → committed to action → now: what was revealed?')
  lines.push('')

  // Request
  lines.push('### Generation Request')
  lines.push(`Generate 3 epiphany completions:`)
  lines.push(`1. channel_aligned: through ${ctx.channel} (${primaryTheme.element})`)
  lines.push(`2. adjacent: through ${adjacentChannel} (${CHANNEL_THEME[adjacentChannel].element}) — what my ${ctx.channel} work generated`)
  lines.push(`3. cross: through ${crossChannel} (${CHANNEL_THEME[crossChannel].element}) — what my ${ctx.channel} was keeping at bay`)
  lines.push('')
  lines.push('Each completion should be something I\'d want to keep as an artifact of this journey.')

  return lines.join('\n')
}

/**
 * Generate 3 channel-typed CYOA completion suggestions using an LLM.
 *
 * This is the AI-augmented path. It calls `generateObject` with structured
 * output to produce exactly 3 suggestions typed to different emotional channels.
 *
 * Falls back to static suggestions if AI is unavailable or fails.
 *
 * @param ctx - The aggregated ReflectionContext from Intake + Action phases
 * @returns A ReflectionCompletionSet with 3 suggestions (source: 'ai' or 'static' on fallback)
 */
export async function generateReflectionCompletions(
  ctx: ReflectionContext,
): Promise<ReflectionCompletionSet> {
  const primaryChannel = ctx.channel
  const adjacentChannel = SHENG_NEIGHBOR[primaryChannel]
  const crossChannel = KE_NEIGHBOR[primaryChannel]

  try {
    // Dynamic import to avoid hard dependency on AI SDK
    const { generateObject } = await import('ai')
    const { getOpenAI } = await import('@/lib/openai')

    const system = buildCompletionSystemPrompt(ctx)
    const prompt = buildCompletionUserPrompt(ctx)

    const result = await generateObject({
      model: getOpenAI()('gpt-4o-mini'),
      schema: aiCompletionSetSchema,
      system,
      prompt,
    })

    const output = result.object

    // Map AI output to typed suggestions
    const suggestions: [ReflectionCompletionSuggestion, ReflectionCompletionSuggestion, ReflectionCompletionSuggestion] = [
      {
        key: 'channel_aligned',
        label: `${CHANNEL_THEME[primaryChannel].element} Insight — ${CHANNEL_THEME[primaryChannel].noun}`,
        channel: primaryChannel,
        element: CHANNEL_THEME[primaryChannel].element,
        title: output.channel_aligned.title,
        body: output.channel_aligned.body,
        framing: 'direct',
      },
      {
        key: 'adjacent',
        label: `${CHANNEL_THEME[adjacentChannel].element} Insight — ${CHANNEL_THEME[adjacentChannel].noun} (from ${adjacentChannel})`,
        channel: adjacentChannel,
        element: CHANNEL_THEME[adjacentChannel].element,
        title: output.adjacent.title,
        body: output.adjacent.body,
        framing: 'generative',
      },
      {
        key: 'cross',
        label: `${CHANNEL_THEME[crossChannel].element} Insight — ${CHANNEL_THEME[crossChannel].noun} (from ${crossChannel})`,
        channel: crossChannel,
        element: CHANNEL_THEME[crossChannel].element,
        title: output.cross.title,
        body: output.cross.body,
        framing: 'challenging',
      },
    ]

    return {
      suggestions,
      source: 'ai',
      contextSummary: {
        playerId: ctx.playerId,
        channel: ctx.channel,
        face: ctx.face,
        waveMove: ctx.waveMove,
        intakeBarId: ctx.intake.barId,
        actionBarId: ctx.action.barId,
      },
    }
  } catch (error) {
    // AI unavailable or failed — fall back to static suggestions
    // This ensures non-AI path is always available
    console.warn(
      '[alchemy-engine] AI reflection generation failed, falling back to static:',
      error instanceof Error ? error.message : String(error),
    )
    return buildStaticCompletionSuggestions(ctx)
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Truncate a string for use in suggestion templates. */
function truncateForSuggestion(text: string, maxLength: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength - 1) + '…'
}

/**
 * Get the Wuxing element for an emotional channel.
 * Exported for use in UI components that need element labels.
 */
export function getChannelElement(channel: EmotionalChannel): string {
  return CHANNEL_THEME[channel]?.element ?? 'Earth'
}

/**
 * Get the shēng (generative) and kè (control) neighbors for a channel.
 * Useful for UI components showing the 3-suggestion spread.
 */
export function getChannelNeighbors(channel: EmotionalChannel): {
  generative: EmotionalChannel
  control: EmotionalChannel
} {
  return {
    generative: SHENG_NEIGHBOR[channel],
    control: KE_NEIGHBOR[channel],
  }
}
