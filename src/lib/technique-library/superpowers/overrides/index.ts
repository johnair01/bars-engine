/**
 * Hand-authored hero-cell overrides, keyed by card id. Applied over the
 * generated grid in decks.ts (mirrors the base deck's AUTHORED pattern).
 * Spec: .specify/specs/superpower-deck-quality/spec.md § FR8
 */

import type { Technique } from '../../types'
import { CONNECTOR_OVERRIDES } from './connector'
import { ESCAPE_ARTIST_OVERRIDES } from './escape-artist'

export const SUPERPOWER_OVERRIDES: Record<string, Technique> = {
  ...CONNECTOR_OVERRIDES,
  ...ESCAPE_ARTIST_OVERRIDES,
}
