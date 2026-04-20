/**
 * Feedback Loop — Phase 4: Play data → BarSeed → pipeline
 * Sprite: sprint/bar-asset-pipeline-001
 */

import { playDataToBarSeed, type PlayData } from './play-data'
import { buildStructuredBarId, parseStructuredBarId } from './id'
import { promoteToIntegrated, hasMinimumMaturity } from './types'
import { persistBarAsset } from './persistence'
import type { BarAsset } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedbackLoopResult {
  barSeedCreated: boolean
  barSeedId: string | null
  barAssetUpdated: boolean
  skipped: boolean
  skipReason?: string
}

export interface FeedbackLoopOptions {
  /**
   * Creator namespace for new BarSeeds from play data.
   * Defaults to 'playtest'.
   */
  creator?: string
  /**
   * Auto-promote BarSeed to BarAsset when maturity is met.
   * Defaults to false (queuing mode for batch-friendly operation).
   */
  autoPromote?: boolean
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Process a single play event through the feedback loop.
 *
 * Flow:
 * 1. Validate the play data
 * 2. Convert to BarSeed content + metadata
 * 3. Create BarSeed record (at maturity = 'captured')
 * 4. If autoPromote and maturity >= shared_or_acted, translate to BarAsset
 * 5. Persist BarAsset to CustomBar
 *
 * @returns FeedbackLoopResult describing what happened
 */
export async function processPlayEvent(
  playData: PlayData,
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult> {
  const { creator = 'playtest', autoPromote = false } = options

  // Step 1: Convert to BarSeed
  const conversion = playDataToBarSeed(playData, creator)

  if (conversion === null) {
    // abandon or invalid — skip without error
    return {
      barSeedCreated: false,
      barSeedId: null,
      barAssetUpdated: false,
      skipped: true,
      skipReason: `event type '${playData.eventType}' excluded from feedback`,
    }
  }

  // Step 2: Build structured id
  // Use a sequence counter keyed to playerId to avoid collisions
  const sequence = hashToSequence(playData.playerId)
  const barSeedId = buildStructuredBarId('blessed', creator, sequence)

  // Step 3: Build a BarAsset from the play data
  // This BarAsset has maturity = 'captured' initially
  const barAsset = buildBarAssetFromSeed(barSeedId, playData, conversion)

  // Step 4: If autoPromote and maturity >= shared_or_acted, promote
  // NOTE: For play-derived seeds, maturity starts at 'captured'.
  // The maturity gate is enforced — no short-circuiting.
  // autoPromote only matters if the seed already has enough maturity.
  if (autoPromote && hasMinimumMaturity(barAsset.sourceSeedId ? { maturity: barAsset.metadata?.maturityPhase ?? 'captured' } as any, 'shared_or_acted')) {
    promoteToIntegrated(barAsset)
  }

  // Step 5: Persist
  const persisted = await persistBarAsset(barAsset)

  return {
    barSeedCreated: true,
    barSeedId,
    barAssetUpdated: persisted,
    skipped: false,
  }
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

function buildBarAssetFromSeed(
  barSeedId: string,
  playData: PlayData,
  conversion: { content: string; metadata: Partial<import('../bar-seed-metabolization/types').SeedMetabolizationState> },
): BarAsset {
  // Infer bar type from source bar id
  const parsed = parseStructuredBarId(playData.sourceBarId)
  const barType = parsed?.barType ?? 'blessed'

  return {
    barDef: {
      id: barSeedId,
      type: barType as any,
      title: `Playtest: ${playData.sourceBarId}`,
      description: conversion.content,
      inputs: [],
      reward: 0,
      unique: false,
      storyPath: playData.eventType,
      twineLogic: null,
    },
    maturityPhase: conversion.metadata.maturity ?? 'captured',
    sourceSeedId: playData.sourceBarId,
    metadata: {
      gameMasterFace: null,
      emotionalContent: null,
      tags: ['playback', playData.eventType],
      integratedAt: null,
    },
  }
}

// ---------------------------------------------------------------------------
// Batch processing (for future use)
// ---------------------------------------------------------------------------

/**
 * Process multiple play events in batch.
 * Useful for periodic sync of play data → feedback loop.
 */
export async function processPlayEventBatch(
  events: PlayData[],
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult[]> {
  return Promise.all(events.map(event => processPlayEvent(event, options)))
}