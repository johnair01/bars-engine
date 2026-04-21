/**
 * Feedback Loop — Phase 4: Play data → BarSeed → pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Flow:
 *   Play event → BarSeed content → auto-promote → BarAsset → CustomBar upsert
 *
 * Lifecycle:
 *   processPlayEvent: validates + routes
 *   persistBarAsset:  writes BarAsset → CustomBar (see persistence.ts)
 */

import { playDataToBarSeed, type PlayData } from './play-data'
import { buildStructuredBarId, parseStructuredBarId } from './id'
import { promoteToIntegrated } from './types'
import { persistBarAsset, type BarAssetPersistenceInput } from './persistence'
import type { BarDef } from '../bars'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedbackLoopResult {
  id: string | null
  persisted: boolean
  skipped: boolean
  skipReason?: string
}

export interface FeedbackLoopOptions {
  /** Creator namespace for new BarSeeds. Default: 'playtest' */
  creator?: string
  /** Auto-promote to integrated. Default: false (queue mode) */
  autoPromote?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashToSequence(playerId: string): number {
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    const char = playerId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash) % 999 + 1
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Process a single play event through the feedback loop.
 */
export async function processPlayEvent(
  playData: PlayData,
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult> {
  const { creator = 'playtest' } = options

  // Step 1: Convert to BarSeed content
  const conversion = playDataToBarSeed(playData, creator)
  if (conversion === null) {
    return {
      id: null,
      persisted: false,
      skipped: true,
      skipReason: `event type '${playData.eventType}' excluded from feedback`,
    }
  }

  // Step 2: Build structured id
  const sequence = hashToSequence(playData.playerId)
  const barSeedId = buildStructuredBarId('blessed', creator, sequence)

  // Step 3: Build a minimal BarDef from the play data
  const parsed = parseStructuredBarId(playData.sourceBarId)
  const barType = parsed?.barType ?? 'blessed'

  const barDef: BarDef = {
    id: barSeedId,
    type: barType as BarDef['type'],
    title: `Playtest: ${playData.sourceBarId}`,
    description: conversion.content,
    inputs: [],
    reward: 0,
    unique: false,
  }

  // Step 4: Wrap as BarAsset — maturity starts at 'captured'
  // NOTE: autoPromote is not implemented in this sprint; seeds queue at 'captured'
  // The maturity gate will block them from entering Constructor B until manually promoted.
  const sourceSeedId = playData.sourceBarId
  const asset = promoteToIntegrated(barDef, sourceSeedId, {
    author: creator,
    tags: ['playback', playData.eventType],
  })

  // Step 5: Persist to CustomBar
  const input: BarAssetPersistenceInput = {
    barAsset: asset,
    createdBy: creator,
  }

  try {
    const result = await persistBarAsset(input, { db: null as any })
    return {
      id: result.id,
      persisted: true,
      skipped: false,
    }
  } catch (err) {
    return {
      id: barSeedId,
      persisted: false,
      skipped: true,
      skipReason: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Process multiple play events in batch.
 */
export async function processPlayEventBatch(
  events: PlayData[],
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult[]> {
  return Promise.all(events.map(event => processPlayEvent(event, options)))
}
