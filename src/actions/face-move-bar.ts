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

  const { title, description, barType = 'vibe', questId, instanceId, metadata = {}, nextAction } = input

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

    const agentMetadata =
      nextAction?.trim()
        ? JSON.stringify({ sourceType: '321', nextAction: nextAction.trim() })
        : null

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
        agentMetadata,
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

/** Shaman: Create ritual — moment before a quest (name a belief, light a candle) */
export async function createRitual(input: {
  belief: string
  questId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `Ritual: ${input.belief.trim()}`
  return createFaceMoveBar('shaman', 'create_ritual', {
    title,
    description: input.belief.trim(),
    barType: 'vibe',
    questId: input.questId,
  })
}

/** Shaman: Name shadow belief — player names/acknowledges a shadow belief; Shaman witnesses */
export async function nameShadowBelief(input: {
  belief: string
  questId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `Shadow belief: ${input.belief.trim()}`
  return createFaceMoveBar('shaman', 'name_shadow_belief', {
    title,
    description: input.belief.trim(),
    barType: 'insight',
    questId: input.questId,
  })
}

/** Regent: Declare period — "We are in Coalition"; focuses quests on a Kotter stage */
export async function declarePeriod(input: {
  period: string
  instanceId?: string
  creatorId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `We are in ${input.period.trim()}`
  const inputObj: FaceMoveBarInput = {
    title,
    description: input.period.trim(),
    barType: 'vibe',
    instanceId: input.instanceId,
  }
  if (input.creatorId) {
    return createFaceMoveBarAs(input.creatorId, 'regent', 'declare_period', inputObj)
  }
  return createFaceMoveBar('regent', 'declare_period', inputObj)
}

/** Regent: Grant role — steward, quest-owner, campaign contributor */
export async function grantRole(input: {
  targetPlayerName: string
  role: string
  questId?: string
  instanceId?: string
  creatorId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `Role granted: ${input.targetPlayerName.trim()} — ${input.role.trim()}`
  const inputObj: FaceMoveBarInput = {
    title,
    description: `${input.role.trim()} granted to ${input.targetPlayerName.trim()}`,
    barType: 'vibe',
    questId: input.questId,
    instanceId: input.instanceId,
    metadata: { targetPlayerName: input.targetPlayerName.trim(), role: input.role.trim() },
  }
  if (input.creatorId) {
    return createFaceMoveBarAs(input.creatorId, 'regent', 'grant_role', inputObj)
  }
  return createFaceMoveBar('regent', 'grant_role', inputObj)
}

/** Architect: Offer blueprint — quest template players can fork */
export async function offerBlueprint(input: {
  title: string
  description: string
  questId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  return createFaceMoveBar('architect', 'offer_blueprint', {
    title: input.title.trim(),
    description: input.description?.trim() || '',
    barType: 'vibe',
    questId: input.questId,
  })
}

/** Architect: Design layout — gameboard layout or slot order suggestion */
export async function designLayout(input: {
  suggestion: string
  instanceId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `Blueprint: ${input.suggestion.trim()}`
  return createFaceMoveBar('architect', 'design_layout', {
    title,
    description: input.suggestion.trim(),
    barType: 'vibe',
    instanceId: input.instanceId,
  })
}

/** Sage: Witness — hold paradox; witness completion; offer meta-perspective */
export async function witness(input: {
  note: string
  questId?: string
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `Witnessed: ${input.note.trim()}`
  return createFaceMoveBar('sage', 'witness', {
    title,
    description: input.note.trim(),
    barType: 'insight',
    questId: input.questId,
  })
}

/** Sage: Cast hexagram — I Ching reading for player decision */
export async function castHexagram(input: {
  hexagramId: number
  interpretation: string
  transformedHexagramId?: number
}): Promise<FaceMoveBarResult | FaceMoveBarError> {
  const title = `Hexagram ${input.hexagramId}${input.transformedHexagramId ? ` → ${input.transformedHexagramId}` : ''}`
  return createFaceMoveBar('sage', 'cast_hexagram', {
    title,
    description: input.interpretation.trim(),
    barType: 'vibe',
    metadata: {
      hexagramId: input.hexagramId,
      transformedHexagramId: input.transformedHexagramId ?? null,
    },
  })
}
