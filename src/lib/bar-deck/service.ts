/**
 * BAR Deck Service — draw, hand, discard, shuffle, bind, play
 * Spec: BAR System v1
 */

import type { Prisma } from '@prisma/client'
import { CampaignDeckTopology, DeckType } from '@prisma/client'
import { db } from '@/lib/db'
import { getCanonicalPrompts, getFriendship64Prompts } from './prompts'

function deckTypeForTopology(t: CampaignDeckTopology): DeckType {
  return t === CampaignDeckTopology.CAMPAIGN_DECK_64 ? DeckType.FRIENDSHIP_64 : DeckType.FRIENDSHIP_52
}

function promptsForDeckType(dt: DeckType) {
  return dt === DeckType.FRIENDSHIP_64 ? getFriendship64Prompts() : getCanonicalPrompts()
}

function targetCardCount(dt: DeckType): number {
  return dt === DeckType.FRIENDSHIP_64 ? 64 : 52
}

type BarDeckWithCards = Prisma.BarDeckGetPayload<{ include: { cards: true } }>

const HAND_SIZE = 7

function parseJsonArray(s: string): string[] {
  if (!s || s.trim() === '') return []
  try {
    const parsed = JSON.parse(s) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function toJsonArray(arr: string[]): string {
  return JSON.stringify(arr)
}

function isToday(d: Date): boolean {
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

/**
 * Ensure campaign has a BarDeck with 52 cards. Create if missing.
 */
export async function ensureCampaignDeck(instanceId: string): Promise<string> {
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    include: {
      deckLibrary: {
        include: {
          decks: { include: { cards: true } },
        },
      },
    },
  })
  if (!instance) throw new Error('Instance not found')

  const deckType = deckTypeForTopology(instance.campaignDeckTopology)
  const needCount = targetCardCount(deckType)

  let library = instance.deckLibrary
  if (!library) {
    library = await db.deckLibrary.create({
      data: { instanceId },
      include: { decks: { include: { cards: true } } },
    })
  }

  const existingDeck = library.decks.find((d) => d.deckType === deckType)
  let deck: BarDeckWithCards
  if (!existingDeck) {
    deck = await db.barDeck.create({
      data: { libraryId: library.id, deckType },
      include: { cards: true },
    })
  } else {
    const refreshed = await db.barDeck.findUnique({
      where: { id: existingDeck.id },
      include: { cards: true },
    })
    if (!refreshed) throw new Error('BarDeck missing after lookup')
    deck = refreshed
  }

  if (deck.cards.length >= needCount) {
    return deck.id
  }

  const prompts = promptsForDeckType(deckType)
  await db.barDeckCard.createMany({
    data: prompts.map((p) => ({
      deckId: deck.id,
      suit: p.suit,
      rank: p.rank,
      promptTitle: p.promptTitle,
      promptText: p.promptText,
      shufflePower: p.shufflePower,
    })),
    skipDuplicates: true,
  })

  return deck.id
}

/**
 * Get or create ActorDeckState. Initialize deck from BarDeck cards.
 */
export async function getOrCreateActorDeckState(
  actorId: string,
  instanceId: string
): Promise<{ deckCardIds: string[]; handCardIds: string[]; discardCardIds: string[]; lastDrawAt: Date | null }> {
  const deckId = await ensureCampaignDeck(instanceId)
  const cards = await db.barDeckCard.findMany({
    where: { deckId },
    select: { id: true },
  })
  const allCardIds = cards.map((c) => c.id)

  const existing = await db.actorDeckState.findUnique({
    where: { actorId_instanceId: { actorId, instanceId } },
  })

  if (existing) {
    const deck = parseJsonArray(existing.deckCardIds)
    const hand = parseJsonArray(existing.handCardIds)
    const discard = parseJsonArray(existing.discardCardIds)
    if (deck.length === 0 && hand.length === 0 && discard.length === 0) {
      await db.actorDeckState.update({
        where: { id: existing.id },
        data: { deckCardIds: toJsonArray(shuffle(allCardIds)) },
      })
      return {
        deckCardIds: allCardIds,
        handCardIds: [],
        discardCardIds: [],
        lastDrawAt: existing.lastDrawAt,
      }
    }
    return {
      deckCardIds: deck,
      handCardIds: hand,
      discardCardIds: discard,
      lastDrawAt: existing.lastDrawAt,
    }
  }

  const shuffled = shuffle(allCardIds)
  await db.actorDeckState.create({
    data: {
      actorId,
      instanceId,
      deckCardIds: toJsonArray(shuffled),
      handCardIds: '[]',
      discardCardIds: '[]',
    },
  })
  return {
    deckCardIds: shuffled,
    handCardIds: [],
    discardCardIds: [],
    lastDrawAt: null,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Draw daily hand (7 cards). Once per day unless hand empty.
 */
export async function drawDailyHand(
  actorId: string,
  instanceId: string
): Promise<{ handCardIds: string[]; lastDrawAt: Date }> {
  const state = await db.actorDeckState.findUnique({
    where: { actorId_instanceId: { actorId, instanceId } },
  })

  if (!state) {
    const { deckCardIds } = await getOrCreateActorDeckState(actorId, instanceId)
    const deck = [...deckCardIds]
    const toDraw = Math.min(HAND_SIZE, deck.length)
    const drawn = deck.splice(0, toDraw)
    const remaining = deck

    await db.actorDeckState.upsert({
      where: { actorId_instanceId: { actorId, instanceId } },
      create: {
        actorId,
        instanceId,
        deckCardIds: toJsonArray(remaining),
        handCardIds: toJsonArray(drawn),
        discardCardIds: '[]',
        lastDrawAt: new Date(),
      },
      update: {
        deckCardIds: toJsonArray(remaining),
        handCardIds: toJsonArray(drawn),
        lastDrawAt: new Date(),
      },
    })
    return { handCardIds: drawn, lastDrawAt: new Date() }
  }

  const lastDraw = state.lastDrawAt
  if (lastDraw && isToday(lastDraw)) {
    const hand = parseJsonArray(state.handCardIds)
    return { handCardIds: hand, lastDrawAt: lastDraw }
  }

  if (parseJsonArray(state.handCardIds).length >= HAND_SIZE) {
    return { handCardIds: parseJsonArray(state.handCardIds), lastDrawAt: state.lastDrawAt ?? new Date() }
  }

  let deck = parseJsonArray(state.deckCardIds)
  const discard = parseJsonArray(state.discardCardIds)
  let hand = parseJsonArray(state.handCardIds)

  if (deck.length < HAND_SIZE - hand.length && discard.length > 0) {
    deck = shuffle([...deck, ...discard])
    await db.actorDeckState.update({
      where: { id: state.id },
      data: { discardCardIds: '[]', deckCardIds: toJsonArray(deck) },
    })
  }

  const toDraw = Math.min(HAND_SIZE - hand.length, deck.length)
  const drawn = deck.splice(0, toDraw)
  hand = [...hand, ...drawn]

  await db.actorDeckState.update({
    where: { id: state.id },
    data: {
      deckCardIds: toJsonArray(deck),
      handCardIds: toJsonArray(hand),
      lastDrawAt: new Date(),
    },
  })

  return { handCardIds: hand, lastDrawAt: new Date() }
}

/**
 * Play a card: move to discard, draw replacement. Optionally trigger shuffle if shuffle card.
 */
export async function playCard(
  cardId: string,
  actorId: string,
  instanceId: string
): Promise<{ success: boolean; replacementCardId?: string; shuffled?: boolean }> {
  const state = await db.actorDeckState.findUnique({
    where: { actorId_instanceId: { actorId, instanceId } },
  })
  if (!state) {
    await getOrCreateActorDeckState(actorId, instanceId)
    return { success: false }
  }

  const hand = parseJsonArray(state.handCardIds)
  const idx = hand.indexOf(cardId)
  if (idx < 0) return { success: false }

  const card = await db.barDeckCard.findUnique({
    where: { id: cardId },
    select: { shufflePower: true },
  })
  if (!card) return { success: false }

  hand.splice(idx, 1)
  let discard = parseJsonArray(state.discardCardIds)
  discard.push(cardId)

  let deck = parseJsonArray(state.deckCardIds)
  let replacementCardId: string | undefined
  let shuffled = false

  if (card.shufflePower && discard.length > 0) {
    deck = shuffle([...deck, ...discard])
    discard = []
    shuffled = true
  }

  if (deck.length === 0 && discard.length > 0) {
    deck = shuffle(discard)
    discard = []
    shuffled = true
  }

  if (deck.length > 0) {
    replacementCardId = deck.shift()
    hand.push(replacementCardId!)
  }

  await db.actorDeckState.update({
    where: { id: state.id },
    data: {
      handCardIds: toJsonArray(hand),
      deckCardIds: toJsonArray(deck),
      discardCardIds: toJsonArray(discard),
    },
  })

  return { success: true, replacementCardId, shuffled }
}

/**
 * Shuffle deck only if allowed. Allowed when: deck empty and discard has cards, or shuffle card.
 */
export async function shuffleDeckIfAllowed(
  actorId: string,
  instanceId: string
): Promise<{ success: boolean; message?: string }> {
  const state = await db.actorDeckState.findUnique({
    where: { actorId_instanceId: { actorId, instanceId } },
  })
  if (!state) return { success: false, message: 'No deck state' }

  const deck = parseJsonArray(state.deckCardIds)
  const discard = parseJsonArray(state.discardCardIds)

  if (deck.length > 0 && discard.length === 0) {
    return { success: false, message: 'Shuffle not allowed: deck has cards and discard is empty' }
  }

  if (discard.length === 0) {
    return { success: false, message: 'Nothing to shuffle' }
  }

  const combined = shuffle([...deck, ...discard])
  await db.actorDeckState.update({
    where: { id: state.id },
    data: {
      deckCardIds: toJsonArray(combined),
      discardCardIds: '[]',
    },
  })
  return { success: true }
}
