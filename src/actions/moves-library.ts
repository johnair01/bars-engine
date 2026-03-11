'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { ensureMetalNationMoves } from '@/actions/nation-moves'
import { applyNationMoveWithState } from '@/actions/nation-moves'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MoveSummary = {
  id: string
  key: string
  name: string
  description: string
  usesPerPeriod: number
  appliesToStatus: string[]
}

export type EquippedMove = {
  slotIndex: 1 | 2 | 3 | 4
  move: MoveSummary | null
}

export type PlayerMovePoolResult =
  | {
      success: true
      unlocked: MoveSummary[]
      equipped: EquippedMove[]
      usesRemaining: Record<string, number>
    }
  | { error: string }

function getPeriodKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
}

function userSafeError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2021' || error.code === 'P2022') {
      return 'Database schema is not updated yet. Run Prisma db push, then retry.'
    }
  }
  return error instanceof Error ? (error.message || 'Unknown error') : 'Unknown error'
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ---------------------------------------------------------------------------
// getPlayerMovePool
// ---------------------------------------------------------------------------

export async function getPlayerMovePool(): Promise<PlayerMovePoolResult> {
  try {
    await ensureMetalNationMoves()

    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }
    if (!player.nationId) return { error: 'Profile incomplete: nation missing' }

    const periodKey = getPeriodKey()

    // Nation moves from player's nation + archetype moves from player's playbook
    const nationMoves = await db.nationMove.findMany({
      where: {
        OR: [
          { nationId: player.nationId },
          ...(player.archetypeId ? [{ archetypeId: player.archetypeId }] : []),
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        usesPerPeriod: true,
        appliesToStatus: true,
        isStartingUnlocked: true,
      },
    })

    const unlockedRows = await db.playerNationMoveUnlock.findMany({
      where: {
        playerId: player.id,
        moveId: { in: nationMoves.map((m) => m.id) },
      },
      select: { moveId: true },
    })
    const unlockedSet = new Set(unlockedRows.map((r) => r.moveId))

    const unlocked: MoveSummary[] = nationMoves
      .filter((m) => m.isStartingUnlocked || unlockedSet.has(m.id))
      .map((m) => ({
        id: m.id,
        key: m.key,
        name: m.name,
        description: m.description,
        usesPerPeriod: m.usesPerPeriod,
        appliesToStatus: safeParseJson<string[]>(m.appliesToStatus, []),
      }))

    const moveIds = unlocked.map((u) => u.id)

    const equips = await db.playerMoveEquip.findMany({
      where: { playerId: player.id, moveId: { in: moveIds } },
      include: { move: true },
      orderBy: { slotIndex: 'asc' },
    })

    const usesByMove = await db.moveUse.groupBy({
      by: ['moveId'],
      where: {
        playerId: player.id,
        moveId: { in: moveIds },
        periodKey,
      },
      _count: { id: true },
    })
    const usesCountMap = Object.fromEntries(usesByMove.map((u) => [u.moveId, u._count.id]))

    const usesRemaining: Record<string, number> = {}
    for (const m of unlocked) {
      const used = usesCountMap[m.id] ?? 0
      const limit = m.usesPerPeriod
      usesRemaining[m.id] = limit === 0 ? 999 : Math.max(0, limit - used)
    }

    const equippedMap = new Map(equips.map((e) => [e.slotIndex, e]))
    const equipped: EquippedMove[] = [1, 2, 3, 4].map((slotIndex) => {
      const e = equippedMap.get(slotIndex)
      if (!e) return { slotIndex: slotIndex as 1 | 2 | 3 | 4, move: null }
      const move: MoveSummary = {
        id: e.move.id,
        key: e.move.key,
        name: e.move.name,
        description: e.move.description,
        usesPerPeriod: e.move.usesPerPeriod,
        appliesToStatus: safeParseJson<string[]>(e.move.appliesToStatus, []),
      }
      return { slotIndex: slotIndex as 1 | 2 | 3 | 4, move }
    })

    return {
      success: true,
      unlocked,
      equipped,
      usesRemaining,
    }
  } catch (error) {
    console.error('[moves-library] getPlayerMovePool failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// equipMove
// ---------------------------------------------------------------------------

export async function equipMove(
  moveId: string,
  slotIndex: 1 | 2 | 3 | 4
): Promise<{ success: true } | { error: string }> {
  try {
    await ensureMetalNationMoves()

    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }
    if (!player.nationId) return { error: 'Profile incomplete: nation missing' }

    const move = await db.nationMove.findUnique({
      where: { id: moveId },
      select: { id: true, nationId: true, archetypeId: true, isStartingUnlocked: true },
    })
    if (!move) return { error: 'Unknown move' }
    const inNationPool = move.nationId === player.nationId
    const inArchetypePool = !!player.archetypeId && move.archetypeId === player.archetypeId
    if (!inNationPool && !inArchetypePool) return { error: 'Move is not in your pool' }

    const isUnlocked =
      move.isStartingUnlocked ||
      (await db.playerNationMoveUnlock.findUnique({
        where: { playerId_moveId: { playerId: player.id, moveId } },
      }))
    if (!isUnlocked) return { error: 'Move is locked' }

    await db.$transaction(async (tx) => {
      await tx.playerMoveEquip.deleteMany({
        where: {
          playerId: player.id,
          OR: [{ slotIndex }, { moveId }],
        },
      })
      await tx.playerMoveEquip.create({
        data: {
          playerId: player.id,
          slotIndex,
          moveId,
        },
      })
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[moves-library] equipMove failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// unequipMove
// ---------------------------------------------------------------------------

export async function unequipMove(slotIndex: 1 | 2 | 3 | 4): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    await db.playerMoveEquip.deleteMany({
      where: { playerId: player.id, slotIndex },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[moves-library] unequipMove failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// getMoveUsesRemaining
// ---------------------------------------------------------------------------

export async function getMoveUsesRemaining(
  moveId: string
): Promise<{ success: true; remaining: number; periodKey: string } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const move = await db.nationMove.findUnique({
      where: { id: moveId },
      select: { id: true, usesPerPeriod: true },
    })
    if (!move) return { error: 'Unknown move' }

    const periodKey = getPeriodKey()
    const used = await db.moveUse.count({
      where: {
        playerId: player.id,
        moveId,
        periodKey,
      },
    })

    const limit = move.usesPerPeriod
    const remaining = limit === 0 ? 999 : Math.max(0, limit - used)

    return { success: true, remaining, periodKey }
  } catch (error) {
    console.error('[moves-library] getMoveUsesRemaining failed:', error)
    return { error: userSafeError(error) }
  }
}

// ---------------------------------------------------------------------------
// useMove
// ---------------------------------------------------------------------------

export async function useMove(
  moveId: string,
  questId: string,
  inputs?: Record<string, unknown>
): Promise<
  | { success: true; createdBarId?: string; questStatus?: string }
  | { error: string }
> {
  try {
    await ensureMetalNationMoves()

    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }
    if (!player.nationId) return { error: 'Profile incomplete: nation missing' }

    const equip = await db.playerMoveEquip.findUnique({
      where: { playerId_moveId: { playerId: player.id, moveId } },
      include: { move: true },
    })
    if (!equip) return { error: 'Move is not equipped' }

    const periodKey = getPeriodKey()
    const used = await db.moveUse.count({
      where: {
        playerId: player.id,
        moveId,
        periodKey,
      },
    })
    const limit = equip.move.usesPerPeriod
    if (limit !== 0 && used >= limit) {
      return { error: 'No uses remaining for this period' }
    }

    const quest = await db.customBar.findUnique({
      where: { id: questId },
      select: { id: true, status: true, creatorId: true, claimedById: true, isSystem: true },
    })
    if (!quest) return { error: 'Quest not found' }
    if (quest.isSystem) return { error: 'System quests cannot receive nation moves' }

    const hasDirectAccess = quest.creatorId === player.id || quest.claimedById === player.id
    if (!hasDirectAccess) {
      const pq = await db.playerQuest.findUnique({
        where: { playerId_questId: { playerId: player.id, questId } },
        select: { status: true },
      })
      if (pq?.status !== 'assigned') return { error: 'Not authorized to modify this quest' }
    }

    const applies = safeParseJson<string[]>(equip.move.appliesToStatus, [])
    if (applies.length > 0 && !applies.includes(quest.status)) {
      return { error: `Move cannot be applied when quest status is "${quest.status}"` }
    }

    const formData = new FormData()
    formData.set('questId', questId)
    formData.set('moveKey', equip.move.key)
    if (inputs && typeof inputs === 'object') {
      for (const [k, v] of Object.entries(inputs)) {
        if (v != null) formData.set(k, String(v))
      }
    }

    const applyResult = await applyNationMoveWithState(null, formData)
    if ('error' in applyResult) return { error: applyResult.error }

    await db.moveUse.create({
      data: {
        playerId: player.id,
        moveId,
        periodKey,
        questId,
      },
    })

    revalidatePath('/')
    return {
      success: true,
      createdBarId: applyResult.barId,
      questStatus: applyResult.questStatus,
    }
  } catch (error) {
    console.error('[moves-library] useMove failed:', error)
    return { error: userSafeError(error) }
  }
}
