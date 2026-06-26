/**
 * Lens helpers (LENS / first slice). Plain server utilities — NOT server actions
 * (so they can be imported by both actions and other server code, and aren't
 * exposed as RPC endpoints that take a raw playerId).
 */

import { db } from '@/lib/db'

/** Canonical daily-lens identity for get-or-create dedupe, e.g. "daily:2026-06-26". */
export function dailyPeriodKey(d: Date = new Date()): string {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `daily:${y}-${m}-${day}`
}

function dailyTitle(d: Date = new Date()): string {
  try {
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  } catch {
    return dailyPeriodKey(d).replace('daily:', '')
  }
}

export type DailyLens = { id: string; type: string; title: string; periodKey: string | null }

/**
 * Get-or-create today's daily Lens for a player. Idempotent via the
 * (playerId, type, periodKey) unique key. Returns null on failure (callers
 * treat the lens link as best-effort — never block the loop on it).
 */
export async function ensureTodayLens(playerId: string): Promise<DailyLens | null> {
  try {
    const periodKey = dailyPeriodKey()
    return await db.lens.upsert({
      where: { playerId_type_periodKey: { playerId, type: 'daily', periodKey } },
      update: {},
      create: { playerId, type: 'daily', title: dailyTitle(), periodKey },
      select: { id: true, type: true, title: true, periodKey: true },
    })
  } catch (e) {
    console.error('[lenses:ensureTodayLens]', e)
    return null
  }
}

/** The player's personal garden id (first slice: one garden per player, soft id). */
export function personalGardenId(playerId: string): string {
  return `personal:${playerId}`
}

// ─── Calendar lens scaffolding (LENS1 — Observatory cold-start) ───────────────
// Calendar lenses (today/week/month/quarter/year) are auto-seeded deterministically;
// vision + orientation are player-authored. Each calendar level has a canonical
// periodKey so get-or-create dedupes to one row per period.

export const LENS_LEVELS = ['orientation', 'vision', 'yearly', 'quarterly', 'monthly', 'weekly', 'daily'] as const
export type LensLevel = (typeof LENS_LEVELS)[number]
/** The auto-seeded calendar levels (vision/orientation are authored, not seeded). */
export const CALENDAR_LEVELS: LensLevel[] = ['yearly', 'quarterly', 'monthly', 'weekly', 'daily']

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return { year: date.getUTCFullYear(), week }
}

/** Canonical { periodKey, title } for a calendar level on date d. */
export function calendarIdentity(level: LensLevel, d: Date = new Date()): { periodKey: string; title: string } {
  const y = d.getFullYear()
  switch (level) {
    case 'daily':
      return { periodKey: dailyPeriodKey(d), title: dailyTitle(d) }
    case 'weekly': {
      const { year, week } = isoWeek(d)
      return { periodKey: `weekly:${year}-W${String(week).padStart(2, '0')}`, title: `Week ${week} · ${year}` }
    }
    case 'monthly':
      return { periodKey: `monthly:${y}-${String(d.getMonth() + 1).padStart(2, '0')}`, title: `${MONTHS[d.getMonth()]} ${y}` }
    case 'quarterly': {
      const q = Math.floor(d.getMonth() / 3) + 1
      return { periodKey: `quarterly:${y}-Q${q}`, title: `Q${q} ${y}` }
    }
    case 'yearly':
      return { periodKey: `yearly:${y}`, title: `${y}` }
    default:
      // vision / orientation are singletons keyed by their type.
      return { periodKey: level, title: level === 'vision' ? 'Vision' : 'Orientation' }
  }
}

type LensRow = { id: string; type: string; title: string; periodKey: string | null; parentLensId: string | null }

async function upsertLensRow(
  playerId: string,
  type: LensLevel,
  periodKey: string,
  title: string,
  parentLensId: string | null,
): Promise<LensRow> {
  return db.lens.upsert({
    where: { playerId_type_periodKey: { playerId, type, periodKey } },
    update: { parentLensId },
    create: { playerId, type, title, periodKey, parentLensId },
    select: { id: true, type: true, title: true, periodKey: true, parentLensId: true },
  })
}

/**
 * Get-or-create the calendar lens scaffold for today (year→quarter→month→week→day),
 * wiring the parent chain. Returns the rows by level. Best-effort; idempotent.
 */
export async function ensureCalendarLenses(playerId: string, d: Date = new Date()): Promise<Record<string, LensRow> | null> {
  try {
    const yId = calendarIdentity('yearly', d)
    const yearly = await upsertLensRow(playerId, 'yearly', yId.periodKey, yId.title, null)
    const qId = calendarIdentity('quarterly', d)
    const quarterly = await upsertLensRow(playerId, 'quarterly', qId.periodKey, qId.title, yearly.id)
    const mId = calendarIdentity('monthly', d)
    const monthly = await upsertLensRow(playerId, 'monthly', mId.periodKey, mId.title, quarterly.id)
    const wId = calendarIdentity('weekly', d)
    const weekly = await upsertLensRow(playerId, 'weekly', wId.periodKey, wId.title, monthly.id)
    const dId = calendarIdentity('daily', d)
    const daily = await upsertLensRow(playerId, 'daily', dId.periodKey, dId.title, weekly.id)
    return { yearly, quarterly, monthly, weekly, daily }
  } catch (e) {
    console.error('[lenses:ensureCalendarLenses]', e)
    return null
  }
}
