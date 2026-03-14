'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const DEFAULT_SUMMON_DURATION_MINUTES = 60
const DAEMON_DEFAULT_MOVE_KEYS = ['metal_call_the_standard', 'metal_highlight_the_craft'] // starter moves for discovered daemons

export type DiscoverDaemonSource = '321_wake_up' | 'school'

export async function discoverDaemon(
  playerId: string,
  source: DiscoverDaemonSource,
  metadata?: { name?: string }
): Promise<{ daemonId?: string; name?: string; moveIds?: string[]; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player || player.id !== playerId) return { error: 'Not authorized' }

  const moves = await db.nationMove.findMany({
    where: { key: { in: DAEMON_DEFAULT_MOVE_KEYS } },
    select: { id: true },
  })
  const moveIds = moves.map((m) => m.id)

  const name = metadata?.name ?? `Daemon (${source === '321_wake_up' ? 'Wake Up' : 'School'})`

  const daemon = await db.daemon.create({
    data: {
      playerId,
      name,
      source,
      level: 1,
      moveIds: JSON.stringify(moveIds),
    },
  })

  revalidatePath('/daemons')
  revalidatePath('/')
  return { daemonId: daemon.id, name: daemon.name, moveIds }
}

export async function summonDaemon(
  playerId: string,
  daemonId: string,
  durationMinutes: number = DEFAULT_SUMMON_DURATION_MINUTES
): Promise<{ summonId?: string; expiresAt?: Date; durationMinutes?: number; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player || player.id !== playerId) return { error: 'Not authorized' }

  const daemon = await db.daemon.findFirst({
    where: { id: daemonId, playerId },
  })
  if (!daemon) return { error: 'Daemon not found' }

  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)

  const summon = await db.daemonSummon.create({
    data: {
      daemonId,
      playerId,
      expiresAt,
      status: 'active',
    },
  })

  revalidatePath('/daemons')
  revalidatePath('/')
  return { summonId: summon.id, expiresAt, durationMinutes }
}

export async function getActiveDaemonMoves(playerId: string) {
  const now = new Date()
  const activeSummons = await db.daemonSummon.findMany({
    where: {
      playerId,
      status: 'active',
      expiresAt: { gt: now },
    },
    include: { daemon: true },
  })

  const moveIds = new Set<string>()
  for (const s of activeSummons) {
    try {
      const ids = JSON.parse(s.daemon.moveIds) as string[]
      ids.forEach((id) => moveIds.add(id))
    } catch {
      // ignore invalid JSON
    }
  }

  if (moveIds.size === 0) return []

  return db.nationMove.findMany({
    where: { id: { in: [...moveIds] } },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function dismissDaemonSummon(
  summonId: string
): Promise<{ success: boolean; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authorized' }

  const summon = await db.daemonSummon.findFirst({
    where: { id: summonId, playerId: player.id },
  })
  if (!summon) return { success: false, error: 'Summon not found' }

  await db.daemonSummon.update({
    where: { id: summonId },
    data: { status: 'dismissed' },
  })

  revalidatePath('/daemons')
  revalidatePath('/')
  return { success: true }
}

export async function dismissExpiredDaemonSummons() {
  const now = new Date()
  await db.daemonSummon.updateMany({
    where: { status: 'active', expiresAt: { lte: now } },
    data: { status: 'dismissed' },
  })
}

export async function getPlayerDaemons(playerId: string) {
  const player = await getCurrentPlayer()
  if (!player || player.id !== playerId) return []

  return db.daemon.findMany({
    where: { playerId },
    orderBy: { discoveredAt: 'desc' },
    include: {
      summons: {
        where: { status: 'active' },
        orderBy: { expiresAt: 'desc' },
        take: 1,
      },
    },
  })
}
