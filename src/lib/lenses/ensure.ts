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
