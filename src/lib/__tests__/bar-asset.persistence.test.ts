/**
 * bar-asset.persistence.test.ts
 * Phase 3: persistence layer tests.
 * Sprint: sprint/bar-asset-pipeline-001
 */

import { describe, expect, it, beforeEach, vi } from 'bun:test'
import { persistBarAsset, inferBarTypeFromId } from '../bar-asset/persistence'
import type { PrismaClientLike } from '../bar-asset/persistence'
import type { BarAsset } from '../bar-asset/types'

// --------------------------------------------------------------------------...
// Test fixture helpers
// --------------------------------------------------------------------------...

function makeMockDb(initialRows: Record<string, { id: string; status: string; type: string; title: string } | null> = {}) {
  const store: Record<string, { id: string; status: string; type: string; title: string } | null> = { ...initialRows }
  return {
    customBar: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => store[where.id] ?? null),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = store[where.id]
        if (!existing) throw new Error('Update target not found')
        const updated = { ...existing, ...data } as { id: string; status: string; type: string; title: string }
        store[where.id] = updated
        return updated
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: data.id as string, status: data.status as string, type: data.type as string, title: data.title as string }
        store[row.id] = row
        return row
      }),
    },
  } satisfies PrismaClientLike
}

function makeAsset(overrides: Partial<BarAsset['barDef']> & { sourceSeedId?: string; metadata?: BarAsset['metadata'] } = {}): BarAsset {
  return {
    barDef: {
      id: overrides.sourceSeedId ?? 'blessed_wendell_001',
      type: (overrides.type as BarAsset['barDef']['type']) ?? 'vibe',
      title: overrides.title ?? 'Test Blessed Object',
      description: overrides.description ?? 'A test artifact of power.',
      inputs: overrides.inputs ?? [],
      reward: 1,
      unique: true,
    },
    maturity: 'integrated',
    integratedAt: '2026-04-20T00:00:00.000Z',
    sourceSeedId: overrides.sourceSeedId ?? 'blessed_wendell_001',
    metadata: overrides.metadata,
  }
}

// --------------------------------------------------------------------------...
// persistBarAsset
// --------------------------------------------------------------------------...

describe('persistBarAsset', () => {
  it('creates a new CustomBar row when id is new', async () => {
    const db = makeMockDb()
    const asset = makeAsset()

    const result = await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(result.isNew).toBe(true)
    expect(result.status).toBe('active')
    expect(result.id).toBe('blessed_wendell_001')
    expect(result.barType).toBe('vibe')
    expect(db.customBar.create).toHaveBeenCalled()
  })

  it('updates existing row when id already exists and status is seed', async () => {
    const db = makeMockDb({
      blessed_wendell_001: { id: 'blessed_wendell_001', status: 'seed', type: 'vibe', title: 'Old Title' },
    })

    const asset = makeAsset({ title: 'New Title', sourceSeedId: 'blessed_wendell_001' })

    const result = await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(result.isNew).toBe(false)
    expect(result.status).toBe('active')
    expect(result.title).toBe('New Title')
    expect(db.customBar.update).toHaveBeenCalled()
  })

  it('does not downgrade archived rows', async () => {
    const db = makeMockDb({
      blessed_wendell_001: { id: 'blessed_wendell_001', status: 'archived', type: 'vibe', title: 'Old Title' },
    })

    const asset = makeAsset({ sourceSeedId: 'blessed_wendell_001' })

    const result = await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(result.isNew).toBe(false)
    expect(result.status).toBe('archived')
    expect(db.customBar.update).toHaveBeenCalled()
    // Status should remain archived, not upgrade to active
    expect(db.customBar.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'archived' }) }),
    )
  })

  it('maps barDef.title → CustomBar.title', async () => {
    const db = makeMockDb()
    const asset = makeAsset({ title: 'The Rune of Seeing', sourceSeedId: 'rune_zoc_001' })

    await persistBarAsset({ barAsset: asset, createdBy: 'user_zoc' }, { db })

    expect(db.customBar.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'The Rune of Seeing' }) }),
    )
  })

  it('maps barDef.type → CustomBar.type', async () => {
    const db = makeMockDb()
    const asset = makeAsset({ type: 'story' })

    await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(db.customBar.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'story' }) }),
    )
  })

  it('maps metadata.gameMasterFace → CustomBar.storyMood', async () => {
    const db = makeMockDb()
    const asset = makeAsset({ metadata: { gameMasterFace: 'shaman', tags: [] } })

    await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(db.customBar.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ storyMood: 'shaman' }) }),
    )
  })

  it('maps metadata.tags → CustomBar.storyPath', async () => {
    const db = makeMockDb()
    const asset = makeAsset({ metadata: { tags: ['ancient', 'rune', 'fire'], gameMasterFace: undefined } })

    await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(db.customBar.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ storyPath: 'ancient,rune,fire' }) }),
    )
  })

  it('sets visibility to public on new rows', async () => {
    const db = makeMockDb()
    const asset = makeAsset()

    await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(db.customBar.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ visibility: 'public' }) }),
    )
  })

  it('sets status to active on new rows', async () => {
    const db = makeMockDb()
    const asset = makeAsset()

    await persistBarAsset({ barAsset: asset, createdBy: 'user_wendell' }, { db })

    expect(db.customBar.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'active' }) }),
    )
  })
})

// --------------------------------------------------------------------------...
// inferBarTypeFromId
// --------------------------------------------------------------------------...

describe('inferBarTypeFromId', () => {
  it('returns blessed for blessed_wendell_001', () => {
    expect(inferBarTypeFromId('blessed_wendell_001')).toBe('blessed')
  })

  it('returns rune for rune_zoc_001', () => {
    expect(inferBarTypeFromId('rune_zoc_001')).toBe('rune')
  })

  it('returns quest for quest_barsengine_001', () => {
    expect(inferBarTypeFromId('quest_barsengine_001')).toBe('quest')
  })

  it('returns vibe for legacy unstructured ids', () => {
    expect(inferBarTypeFromId('some-random-bar-id')).toBe('vibe')
  })

  it('returns vibe for cuid-style ids', () => {
    expect(inferBarTypeFromId('clr9hkfl900000qcertain')).toBe('vibe')
  })
})
