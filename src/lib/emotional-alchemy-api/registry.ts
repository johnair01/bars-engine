/**
 * Emotional Alchemy API — Move Registry
 *
 * 15 transcend moves (same-channel) + 10 translate moves (cross-channel).
 * Transcend: stabilization, activation, integration per channel.
 * Translate: flow cycle + control cycle (v1 unified).
 */

import type { EmotionalChannelId, SatisfactionAltitude, TransitionType } from './constants'
import {
  CHANNEL_TO_ELEMENT,
  EMOTIONAL_CHANNELS,
  ELEMENT_TO_CHANNEL,
  LEGAL_ALTITUDE_TRANSITIONS,
} from './constants'
import { ALL_CANONICAL_MOVES, getMoveById } from '@/lib/quest-grammar/move-engine'

export interface TranscendMoveEntry {
  move_id: string
  from_channel: EmotionalChannelId
  from_altitude: SatisfactionAltitude
  to_channel: EmotionalChannelId
  to_altitude: SatisfactionAltitude
  move_type: 'transcend'
  transition_type: TransitionType
  parent_move_id: string
  prompt_template: string
  short_label: string
  completion_reflection_template: string
}

export interface TranslateMoveEntry {
  move_id: string
  from_channel: EmotionalChannelId
  to_channel: EmotionalChannelId
  move_type: 'translate'
  prompt_template: string
  short_label: string
  completion_reflection_template: string
}

export type MoveRegistryEntry = TranscendMoveEntry | TranslateMoveEntry

/** Copy templates by transition type */
const STABILIZATION_COPY = {
  prompt: 'Guide the player from reactivity into steadiness.',
  completion: 'Acknowledge increased clarity and stability.',
}
const ACTIVATION_COPY = {
  prompt: 'Guide the player from available energy into generative movement.',
  completion: 'Acknowledge momentum and participation.',
}
const INTEGRATION_COPY = {
  prompt: 'Guide the player from peak energy into sustainable coherence.',
  completion: 'Acknowledge harvest and consolidation.',
}

/** Build transcend registry entries */
function buildTranscendRegistry(): TranscendMoveEntry[] {
  const entries: TranscendMoveEntry[] = []
  const transitions: { from: SatisfactionAltitude; to: SatisfactionAltitude; type: TransitionType }[] = [
    { from: 'dissatisfied', to: 'neutral', type: 'stabilization' },
    { from: 'neutral', to: 'satisfied', type: 'activation' },
    { from: 'satisfied', to: 'neutral', type: 'integration' },
  ]

  for (const channel of EMOTIONAL_CHANNELS) {
    const element = CHANNEL_TO_ELEMENT[channel]
    const parentMoveId = `${element}_transcend`

    for (const { from, to, type } of transitions) {
      const copy =
        type === 'stabilization'
          ? STABILIZATION_COPY
          : type === 'activation'
            ? ACTIVATION_COPY
            : INTEGRATION_COPY

      entries.push({
        move_id: `${channel}_${from}_to_${channel}_${to}`,
        from_channel: channel,
        from_altitude: from,
        to_channel: channel,
        to_altitude: to,
        move_type: 'transcend',
        transition_type: type,
        parent_move_id: parentMoveId,
        prompt_template: copy.prompt,
        short_label: `${channel} ${type}`,
        completion_reflection_template: copy.completion,
      })
    }
  }

  return entries
}

/** Build translate registry from canonical moves */
function buildTranslateRegistry(): TranslateMoveEntry[] {
  const entries: TranslateMoveEntry[] = []
  const translateMoves = ALL_CANONICAL_MOVES.filter(
    (m) => m.category === 'Generative' || m.category === 'Control'
  )

  for (const move of translateMoves) {
    if (!move.fromElement || !move.toElement) continue
    const fromChannel = ELEMENT_TO_CHANNEL[move.fromElement] as EmotionalChannelId
    const toChannel = ELEMENT_TO_CHANNEL[move.toElement] as EmotionalChannelId
    if (!fromChannel || !toChannel) continue

    entries.push({
      move_id: move.id,
      from_channel: fromChannel,
      to_channel: toChannel,
      move_type: 'translate',
      prompt_template: move.narrative,
      short_label: move.name,
      completion_reflection_template: `Reflect on how ${move.name} shaped this moment.`,
    })
  }

  return entries
}

const TRANSCEND_REGISTRY = buildTranscendRegistry()
const TRANSLATE_REGISTRY = buildTranslateRegistry()

export const MOVE_REGISTRY: MoveRegistryEntry[] = [...TRANSCEND_REGISTRY, ...TRANSLATE_REGISTRY]

/** Lookup transcend move by from/to state */
export function getTranscendMove(
  fromChannel: EmotionalChannelId,
  fromAltitude: SatisfactionAltitude,
  toChannel: EmotionalChannelId,
  toAltitude: SatisfactionAltitude
): TranscendMoveEntry | null {
  if (fromChannel !== toChannel) return null
  const validTargets = LEGAL_ALTITUDE_TRANSITIONS[fromAltitude]
  if (!validTargets?.includes(toAltitude)) return null

  return (
    TRANSCEND_REGISTRY.find(
      (m) =>
        m.from_channel === fromChannel &&
        m.from_altitude === fromAltitude &&
        m.to_altitude === toAltitude
    ) ?? null
  )
}

/** Lookup translate move by channel pair */
export function getTranslateMove(
  fromChannel: EmotionalChannelId,
  toChannel: EmotionalChannelId
): TranslateMoveEntry | null {
  if (fromChannel === toChannel) return null

  return (
    TRANSLATE_REGISTRY.find(
      (m) => m.from_channel === fromChannel && m.to_channel === toChannel
    ) ?? null
  )
}

/** Get admin metadata for a move (WAVE stage, energy, etc.) */
export function getMoveAdminMetadata(
  moveId: string,
  parentMoveId?: string
): Record<string, unknown> {
  const canonical = getMoveById(parentMoveId ?? moveId)
  if (!canonical) return { grammar_version: 'v1' }
  return {
    grammar_version: 'v1',
    primary_wave_stage: canonical.primaryWaveStage,
    energy_delta: canonical.energyDelta,
    narrative: canonical.narrative,
  }
}
