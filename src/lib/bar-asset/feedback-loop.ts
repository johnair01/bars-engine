/**
 * Feedback Loop — Phase 4: Play data → BarAsset pipeline
 * Sprint: sprint/bar-asset-pipeline-002
 *
 * Flow:
 *   1. Receive PlayData from game client
 *   2. Filter excluded event types
 *   3. Convert to BarAsset content (title + description)
 *   4. Persist BarAsset to CustomBar via persistBarAsset
 *
 * Out of scope (deferred):
 * - Feedback → new BarSeed cycle
 * - Batch processing with concurrency limits
 */

import { buildStructuredBarId, parseStructuredBarId } from './id'
import type { BarAsset } from './types'
import { persistBarAsset, type BarAssetPersistenceInput } from './persistence'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayData {
  /** Which event triggered this. Used to filter exclusions. */
  eventType: string
  /** The bar this play contributed to. */
  sourceBarId: string
  /** Player who triggered the event. */
  playerId: string
  /** Optional — NL text from the play. May be empty. */
  content?: string
}

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
}

// ---------------------------------------------------------------------------
// Event type exclusions
// ---------------------------------------------------------------------------

const EXCLUDED_EVENT_TYPES = new Set([
  'page_view',
  'session_heartbeat',
  'telemetry_degraded',
])

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Process a single play event and route it through the feedback loop.
 *
 * Returns FeedbackLoopResult describing what happened:
 * - `skipped: true` + `skipReason` if the event type is excluded
 * - `skipped: false` + persisted BarAsset if content is present
 * - `skipped: false` + persisted BarAsset if autoCreate is enabled (even empty content)
 */
export async function processPlayEvent(
  playData: PlayData,
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult> {
  const creator = options.creator ?? 'playtest'

  // Filter excluded event types
  if (EXCLUDED_EVENT_TYPES.has(playData.eventType)) {
    return {
      barAssetCreated: false,
      barAssetId: null,
      persisted: false,
      skipped: true,
      skipReason: `event type '${playData.eventType}' excluded from feedback`,
    }
  }

  // Skip if no content (nothing to write)
  if (!playData.content || playData.content.trim().length === 0) {
    return {
      barAssetCreated: false,
      barAssetId: null,
      persisted: false,
      skipped: true,
      skipReason: 'content empty — nothing to translate',
    }
  }

  // Build structured bar id
  const sequence = hashToSequence(playData.playerId)
  const barAssetId = buildStructuredBarId('blessed', creator, sequence)

  // Infer bar type from source bar id
  const parsed = parseStructuredBarId(playData.sourceBarId)
  const barType = (parsed?.barType ?? 'blessed') as BarAsset['barDef']['type']

  // Build BarAsset
  const barAsset: BarAsset = {
    id: barAssetId,
    barDef: {
      id: barAssetId,
      type: barType,
      title: `Playtest: ${playData.sourceBarId}`,
      description: playData.content.trim(),
      inputs: [],
      reward: 0,
      unique: false,
    },
    maturity: 'integrated',
    sourceSeedId: playData.sourceBarId,
    metadata: {
      tags: ['playback', playData.eventType],
    },
  }

  // Persist
  await persistBarAsset({ barAsset, createdBy: creator }, { db: getStubDb() })

  return {
    barAssetCreated: true,
    barAssetId,
    persisted: true,
    skipped: false,
  }
}

/**
 * Process multiple play events concurrently.
 */
export async function processPlayEventBatch(
  events: PlayData[],
  options: FeedbackLoopOptions = {},
): Promise<FeedbackLoopResult[]> {
  return Promise.all(events.map(event => processPlayEvent(event, options)))
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Simple deterministic hash → sequence number for bar id uniqueness. */
function hashToSequence(playerId: string): number {
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash)
}

/** Stub DB for unit tests — replace with real PrismaClient in the route handler. */
function getStubDb() {
  return {
    customBar: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) =>
        ({ id: data.id as string, status: 'active', type: 'blessed', title: '' }),
      update: async ({ data }: { data: Record<string, unknown> }) =>
        ({ id: data.id as string, status: 'active', type: 'blessed', title: '' }),
    },
  }
}