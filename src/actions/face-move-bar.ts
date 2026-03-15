'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type {
  FaceMoveBarInput,
  FaceMoveBarResult,
  FaceMoveBarError,
  FaceMoveType,
} from '@/lib/face-move-bar'
import { ALL_CANONICAL_MOVES, getMoveById } from '@/lib/quest-grammar/move-engine'

const VALID_FACES: GameMasterFace[] = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
]

/**
 * Create a BAR from a Game Master face move.
 * Every face move produces a CustomBar with gameMasterFace set.
 */
export async function createFaceMoveBar(
  face: GameMasterFace,
  moveType: FaceMoveType,
  input: FaceMoveBarInput
): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    return { error: 'Not logged in' }
  }

  if (!VALID_FACES.includes(face)) {
    return { error: `Invalid face: ${face}` }
  }

  const { title, description, barType = 'vibe', questId, instanceId, metadata = {} } = input

  if (!title?.trim()) {
    return { error: 'Title is required' }
  }

  try {
    const creator = await db.player.findUnique({
      where: { id: playerId },
      select: { id: true },
    })
    if (!creator) return { error: 'Player not found' }

    const faceMoveMetadata = {
      faceMove: {
        moveType,
        questId: questId ?? null,
        playerId: input.playerId ?? playerId,
        instanceId: instanceId ?? null,
        ...metadata,
      },
    }

    const bar = await db.customBar.create({
      data: {
        creatorId: playerId,
        title: title.trim(),
        description: description?.trim() || '',
        type: barType,
        visibility: 'private',
        status: 'active',
        gameMasterFace: face,
        completionEffects: JSON.stringify(faceMoveMetadata),
        reward: 0,
      },
    })

    revalidatePath('/')
    revalidatePath('/hand')
    revalidatePath('/bars/available')

    return { success: true, barId: bar.id }
  } catch (e) {
    console.error('[createFaceMoveBar]', e)
    return { error: e instanceof Error ? e.message : 'Failed to create face move BAR' }
  }
}

/**
 * Create a face move BAR when creatorId is provided (e.g. system or admin-initiated).
 * Use when the current session user is not the creator (e.g. Regent declares period on admin advance).
 */
export async function createFaceMoveBarAs(
  creatorId: string,
  face: GameMasterFace,
  moveType: FaceMoveType,
  input: FaceMoveBarInput
): Promise<FaceMoveBarResult | FaceMoveBarError> {
  if (!VALID_FACES.includes(face)) {
    return { error: `Invalid face: ${face}` }
  }

  const { title, description, barType = 'vibe', questId, instanceId, metadata = {} } = input

  if (!title?.trim()) {
    return { error: 'Title is required' }
  }

  try {
    const creator = await db.player.findUnique({
      where: { id: creatorId },
      select: { id: true },
    })
    if (!creator) return { error: 'Creator not found' }

    const faceMoveMetadata = {
      faceMove: {
        moveType,
        questId: questId ?? null,
        playerId: input.playerId ?? null,
        instanceId: instanceId ?? null,
        ...metadata,
      },
    }

    const bar = await db.customBar.create({
      data: {
        creatorId,
        title: title.trim(),
        description: description?.trim() || '',
        type: barType,
        visibility: 'private',
        status: 'active',
        gameMasterFace: face,
        completionEffects: JSON.stringify(faceMoveMetadata),
        reward: 0,
      },
    })

    revalidatePath('/')
    revalidatePath('/hand')
    revalidatePath('/bars/available')

    return { success: true, barId: bar.id }
  } catch (e) {
    console.error('[createFaceMoveBarAs]', e)
    return { error: e instanceof Error ? e.message : 'Failed to create face move BAR' }
  }
}

/** Challenger: Issue challenge — time-bound quest, bid, or dare */
export async function issueChallenge(input: {
  title: string
  description: string
  questId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  return createFaceMoveBar('challenger', 'issue_challenge', {
    title: input.title.trim(),
    description: input.description?.trim() || '',
    barType: 'vibe',
    questId: input.questId,
    metadata: {},
  })
}

/** Challenger: Propose move — recommend one of 15 canonical moves */
export async function proposeMove(input: {
  moveId?: string
  energyNote?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const move = input.moveId
    ? getMoveById(input.moveId)
    : ALL_CANONICAL_MOVES[Math.floor(Math.random() * ALL_CANONICAL_MOVES.length)]
  if (!move) return { error: 'Move not found' }
  const energyNote = input.energyNote?.trim() || `Energy: ${move.energyDelta >= 0 ? '+' : ''}${move.energyDelta}`
  const title = `Challenger: ${move.name}`
  const description = [move.narrative, energyNote].filter(Boolean).join('\n\n')
  return createFaceMoveBar('challenger', 'propose_move', {
    title,
    description,
    barType: 'vibe',
    metadata: { moveId: move.id, energyDelta: move.energyDelta },
  })
}

/** Diplomat: Offer connection — "Consider reaching out to X" */
export async function offerConnection(input: {
  suggestedPlayerName: string
  message: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `Consider reaching out to ${input.suggestedPlayerName.trim()}`
  const description = input.message?.trim() || ''
  return createFaceMoveBar('diplomat', 'offer_connection', {
    title,
    description,
    barType: 'vibe',
    metadata: { suggestedPlayerName: input.suggestedPlayerName.trim() },
  })
}

/** Diplomat: Host event — community event, shared reflection */
export async function hostEvent(input: {
  title: string
  description: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  return createFaceMoveBar('diplomat', 'host_event', {
    title: input.title.trim(),
    description: input.description?.trim() || '',
    barType: 'vibe',
  })
}
