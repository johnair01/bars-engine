'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getActiveInstance } from '@/actions/instance'
import { revalidatePath } from 'next/cache'
import { generateQuestSuggestions } from '@/lib/charge-quest-generator'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'
import { buildQuestSeedInput } from '@/lib/quest-seed-composer'
import { applyArchetypeToChargeSuggestions } from '@/lib/charge-suggestion-archetype-overlay'
import { getArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay'
import { slugifyName } from '@/lib/avatar-utils'
import type { SceneType } from '@/lib/alchemy/wuxing'
import { assertCanCreatePrivateDraft, assertCanCreateUnplacedVaultQuest } from '@/lib/vault-limits'

export type CreateChargeBarPayload = {
  summary: string
  emotion_channel?: 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'
  intensity?: 1 | 2 | 3 | 4 | 5
  satisfaction?: 'dissatisfied' | 'neutral' | 'satisfied'
  context_note?: string
}

export type ChargeListFilters = {
  limit?: number
  offset?: number
  since?: string
}

/**
 * Start of today in the given timezone (IANA, e.g. America/Los_Angeles).
 * If timezone is null or invalid, uses UTC.
 */
function startOfTodayInTimezone(timezone: string | null | undefined): Date {
  if (!timezone || typeof timezone !== 'string') {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  }
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).formatToParts(now)
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)
    const second = parseInt(parts.find((p) => p.type === 'second')?.value ?? '0', 10)
    const msSinceMidnight = (hour * 3600 + minute * 60 + second) * 1000
    return new Date(now.getTime() - msSinceMidnight)
  } catch {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  }
}

/**
 * Create a charge capture BAR. Minimal payload; capture first, structure later.
 * Strict one charge per day: rejects if player already captured today.
 * Spec: .specify/specs/charge-capture-ux-micro-interaction/spec.md
 */
export async function createChargeBar(
  payload: CreateChargeBarPayload
): Promise<{ success: true; barId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const summary = (payload.summary || '').trim()
  if (!summary) return { error: 'Summary is required' }

  // Strict one charge per day (instance timezone for "start of today")
  const instance = await getActiveInstance()
  const startOfToday = startOfTodayInTimezone(instance?.timezone ?? undefined)
  const existingToday = await db.customBar.findFirst({
    where: {
      creatorId: player.id,
      type: 'charge_capture',
      createdAt: { gte: startOfToday },
    },
    select: { id: true },
  })
  if (existingToday) {
    return { error: "You've already captured today's charge. Come back tomorrow." }
  }

  const draftCap = await assertCanCreatePrivateDraft(player.id)
  if (!draftCap.ok) return { error: draftCap.error }

  try {
    const title = summary.length > 80 ? summary.slice(0, 77) + '...' : summary
    const description = payload.context_note
      ? `${summary}\n\n${payload.context_note}`
      : summary

    const sceneType: SceneType = 'transcend'
    const playerWithArch = await db.player.findUnique({
      where: { id: player.id },
      select: { archetype: { select: { name: true } } },
    })
    let archetypeKey: string | null = null
    if (playerWithArch?.archetype?.name) {
      const prof = getArchetypeInfluenceProfile(playerWithArch.archetype.name)
      const slug = slugifyName(playerWithArch.archetype.name)
      archetypeKey = prof?.archetype_id ?? (slug || null)
    }

    const inputs = JSON.stringify({
      emotion_channel: payload.emotion_channel ?? null,
      intensity: payload.intensity ?? null,
      satisfaction: payload.satisfaction ?? null,
      context_note: payload.context_note ?? null,
      sceneType,
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
        archetypeKey,
      },
    })

    revalidatePath('/')
    revalidatePath('/capture')
    return { success: true, barId: bar.id }
  } catch (e: unknown) {
    console.error('[createChargeBar]', e)
    return { error: (e as Error)?.message || 'Failed to capture charge' }
  }
}

/**
 * Get today's charge for the current player (strict one charge per day).
 * Returns null if none captured today.
 */
export async function getTodayCharge(): Promise<
  | { success: true; bar: { id: string; title: string; description: string; createdAt: string; inputs: string } | null }
  | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const instance = await getActiveInstance()
    const startOfToday = startOfTodayInTimezone(instance?.timezone ?? undefined)
    const bar = await db.customBar.findFirst({
      where: {
        creatorId: player.id,
        type: 'charge_capture',
        createdAt: { gte: startOfToday },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, createdAt: true, inputs: true },
    })

    return {
      success: true,
      bar: bar
        ? {
            id: bar.id,
            title: bar.title,
            description: bar.description,
            createdAt: bar.createdAt.toISOString(),
            inputs: bar.inputs,
          }
        : null,
    }
  } catch (e: unknown) {
    console.error('[getTodayCharge]', e)
    return { error: (e as Error)?.message || 'Failed to fetch today\'s charge' }
  }
}

/**
 * Get older charges (before today) for the archive.
 * Uses instance timezone for "today" boundary.
 */
export async function getChargeArchive(
  limit = 10
): Promise<
  | { success: true; bars: Array<{ id: string; title: string; createdAt: string }> }
  | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const instance = await getActiveInstance()
    const startOfToday = startOfTodayInTimezone(instance?.timezone ?? undefined)

    const bars = await db.customBar.findMany({
      where: {
        creatorId: player.id,
        type: 'charge_capture',
        createdAt: { lt: startOfToday },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, title: true, createdAt: true },
    })

    return {
      success: true,
      bars: bars.map((b) => ({
        id: b.id,
        title: b.title,
        createdAt: b.createdAt.toISOString(),
      })),
    }
  } catch (e: unknown) {
    console.error('[getChargeArchive]', e)
    return { error: (e as Error)?.message || 'Failed to fetch archive' }
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

export type ChargeExploreCeremony = {
  sceneType: string
  kotterStage: number
}

/**
 * Generate quest suggestions from a charge BAR.
 * Spec: Charge → Quest Generator API — generateQuestSuggestionsFromCharge
 */
export async function generateQuestSuggestionsFromCharge(
  barId: string
): Promise<
  | { success: true; bar_id: string; quest_suggestions: QuestSuggestion[]; ceremony: ChargeExploreCeremony }
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

  // IE-3: compose context + applyArchetypeOverlay via QuestSeed mapping (overlay failure never blocks)
  let flavored = suggestions
  let ceremony: ChargeExploreCeremony = { sceneType: 'transcend', kotterStage: 1 }
  try {
    const context = await buildQuestSeedInput(player.id, bar.id)
    ceremony = {
      sceneType: context.sceneType ?? 'transcend',
      kotterStage: context.kotterStage,
    }
    if (context.archetypeProfile) {
      flavored = applyArchetypeToChargeSuggestions(
        suggestions,
        context.archetypeProfile,
        bar.title || bar.description || ''
      )
    }
  } catch (e) {
    console.warn('[generateQuestSuggestionsFromCharge] archetype overlay skipped', e)
  }

  return {
    success: true,
    bar_id: bar.id,
    quest_suggestions: flavored,
    ceremony,
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

  const cap = await assertCanCreateUnplacedVaultQuest(player.id)
  if (!cap.ok) return { error: cap.error }

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
