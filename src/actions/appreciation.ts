'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { fireTrigger } from '@/actions/quest-engine'

const APPRECIATION_TYPES = ['courage', 'care', 'clarity', 'support', 'creativity', 'completion'] as const
const MIN_AMOUNT = 1
const MAX_AMOUNT = 10

export type AppreciationType = (typeof APPRECIATION_TYPES)[number]

export type SendAppreciationInput = {
  amount: number
  targetPlayerId?: string
  targetQuestId?: string
  appreciationType?: AppreciationType
  note?: string
  createAppreciationBar?: boolean
}

export type SendAppreciationResult =
  | { success: true; barId?: string }
  | { error: string }

function isValidAppreciationType(v: unknown): v is AppreciationType {
  return typeof v === 'string' && APPRECIATION_TYPES.includes(v as AppreciationType)
}

/**
 * Send vibeulons to a player or quest creator as appreciation.
 * Spec: .specify/specs/appreciation-mechanic/spec.md
 */
export async function sendAppreciationAction(
  input: SendAppreciationInput
): Promise<SendAppreciationResult> {
  const sender = await getCurrentPlayer()
  if (!sender) return { error: 'Not logged in' }

  const {
    amount: rawAmount,
    targetPlayerId,
    targetQuestId,
    appreciationType,
    note = '',
    createAppreciationBar = true,
  } = input

  const amount = Math.floor(Number(rawAmount))
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return { error: `Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}` }
  }

  const hasPlayer = !!targetPlayerId?.trim()
  const hasQuest = !!targetQuestId?.trim()
  if (hasPlayer === hasQuest) {
    return { error: 'Provide exactly one of targetPlayerId or targetQuestId' }
  }

  const type = isValidAppreciationType(appreciationType) ? appreciationType : undefined
  const noteTrimmed = (note || '').trim().slice(0, 200)

  const result = await db.$transaction(async (tx) => {
    let recipientId: string
    let targetType: 'player' | 'quest'
    let targetId: string
    let campaignRef: string | null = null

    if (hasPlayer) {
      const player = await tx.player.findUnique({
        where: { id: targetPlayerId!.trim() },
        select: { id: true },
      })
      if (!player) return { error: 'Player not found' }
      recipientId = player.id
      targetType = 'player'
      targetId = player.id
    } else {
      const quest = await tx.customBar.findUnique({
        where: { id: targetQuestId!.trim() },
        select: { id: true, creatorId: true, campaignRef: true },
      })
      if (!quest) return { error: 'Quest not found' }
      recipientId = quest.creatorId
      targetType = 'quest'
      targetId = quest.id
      campaignRef = quest.campaignRef
    }

    if (recipientId === sender.id) {
      return { error: 'Cannot appreciate yourself' }
    }

    const wallet = await tx.vibulon.findMany({
      where: { ownerId: sender.id },
      orderBy: { createdAt: 'asc' },
      take: amount,
    })

    if (wallet.length < amount) {
      return {
        error: `Insufficient balance. You have ${wallet.length} vibeulon(s); need ${amount}.`,
      }
    }

    const recipient = await tx.player.findUnique({
      where: { id: recipientId },
      select: { name: true },
    })
    const recipientLabel = recipient?.name || 'a player'
    const senderLabel = sender.name || 'A player'

    const notesSuffix = [type, noteTrimmed].filter(Boolean).join(' • ')
    const senderNotes = `Appreciation to ${recipientLabel}${notesSuffix ? ` (${notesSuffix})` : ''}`
    const recipientNotes = `Appreciation from ${senderLabel}${notesSuffix ? ` (${notesSuffix})` : ''}`

    for (const token of wallet) {
      await tx.vibulon.update({
        where: { id: token.id },
        data: {
          ownerId: recipientId,
          generation: token.generation + 1,
        },
      })
    }

    await tx.vibulonEvent.create({
      data: {
        playerId: sender.id,
        source: 'appreciation',
        amount: -amount,
        notes: senderNotes,
        archetypeMove: 'PERMEATE',
        questId: targetType === 'quest' ? targetId : null,
      },
    })
    await tx.vibulonEvent.create({
      data: {
        playerId: recipientId,
        source: 'appreciation',
        amount,
        notes: recipientNotes,
        archetypeMove: 'PERMEATE',
        questId: targetType === 'quest' ? targetId : null,
      },
    })

    let barId: string | undefined
    if (createAppreciationBar) {
      const inputs = JSON.stringify({
        appreciationType: type ?? null,
        targetType,
        targetId,
        amount,
        note: noteTrimmed || null,
      })
      const bar = await tx.customBar.create({
        data: {
          creatorId: sender.id,
          title: `Appreciation: ${type || 'general'} • ${amount} ⓥ`,
          description: noteTrimmed || `Sent ${amount} vibeulon(s) as appreciation`,
          type: 'appreciation',
          reward: 0,
          inputs,
          visibility: campaignRef ? 'public' : 'private',
          status: 'active',
          parentId: targetType === 'quest' ? targetId : null,
          campaignRef,
        },
      })
      barId = bar.id
    }

    return { success: true as const, barId }
  })

  if ('error' in result) return result

  revalidatePath('/')
  revalidatePath('/wallet')
  revalidatePath('/bars/available')
  revalidatePath('/hand')

  await fireTrigger('VIBEULON_SENT')

  return result
}

export type AppreciationFeedItem = {
  id: string
  senderId: string
  senderName: string
  amount: number
  appreciationType: string | null
  targetType: 'player' | 'quest'
  targetId: string
  note: string | null
  questTitle: string | null
  createdAt: Date
}

/**
 * Get appreciation BARs where current player is the recipient.
 * Spec FR6: appreciation BARs for current player as recipient.
 */
export async function getAppreciationFeed(
  limit = 20
): Promise<{ success: true; appreciations: AppreciationFeedItem[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const bars = await db.customBar.findMany({
    where: { type: 'appreciation' },
    include: {
      creator: { select: { id: true, name: true } },
      parent: { select: { id: true, title: true, creatorId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 2, // over-fetch for filtering
  })

  const filtered: AppreciationFeedItem[] = []
  for (const bar of bars) {
    let inputs: { targetType?: string; targetId?: string; amount?: number; appreciationType?: string; note?: string }
    try {
      inputs = JSON.parse(bar.inputs || '{}') as typeof inputs
    } catch {
      continue
    }
    const targetType = inputs.targetType as 'player' | 'quest' | undefined
    const targetId = inputs.targetId

    const isRecipient =
      (targetType === 'player' && targetId === player.id) ||
      (targetType === 'quest' && bar.parent?.creatorId === player.id)

    if (!isRecipient) continue

    filtered.push({
      id: bar.id,
      senderId: bar.creatorId,
      senderName: bar.creator?.name || 'A player',
      amount: inputs.amount ?? 0,
      appreciationType: inputs.appreciationType ?? null,
      targetType: (targetType as 'player' | 'quest') || 'player',
      targetId: targetId || '',
      note: inputs.note ?? null,
      questTitle: bar.parent?.title ?? null,
      createdAt: bar.createdAt,
    })

    if (filtered.length >= limit) break
  }

  return { success: true, appreciations: filtered }
}
