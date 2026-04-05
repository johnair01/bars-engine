/**
 * Emotional Alchemy API — State Validation
 *
 * Validates emotional states (channel + altitude) and returns state_id.
 */

import type { EmotionalChannelId, SatisfactionAltitude } from './constants'
import { EMOTIONAL_CHANNELS, SATISFACTION_ALTITUDES } from './constants'

export interface ValidateStateResult {
  valid: boolean
  state_id?: string
  error?: string
}

/**
 * Validate an emotional state. Returns state_id as {channel}_{altitude}.
 */
export function validateEmotionalState(
  channel: string,
  altitude: string
): ValidateStateResult {
  const channelNorm = channel?.toLowerCase().trim()
  const altitudeNorm = altitude?.toLowerCase().trim()

  const validChannel = EMOTIONAL_CHANNELS.includes(channelNorm as EmotionalChannelId)
  const validAltitude = SATISFACTION_ALTITUDES.includes(altitudeNorm as SatisfactionAltitude)

  if (!validChannel) {
    return {
      valid: false,
      error: `Invalid channel: ${channel}. Must be one of: ${EMOTIONAL_CHANNELS.join(', ')}`,
    }
  }

  if (!validAltitude) {
    return {
      valid: false,
      error: `Invalid altitude: ${altitude}. Must be one of: ${SATISFACTION_ALTITUDES.join(', ')}`,
    }
  }

  return {
    valid: true,
    state_id: `${channelNorm}_${altitudeNorm}`,
  }
}
