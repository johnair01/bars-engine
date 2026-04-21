/**
 * bar-asset.feedback-loop.test.ts — Phase 4
 * Sprint: sprint/bar-asset-pipeline-002
 */

import { describe, expect, it, beforeEach, vi } from 'bun:test'
import { processPlayEvent, processPlayEventBatch } from '../bar-asset/feedback-loop'
import type { PlayData } from '../bar-asset/play-data'

// ---------------------------------------------------------------------------
// Stub DB — captures what gets written
// ---------------------------------------------------------------------------

interface StubRecord {
  id: string
  status: string
  type: string
  title: string
}

let stubDb: {
  findUnique: () => Promise<StubRecord | null>
  create: (data: { data: Record<string, unknown> }) => Promise<StubRecord>
  update: (data: { data: Record<string, unknown> }) => Promise<StubRecord>
}

function makeStubDb(existing: StubRecord | null = null) {
  const created: StubRecord[] = []
  stubDb = {
    findUnique: async () => existing,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const record = { id: data.id as string, status: 'active', type: data.type as string, title: data.title as string }
      created.push(record)
      return record
    },
    update: async ({ data }: { data: Record<string, unknown> }) => {
      return { id: data.id as string, status: 'active', type: data.type as string, title: data.title as string }
    },
  }
  return { db: stubDb }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('processPlayEvent', () => {
  it('skips excluded event types', async () => {
    const { db } = makeStubDb()
    const result = await processPlayEvent(
      { eventType: 'page_view', sourceBarId: 'blessed_test_001', playerId: 'p1' },
      { creator: 'test' },
    )
    expect(result.skipped).toBe(true)
    expect(result.skipReason).toContain('page_view')
  })

  it('skips empty content', async () => {
    const { db } = makeStubDb()
    const result = await processPlayEvent(
      { eventType: 'completion', sourceBarId: 'blessed_test_001', playerId: 'p1', content: '' },
      { creator: 'test' },
    )
    expect(result.skipped).toBe(true)
    expect(result.skipReason).toContain('empty')
  })

  it('skips whitespace-only content', async () => {
    const { db } = makeStubDb()
    const result = await processPlayEvent(
      { eventType: 'completion', sourceBarId: 'blessed_test_001', playerId: 'p1', content: '   \n  ' },
      { creator: 'test' },
    )
    expect(result.skipped).toBe(true)
    expect(result.skipReason).toContain('empty')
  })

  it('persists BarAsset when content is valid', async () => {
    const { db } = makeStubDb()
    const result = await processPlayEvent(
      { eventType: 'completion', sourceBarId: 'blessed_test_001', playerId: 'p1', content: 'The village was saved!' },
      { creator: 'test' },
    )
    expect(result.skipped).toBe(false)
    expect(result.barAssetId).toBeTruthy()
    expect(result.persisted).toBe(true)
    expect(result.barAssetCreated).toBe(true)
  })

  it('builds structured bar id with correct format', async () => {
    const { db } = makeStubDb()
    const result = await processPlayEvent(
      { eventType: 'completion', sourceBarId: 'blessed_test_001', playerId: 'player_alice', content: 'Hello world' },
      { creator: 'test' },
    )
    expect(result.barAssetId).toMatch(/^blessed_test_\d+$/)
  })

  it('uses custom creator namespace', async () => {
    const { db } = makeStubDb()
    const result = await processPlayEvent(
      { eventType: 'completion', sourceBarId: 'blessed_test_001', playerId: 'p1', content: 'Content' },
      { creator: 'mycampaign' },
    )
    expect(result.barAssetId).toMatch(/^blessed_mycampaign_\d+$/)
  })

  it('skips session_heartbeat events', async () => {
    const { db } = makeStubDb()
    const result = await processPlayEvent(
      { eventType: 'session_heartbeat', sourceBarId: 'blessed_test_001', playerId: 'p1', content: 'ping' },
      { creator: 'test' },
    )
    expect(result.skipped).toBe(true)
    expect(result.skipReason).toContain('session_heartbeat')
  })
})

describe('processPlayEventBatch', () => {
  it('processes multiple events concurrently', async () => {
    const { db } = makeStubDb()
    const events: PlayData[] = [
      { eventType: 'completion', sourceBarId: 'blessed_a_001', playerId: 'p1', content: 'First' },
      { eventType: 'completion', sourceBarId: 'blessed_a_001', playerId: 'p2', content: 'Second' },
      { eventType: 'completion', sourceBarId: 'blessed_a_001', playerId: 'p3', content: 'Third' },
    ]
    const results = await processPlayEventBatch(events, { creator: 'batch_test' })
    expect(results).toHaveLength(3)
    expect(results.filter(r => !r.skipped)).toHaveLength(3)
  })

  it('returns skipped results for mixed valid/invalid events', async () => {
    const { db } = makeStubDb()
    const events: PlayData[] = [
      { eventType: 'completion', sourceBarId: 'blessed_a_001', playerId: 'p1', content: 'Valid' },
      { eventType: 'page_view', sourceBarId: 'blessed_a_001', playerId: 'p2', content: 'Invalid' },
    ]
    const results = await processPlayEventBatch(events, { creator: 'batch_test' })
    expect(results[0].skipped).toBe(false)
    expect(results[1].skipped).toBe(true)
  })
})