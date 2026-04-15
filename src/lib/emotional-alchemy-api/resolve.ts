/**
 * Emotional Alchemy API — Resolve Move
 *
 * Resolves emotional moves from (from_state, to_state).
 * Full path (dissatisfied→satisfied) returns 2 moves; single-step returns 1.
 */

import type { EmotionalChannelId, SatisfactionAltitude } from './constants'
import { getTranscendMove, getTranslateMove, getMoveAdminMetadata } from './registry'
import { validateEmotionalState } from './validate'

export interface ResolvedMove {
  move_id: string
  move_type: 'transcend' | 'translate'
  transition_type: 'stabilization' | 'activation' | 'integration' | null
  from_state: string
  to_state: string
  parent_move_id?: string
  player_facing_copy: {
    prompt: string
    short_label: string
    completion_reflection: string
  }
  admin_metadata: Record<string, unknown>
}

export interface ResolveMoveResult {
  status: 'resolved' | 'unresolved'
  moves?: ResolvedMove[]
  error_code?: string
  message?: string
}

export interface ResolveMoveInput {
  from: { channel: string; altitude: string }
  to: { channel: string; altitude: string }
  context?: {
    campaign_id?: string
    player_id?: string
    quest_template_id?: string
    source_context_tags?: string[]
    desired_outcome_tags?: string[]
  }
}

function toResolvedMove(move: {
  move_id: string
  move_type: 'transcend' | 'translate'
  transition_type?: 'stabilization' | 'activation' | 'integration' | null
  from_state: string
  to_state: string
  parent_move_id?: string
  prompt_template: string
  short_label: string
  completion_reflection_template: string
}): ResolvedMove {
  const adminMetadata = getMoveAdminMetadata(move.move_id, move.parent_move_id)
  return {
    move_id: move.move_id,
    move_type: move.move_type,
    transition_type: move.transition_type ?? null,
    from_state: move.from_state,
    to_state: move.to_state,
    ...(move.parent_move_id && { parent_move_id: move.parent_move_id }),
    player_facing_copy: {
      prompt: move.prompt_template,
      short_label: move.short_label,
      completion_reflection: move.completion_reflection_template,
    },
    admin_metadata: adminMetadata,
  }
}

/**
 * Resolve emotional move(s) from from_state to to_state.
 * Full path (dissatisfied→satisfied same channel) returns [stabilization, activation].
 */
export function resolveEmotionalMove(input: ResolveMoveInput): ResolveMoveResult {
  const fromValid = validateEmotionalState(input.from.channel, input.from.altitude)
  const toValid = validateEmotionalState(input.to.channel, input.to.altitude)

  if (!fromValid.valid) {
    return {
      status: 'unresolved',
      error_code: 'invalid_from_state',
      message: fromValid.error,
    }
  }

  if (!toValid.valid) {
    return {
      status: 'unresolved',
      error_code: 'invalid_to_state',
      message: toValid.error,
    }
  }

  const fromChannel = input.from.channel.toLowerCase() as EmotionalChannelId
  const fromAltitude = input.from.altitude.toLowerCase() as SatisfactionAltitude
  const toChannel = input.to.channel.toLowerCase() as EmotionalChannelId
  const toAltitude = input.to.altitude.toLowerCase() as SatisfactionAltitude
  const fromState = fromValid.state_id!
  const toState = toValid.state_id!

  // Same channel → transcend
  if (fromChannel === toChannel) {
    // Full path: dissatisfied → satisfied
    if (fromAltitude === 'dissatisfied' && toAltitude === 'satisfied') {
      const stabilization = getTranscendMove(
        fromChannel,
        'dissatisfied',
        toChannel,
        'neutral'
      )
      const activation = getTranscendMove(fromChannel, 'neutral', toChannel, 'satisfied')

      if (!stabilization || !activation) {
        return {
          status: 'unresolved',
          error_code: 'illegal_transition',
          message: 'Could not resolve full path (stabilization + activation).',
        }
      }

      return {
        status: 'resolved',
        moves: [
          toResolvedMove({
            ...stabilization,
            from_state: fromState,
            to_state: `${fromChannel}_neutral`,
          }),
          toResolvedMove({
            ...activation,
            from_state: `${fromChannel}_neutral`,
            to_state: toState,
          }),
        ],
      }
    }

    // Single-step transcend
    const move = getTranscendMove(fromChannel, fromAltitude, toChannel, toAltitude)
    if (!move) {
      return {
        status: 'unresolved',
        error_code: 'illegal_transition',
        message: `Invalid same-channel transition: ${fromState} → ${toState}. Must be dissatisfied→neutral, neutral→satisfied, or satisfied→neutral.`,
      }
    }

    return {
      status: 'resolved',
      moves: [
        toResolvedMove({
          ...move,
          from_state: fromState,
          to_state: toState,
        }),
      ],
    }
  }

  // Cross-channel → translate
  const translateMove = getTranslateMove(fromChannel, toChannel)
  if (!translateMove) {
    return {
      status: 'unresolved',
      error_code: 'illegal_transition',
      message: 'Cross-channel transition not in flow or control cycle.',
    }
  }

  return {
    status: 'resolved',
    moves: [
      toResolvedMove({
        ...translateMove,
        transition_type: null,
        from_state: fromState,
        to_state: toState,
      }),
    ],
  }
}
