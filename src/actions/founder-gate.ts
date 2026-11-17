'use server'

/** Admin: set the courier's shipped count and the founder's player id on /ally/gate. Admin-gated, merged into AppConfig.theme, no deploy. */

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { FOUNDER_GATE_KEY } from '@/lib/founder-gate/courier-server'

export async function setShippedCount(shipped: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { ok: false, error: 'Authentication required' }
  const admin = await db.playerRole.findFirst({ where: { playerId, role: { key: 'admin' } }, select: { playerId: true } })
  if (!admin) return { ok: false, error: 'Admin access required' }
  if (!Number.isInteger(shipped) || shipped < 0 || shipped > 100_000) return { ok: false, error: 'Enter a whole number from 0 up' }

  const existing = await db.appConfig.findUnique({ where: { id: 'singleton' }, select: { theme: true } })
  let theme: Record<string, unknown> = {}
  try {
    theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
  } catch {
    theme = {}
  }
  const gate = (theme[FOUNDER_GATE_KEY] && typeof theme[FOUNDER_GATE_KEY] === 'object' ? theme[FOUNDER_GATE_KEY] : {}) as Record<string, unknown>
  const nextTheme = JSON.stringify({ ...theme, [FOUNDER_GATE_KEY]: { ...gate, shipped, updatedAt: new Date().toISOString() } })
  await db.appConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', theme: nextTheme, updatedBy: playerId },
    update: { theme: nextTheme, updatedBy: playerId },
  })
  revalidatePath('/ally/gate')
  return { ok: true }
}

/**
 * Admin: set whose garden the gate's sealed acts land in. Blank clears it, and a seal then keeps only the lead. The id
 * must be an existing player, so a typo cannot file quests under nobody.
 */
export async function setFounderPlayerId(raw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { ok: false, error: 'Authentication required' }
  const admin = await db.playerRole.findFirst({ where: { playerId, role: { key: 'admin' } }, select: { playerId: true } })
  if (!admin) return { ok: false, error: 'Admin access required' }
  const id = raw.trim()
  if (id) {
    const found = await db.player.findUnique({ where: { id }, select: { id: true } })
    if (!found) return { ok: false, error: 'No player has that id' }
  }
  const existing = await db.appConfig.findUnique({ where: { id: 'singleton' }, select: { theme: true } })
  let theme: Record<string, unknown> = {}
  try {
    theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
  } catch {
    theme = {}
  }
  const gate = (theme[FOUNDER_GATE_KEY] && typeof theme[FOUNDER_GATE_KEY] === 'object' ? theme[FOUNDER_GATE_KEY] : {}) as Record<string, unknown>
  const nextGate = { ...gate, founderPlayerId: id || undefined, updatedAt: new Date().toISOString() }
  const nextTheme = JSON.stringify({ ...theme, [FOUNDER_GATE_KEY]: nextGate })
  await db.appConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', theme: nextTheme, updatedBy: playerId },
    update: { theme: nextTheme, updatedBy: playerId },
  })
  revalidatePath('/ally/gate')
  return { ok: true }
}
