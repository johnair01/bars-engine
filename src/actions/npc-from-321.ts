'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { normalizeCastingSheet, type CastingSheet } from '@/lib/npc-from-321/casting-sheet'

async function requireAdmin() {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authorized')
  const full = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } } },
  })
  if (!full?.roles.some((r) => r.role.key === 'admin')) throw new Error('Not authorized: Admin role required')
  return full
}

function needOf(phase2Snapshot: string): string {
  try {
    const q5 = JSON.parse(phase2Snapshot)?.q5
    return typeof q5 === 'string' ? q5 : ''
  } catch {
    return ''
  }
}

/** Finished 3-2-1 sessions with a part name, newest first, with the need read from phase2Snapshot.q5. */
export async function listFinished321Sessions() {
  await requireAdmin()
  const rows = await db.shadow321Session.findMany({
    where: { finalShadowName: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, finalShadowName: true, phase2Snapshot: true, createdAt: true, daemons: { select: { id: true }, take: 1 } },
  })
  return rows.map((r) => ({
    id: r.id,
    partName: r.finalShadowName ?? '',
    need: needOf(r.phase2Snapshot),
    createdAt: r.createdAt.toISOString(),
    raised: r.daemons.length > 0,
  }))
}

/** Raise a finished 3-2-1 part as a daemon, keeping the casting sheet (with a source per field) on its digest. */
export async function raisePartFrom321(
  sessionId: string,
  sheet: CastingSheet,
): Promise<{ daemonId?: string; error?: string }> {
  const admin = await requireAdmin()
  const session = await db.shadow321Session.findUnique({
    where: { id: sessionId },
    select: { id: true, playerId: true, finalShadowName: true, phase2Snapshot: true, daemons: { select: { id: true }, take: 1 } },
  })
  if (!session?.finalShadowName) return { error: 'That 3-2-1 has no part name yet' }
  if (session.daemons.length > 0) return { error: 'That part is already raised' }

  const casting = normalizeCastingSheet(sheet)
  const moves = await db.nationMove.findMany({
    where: { key: { in: ['metal_call_the_standard', 'metal_highlight_the_craft'] } },
    select: { id: true },
  })
  const daemon = await db.daemon.create({
    data: {
      playerId: session.playerId,
      name: casting.fields.storyName ?? session.finalShadowName,
      source: '321_raised',
      level: 1,
      moveIds: JSON.stringify(moves.map((m) => m.id)),
      shadow321SessionId: session.id,
      innerWorkDigest: {
        v: 1,
        finalShadowName: session.finalShadowName,
        raisedBy: admin.id,
        casting,
      },
    },
  })
  revalidatePath('/admin/npcs')
  return { daemonId: daemon.id }
}
