'use server'

/**
 * Observatory (LENS1) — temporal navigation over the Lens hierarchy.
 * Calendar levels are auto-seeded; vision + orientation are player-authored.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  ensureCalendarLenses,
  calendarIdentity,
  LENS_LEVELS,
  CALENDAR_LEVELS,
  type LensLevel,
} from '@/lib/lenses/ensure'

export type ObservatoryLevel = {
  level: LensLevel
  label: string
  lensId: string | null
  title: string | null
  barCount: number
  authored: boolean // for vision/orientation: whether the player has set it
}

export type ObsResult<T> = T | { error: string }

const DEFAULT_LABEL: Record<LensLevel, string> = {
  orientation: 'Orientation',
  vision: 'Vision',
  yearly: 'This year',
  quarterly: 'This quarter',
  monthly: 'This month',
  weekly: 'This week',
  daily: 'Today',
}

/** The 7 Observatory levels for the current player (auto-seeds the calendar). */
export async function getObservatory(): Promise<ObsResult<{ levels: ObservatoryLevel[] }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    await ensureCalendarLenses(player.id)

    const lenses = await db.lens.findMany({
      where: { playerId: player.id },
      select: { id: true, type: true, title: true, periodKey: true },
    })
    const counts = await db.customBar.groupBy({
      by: ['lensId'],
      where: { creatorId: player.id, lensId: { not: null } },
      _count: { id: true },
    })
    const countByLens = new Map(counts.map((c) => [c.lensId as string, c._count.id]))

    const levels: ObservatoryLevel[] = LENS_LEVELS.map((level) => {
      const isCalendar = (CALENDAR_LEVELS as string[]).includes(level)
      const periodKey = isCalendar ? calendarIdentity(level).periodKey : level
      const lens = lenses.find((l) => l.type === level && l.periodKey === periodKey) ?? null
      return {
        level,
        label: lens?.title ?? (isCalendar ? calendarIdentity(level).title : DEFAULT_LABEL[level]),
        lensId: lens?.id ?? null,
        title: lens?.title ?? null,
        barCount: lens ? countByLens.get(lens.id) ?? 0 : 0,
        authored: isCalendar ? true : !!lens,
      }
    })
    return { levels }
  } catch (e) {
    console.error('[observatory:getObservatory]', e)
    return { error: 'Failed to load the Observatory' }
  }
}

export type LensLevelView = {
  level: LensLevel
  lensId: string | null
  title: string | null
  description: string | null
  authored: boolean
  bars: Array<{ id: string; title: string; element: string | null }>
}

/** One Observatory level — its lens + the BARs grown under it. */
export async function getLensLevel(level: string): Promise<ObsResult<LensLevelView>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  if (!(LENS_LEVELS as readonly string[]).includes(level)) return { error: 'Unknown level' }
  const lvl = level as LensLevel
  try {
    const isCalendar = (CALENDAR_LEVELS as string[]).includes(lvl)
    if (isCalendar) await ensureCalendarLenses(player.id)
    const periodKey = isCalendar ? calendarIdentity(lvl).periodKey : lvl

    const lens = await db.lens.findUnique({
      where: { playerId_type_periodKey: { playerId: player.id, type: lvl, periodKey } },
      select: { id: true, title: true, description: true },
    })

    let bars: LensLevelView['bars'] = []
    if (lens) {
      const rows = await db.customBar.findMany({
        where: { creatorId: player.id, lensId: lens.id, archivedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, nation: true },
      })
      bars = rows.map((b) => ({ id: b.id, title: b.title, element: b.nation }))
    }

    return {
      level: lvl,
      lensId: lens?.id ?? null,
      title: lens?.title ?? (isCalendar ? calendarIdentity(lvl).title : DEFAULT_LABEL[lvl]),
      description: lens?.description ?? null,
      authored: isCalendar ? true : !!lens,
      bars,
    }
  } catch (e) {
    console.error('[observatory:getLensLevel]', e)
    return { error: 'Failed to load this lens' }
  }
}

/** Author / edit the vision or orientation lens (singletons keyed by type). */
export async function authorLens(input: {
  level: 'vision' | 'orientation'
  title: string
  description?: string
}): Promise<ObsResult<{ lensId: string }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  if (input.level !== 'vision' && input.level !== 'orientation') return { error: 'Only vision/orientation are authored' }
  const title = (input.title || '').trim()
  if (!title) return { error: 'A title is required' }
  try {
    const lens = await db.lens.upsert({
      where: { playerId_type_periodKey: { playerId: player.id, type: input.level, periodKey: input.level } },
      update: { title, description: input.description ?? null },
      create: { playerId: player.id, type: input.level, periodKey: input.level, title, description: input.description ?? null },
      select: { id: true },
    })
    revalidatePath('/observatory')
    revalidatePath(`/observatory/${input.level}`)
    return { lensId: lens.id }
  } catch (e) {
    console.error('[observatory:authorLens]', e)
    return { error: 'Failed to save' }
  }
}
