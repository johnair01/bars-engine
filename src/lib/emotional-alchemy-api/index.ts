/**
 * Emotional Alchemy API
 *
 * Canonical API for emotional state validation and move resolution.
 * Single source of truth for channels, altitudes, and transitions.
 */

export {
  EMOTIONAL_CHANNELS,
  SATISFACTION_ALTITUDES,
  MOVE_TYPES,
  TRANSITION_TYPES,
  CHANNEL_TO_ELEMENT,
  ELEMENT_TO_CHANNEL,
  LEGAL_ALTITUDE_TRANSITIONS,
} from './constants'
export type {
  EmotionalChannelId,
  SatisfactionAltitude,
  MoveType,
  TransitionType,
} from './constants'

export {
  MOVE_REGISTRY,
  getTranscendMove,
  getTranslateMove,
  getMoveAdminMetadata,
} from './registry'
export type {
  TranscendMoveEntry,
  TranslateMoveEntry,
  MoveRegistryEntry,
} from './registry'

export { validateEmotionalState } from './validate'
export type { ValidateStateResult } from './validate'

export { resolveEmotionalMove } from './resolve'
export type {
  ResolvedMove,
  ResolveMoveResult,
  ResolveMoveInput,
} from './resolve'
