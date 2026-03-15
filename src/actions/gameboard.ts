'use server'

import { db } from '@/lib/db'
import { getAppConfig } from '@/actions/config'
import type { Prisma } from '@prisma/client'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { completeQuest } from '@/actions/quest-engine'
import {
  drawFromCampaignDeck,
  getCampaignDeckQuestIds,
} from '@/lib/gameboard'
import {
  drawFromDeck,
  markQuestPlayed,
  translateQuestForStage,
} from '@/lib/campaign-domain-deck'
import { createFaceMoveBar } from '@/actions/face-move-bar'
import type { AllyshipDomain } from '@/lib/kotter'
import { getActiveInstance } from '@/actions/instance'
import { generateRandomUnpacking, getArchetypePrimaryWave } from '@/lib/quest-grammar'
import { compileQuestWithAI, publishGameboardAlignedQuestToPlayer } from '@/actions/quest-grammar'
import type { ElementKey } from '@/lib/quest-grammar/elements'
import type { PersonalMoveType, IChingContext } from '@/lib/quest-grammar/types'
import type { UnpackingAnswers, SerializableQuestPacket } from '@/lib/quest-grammar/types'
import { getAlignmentContext, drawAlignedHexagram } from '@/lib/iching-alignment'
import { getHexagramStructure } from '@/lib/iching-struct'
import { getStageAction } from '@/lib/kotter'

const ELEMENT_KEYS: ElementKey[] = ['metal', 'water', 'wood', 'fire', 'earth']

function buildGameboardContext(
  parentQuest: { title: string; description: string | null; allyshipDomain?: string | null },
  period: number,
  instance: { targetDescription?: string | null } | null,
  campaignRef: string
) {
  const domain = (parentQuest.allyshipDomain ?? 'GATHERING_RESOURCES') as AllyshipDomain
  const stageAction = getStageAction(period, domain)
  const campaignGoal =
    instance?.targetDescription?.trim() || `${campaignRef} — people showing up`
  return {
    parentTitle: parentQuest.title,
    parentDescription: parentQuest.description ?? '',
    period,
    campaignGoal,
    stageAction,
  }
}

const SLOT_COUNT = 8

const DEFAULT_AID_OFFER_TTL_HOURS = 24

async function getAidOfferTtlHours(): Promise<number> {
  try {
    const config = await getAppConfig()
    const features = config?.features ? JSON.parse(config.features) : {}
    const ttl = features?.aidOfferTtlHours
    return typeof ttl === 'number' && ttl > 0 ? ttl : DEFAULT_AID_OFFER_TTL_HOURS
  } catch {
    return DEFAULT_AID_OFFER_TTL_HOURS
  }
}

const slotInclude = {
  quest: true,
  steward: { select: { id: true, name: true } as const },
  bids: {
    where: { status: 'active' },
    orderBy: { amount: 'desc' },
    take: 5,
    include: { bidder: { select: { id: true, name: true } } },
  },
  aidOffers: {
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      offerer: { select: { id: true, name: true } },
      linkedQuest: { select: { id: true, title: true } },
    },
  },
} as const

function getSlotInclude() {
  const now = new Date()
  return {
    ...slotInclude,
    aidOffers: {
      ...slotInclude.aidOffers,
      where: {
        status: 'pending',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    },
  } as typeof slotInclude
}

type SlotWithRelations = Prisma.GameboardSlotGetPayload<{
  include: typeof slotInclude
}>

/**
 * Get or create gameboard slots for the current instance/campaign/period.
 * If no slots exist, draw 8 from the campaign deck.
 */
export async function getOrCreateGameboardSlots(campaignRef: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const instance = await getActiveInstance()
  if (!instance) return { error: 'No active instance' }

  const period = instance.kotterStage ?? 1
  const domainRaw = instance.allyshipDomain ?? (campaignRef === 'bruised-banana' ? 'GATHERING_RESOURCES' : null)
  const domain = domainRaw as AllyshipDomain | null
  const useDomainDeck = domain != null && ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'].includes(domain)

  let slots: SlotWithRelations[] = await db.gameboardSlot.findMany({
    where: {
      instanceId: instance.id,
      campaignRef,
      period,
    },
    include: getSlotInclude(),
    orderBy: { slotIndex: 'asc' },
  })

  const allSlotsEmpty = slots.length > 0 && slots.every((s) => !s.questId)
  if (allSlotsEmpty) {
    let drawn: string[] = []
    if (useDomainDeck) {
      const result = await drawFromDeck(
        instance.id,
        campaignRef,
        domain as AllyshipDomain,
        period,
        SLOT_COUNT,
        []
      )
      drawn = result.questIds
    } else {
      const deck = await import('@/lib/gameboard').then((m) =>
        m.getCampaignDeckQuestIds(campaignRef, period, player.id)
      )
      if (deck.length > 0) {
        drawn = await drawFromCampaignDeck(
          instance.id,
          campaignRef,
          period,
          SLOT_COUNT,
          player.id
        )
      }
    }
    if (drawn.length > 0) {
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        if (slot && drawn[i]) {
          await db.gameboardSlot.update({
            where: { id: slot.id },
            data: { questId: drawn[i], drawnAt: new Date() },
          })
        }
      }
      slots = await db.gameboardSlot.findMany({
        where: {
          instanceId: instance.id,
          campaignRef,
          period,
        },
        include: getSlotInclude(),
        orderBy: { slotIndex: 'asc' },
      })
    }
  }

  if (slots.length === 0) {
    let drawn: string[] = []
    if (useDomainDeck) {
      const result = await drawFromDeck(
        instance.id,
        campaignRef,
        domain as AllyshipDomain,
        period,
        SLOT_COUNT,
        []
      )
      drawn = result.questIds
    } else {
      drawn = await drawFromCampaignDeck(
        instance.id,
        campaignRef,
        period,
        SLOT_COUNT,
        player.id
      )
    }
    await db.gameboardSlot.createMany({
      data: Array.from({ length: SLOT_COUNT }, (_, i) => ({
        instanceId: instance.id,
        campaignRef,
        period,
        slotIndex: i,
        questId: drawn[i] ?? null,
        drawnAt: drawn[i] ? new Date() : null,
      })),
    })
    if (drawn.length === 0) {
      slots = await db.gameboardSlot.findMany({
        where: {
          instanceId: instance.id,
          campaignRef,
          period,
        },
        include: getSlotInclude(),
        orderBy: { slotIndex: 'asc' },
      })
      return {
        slots,
        period,
        campaignRef,
        message: 'No quests in campaign deck. Add campaign quests to threads with adventure.campaignRef.',
      }
    }
    slots = await db.gameboardSlot.findMany({
      where: {
        instanceId: instance.id,
        campaignRef,
        period,
      },
      include: getSlotInclude(),
      orderBy: { slotIndex: 'asc' },
    })
  }

  if (useDomainDeck && domain) {
    for (const slot of slots) {
      if (slot.quest) {
        const translated = translateQuestForStage(
          { title: slot.quest.title, description: slot.quest.description },
          domain as AllyshipDomain,
          period
        )
        ;(slot.quest as { title: string; description: string }).title = translated.title
        ;(slot.quest as { title: string; description: string }).description = translated.description
      }
    }
  }

  return {
    slots,
    period,
    campaignRef,
    allyshipDomain: domain ?? undefined,
  }
}

/**
 * Take a slot quest — current player becomes steward.
 * Only when slot has a quest and no steward.
 * Optional ritualText: Shaman create ritual — creates a ritual BAR before taking.
 */
export async function takeSlotQuest(slotId: string, ritualText?: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
    include: { quest: true },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }
  if (slot.stewardId) return { error: 'Quest already taken by another player' }

  // Shaman: Create ritual — optional step before take
  if (ritualText?.trim()) {
    await createFaceMoveBar('shaman', 'create_ritual', {
      title: ritualText.trim().slice(0, 80) + (ritualText.trim().length > 80 ? '…' : ''),
      description: ritualText.trim(),
      barType: 'vibe',
      questId: slot.questId ?? undefined,
      metadata: { slotId },
    })
  }

  await db.gameboardSlot.update({
    where: { id: slotId },
    data: { stewardId: player.id },
  })

  // Regent: Grant role — every face move produces a BAR
  await createFaceMoveBar('regent', 'grant_role', {
    title: `Steward: ${slot.quest?.title ?? 'Quest'}`,
    description: `${player.name} took stewardship of this quest.`,
    barType: 'vibe',
    questId: slot.questId ?? undefined,
    playerId: player.id,
    metadata: { slotId, role: 'steward' },
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Release a slot quest — steward gives up stewardship.
 * If there are active bids, highest bidder becomes the new steward and their bid goes to the releasing steward.
 */
export async function releaseSlotQuest(slotId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
    include: {
      bids: {
        where: { status: 'active' },
        orderBy: { amount: 'desc' },
        take: 1,
        include: { bidder: true },
      },
    },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }
  if (slot.stewardId !== player.id) return { error: 'Only the steward can release' }

  const outgoingStewardId = slot.stewardId
  const highestBid = slot.bids[0]

  await db.$transaction(async (tx) => {
    if (highestBid) {
      // Transfer bid amount to outgoing steward (mint inside tx for atomicity)
      const mintData = Array.from({ length: highestBid.amount }, () => ({
        ownerId: outgoingStewardId!,
        originSource: 'gameboard_bid_win',
        originId: highestBid.id,
        originTitle: 'Bid won for slot quest',
      }))
      await tx.vibulon.createMany({ data: mintData })
      await tx.gameboardBid.update({
        where: { id: highestBid.id },
        data: { status: 'won' },
      })
      await tx.gameboardSlot.update({
        where: { id: slotId },
        data: {
          stewardId: highestBid.bidderId,
          wakeUpAt: null,
          cleanUpAt: null,
          cleanUpReflection: null,
        },
      })
    } else {
      await tx.gameboardSlot.update({
        where: { id: slotId },
        data: {
          stewardId: null,
          wakeUpAt: null,
          cleanUpAt: null,
          cleanUpReflection: null,
        },
      })
    }
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Place a vibeulon bid to take over a slot when the steward releases.
 * Bids are burned (deleted); if you win, the outgoing steward receives your bid.
 */
export async function placeBid(slotId: string, amount: number) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  if (amount < 1) return { error: 'Bid must be at least 1 vibeulon' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
    include: { bids: { where: { status: 'active' }, orderBy: { amount: 'desc' }, take: 1 } },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }
  if (!slot.stewardId) return { error: 'No steward to bid against' }
  if (slot.stewardId === player.id) return { error: 'You cannot bid on your own slot' }

  const highestBid = slot.bids[0]?.amount ?? 0
  if (amount <= highestBid) return { error: `Bid must exceed current highest (${highestBid}v)` }

  const wallet = await db.vibulon.findMany({
    where: { ownerId: player.id },
    orderBy: { createdAt: 'asc' },
    take: amount,
  })
  if (wallet.length < amount) return { error: `Insufficient vibeulons. You need ${amount}v.` }

  await db.$transaction(async (tx) => {
    const tokenIds = wallet.map((t) => t.id)
    await tx.vibulon.deleteMany({ where: { id: { in: tokenIds } } })
    await tx.vibulonEvent.create({
      data: {
        playerId: player.id,
        source: 'gameboard_bid',
        amount: -amount,
        notes: `Bid ${amount}v on gameboard slot`,
        questId: slot.questId,
      },
    })
    await tx.gameboardBid.create({
      data: { slotId, bidderId: player.id, amount, status: 'active' },
    })
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Withdraw an active bid — returns vibeulons to the bidder.
 */
export async function withdrawBid(bidId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const bid = await db.gameboardBid.findUnique({
    where: { id: bidId },
    include: { slot: true },
  })
  if (!bid || bid.status !== 'active') return { error: 'Bid not found or already resolved' }
  if (bid.bidderId !== player.id) return { error: 'You can only withdraw your own bid' }

  await db.$transaction(async (tx) => {
    await tx.gameboardBid.update({
      where: { id: bidId },
      data: { status: 'withdrawn' },
    })
    const mintData = Array.from({ length: bid.amount }, () => ({
      ownerId: player.id,
      originSource: 'gameboard_bid_withdraw',
      originId: bidId,
      originTitle: 'Bid withdrawn',
    }))
    await tx.vibulon.createMany({ data: mintData })
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Offer AID to a steward — direct support (EFA) or quest to unblock.
 */
export async function offerAid(
  slotId: string,
  message: string,
  type: 'direct' | 'quest' = 'direct',
  linkedQuestId?: string | null
) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  if (!message.trim()) return { error: 'Message is required' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
    include: { quest: true },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }
  if (!slot.stewardId) return { error: 'No steward to offer AID to' }
  if (slot.stewardId === player.id) return { error: 'You cannot offer AID to yourself' }

  if (type === 'quest' && linkedQuestId) {
    const quest = await db.customBar.findUnique({
      where: { id: linkedQuestId },
      select: { id: true, creatorId: true },
    })
    if (!quest || quest.creatorId !== player.id) return { error: 'Quest not found or not yours' }
  }

  const ttlHours = await getAidOfferTtlHours()
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)

  await db.gameboardAidOffer.create({
    data: {
      slotId,
      stewardId: slot.stewardId,
      offererId: player.id,
      message: message.trim(),
      type,
      linkedQuestId: type === 'quest' ? linkedQuestId ?? null : null,
      status: 'pending',
      expiresAt,
    },
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Steward accepts an AID offer.
 * When type is 'quest' and linkedQuestId is set, assigns the quest to the steward.
 */
export async function acceptAidOffer(offerId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const offer = await db.gameboardAidOffer.findUnique({
    where: { id: offerId },
    include: { slot: true, linkedQuest: true },
  })
  if (!offer || offer.status !== 'pending') return { error: 'Offer not found or already resolved' }
  if (offer.stewardId !== player.id) return { error: 'Only the steward can accept this offer' }
  if (offer.expiresAt && offer.expiresAt < new Date()) return { error: 'Offer has expired' }

  await db.$transaction(async (tx) => {
    await tx.gameboardAidOffer.update({
      where: { id: offerId },
      data: { status: 'accepted' },
    })

    if (offer.type === 'quest' && offer.linkedQuestId && offer.linkedQuest) {
      await tx.playerQuest.deleteMany({
        where: { questId: offer.linkedQuestId },
      })
      await tx.customBar.update({
        where: { id: offer.linkedQuestId },
        data: { claimedById: player.id },
      })
      await tx.playerQuest.create({
        data: {
          playerId: player.id,
          questId: offer.linkedQuestId,
          status: 'assigned',
        },
      })
    }
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  revalidatePath('/hand')
  return { success: true }
}

/**
 * Steward declines an AID offer.
 */
export async function declineAidOffer(offerId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const offer = await db.gameboardAidOffer.findUnique({
    where: { id: offerId },
  })
  if (!offer || offer.status !== 'pending') return { error: 'Offer not found or already resolved' }
  if (offer.stewardId !== player.id) return { error: 'Only the steward can decline this offer' }

  await db.gameboardAidOffer.update({
    where: { id: offerId },
    data: { status: 'declined' },
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Fork a declined/expired quest-type AID offer — offerer gets a private copy to complete.
 * When steward declines (or offer expires), offerer can fork the linked quest.
 */
export async function forkDeclinedAidQuest(offerId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const offer = await db.gameboardAidOffer.findUnique({
    where: { id: offerId },
    include: { linkedQuest: true },
  })
  if (!offer) return { error: 'Offer not found' }
  if (offer.offererId !== player.id) return { error: 'Only the offerer can fork this offer' }
  if (offer.type !== 'quest' || !offer.linkedQuestId) return { error: 'Only quest-type offers can be forked' }
  if (offer.forkedAt) return { error: 'Already forked' }

  const isDeclined = offer.status === 'declined'
  const isExpired = offer.status === 'pending' && offer.expiresAt && offer.expiresAt < new Date()
  if (!isDeclined && !isExpired) return { error: 'Offer must be declined or expired to fork' }

  const forkResult = await forkQuestPrivately(offer.linkedQuestId)
  if (forkResult && 'error' in forkResult) return forkResult

  await db.gameboardAidOffer.update({
    where: { id: offerId },
    data: { forkedAt: new Date() },
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  revalidatePath('/hand')
  return { success: true }
}

/**
 * Get declined/expired quest-type AID offers for the current player (as offerer).
 * Used to show "Your declined AID" section with Fork button.
 */
export async function getDeclinedAidOffersForOfferer(playerId: string) {
  const now = new Date()
  const offers = await db.gameboardAidOffer.findMany({
    where: {
      offererId: playerId,
      type: 'quest',
      linkedQuestId: { not: null },
      forkedAt: null,
      OR: [
        { status: 'declined' },
        { status: 'pending', expiresAt: { lt: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      linkedQuest: { select: { id: true, title: true } },
      slot: { select: { id: true, slotIndex: true } },
      steward: { select: { id: true, name: true } },
    },
  })
  return offers
}

/**
 * Fork a quest privately — create a copy assigned to you for personal completion.
 * Original slot remains with steward; fork completion is for personal throughput.
 */
export async function forkQuestPrivately(questId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const original = await db.customBar.findUnique({
    where: { id: questId },
    select: {
      id: true,
      title: true,
      description: true,
      campaignRef: true,
      campaignGoal: true,
      moveType: true,
      allyshipDomain: true,
    },
  })
  if (!original) return { error: 'Quest not found' }

  const fork = await db.customBar.create({
    data: {
      creatorId: player.id,
      title: `${original.title} (fork)`,
      description: original.description,
      type: 'vibe',
      visibility: 'private',
      status: 'active',
      campaignRef: original.campaignRef,
      campaignGoal: original.campaignGoal,
      moveType: original.moveType,
      allyshipDomain: original.allyshipDomain,
      forkedFromId: original.id,
    },
  })

  await db.playerQuest.create({
    data: {
      playerId: player.id,
      questId: fork.id,
      status: 'assigned',
    },
  })

  // Architect: Offer blueprint — original quest is the blueprint; fork is player copy
  await createFaceMoveBar('architect', 'offer_blueprint', {
    title: `Blueprint: ${original.title}`,
    description: original.description ?? '',
    barType: 'vibe',
    questId: original.id,
    metadata: { forkedQuestId: fork.id },
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  revalidatePath('/hand')
  return { success: true, questId: fork.id }
}

/**
 * Record Wake Up — steward acknowledges they've read the quest.
 */
export async function recordWakeUp(slotId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }
  if (slot.stewardId !== player.id) return { error: 'Only the steward can record Wake Up' }

  await db.gameboardSlot.update({
    where: { id: slotId },
    data: { wakeUpAt: new Date() },
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Record Clean Up — steward names inner obstacles.
 */
export async function recordCleanUp(slotId: string, reflection: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }
  if (slot.stewardId !== player.id) return { error: 'Only the steward can record Clean Up' }
  if (!reflection.trim()) return { error: 'Reflection is required' }

  await db.gameboardSlot.update({
    where: { id: slotId },
    data: {
      cleanUpAt: new Date(),
      cleanUpReflection: reflection.trim(),
    },
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Complete a quest on the gameboard and replace the slot with a new draw.
 * When current player is steward, requires wakeUpAt and cleanUpAt first.
 */
export async function completeGameboardQuest(
  slotId: string,
  threadId?: string | null
) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
    include: { quest: true },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }

  if (slot.stewardId === player.id) {
    if (!slot.wakeUpAt || !slot.cleanUpAt) {
      return {
        error:
          'Complete Wake Up and Clean Up first. Read the quest, then reflect on obstacles.',
      }
    }
  }

  const threadQuest = await db.threadQuest.findFirst({
    where: { questId: slot.questId },
    select: { threadId: true },
  })
  const resolvedThreadId = threadId ?? threadQuest?.threadId ?? undefined

  const result = await completeQuest(
    slot.questId,
    { gameboardComplete: true },
    {
      source: 'gameboard',
      threadId: resolvedThreadId,
      instanceId: slot.instanceId,
      kotterStage: slot.period,
    },
    { skipRevalidate: true }
  )

  if (result && 'error' in result) {
    return result
  }

  // Sage: Witness — every face move produces a BAR
  await createFaceMoveBar('sage', 'witness', {
    title: `Witnessed: ${slot.quest?.title ?? 'Quest completed'}`,
    description: `${player.name} completed this quest on the gameboard. The Sage holds the moment.`,
    barType: 'insight',
    questId: slot.questId ?? undefined,
    playerId: player.id,
    instanceId: slot.instanceId,
    metadata: { slotId, source: 'gameboard' },
  })

  await replaceSlotWithDraw(slotId)
  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Replace a slot with a new draw from the deck.
 * When instance uses domain deck, marks completed quest as played and resets cycle on exhaustion.
 */
export async function replaceSlotWithDraw(slotId: string) {
  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
  })
  if (!slot) return { error: 'Slot not found' }

  const instance = await db.instance.findUnique({
    where: { id: slot.instanceId },
    select: { allyshipDomain: true },
  })
  const domainRaw = instance?.allyshipDomain ?? (slot.campaignRef === 'bruised-banana' ? 'GATHERING_RESOURCES' : null)
  const domain = domainRaw as AllyshipDomain | null
  const useDomainDeck = domain != null && ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'].includes(domain)

  let drawn: string[] = []
  if (useDomainDeck && slot.questId) {
    await markQuestPlayed(slot.instanceId, domain as AllyshipDomain, slot.questId)
    const onBoard = await db.gameboardSlot.findMany({
      where: {
        instanceId: slot.instanceId,
        campaignRef: slot.campaignRef,
        period: slot.period,
        questId: { not: null },
      },
      select: { questId: true },
    })
    const exclude = onBoard
      .map((s) => s.questId)
      .filter((id): id is string => !!id && id !== slot.questId)
    const result = await drawFromDeck(
      slot.instanceId,
      slot.campaignRef,
      domain as AllyshipDomain,
      slot.period,
      1,
      exclude
    )
    drawn = result.questIds
  } else {
    drawn = await drawFromCampaignDeck(
      slot.instanceId,
      slot.campaignRef,
      slot.period,
      1
    )
  }

  await db.gameboardSlot.update({
    where: { id: slotId },
    data: {
      questId: drawn[0] ?? null,
      drawnAt: drawn[0] ? new Date() : null,
      stewardId: null,
      wakeUpAt: null,
      cleanUpAt: null,
      cleanUpReflection: null,
    },
  })

  return { success: true, newQuestId: drawn[0] ?? null }
}

/**
 * Get campaign deck size (for UI).
 */
export async function getCampaignDeckSize(campaignRef: string) {
  const ids = await getCampaignDeckQuestIds(campaignRef)
  return ids.length
}

/**
 * Get player's campaign-tagged quests eligible for attaching to a gameboard slot.
 * Quest must have campaignRef + campaignGoal and match the slot's campaign.
 */
export async function getPlayerCampaignQuestsForSlot(
  campaignRef: string
): Promise<{ id: string; title: string; campaignGoal: string | null }[]> {
  const player = await getCurrentPlayer()
  if (!player) return []

  const quests = await db.customBar.findMany({
    where: {
      creatorId: player.id,
      campaignRef,
      campaignGoal: { not: null },
      status: 'active',
      parentId: null, // Not already a subquest
    },
    select: { id: true, title: true, campaignGoal: true },
    orderBy: { createdAt: 'desc' },
  })
  return quests
}

/**
 * Attach an existing player quest as a subquest of a quest on a gameboard slot.
 * Cost: 1 vibeulon.
 * The player's quest becomes a child (parentId = slot quest) of the slot's quest.
 */
export async function attachQuestToSlot(
  slotId: string,
  existingQuestId: string
) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const slot = await db.gameboardSlot.findUnique({
    where: { id: slotId },
    include: { quest: true },
  })
  if (!slot || !slot.questId) return { error: 'Slot or quest not found' }

  const quest = await db.customBar.findUnique({
    where: { id: existingQuestId },
    select: { id: true, creatorId: true, campaignRef: true, campaignGoal: true, parentId: true, status: true },
  })
  if (!quest) return { error: 'Quest not found' }
  if (quest.creatorId !== player.id) return { error: 'You can only attach quests you created' }
  if (!quest.campaignRef || !quest.campaignGoal) return { error: 'Quest must be linked to campaign (campaignRef + campaignGoal)' }
  if (quest.campaignRef !== slot.campaignRef) return { error: 'Quest campaign must match slot campaign' }
  if (quest.parentId) return { error: 'Quest is already attached as a subquest' }
  if (quest.status !== 'active') return { error: 'Quest must be active' }

  const wallet = await db.vibulon.findMany({
    where: { ownerId: player.id },
    orderBy: { createdAt: 'asc' },
    take: 1,
  })
  if (wallet.length < 1) return { error: 'Insufficient vibeulons. Cost: 1 vibeulon.' }

  await db.$transaction(async (tx) => {
    const tokenToBurn = wallet[0]
    await tx.vibulon.delete({ where: { id: tokenToBurn.id } })
    await tx.vibulonEvent.create({
      data: {
        playerId: player.id,
        source: 'gameboard_attach_subquest',
        amount: -1,
        notes: `Attached quest to gameboard slot`,
        archetypeMove: 'INITIATE',
      },
    })
    await tx.customBar.update({
      where: { id: existingQuestId },
      data: { parentId: slot.questId },
    })
  })

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true }
}

/**
 * Generate a grammatical quest aligned with player's nation, playbook, and gameboard state.
 * Admin-only. Uses generateRandomUnpacking + compileQuestWithAI with gameboard context.
 */
export async function generateGameboardAlignedQuest(
  parentQuestId: string,
  slotId: string,
  campaignRef: string
): Promise<{ success: true; questId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const playerWithRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } }, nation: true, archetype: true },
  })
  if (!playerWithRoles) return { error: 'Player not found' }
  const isAdmin = playerWithRoles.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) return { error: 'Admin role required' }

  if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
    return { error: 'Quest Grammar AI is disabled. Set QUEST_GRAMMAR_AI_ENABLED=true to enable.' }
  }

  const parentQuest = await db.customBar.findUnique({
    where: { id: parentQuestId },
    select: { id: true, title: true, description: true, allyshipDomain: true },
  })
  if (!parentQuest) return { error: 'Parent quest not found' }

  const instance = await getActiveInstance()
  const period = instance?.kotterStage ?? 1

  const nationElement: ElementKey | undefined =
    playerWithRoles.nation?.element && ELEMENT_KEYS.includes(playerWithRoles.nation.element as ElementKey)
      ? (playerWithRoles.nation.element as ElementKey)
      : undefined
  const archetypePrimaryWave = playerWithRoles.archetypeId
    ? await getArchetypePrimaryWave(playerWithRoles.archetypeId)
    : undefined

  const { unpackingAnswers, alignedAction, moveType } = generateRandomUnpacking({
    nationElement,
    archetypePrimaryWave,
  })

  const compileResult = await compileQuestWithAI({
    unpackingAnswers,
    alignedAction,
    segment: 'player',
    targetArchetypeId: playerWithRoles.archetypeId ?? undefined,
    moveType,
    gameboardContext: buildGameboardContext(
      parentQuest,
      period,
      instance,
      campaignRef
    ),
  })

  if ('error' in compileResult) return { error: compileResult.error }

  const publishResult = await publishGameboardAlignedQuestToPlayer(
    compileResult.packet,
    player.id,
    parentQuestId,
    campaignRef,
    parentQuest.title
  )

  if (!publishResult.success) return { error: publishResult.error }

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true, questId: publishResult.questId }
}

export type GameboardUnpacking = {
  answers: UnpackingAnswers
  alignedAction: string
  moveType?: string
  hexagramId?: number
  hexagramName?: string
}

/**
 * Preview-only: compile a gameboard-aligned quest via AI but do NOT publish.
 * Returns the packet + unpacking so the admin can review/refine before committing.
 */
export async function previewGameboardAlignedQuest(
  parentQuestId: string,
  campaignRef: string,
  opts?: {
    adminFeedback?: string
    priorUnpacking?: GameboardUnpacking
  }
): Promise<
  | { packet: SerializableQuestPacket; unpacking: GameboardUnpacking }
  | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const playerWithRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } }, nation: true, archetype: true },
  })
  if (!playerWithRoles) return { error: 'Player not found' }
  const isAdmin = playerWithRoles.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) return { error: 'Admin role required' }

  if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
    return { error: 'Quest Grammar AI is disabled. Set QUEST_GRAMMAR_AI_ENABLED=true to enable.' }
  }

  const parentQuest = await db.customBar.findUnique({
    where: { id: parentQuestId },
    select: { id: true, title: true, description: true, allyshipDomain: true },
  })
  if (!parentQuest) return { error: 'Parent quest not found' }

  const instance = await getActiveInstance()
  const period = instance?.kotterStage ?? 1

  let unpackingAnswers: UnpackingAnswers
  let alignedAction: string
  let moveType: PersonalMoveType | undefined

  if (opts?.priorUnpacking) {
    unpackingAnswers = opts.priorUnpacking.answers
    alignedAction = opts.priorUnpacking.alignedAction
    moveType = opts.priorUnpacking.moveType as PersonalMoveType | undefined
  } else {
    const nationElement: ElementKey | undefined =
      playerWithRoles.nation?.element && ELEMENT_KEYS.includes(playerWithRoles.nation.element as ElementKey)
        ? (playerWithRoles.nation.element as ElementKey)
        : undefined
    const archetypePrimaryWave = playerWithRoles.archetypeId
      ? await getArchetypePrimaryWave(playerWithRoles.archetypeId)
      : undefined

    const random = generateRandomUnpacking({ nationElement, archetypePrimaryWave })
    unpackingAnswers = random.unpackingAnswers
    alignedAction = random.alignedAction
    moveType = random.moveType
  }

  let hexagramId = opts?.priorUnpacking?.hexagramId
  let hexagramName = opts?.priorUnpacking?.hexagramName
  let ichingContext: IChingContext | undefined

  try {
    if (!hexagramId) {
      const alignCtx = await getAlignmentContext(player.id)
      hexagramId = await drawAlignedHexagram(alignCtx)
    }
    const hexBar = await db.bar.findUnique({ where: { id: hexagramId } })
    if (hexBar) {
      const structure = getHexagramStructure(hexagramId)
      hexagramName = hexBar.name
      ichingContext = {
        hexagramId,
        hexagramName: hexBar.name,
        hexagramTone: hexBar.tone ?? '',
        hexagramText: hexBar.text ?? '',
        upperTrigram: structure.upper,
        lowerTrigram: structure.lower,
      }
    }
  } catch {
    // I Ching is optional; proceed without it
  }

  const compileResult = await compileQuestWithAI({
    unpackingAnswers,
    alignedAction,
    segment: 'player',
    targetArchetypeId: playerWithRoles.archetypeId ?? undefined,
    moveType,
    adminFeedback: opts?.adminFeedback,
    ichingContext,
    gameboardContext: buildGameboardContext(
      parentQuest,
      period,
      instance,
      campaignRef
    ),
  })

  if ('error' in compileResult) return { error: compileResult.error }

  return {
    packet: compileResult.packet,
    unpacking: { answers: unpackingAnswers, alignedAction, moveType, hexagramId, hexagramName },
  }
}

/**
 * Publish a previously previewed & accepted quest packet to the gameboard.
 */
export async function publishGameboardQuestFromPreview(
  packet: SerializableQuestPacket,
  parentQuestId: string,
  slotId: string,
  campaignRef: string
): Promise<{ success: true; questId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const playerWithRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } } },
  })
  if (!playerWithRoles) return { error: 'Player not found' }
  const isAdmin = playerWithRoles.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) return { error: 'Admin role required' }

  const parentQuest = await db.customBar.findUnique({
    where: { id: parentQuestId },
    select: { id: true, title: true },
  })
  if (!parentQuest) return { error: 'Parent quest not found' }

  const publishResult = await publishGameboardAlignedQuestToPlayer(
    packet,
    player.id,
    parentQuestId,
    campaignRef,
    parentQuest.title
  )

  if (!publishResult.success) return { error: publishResult.error }

  await attachQuestToSlot(slotId, publishResult.questId)

  revalidatePath('/campaign/board')
  revalidatePath('/')
  return { success: true, questId: publishResult.questId }
}
