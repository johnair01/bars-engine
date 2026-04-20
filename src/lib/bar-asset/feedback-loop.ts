/**
 * Feedback Loop — Phase 4: Play data -> pipeline
 * Sprint: sprint/bar-asset-pipeline-001
 */

import type { PlayData } from './play-data'
import { buildStructuredBarId, parseStructuredBarId } from './id'
import type { BarAsset } from './types'
import { persistBarAsset, type PersistBarAssetResult } from './persistence'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedbackLoopResult {
  barAssetCreated: boolean
  barAssetId: string | null
  persisted: boolean
  skipped: boolean
  skipReason?: string
}

export interface FeedbackLoopOptions {
  /** Creator namespace for new BarAssets. Defaults to 'playtest'. */
  creator?: string
  /** Auto-promote to 'integrated' maturity. Defaults to false. */
  autoPromote?: boolean
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Process a single play event and route it through the feedback loop.
 *
 * Flow:
 * 1. Validate the play data
 * 2. Convert to BarAsset content
 * 3. Persist BarAsset to CustomBar
 *
 * @returns FeedbackLoopResult describing what happened
 */
export async function processPlayEvent(
  playData: PlayData,
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult> {
  const { creator = 'playtest' } = options

  // Step 1: Convert to BarAsset content
  const conversion = playDataToBarSeed(playData, creator)

  if (conversion === null) {
    return {
      barAssetCreated: false,
      barAssetId: null,
      persisted: false,
      skipped: true,
      skipReason: `event type '${playData.eventType}' excluded from feedback`,
    }
  }

  // Step 2: Build structured id
  const sequence = hashToSequence(playData.playerId)
  const barAssetId = buildStructuredBarId('blessed', creator, sequence)

  // Step 3: Build BarAsset
  const parsed = parseStructuredBarId(playData.sourceBarId)
  const barType = parsed?.barType ?? 'blessed'
  const maturity = 'integrated' as const
  const integratedAt: string | null = new Date().toISOString()

  const barAsset: BarAsset = {
    barDef: {
      id: barAssetId,
      type: barType as any,
      title: `Playtest: ${playData.sourceBarId}`,
      description: conversion.content,
      inputs: [],
      reward: 0,
      unique: false,
    },
    maturity,
    integratedAt,
    sourceSeedId: playData.sourceBarId,
    metadata: {
      tags: ['playback', playData.eventType],
    },
  }

  // Step 4: Persist
  const result: PersistBarAssetResult = await persistBarAsset({ barAsset, createdBy: creator })

  return {
    barAssetCreated: true,
    barAssetId,
    persisted: true,
    skipped: false,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function playDataToBarSeed(playData: PlayData, _creator: string): { content: string } | null {
  // Exclude certain event types from feedback
  const excludedEvents = ['abandon']
  if (excludedEvents.includes(playData.eventType)) return null

  // Build content from play data
  const selected = playData.payload?.selectedOption !== undefined
    ? String(playData.payload.selectedOption)
    : 'none'
  const outcome = playData.payload?.outcome ?? 'unknown'
  const content = `[${playData.eventType}] Player: ${playData.playerId} -> bar ${playData.sourceBarId} | option: ${selected} | outcome: ${outcome}`
  return { content }
}

function hashToSequence(playerId: string): number {
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    const char = playerId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % 999 + 1
}

// ---------------------------------------------------------------------------
// Batch processing
// ---------------------------------------------------------------------------

/**
 * Process multiple play events in batch.
 * Useful for periodic sync of play data -> feedback loop.
 */
export async function processPlayEventBatch(
  events: PlayData[],
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult[]> {
  return Promise.all(events.map(event => processPlayEvent(event, options)))
}
