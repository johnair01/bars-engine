'use server'

import type { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  normalizeSceneAtlasGuidedDraftPayload,
  parseSceneAtlasGuidedDraftPayload,
  serializeSceneAtlasGuidedDraftPayload,
  type SceneAtlasGuidedDraftPayload,
} from '@/lib/creator-scene-grid-deck/scene-atlas-draft'

async function assertCardInInstance(instanceId: string, cardId: string) {
  const card = await db.barDeckCard.findFirst({
    where: { id: cardId, deck: { instanceId } },
    select: { id: true },
  })
  return card
}

export type LoadSceneAtlasGuidedDraftResult =
  | { ok: true; draft: SceneAtlasGuidedDraftPayload | null }
  | { ok: false; error: string }

/** Load persisted guided CYOA draft for this player × card (resume). */
export async function loadSceneAtlasGuidedDraft(
  instanceId: string,
  cardId: string
): Promise<LoadSceneAtlasGuidedDraftResult> {
  const playerId = (await cookies()).get('bars_player_id')?.value
  if (!playerId) return { ok: false, error: 'Not logged in' }
  const iid = instanceId?.trim()
  const cid = cardId?.trim()
  if (!iid || !cid) return { ok: false, error: 'Missing instance or card' }

  const cardOk = await assertCardInInstance(iid, cid)
  if (!cardOk) return { ok: false, error: 'Card not found for this deck' }

  const row = await db.sceneAtlasGuidedDraft.findUnique({
    where: { playerId_cardId: { playerId, cardId: cid } },
    select: { payload: true, instanceId: true },
  })
  if (!row) return { ok: true, draft: null }
  if (row.instanceId !== iid) return { ok: true, draft: null }

  const parsed = parseSceneAtlasGuidedDraftPayload(row.payload)
  return { ok: true, draft: parsed }
}

export type SaveSceneAtlasGuidedDraftResult = { ok: true } | { ok: false; error: string }

/** Upsert draft (autosave on step change / debounced typing). */
export async function saveSceneAtlasGuidedDraft(
  instanceId: string,
  cardId: string,
  partial: Partial<SceneAtlasGuidedDraftPayload> & { answers?: Partial<Record<string, string>> }
): Promise<SaveSceneAtlasGuidedDraftResult> {
  const playerId = (await cookies()).get('bars_player_id')?.value
  if (!playerId) return { ok: false, error: 'Not logged in' }
  const iid = instanceId?.trim()
  const cid = cardId?.trim()
  if (!iid || !cid) return { ok: false, error: 'Missing instance or card' }

  const cardOk = await assertCardInInstance(iid, cid)
  if (!cardOk) return { ok: false, error: 'Card not found for this deck' }

  const payload = normalizeSceneAtlasGuidedDraftPayload(partial)

  const jsonPayload = serializeSceneAtlasGuidedDraftPayload(payload) as Prisma.InputJsonValue

  await db.sceneAtlasGuidedDraft.upsert({
    where: { playerId_cardId: { playerId, cardId: cid } },
    create: {
      playerId,
      cardId: cid,
      instanceId: iid,
      payload: jsonPayload,
    },
    update: {
      instanceId: iid,
      payload: jsonPayload,
    },
  })

  return { ok: true }
}

export type DeleteSceneAtlasGuidedDraftResult = { ok: true } | { ok: false; error: string }

export async function deleteSceneAtlasGuidedDraft(
  instanceId: string,
  cardId: string
): Promise<DeleteSceneAtlasGuidedDraftResult> {
  const playerId = (await cookies()).get('bars_player_id')?.value
  if (!playerId) return { ok: false, error: 'Not logged in' }
  const iid = instanceId?.trim()
  const cid = cardId?.trim()
  if (!iid || !cid) return { ok: false, error: 'Missing instance or card' }

  await db.sceneAtlasGuidedDraft.deleteMany({
    where: { playerId, cardId: cid, instanceId: iid },
  })
  return { ok: true }
}
