'use server'

import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { queryActiveDaemonChannelAltitude } from '@/lib/daemon-active-state'
import { persist321Session } from '@/actions/charge-metabolism'
import type { Shadow321NameFields } from '@/lib/shadow321-name-resolution'
import { truncateChargeExcerpt } from '@/lib/npc321-inner-work-merge'
import { getDaemonNpcPromotionMinLevel } from '@/lib/daemon-npc-constants'

const DEFAULT_SUMMON_DURATION_MINUTES = 60
const DAEMON_DEFAULT_MOVE_KEYS = ['metal_call_the_standard', 'metal_highlight_the_craft'] // starter moves for discovered daemons

export type DiscoverDaemonSource = '321_wake_up' | 'school' | 'bar'

export type DiscoverDaemonMetadata = {
  name?: string
  sourceBarId?: string
  shadow321SessionId?: string | null
  innerWorkDigest?: Prisma.InputJsonValue
}

function buildInnerWorkDigestFrom321(args: {
  phase3Snapshot: string
  shadow321Name?: Shadow321NameFields | null
}): Prisma.InputJsonValue {
  let identityFreeText: string | undefined
  try {
    const p3 = JSON.parse(args.phase3Snapshot || '{}') as { identityFreeText?: string }
    identityFreeText = p3.identityFreeText
  } catch {
    /* ignore */
  }
  const identityExcerpt = identityFreeText
    ? truncateChargeExcerpt(identityFreeText, 120)
    : null
  const base: Prisma.JsonObject = { v: 1 }
  if (args.shadow321Name) {
    base.finalShadowName = args.shadow321Name.finalShadowName
    base.nameResolution = args.shadow321Name.nameResolution
    base.suggestionCount = args.shadow321Name.suggestionCount
  }
  if (identityExcerpt) base.identityExcerpt = identityExcerpt
  return base as Prisma.InputJsonValue
}

async function getOrCreateAgentSimInvite() {
  let inv = await db.invite.findFirst({ where: { token: { startsWith: 'agent-sim-' } } })
  if (!inv) {
    inv = await db.invite.create({
      data: {
        token: `agent-sim-${Date.now()}`,
        status: 'active',
        maxUses: 9999,
      },
    })
  }
  return inv
}

/**
 * Full Shadow321Runner path: persist session (daemon_awakened), merges, blessed object, Shaman BAR — then daemon row.
 * SN Phase 8.
 */
export async function awakenDaemonFrom321(input: {
  playerId: string
  phase2Snapshot: string
  phase3Snapshot: string
  daemonName: string
  shadow321Name?: Shadow321NameFields | null
  chargeSourceBarId?: string | null
}): Promise<{ daemonId?: string; sessionId?: string; name?: string; moveIds?: string[]; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player || player.id !== input.playerId) return { error: 'Not authorized' }

  const persist = await persist321Session({
    phase2Snapshot: input.phase2Snapshot,
    phase3Snapshot: input.phase3Snapshot,
    outcome: 'daemon_awakened',
    shadow321Name: input.shadow321Name ?? undefined,
    chargeSourceBarId: input.chargeSourceBarId ?? undefined,
  })

  if ('error' in persist) return { error: persist.error }

  const innerWorkDigest = buildInnerWorkDigestFrom321({
    phase3Snapshot: input.phase3Snapshot,
    shadow321Name: input.shadow321Name,
  })

  const moves = await db.nationMove.findMany({
    where: { key: { in: DAEMON_DEFAULT_MOVE_KEYS } },
    select: { id: true },
  })
  const moveIds = moves.map((m) => m.id)

  const daemon = await db.daemon.create({
    data: {
      playerId: input.playerId,
      name: input.daemonName.trim() || 'Daemon (Wake Up)',
      source: '321_wake_up',
      level: 1,
      moveIds: JSON.stringify(moveIds),
      shadow321SessionId: persist.sessionId,
      innerWorkDigest,
    },
  })

  revalidatePath('/daemons')
  revalidatePath('/')
  return {
    daemonId: daemon.id,
    sessionId: persist.sessionId,
    name: daemon.name,
    moveIds,
  }
}

/** When daemon level >= DAEMON_NPC_PROMOTION_MIN_LEVEL (default 5), create agent Player and set promotedToPlayerId. */
export async function maybePromoteDaemonToNpc(daemonId: string): Promise<void> {
  const daemon = await db.daemon.findUnique({
    where: { id: daemonId },
    include: { player: { select: { id: true, nationId: true, archetypeId: true } } },
  })
  if (!daemon || daemon.promotedToPlayerId) return
  const minLevel = getDaemonNpcPromotionMinLevel()
  if (daemon.level < minLevel) return

  const owner = daemon.player
  if (!owner.nationId || !owner.archetypeId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[maybePromoteDaemonToNpc] owner missing nation/archetype; skip', { daemonId })
    }
    return
  }

  const invite = await getOrCreateAgentSimInvite()
  const npcName = `${daemon.name} (grown)`.slice(0, 120)

  const npc = await db.player.create({
    data: {
      name: npcName,
      creatorType: 'agent',
      contactType: 'email',
      contactValue: `daemon-npc-${daemon.id}@npc.local`,
      inviteId: invite.id,
      nationId: owner.nationId,
      archetypeId: owner.archetypeId,
      onboardingComplete: true,
    },
  })

  await db.daemon.update({
    where: { id: daemonId },
    data: { promotedToPlayerId: npc.id },
  })

  revalidatePath('/daemons')
  revalidatePath('/')
}

/** Increment daemon level (e.g. school quest graduation). Runs promotion check after update. */
export async function advanceDaemonLevel(
  playerId: string,
  daemonId: string,
  delta: number = 1
): Promise<{ level?: number; promotedToPlayerId?: string | null; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player || player.id !== playerId) return { error: 'Not authorized' }

  const d = await db.daemon.findFirst({ where: { id: daemonId, playerId } })
  if (!d) return { error: 'Daemon not found' }

  const newLevel = Math.min(99, Math.max(1, d.level + delta))
  await db.daemon.update({
    where: { id: daemonId },
    data: { level: newLevel },
  })

  await maybePromoteDaemonToNpc(daemonId)

  const updated = await db.daemon.findUnique({
    where: { id: daemonId },
    select: { level: true, promotedToPlayerId: true },
  })

  revalidatePath('/daemons')
  revalidatePath('/')
  return { level: updated?.level, promotedToPlayerId: updated?.promotedToPlayerId ?? null }
}

export async function discoverDaemon(
  playerId: string,
  source: DiscoverDaemonSource,
  metadata?: DiscoverDaemonMetadata
): Promise<{ daemonId?: string; name?: string; moveIds?: string[]; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player || player.id !== playerId) return { error: 'Not authorized' }

  const moves = await db.nationMove.findMany({
    where: { key: { in: DAEMON_DEFAULT_MOVE_KEYS } },
    select: { id: true },
  })
  const moveIds = moves.map((m) => m.id)

  const name =
    metadata?.name ??
    (source === '321_wake_up' ? 'Daemon (Wake Up)' : source === 'bar' ? 'Daemon (from BAR)' : 'Daemon (School)')

  const daemon = await db.daemon.create({
    data: {
      playerId,
      name,
      source,
      sourceBarId: metadata?.sourceBarId ?? null,
      level: 1,
      moveIds: JSON.stringify(moveIds),
      ...(metadata?.shadow321SessionId
        ? { shadow321SessionId: metadata.shadow321SessionId }
        : {}),
      ...(metadata?.innerWorkDigest != null ? { innerWorkDigest: metadata.innerWorkDigest } : {}),
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

/**
 * Returns the channel and altitude of the most recently summoned active daemon.
 * Returns null if no active summon exists.
 * Spec: .specify/specs/individuation-engine/plan.md (IE-2)
 */
export async function getActiveDaemonState(
  playerId: string
): Promise<{ channel: string | null; altitude: string | null } | null> {
  return queryActiveDaemonChannelAltitude(playerId)
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

export type DaemonCodexUpdate = {
  voice?: string
  desire?: string
  fear?: string
  shadow?: string
}

/**
 * Player-scoped codex fields (IE-12). Evolution log is not editable here.
 */
export async function updateDaemonCodex(
  daemonId: string,
  codex: DaemonCodexUpdate
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authorized' }

  const daemon = await db.daemon.findFirst({
    where: { id: daemonId, playerId: player.id },
    select: { id: true },
  })
  if (!daemon) return { error: 'Daemon not found' }

  try {
    await db.daemon.update({
      where: { id: daemonId },
      data: {
        ...(codex.voice !== undefined ? { voice: codex.voice || null } : {}),
        ...(codex.desire !== undefined ? { desire: codex.desire || null } : {}),
        ...(codex.fear !== undefined ? { fear: codex.fear || null } : {}),
        ...(codex.shadow !== undefined ? { shadow: codex.shadow || null } : {}),
      },
    })
    revalidatePath('/daemons')
    revalidatePath(`/daemons/${daemonId}/codex`)
    return { success: true }
  } catch (e) {
    console.error('[updateDaemonCodex]', e)
    return { error: e instanceof Error ? e.message : 'Update failed' }
  }
}

/** Server read for codex page (IE-17). */
export async function getDaemonCodexForPlayer(daemonId: string) {
  const player = await getCurrentPlayer()
  if (!player) return null

  return db.daemon.findFirst({
    where: { id: daemonId, playerId: player.id },
    select: {
      id: true,
      name: true,
      voice: true,
      desire: true,
      fear: true,
      shadow: true,
      evolutionLog: true,
      level: true,
      source: true,
    },
  })
}
