'use server'

import { db } from '@/lib/db'
import {
  ensureCampaignDeck,
  getOrCreateActorDeckState,
  drawDailyHand as drawDailyHandService,
  playCard as playCardService,
  shuffleDeckIfAllowed,
} from '@/lib/bar-deck/service'
import type { BarDeckCard, BarBinding, BoundCard } from '@/features/bar-system/types'

const PERSONAL_BAR_TYPES = ['charge_capture', 'insight', 'vibe'] as const

/**
 * Get 52 BarDeckCards for a campaign.
 */
export async function getCampaignDeck(
  instanceId: string
): Promise<{ success: true; cards: BarDeckCard[] } | { error: string }> {
  try {
    const deckId = await ensureCampaignDeck(instanceId)
    const rows = await db.barDeckCard.findMany({
      where: { deckId },
      orderBy: [{ suit: 'asc' }, { rank: 'asc' }],
    })
    return {
      success: true,
      cards: rows.map((r) => ({
        id: r.id,
        deckId: r.deckId,
        suit: r.suit as BarDeckCard['suit'],
        rank: r.rank,
        promptTitle: r.promptTitle,
        promptText: r.promptText,
        shufflePower: r.shufflePower,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
      })),
    }
  } catch (e) {
    console.error('[bar-deck] getCampaignDeck:', e)
    return { error: e instanceof Error ? e.message : 'Failed to get deck' }
  }
}

/**
 * Get actor's deck state (deck/hand/discard counts).
 */
export async function getActorDeck(
  actorId: string,
  instanceId: string
): Promise<
  | { success: true; deckCardIds: string[]; handCardIds: string[]; discardCardIds: string[] }
  | { error: string }
> {
  try {
    const state = await getOrCreateActorDeckState(actorId, instanceId)
    return {
      success: true,
      deckCardIds: state.deckCardIds,
      handCardIds: state.handCardIds,
      discardCardIds: state.discardCardIds,
    }
  } catch (e) {
    console.error('[bar-deck] getActorDeck:', e)
    return { error: e instanceof Error ? e.message : 'Failed to get deck state' }
  }
}

/**
 * Get actor's hand (7 cards) with bindings.
 */
export async function getActorHand(
  actorId: string,
  instanceId: string
): Promise<{ success: true; hand: BoundCard[] } | { error: string }> {
  try {
    const state = await getOrCreateActorDeckState(actorId, instanceId)
    const handIds = state.handCardIds
    if (handIds.length === 0) return { success: true, hand: [] }

    const cards = await db.barDeckCard.findMany({
      where: { id: { in: handIds } },
      include: {
        bindings: {
          where: { status: 'active' },
          include: {
            bar: {
              select: {
                id: true,
                title: true,
                description: true,
                inputs: true,
                type: true,
                createdAt: true,
                status: true,
                creator: { select: { name: true } },
              },
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const cardMap = new Map(cards.map((c) => [c.id, c]))
    const hand = handIds
      .map((id) => {
        const c = cardMap.get(id)
        if (!c) return null
        const binding = c.bindings[0]
        const bound: BoundCard = {
          card: {
            id: c.id,
            deckId: c.deckId,
            suit: c.suit as BarDeckCard['suit'],
            rank: c.rank,
            promptTitle: c.promptTitle,
            promptText: c.promptText,
            shufflePower: c.shufflePower,
            metadata: (c.metadata as Record<string, unknown>) ?? {},
          },
          binding: binding
            ? {
                id: binding.id,
                cardId: binding.cardId,
                barId: binding.barId,
                authorActorId: binding.authorActorId,
                instanceId: binding.instanceId,
                status: binding.status as BarBinding['status'],
                bar: binding.bar,
              }
            : null,
          bar: binding?.bar,
        }
        return bound
      })
      .filter((x): x is BoundCard => x !== null)

    return { success: true, hand }
  } catch (e) {
    console.error('[bar-deck] getActorHand:', e)
    return { error: e instanceof Error ? e.message : 'Failed to get hand' }
  }
}

/**
 * Draw daily hand (7 cards). Once per day.
 */
export async function drawDailyHand(
  actorId: string,
  instanceId: string
): Promise<
  { success: true; handCardIds: string[]; lastDrawAt: Date } | { error: string }
> {
  try {
    const result = await drawDailyHandService(actorId, instanceId)
    return { success: true, ...result }
  } catch (e) {
    console.error('[bar-deck] drawDailyHand:', e)
    return { error: e instanceof Error ? e.message : 'Failed to draw hand' }
  }
}

/**
 * Bind a personal BAR to a deck card.
 */
export async function bindBarToCard(
  cardId: string,
  barId: string,
  actorId: string,
  instanceId?: string
): Promise<{ success: true; bindingId: string } | { error: string }> {
  try {
    const card = await db.barDeckCard.findUnique({ where: { id: cardId } })
    if (!card) return { error: 'Card not found' }

    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { type: true, creatorId: true },
    })
    if (!bar) return { error: 'BAR not found' }
    if (bar.creatorId !== actorId) return { error: 'Not your BAR' }
    if (!PERSONAL_BAR_TYPES.includes(bar.type as (typeof PERSONAL_BAR_TYPES)[number])) {
      return { error: 'BAR must be charge_capture, insight, or vibe' }
    }

    const binding = await db.barBinding.create({
      data: {
        cardId,
        barId,
        authorActorId: actorId,
        instanceId: instanceId ?? null,
        status: 'active',
      },
    })
    return { success: true, bindingId: binding.id }
  } catch (e) {
    console.error('[bar-deck] bindBarToCard:', e)
    return { error: e instanceof Error ? e.message : 'Failed to bind' }
  }
}

/**
 * Remove a binding.
 */
export async function removeBinding(
  bindingId: string,
  actorId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const binding = await db.barBinding.findUnique({ where: { id: bindingId } })
    if (!binding) return { error: 'Binding not found' }
    if (binding.authorActorId !== actorId) return { error: 'Not your binding' }

    await db.barBinding.update({
      where: { id: bindingId },
      data: { status: 'removed' },
    })
    return { success: true }
  } catch (e) {
    console.error('[bar-deck] removeBinding:', e)
    return { error: e instanceof Error ? e.message : 'Failed to remove binding' }
  }
}

/**
 * Get active bindings for a card.
 */
export async function getCardBindings(
  cardId: string
): Promise<{ success: true; bindings: BarBinding[] } | { error: string }> {
  try {
    const bindings = await db.barBinding.findMany({
      where: { cardId, status: 'active' },
      include: { bar: { select: { id: true, title: true, description: true, inputs: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return {
      success: true,
      bindings: bindings.map((b) => ({
        id: b.id,
        cardId: b.cardId,
        barId: b.barId,
        authorActorId: b.authorActorId,
        instanceId: b.instanceId,
        status: b.status as BarBinding['status'],
        bar: b.bar,
      })),
    }
  } catch (e) {
    console.error('[bar-deck] getCardBindings:', e)
    return { error: e instanceof Error ? e.message : 'Failed to get bindings' }
  }
}

/**
 * Play a card. Moves to discard, draws replacement. Triggers shuffle if shuffle card.
 */
export async function playCard(
  cardId: string,
  actorId: string,
  instanceId: string
): Promise<
  | { success: true; replacementCardId?: string; shuffled?: boolean }
  | { error: string }
> {
  try {
    const result = await playCardService(cardId, actorId, instanceId)
    return result.success
      ? { success: true as const, replacementCardId: result.replacementCardId, shuffled: result.shuffled }
      : { error: 'Card not in hand' }
  } catch (e) {
    console.error('[bar-deck] playCard:', e)
    return { error: e instanceof Error ? e.message : 'Failed to play card' }
  }
}

/**
 * Shuffle deck. Only allowed when deck empty or shuffle card played.
 */
export async function shuffleDeck(
  actorId: string,
  instanceId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const result = await shuffleDeckIfAllowed(actorId, instanceId)
    return result.success ? { success: true } : { error: result.message ?? 'Shuffle not allowed' }
  } catch (e) {
    console.error('[bar-deck] shuffleDeck:', e)
    return { error: e instanceof Error ? e.message : 'Failed to shuffle' }
  }
}

/**
 * Create a personal BAR (charge_capture, insight, or vibe).
 */
export async function createPersonalBar(input: {
  authorActorId: string
  title: string
  summaryText: string
  barType: 'charge_capture' | 'insight' | 'vibe'
  campaignRef?: string
  emotionChannel?: string
  chargeIntensity?: number
  visibility?: 'private' | 'campaign_visible' | 'public'
}): Promise<{ success: true; barId: string } | { error: string }> {
  try {
    const inputs: Record<string, unknown> = {}
    if (input.emotionChannel) inputs.emotion_channel = input.emotionChannel
    if (input.chargeIntensity != null) inputs.charge_intensity = input.chargeIntensity

    const bar = await db.customBar.create({
      data: {
        creatorId: input.authorActorId,
        title: input.title,
        description: input.summaryText,
        type: input.barType,
        visibility: input.visibility ?? 'private',
        status: 'active',
        campaignRef: input.campaignRef ?? null,
        inputs: JSON.stringify(inputs),
        reward: 0,
      },
    })
    return { success: true, barId: bar.id }
  } catch (e) {
    console.error('[bar-deck] createPersonalBar:', e)
    return { error: e instanceof Error ? e.message : 'Failed to create BAR' }
  }
}

/**
 * Get actor's BAR library (personal BARs: charge_capture, insight, vibe).
 */
export async function getActorBars(
  actorId: string,
  filters?: { campaignRef?: string; type?: string }
): Promise<
  | { success: true; bars: Array<{ id: string; title: string; description: string; type: string }> }
  | { error: string }
> {
  try {
    const where: { creatorId: string; type?: { in: string[] } } = {
      creatorId: actorId,
      type: { in: [...PERSONAL_BAR_TYPES] },
    }
    if (filters?.campaignRef) {
      ;(where as { campaignRef?: string }).campaignRef = filters.campaignRef
    }
    if (filters?.type) {
      where.type = { in: [filters.type] }
    }

    const bars = await db.customBar.findMany({
      where,
      select: { id: true, title: true, description: true, type: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return { success: true, bars }
  } catch (e) {
    console.error('[bar-deck] getActorBars:', e)
    return { error: e instanceof Error ? e.message : 'Failed to get BARs' }
  }
}
