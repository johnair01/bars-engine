'use server'

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { mintVibulon } from '@/actions/economy'
import { promoteRaisedPartOnMet } from '@/actions/daemons'
import { PART_STEPS, bothStepsDone, coinTitle, readPart, withPart, type PartStep } from '@/lib/npc-from-321/part-quest'
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

// ── T006: the part's three-step quest and its check-in ──────────────────────────────────────────────────────────

async function ownedRaisedPart(daemonId: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authorized' as const }
  const daemon = await db.daemon.findUnique({
    where: { id: daemonId },
    select: { id: true, playerId: true, name: true, source: true, shadow321SessionId: true, innerWorkDigest: true },
  })
  if (!daemon || daemon.source !== '321_raised') return { error: 'Part not found' as const }
  if (daemon.playerId !== player.id) return { error: 'Not authorized' as const }
  return { player, daemon }
}

/** Take the part's quest: a root quest with three children (life, land, checkin). Taking it twice returns the same quest. */
export async function takePartQuest(daemonId: string): Promise<{ questId?: string; error?: string }> {
  const got = await ownedRaisedPart(daemonId)
  if ('error' in got) return { error: got.error }
  const { player, daemon } = got
  const part = readPart(daemon.innerWorkDigest)
  if (part.questId) return { questId: part.questId }

  // A part met in a 3-2-1 opened from a setback serves the goal that setback was about (Madi's demo, /between/people).
  const session = daemon.shadow321SessionId
    ? await db.shadow321Session.findUnique({ where: { id: daemon.shadow321SessionId }, select: { chargeSourceBarId: true } })
    : null
  const charge = session?.chargeSourceBarId
    ? await db.customBar.findUnique({ where: { id: session.chargeSourceBarId }, select: { creatorId: true, lensGoalId: true } })
    : null
  const lensGoalId = charge?.creatorId === player.id ? charge.lensGoalId ?? null : null

  const root = await db.customBar.create({
    data: { creatorId: player.id, title: `Help ${daemon.name}`, description: `A part of you asked for help. Three steps: one in your life, one in the land, one check-in.`, type: 'quest', visibility: 'private', lensGoalId },
  })
  for (const [i, step] of ['life', 'land', 'checkin'].entries()) {
    await db.customBar.create({
      data: { creatorId: player.id, title: `${daemon.name}: ${step}`, description: `Step ${i + 1} of 3 (${step}).`, type: 'quest', visibility: 'private', parentId: root.id, rootId: root.id },
    })
  }
  if (daemon.shadow321SessionId) {
    await db.shadow321Session.update({ where: { id: daemon.shadow321SessionId }, data: { linkedQuestId: root.id } })
  }
  await db.daemon.update({
    where: { id: daemon.id },
    data: { innerWorkDigest: withPart(daemon.innerWorkDigest, { ...part, questId: root.id }) as Prisma.InputJsonValue },
  })
  revalidatePath('/daemons')
  return { questId: root.id }
}

/** Mark the life step or the land step done. The check-in is not a step you mark; it opens when both are done. */
export async function markStep(questId: string, step: PartStep): Promise<{ ok?: true; error?: string }> {
  if (!(PART_STEPS as readonly string[]).includes(step)) return { error: 'Unknown step' }
  const session = await db.shadow321Session.findFirst({
    where: { linkedQuestId: questId },
    select: { daemons: { where: { source: '321_raised' }, select: { id: true }, take: 1 } },
  })
  const daemonId = session?.daemons[0]?.id
  if (!daemonId) return { error: 'Quest not found' }
  const got = await ownedRaisedPart(daemonId)
  if ('error' in got) return { error: got.error }
  const part = readPart(got.daemon.innerWorkDigest)
  if (part.questId !== questId) return { error: 'Quest not found' }
  await db.daemon.update({
    where: { id: daemonId },
    data: { innerWorkDigest: withPart(got.daemon.innerWorkDigest, { ...part, steps: { ...part.steps, [step]: true } }) as Prisma.InputJsonValue },
  })
  return { ok: true }
}

/**
 * The check-in. "not_yet" changes nothing. "met" needs both steps, mints one coin with the player as creator, and
 * promotes the part to a person; a second "met" on the same need mints nothing.
 */
export async function checkInPart(
  daemonId: string,
  answer: 'met' | 'not_yet',
  whatWasDone?: string,
): Promise<{ vibulonId?: string; playerId?: string; error?: string }> {
  const got = await ownedRaisedPart(daemonId)
  if ('error' in got) return { error: got.error }
  const { player, daemon } = got
  const part = readPart(daemon.innerWorkDigest)
  if (!part.questId || !bothStepsDone(part)) return { error: 'The life step and the land step come first' }
  if (answer === 'not_yet') return {}
  if (part.met) return { error: 'This need is already met' }

  const done = (whatWasDone ?? '').trim()
  if (!done) return { error: 'Say in one line what was done' }

  const digest = (daemon.innerWorkDigest ?? {}) as { finalShadowName?: string }
  const [vibulonId] = await mintVibulon(
    player.id,
    1,
    { source: 'npc-from-321', id: part.questId, title: coinTitle(digest.finalShadowName ?? daemon.name, done) },
    { creatorId: player.id },
  )
  await db.daemon.update({
    where: { id: daemon.id },
    data: { innerWorkDigest: withPart(daemon.innerWorkDigest, { ...part, met: { vibulonId, whatWasDone: done, at: new Date().toISOString() } }) as Prisma.InputJsonValue },
  })
  const { npcId } = await promoteRaisedPartOnMet(daemon.id)
  revalidatePath('/daemons')
  return { vibulonId, playerId: npcId }
}
