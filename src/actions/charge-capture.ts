'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateQuestSuggestions } from '@/lib/charge-quest-generator'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'

export type CreateChargeBarPayload = {
  summary: string
  emotion_channel?: 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'
  intensity?: 1 | 2 | 3 | 4 | 5
  context_note?: string
}

export type ChargeListFilters = {
  limit?: number
  offset?: number
  since?: string
}

/**
 * Create a charge capture BAR. Minimal payload; capture first, structure later.
 * Spec: .specify/specs/charge-capture-ux-micro-interaction/spec.md
 */
export async function createChargeBar(
  payload: CreateChargeBarPayload
): Promise<{ success: true; barId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const summary = (payload.summary || '').trim()
  if (!summary) return { error: 'Summary is required' }

  try {
    const title = summary.length > 80 ? summary.slice(0, 77) + '...' : summary
    const description = payload.context_note
      ? `${summary}\n\n${payload.context_note}`
      : summary

    const inputs = JSON.stringify({
      emotion_channel: payload.emotion_channel ?? null,
      intensity: payload.intensity ?? null,
      context_note: payload.context_note ?? null,
    })

    const bar = await db.customBar.create({
      data: {
        creatorId: player.id,
        title,
        description,
        type: 'charge_capture',
        reward: 0,
        inputs,
        visibility: 'private',
        status: 'active',
      },
    })

    revalidatePath('/')
    return { success: true, barId: bar.id }
  } catch (e: unknown) {
    console.error('[createChargeBar]', e)
    return { error: (e as Error)?.message || 'Failed to capture charge' }
  }
}

/**
 * List recent charge captures for the current player.
 * Spec: Charge Capture API — getRecentChargeBars
 */
export async function getRecentChargeBars(
  filters?: ChargeListFilters
): Promise<{ success: true; bars: Array<{ id: string; title: string; description: string; createdAt: string; inputs: string }> } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const limit = Math.min(filters?.limit ?? 20, 50)
  const offset = filters?.offset ?? 0

  try {
    const where: { creatorId: string; type: string; createdAt?: { gte: Date } } = {
      creatorId: player.id,
      type: 'charge_capture',
    }
    if (filters?.since) {
      const since = new Date(filters.since)
      if (!isNaN(since.getTime())) where.createdAt = { gte: since }
    }

    const bars = await db.customBar.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: { id: true, title: true, description: true, createdAt: true, inputs: true },
    })

    return {
      success: true,
      bars: bars.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        createdAt: b.createdAt.toISOString(),
        inputs: b.inputs,
      })),
    }
  } catch (e: unknown) {
    console.error('[getRecentChargeBars]', e)
    return { error: (e as Error)?.message || 'Failed to fetch charge captures' }
  }
}

/**
 * Launch 321 reflection with charge BAR as context.
 * Returns redirect URL; client navigates.
 * Spec: Charge Capture API — run321FromCharge
 */
export async function run321FromCharge(
  barId: string
): Promise<{ success: true; redirectUrl: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { id: true, creatorId: true, type: true },
    })

    if (!bar) return { error: 'Charge not found' }
    if (bar.type !== 'charge_capture') return { error: 'Not a charge capture' }
    if (bar.creatorId !== player.id) return { error: 'Not your charge' }

    return {
      success: true,
      redirectUrl: `/shadow/321?chargeBarId=${barId}`,
    }
  } catch (e: unknown) {
    console.error('[run321FromCharge]', e)
    return { error: (e as Error)?.message || 'Failed to launch 321' }
  }
}

/**
 * Generate quest suggestions from a charge BAR.
 * Spec: Charge → Quest Generator API — generateQuestSuggestionsFromCharge
 */
export async function generateQuestSuggestionsFromCharge(
  barId: string
): Promise<
  | { success: true; bar_id: string; quest_suggestions: QuestSuggestion[] }
  | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, title: true, description: true, inputs: true, creatorId: true, type: true },
  })

  if (!bar || bar.type !== 'charge_capture' || bar.creatorId !== player.id) {
    return { error: 'Charge not found' }
  }

  let emotion_channel: 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality' | null = null
  let intensity: number | null = null
  let context_note: string | null = null

  try {
    const parsed = JSON.parse(bar.inputs || '{}') as {
      emotion_channel?: string
      intensity?: number
      context_note?: string
    }
    if (['anger', 'joy', 'sadness', 'fear', 'neutrality'].includes(parsed.emotion_channel ?? '')) {
      emotion_channel = parsed.emotion_channel as 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'
    }
    intensity = typeof parsed.intensity === 'number' ? parsed.intensity : null
    context_note = typeof parsed.context_note === 'string' ? parsed.context_note : null
  } catch {
    // use defaults
  }

  const suggestions = generateQuestSuggestions({
    bar_id: bar.id,
    summary_text: bar.title,
    emotion_channel,
    intensity,
    context_note,
  })

  return {
    success: true,
    bar_id: bar.id,
    quest_suggestions: suggestions,
  }
}

/**
 * Create a quest from a suggestion index.
 * Spec: Charge → Quest Generator API — createQuestFromSuggestion
 */
export async function createQuestFromSuggestion(
  barId: string,
  suggestionIndex: number
): Promise<{ success: true; questId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const result = await generateQuestSuggestionsFromCharge(barId)
  if ('error' in result) return result

  const suggestions = result.quest_suggestions
  const suggestion = suggestions[suggestionIndex]
  if (!suggestion) return { error: 'Invalid suggestion index' }

  try {
    const quest = await db.customBar.create({
      data: {
        creatorId: player.id,
        title: suggestion.quest_title,
        description: suggestion.quest_summary,
        type: 'quest',
        moveType: suggestion.move_type,
        reward: 1,
        visibility: 'private',
        status: 'active',
        sourceBarId: barId,
        claimedById: player.id,
      },
    })

    await db.playerQuest.create({
      data: {
        playerId: player.id,
        questId: quest.id,
        status: 'assigned',
      },
    })

    revalidatePath('/')
    revalidatePath('/wallet')
    return { success: true, questId: quest.id }
  } catch (e: unknown) {
    console.error('[createQuestFromSuggestion]', e)
    return { error: (e as Error)?.message || 'Failed to create quest' }
  }
}

/**
 * Get a single charge BAR by ID (for current player).
 */
export async function getChargeBar(
  barId: string
): Promise<{ success: true; bar: { id: string; title: string; description: string; inputs: string } } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, title: true, description: true, inputs: true, creatorId: true, type: true },
  })

  if (!bar || bar.type !== 'charge_capture' || bar.creatorId !== player.id) {
    return { error: 'Charge not found' }
  }

  return {
    success: true,
    bar: {
      id: bar.id,
      title: bar.title,
      description: bar.description,
      inputs: bar.inputs,
    },
  }
}
