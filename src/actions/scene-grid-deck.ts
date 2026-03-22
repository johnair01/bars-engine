'use server'

import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  incrementSceneAtlasDailyInStoryProgress,
  sceneAtlasDailyBindBlocked,
} from '@/lib/scene-atlas-daily'
import {
  SCENE_ATLAS_BAR_TEMPLATE_KEY,
  SCENE_ATLAS_BAR_TEMPLATE_VERSION,
  type SceneAtlasBarTemplateMeta,
} from '@/lib/creator-scene-grid-deck/bar-template'

/**
 * Shared transaction step: archive prior bindings for this slot or this BAR, create binding,
 * participation, daily Scene Atlas counter.
 */
export async function applySceneGridBindingInTx(
  tx: Prisma.TransactionClient,
  params: {
    playerId: string
    barId: string
    instanceId: string
    cardId: string
    instanceSlug: string
  }
): Promise<void> {
  await tx.barBinding.updateMany({
    where: {
      OR: [
        { cardId: params.cardId, authorActorId: params.playerId, status: 'active' },
        { barId: params.barId, authorActorId: params.playerId, status: 'active' },
      ],
    },
    data: { status: 'archived' },
  })

  await tx.barBinding.create({
    data: {
      cardId: params.cardId,
      barId: params.barId,
      authorActorId: params.playerId,
      instanceId: params.instanceId,
      status: 'active',
    },
  })

  await tx.instanceParticipation.upsert({
    where: {
      playerId_instanceId: { playerId: params.playerId, instanceId: params.instanceId },
    },
    update: {},
    create: { playerId: params.playerId, instanceId: params.instanceId },
  })

  const latest = await tx.player.findUnique({
    where: { id: params.playerId },
    select: { storyProgress: true },
  })
  await tx.player.update({
    where: { id: params.playerId },
    data: {
      storyProgress: incrementSceneAtlasDailyInStoryProgress(latest?.storyProgress),
    },
  })
}

export type SceneGridBindableBarRow = { id: string; title: string; type: string }

/** BARs the current player can attach to a Scene Atlas cell (inspirations + other vault captures). */
export async function getSceneGridBindableBars(): Promise<SceneGridBindableBarRow[]> {
  const playerId = (await cookies()).get('bars_player_id')?.value
  if (!playerId) return []

  return db.customBar.findMany({
    where: {
      creatorId: playerId,
      status: 'active',
      inviteId: null,
      visibility: { in: ['private', 'public'] },
    },
    select: { id: true, title: true, type: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function bindSceneGridCardToExistingBar(
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const playerId = (await cookies()).get('bars_player_id')?.value
  if (!playerId) {
    return { error: 'Not logged in' }
  }

  const instanceId = (formData.get('instanceId') as string)?.trim()
  const cardId = (formData.get('cardId') as string)?.trim()
  const instanceSlug = (formData.get('instanceSlug') as string)?.trim()
  const barId = (formData.get('barId') as string)?.trim()
  const sceneGridSuit = (formData.get('sceneGridSuit') as string)?.trim() || ''
  const sceneGridRankRaw = (formData.get('sceneGridRank') as string)?.trim() || ''
  const sceneGridRankParsed = sceneGridRankRaw ? Number.parseInt(sceneGridRankRaw, 10) : NaN
  const sceneGridRank = Number.isFinite(sceneGridRankParsed) ? sceneGridRankParsed : null

  if (!instanceId || !cardId || !instanceSlug || !barId) {
    return { error: 'Missing deck or BAR' }
  }

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { id: true, nationId: true, archetypeId: true, storyProgress: true },
  })
  if (!player) return { error: 'Player not found' }
  if (!player.nationId || !player.archetypeId) {
    return { error: 'Choose nation and archetype before using Scene Atlas.' }
  }

  const dailyBlock = sceneAtlasDailyBindBlocked(player.storyProgress)
  if (dailyBlock) {
    return { error: dailyBlock }
  }

  const card = await db.barDeckCard.findFirst({
    where: { id: cardId, deck: { instanceId } },
    select: { id: true },
  })
  if (!card) {
    return { error: 'Card not found for this deck' }
  }

  const bar = await db.customBar.findFirst({
    where: {
      id: barId,
      creatorId: playerId,
      status: 'active',
      inviteId: null,
      visibility: { in: ['private', 'public'] },
    },
    select: { id: true, completionEffects: true },
  })
  if (!bar) {
    return { error: 'BAR not found, not yours, or cannot be placed on the deck' }
  }

  let effects: Record<string, unknown> = {}
  if (bar.completionEffects?.trim()) {
    try {
      const parsed = JSON.parse(bar.completionEffects) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        effects = parsed as Record<string, unknown>
      }
    } catch {
      /* keep empty */
    }
  }
  effects.sceneGridDeck = { instanceId, cardId, instanceSlug }
  const barTemplate: SceneAtlasBarTemplateMeta = {
    key: SCENE_ATLAS_BAR_TEMPLATE_KEY,
    version: SCENE_ATLAS_BAR_TEMPLATE_VERSION,
    suit: sceneGridSuit || null,
    rank: sceneGridRank,
  }
  effects.barTemplate = barTemplate

  try {
    await db.$transaction(async (tx) => {
      await tx.customBar.update({
        where: { id: barId },
        data: { completionEffects: JSON.stringify(effects) },
      })
      await applySceneGridBindingInTx(tx, {
        playerId,
        barId,
        instanceId,
        cardId,
        instanceSlug,
      })
    })
  } catch (e) {
    console.error('bindSceneGridCardToExistingBar', e)
    return { error: 'Could not attach BAR to this card' }
  }

  revalidatePath('/creator-scene-deck')
  revalidatePath(`/creator-scene-deck/${instanceSlug}`)
  revalidatePath('/hand')
  revalidatePath('/bars')
  return { ok: true }
}
