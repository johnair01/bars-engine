'use server'

import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  appendDiscardUnique,
  parseIdArray,
  pickRandomDrawIndex,
  removeIdOnce,
  shuffleIds,
  stringifyIdArray,
} from '@/lib/prompt-deck/cycle-logic'
import { PROMPT_HAND_MAX } from '@/lib/prompt-deck/load-play-snapshot'

export type DrawPromptCardResult = { ok: true; cardId: string } | { ok: false; error: string }

export type DiscardPromptCardResult = { ok: true } | { ok: false; error: string }

const WILD_FAMILIES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const

async function getPlayerId(): Promise<string | null> {
  return (await cookies()).get('bars_player_id')?.value ?? null
}

function revalidateSceneAtlas(instanceSlug: string) {
  revalidatePath('/creator-scene-deck')
  revalidatePath(`/creator-scene-deck/${instanceSlug}`)
}

/** Ensure cycle row exists and draw pile is non-empty (reshuffle discard or full deck as needed). */
async function ensureCycleReady(
  tx: Prisma.TransactionClient,
  playerId: string,
  deckId: string
): Promise<{ ok: true; cycleId: string } | { ok: false; error: string }> {
  const allIds = (await tx.barDeckCard.findMany({ where: { deckId }, select: { id: true } })).map((c) => c.id)
  if (allIds.length === 0) return { ok: false, error: 'This deck has no cards.' }

  let cycle = await tx.promptDeckCycle.findUnique({
    where: { playerId_deckId: { playerId, deckId } },
  })

  if (!cycle) {
    const draw = shuffleIds(allIds)
    cycle = await tx.promptDeckCycle.create({
      data: {
        playerId,
        deckId,
        drawCardIds: stringifyIdArray(draw),
        discardCardIds: '[]',
      },
    })
    return { ok: true, cycleId: cycle.id }
  }

  let draw = parseIdArray(cycle.drawCardIds)
  let discard = parseIdArray(cycle.discardCardIds)

  if (draw.length === 0) {
    if (discard.length > 0) {
      draw = shuffleIds(discard)
      discard = []
    } else {
      draw = shuffleIds(allIds)
    }
    await tx.promptDeckCycle.update({
      where: { id: cycle.id },
      data: {
        drawCardIds: stringifyIdArray(draw),
        discardCardIds: stringifyIdArray(discard),
      },
    })
  }

  return { ok: true, cycleId: cycle.id }
}

/**
 * Random card from this deck’s draw pile → global hand (max 5 across all decks).
 * Does not change BarBinding / grid.
 */
export async function drawPromptCard(deckId: string, instanceSlug: string): Promise<DrawPromptCardResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { ok: false, error: 'Not logged in' }
  const did = deckId?.trim()
  const slug = instanceSlug?.trim()
  if (!did || !slug) return { ok: false, error: 'Missing deck or instance.' }

  const deck = await db.barDeck.findFirst({
    where: { id: did, library: { instance: { slug } } },
    select: { id: true },
  })
  if (!deck) return { ok: false, error: 'Deck not found for this Scene Atlas.' }

  try {
    const cardId = await db.$transaction(async (tx) => {
      const ready = await ensureCycleReady(tx, playerId, did)
      if (!ready.ok) throw new Error(ready.error)

      const cycle = await tx.promptDeckCycle.findUniqueOrThrow({
        where: { id: ready.cycleId },
      })
      const draw = parseIdArray(cycle.drawCardIds)
      if (draw.length === 0) throw new Error('Draw pile is empty.')

      await tx.playerPromptHand.upsert({
        where: { playerId },
        create: { playerId, handCardIds: '[]' },
        update: {},
      })
      const handRow = await tx.playerPromptHand.findUniqueOrThrow({
        where: { playerId },
        select: { handCardIds: true },
      })
      const hand = parseIdArray(handRow.handCardIds)
      if (hand.length >= PROMPT_HAND_MAX) {
        throw new Error(`Hand is full (${PROMPT_HAND_MAX} cards). Play or clear a card first.`)
      }

      const pick = pickRandomDrawIndex(draw)
      if (!pick) throw new Error('Draw pile is empty.')
      const newDraw = [...draw.slice(0, pick.index), ...draw.slice(pick.index + 1)]
      const newHand = [...hand, pick.id]

      await tx.promptDeckCycle.update({
        where: { id: cycle.id },
        data: { drawCardIds: stringifyIdArray(newDraw) },
      })
      await tx.playerPromptHand.update({
        where: { playerId },
        data: { handCardIds: stringifyIdArray(newHand) },
      })

      return pick.id
    })

    revalidateSceneAtlas(slug)
    return { ok: true, cardId }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not draw.'
    return { ok: false, error: msg }
  }
}

/**
 * Quest / play: move card into this deck’s discard. Removes from global hand if present;
 * removes from draw pile if still undealt. Does not modify BarBinding.
 * Rank 13 (wild): pass `wildFamily` when you want it validated/logged (optional for MVP).
 */
export async function discardPromptCardForQuest(
  cardId: string,
  instanceSlug: string,
  wildFamily?: string | null
): Promise<DiscardPromptCardResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { ok: false, error: 'Not logged in' }
  const cid = cardId?.trim()
  const slug = instanceSlug?.trim()
  if (!cid || !slug) return { ok: false, error: 'Missing card or instance.' }

  const card = await db.barDeckCard.findUnique({
    where: { id: cid },
    select: {
      id: true,
      deckId: true,
      rank: true,
      deck: {
        select: {
          library: {
            select: {
              instance: {
                select: { slug: true },
              },
            },
          },
        },
      },
    },
  })
  if (!card) return { ok: false, error: 'Card not found.' }
  if (card.deck.library.instance.slug !== slug) return { ok: false, error: 'Card is not from this Scene Atlas instance.' }

  if (card.rank === 13 && wildFamily) {
    if (!WILD_FAMILIES.includes(wildFamily as (typeof WILD_FAMILIES)[number])) {
      return { ok: false, error: 'Invalid wild move family.' }
    }
  }

  const deckId = card.deckId

  try {
    await db.$transaction(async (tx) => {
      await ensureCycleReady(tx, playerId, deckId)

      const cycle = await tx.promptDeckCycle.findUniqueOrThrow({
        where: { playerId_deckId: { playerId, deckId } },
      })

      let draw = parseIdArray(cycle.drawCardIds)
      let discard = parseIdArray(cycle.discardCardIds)

      if (draw.includes(cid)) draw = removeIdOnce(draw, cid)
      discard = appendDiscardUnique(discard, cid)

      await tx.promptDeckCycle.update({
        where: { id: cycle.id },
        data: {
          drawCardIds: stringifyIdArray(draw),
          discardCardIds: stringifyIdArray(discard),
        },
      })

      await tx.playerPromptHand.upsert({
        where: { playerId },
        create: { playerId, handCardIds: '[]' },
        update: {},
      })
      const handRow = await tx.playerPromptHand.findUniqueOrThrow({
        where: { playerId },
        select: { handCardIds: true },
      })
      const hand = removeIdOnce(parseIdArray(handRow.handCardIds), cid)
      await tx.playerPromptHand.update({
        where: { playerId },
        data: { handCardIds: stringifyIdArray(hand) },
      })
    })

    revalidateSceneAtlas(slug)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update discard.' }
  }
}
