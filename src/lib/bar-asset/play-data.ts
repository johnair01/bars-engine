/**
 * PlayData — Phase 4: Feedback Loop
 * Play interaction data → BarSeed → pipeline
 * Sprint: sprint/bar-asset-pipeline-001
 */

import type { SeedMetabolizationState } from '../bar-seed-metabolization/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlayEventType = 'choice' | 'outcome' | 'completion' | 'abandon'

export interface PlayData {
  sourceBarId: string
  playerId: string
  eventType: PlayEventType
  payload: {
    selectedOption?: number
    outcome?: string
    timeToComplete?: number
    emotionalResponse?: string
  }
  playedAt: string
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * Convert PlayData to a BarSeed-compatible content + metadata pair.
 * Used by the feedback loop to ingest play data as new BarSeed inputs.
 *
 * @param playData - The raw play event
 * @param creator - Creator namespace for the new BarSeed. Defaults to 'playtest'.
 * @returns Content string and metadata, or null if event should be excluded (abandon)
 */
export function playDataToBarSeed(
  playData: PlayData,
  creator: string = 'playtest',
): { content: string; metadata: Partial<SeedMetabolizationState> } | null {
  // Never generate feedback from abandoned runs — distorts quality signals
  if (playData.eventType === 'abandon') {
    return null
  }

  if (!playData.sourceBarId) {
    return null
  }

  const timeTag = playData.payload.timeToComplete
    ? playData.payload.timeToComplete > 5 * 60 * 1000
      ? ' (slow completion flag)'
      : ''
    : ''

  let content: string

  switch (playData.eventType) {
    case 'choice': {
      const option = playData.payload.selectedOption ?? 0
      content = `Player selected option ${option} from bar ${playData.sourceBarId}.`
      break
    }
    case 'outcome': {
      const outcome = playData.payload.outcome ?? 'unknown'
      const time = playData.payload.timeToComplete
        ? ` resolved in ${playData.payload.timeToComplete}ms`
        : ''
      content = `Outcome: ${outcome}${time}${timeTag}. Player engaged with bar ${playData.sourceBarId}.`
      break
    }
    case 'completion': {
      const outcome = playData.payload.outcome ?? 'completed'
      const time = playData.payload.timeToComplete
        ? ` completed in ${playData.payload.timeToComplete}ms`
        : ' completed'
      content = `${outcome}${time}${timeTag}. Bar ${playData.sourceBarId} finished.`
      break
    }
    default: {
      content = `Play event on bar ${playData.sourceBarId}: ${playData.eventType}`
    }
  }

  const metadata: Partial<SeedMetabolizationState> = {
    soilKind: null,
    contextNote: `playback:${playData.playerId}:${playData.eventType}`,
    maturity: 'captured', // Always start at captured — must earn integration
  }

  return { content, metadata }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface PlayDataValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate a PlayData payload before ingestion.
 * Returns issues; throws nothing.
 */
export function validatePlayData(data: unknown): PlayDataValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['playData must be an object'] }
  }

  const d = data as Record<string, unknown>

  if (typeof d.sourceBarId !== 'string' || !d.sourceBarId.trim()) {
    errors.push('sourceBarId is required and must be a non-empty string')
  }

  if (typeof d.playerId !== 'string' || !d.playerId.trim()) {
    errors.push('playerId is required and must be a non-empty string')
  }

  const validEventTypes = ['choice', 'outcome', 'completion', 'abandon']
  if (!validEventTypes.includes(d.eventType as string)) {
    errors.push(`eventType must be one of: ${validEventTypes.join(', ')}`)
  }

  if (!d.payload || typeof d.payload !== 'object') {
    errors.push('payload is required and must be an object')
  }

  return { valid: errors.length === 0, errors }
}