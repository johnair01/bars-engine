/**
 * BarAsset Persistence — Phase 3
 * Connects BarAsset output to existing CustomBar rows via the status lifecycle.
 * Sprint: sprint/bar-asset-pipeline-002 | Issue: #76
 *
 * Lifecycle: seed → draft → active → archived
 * - BarSeed from NL authoring  → status='seed'
 * - BarAsset from translation   → status='active' (storyPath + twineLogic + storyMood set)
 * - Constructor C renders it    → no status change (already active)
 */

import { z } from 'zod'
import type { BarAsset } from './types'

/** Minimum fields required to upsert a CustomBar from a BarAsset. */
export const BarAssetPersistenceSchema = z.object({
  barAsset: z.custom<BarAsset>(),
  createdBy: z.string().min(1, 'creator id required'),
})

export type BarAssetPersistenceInput = z.infer<typeof BarAssetPersistenceSchema>

/** Result of a persistence write. */
export interface PersistBarAssetResult {
  id: string
  status: 'seed' | 'draft' | 'active' | 'archived'
  isNew: boolean
  barType: string
  title: string
}

/**
 * Persist a BarAsset to a CustomBar row.
 *
 * @requires barAsset.sourceSeedId is not null — a BarAsset must have a traceable seed id
 *
 * Upsert logic:
 * - If structured BarId exists → update existing CustomBar row
 * - If legacy/freeform id       → create new CustomBar row
 *
 * Status transition:
 * - Any seed → 'active' (translation marks it as game-ready)
 * - No downgrades: 'active' or 'archived' rows are not moved backward
 *
 * CustomBar fields populated from BarAsset:
 * - barDef.title       → title
 * - barDef.description → description
 * - barDef.type        → type (vibe | story | insight)
 * - barDef.inputs      → inputs (JSON string)
 * - barAsset.metadata.storyMood  → storyMood (from metadata)
 * - barAsset.metadata.storyPath  → storyPath (from metadata)
 * - barAsset.metadata.twineLogic → twineLogic (from metadata)
 */
export async function persistBarAsset(
  input: BarAssetPersistenceInput,
  ctx: { db: PrismaClientLike },
): Promise<PersistBarAssetResult> {
  const parsed = BarAssetPersistenceSchema.parse(input)
  const { barAsset, createdBy } = parsed

  if (!barAsset.sourceSeedId) {
    throw new Error('persistBarAsset requires barAsset.sourceSeedId to be set')
  }

  // Build bar id from the source seed.
  const barId: string = barAsset.sourceSeedId
  const barDef = barAsset.barDef
  const barType = barDef.type
  const title = barDef.title
  const description = barDef.description
  const inputs = JSON.stringify(barDef.inputs)
  const storyMood = barAsset.metadata?.gameMasterFace ?? null
  const storyPath = barAsset.metadata?.tags?.join(',') ?? null
  const twineLogic = barAsset.metadata?.emotionalVector
    ? JSON.stringify(barAsset.metadata.emotionalVector)
    : null

  const targetStatus: PersistBarAssetResult['status'] = 'active'

  const existing = await ctx.db.customBar.findUnique({ where: { id: barId } })

  if (existing) {
    const safeStatus: PersistBarAssetResult['status'] =
      existing.status === 'archived'
        ? 'archived'
        : targetStatus

    const updated = await ctx.db.customBar.update({
      where: { id: barId },
      data: {
        type: barType,
        title,
        description,
        inputs,
        storyMood,
        storyPath,
        twineLogic,
        status: safeStatus,
      },
    })

    return {
      id: updated.id,
      status: safeStatus,
      isNew: false,
      barType: updated.type,
      title: updated.title,
    }
  }

  const created = await ctx.db.customBar.create({
    data: {
      id: barId,
      creatorId: createdBy,
      type: barType,
      title,
      description,
      inputs,
      storyMood,
      storyPath,
      twineLogic,
      status: targetStatus,
      visibility: 'public',
    },
  })

  return {
    id: created.id,
    status: targetStatus,
    isNew: true,
    barType: created.type,
    title: created.title,
  }
}

/** Prisma-like client interface for dependency injection in tests. */
export interface PrismaClientLike {
  customBar: {
    findUnique(opts: { where: { id: string } }): Promise<{
      id: string
      status: string
      type: string
      title: string
    } | null>
    update(opts: {
      where: { id: string }
      data: Record<string, unknown>
    }): Promise<{ id: string; status: string; type: string; title: string }>
    create(opts: { data: Record<string, unknown> }): Promise<{
      id: string
      status: string
      type: string
      title: string
    }>
  }
}
