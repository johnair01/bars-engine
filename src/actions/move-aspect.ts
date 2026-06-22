'use server'

/**
 * Inner / Outer Allyship — persistence of a player's aspect choice on move-taking.
 *
 * Base layer: when a player takes a move they may enact it **inner** (self-
 * development) or **outer** (allyship, which requires a target). Aspect is a
 * property of the *base* move, so the source of truth is the base `CustomBar`
 * (`moveAspect` + `allyshipTarget`) — recorded **Nation-free**. A `NationMove`
 * is no longer required to record an aspect.
 *
 * When the move is taken via a Nation overlay (a `NationMove` id is supplied), a
 * `QuestMoveLog` row is also written as a secondary *echo* of the same aspect, so
 * the Nation path stays observable. The base `CustomBar` remains canonical.
 *
 * The with/for shadow reading of the chosen face×cell is a documented seam and is
 * deliberately NOT recorded here — the engine logs *what* was enacted, it does not
 * judge it (CLAUDE.md: "emotional energy is fuel, not judgment").
 *
 * See .specify/specs/inner-outer-allyship-moves/data-model.md and spec.md.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { isValidAspectTarget } from '@/lib/quest-grammar/move-aspect'
import type { MoveAspect, AllyshipTarget } from '@/lib/quest-grammar/types'

const VALID_ASPECTS: readonly MoveAspect[] = ['inner', 'outer']
const VALID_TARGETS: readonly AllyshipTarget[] = ['individual', 'collective', 'system']

/** Contract for recording a player's inner/outer choice when they take a move. */
export interface RecordEnactedMoveInput {
  /**
   * The base move-BAR (CustomBar) to stamp as the canonical aspect record.
   * Defaults to `questId` when omitted. At least one of `barId`/`questId` is required.
   */
  barId?: string
  /** The quest (CustomBar) the move is taken on / the base move-BAR's context. */
  questId?: string
  /**
   * Optional NationMove id. When present, a QuestMoveLog echo is also written
   * (the Nation overlay path). Omit for a Nation-free base move.
   */
  moveId?: string
  /** inner = self-development; outer = allyship (requires target). */
  aspect: MoveAspect
  /** Required when aspect === 'outer'; omitted/undefined for inner. */
  target?: AllyshipTarget
}

export type RecordEnactedMoveResult =
  | { ok: true; logId: string | null; aspect: MoveAspect; target: AllyshipTarget | null }
  | { ok: false; error: string }

function userSafeError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2003 = FK violation (bad moveId); P2021/P2022 = schema not migrated yet.
    if (error.code === 'P2003') return 'Unknown move (no matching move record).'
    if (error.code === 'P2021' || error.code === 'P2022') {
      return 'Database schema is not updated yet. Run prisma migrate deploy, then retry.'
    }
  }
  return error instanceof Error ? error.message || 'Unknown error' : 'Unknown error'
}

/**
 * Record a player's inner/outer aspect choice for a move on a quest.
 *
 * Validates the aspect/target invariant (outer ⇒ target; inner ⇒ no target) and
 * the player's access to the quest (creator, claimer, or assigned), then writes an
 * annotated QuestMoveLog row.
 */
export async function recordEnactedMove(input: RecordEnactedMoveInput): Promise<RecordEnactedMoveResult> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { ok: false, error: 'Not logged in' }

    const questId = input.questId?.trim()
    const moveId = input.moveId?.trim()
    // Canonical home for the aspect is the base move-BAR; fall back to the quest.
    const barId = input.barId?.trim() || questId
    if (!barId) return { ok: false, error: 'Missing barId/questId' }

    if (!VALID_ASPECTS.includes(input.aspect)) {
      return { ok: false, error: `Invalid aspect: ${String(input.aspect)}` }
    }
    if (input.target !== undefined && !VALID_TARGETS.includes(input.target)) {
      return { ok: false, error: `Invalid target: ${String(input.target)}` }
    }
    // Structural invariant of allyship — one source of truth with the grammar.
    if (!isValidAspectTarget(input.aspect, input.target)) {
      return {
        ok: false,
        error:
          input.aspect === 'outer'
            ? 'Outer (allyship) moves require a target (individual, collective, or system).'
            : 'Inner moves are self-directed and cannot carry a target.',
      }
    }

    // Access: creator, claimer, or assigned (mirrors nation-moves), checked on the
    // base CustomBar that will carry the aspect.
    const bar = await db.customBar.findUnique({
      where: { id: barId },
      select: { id: true, creatorId: true, claimedById: true },
    })
    if (!bar) return { ok: false, error: 'BAR not found' }

    const hasDirectAccess = bar.creatorId === player.id || bar.claimedById === player.id
    if (!hasDirectAccess) {
      const pq = await db.playerQuest.findUnique({
        where: { playerId_questId: { playerId: player.id, questId: barId } },
        select: { status: true },
      })
      if (pq?.status !== 'assigned') return { ok: false, error: 'Not authorized to act on this BAR' }
    }

    const target = input.target ?? null

    // Canonical: stamp the base move-BAR (Nation-free source of truth).
    await db.customBar.update({
      where: { id: barId },
      data: { moveAspect: input.aspect, allyshipTarget: target },
    })

    // Echo: only on the Nation overlay path (a NationMove id + its quest context).
    let logId: string | null = null
    if (moveId && questId) {
      const log = await db.questMoveLog.create({
        data: {
          questId,
          moveId,
          playerId: player.id,
          moveAspect: input.aspect,
          allyshipTarget: target,
        },
        select: { id: true },
      })
      logId = log.id
    }

    revalidatePath('/')
    revalidatePath('/vault')

    return { ok: true, logId, aspect: input.aspect, target }
  } catch (error) {
    console.error('[move-aspect] recordEnactedMove failed:', error)
    return { ok: false, error: userSafeError(error) }
  }
}
