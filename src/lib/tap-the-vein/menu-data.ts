/**
 * Server reads for the morning menu (TTV-MENU), shared by the server actions and
 * the council export route. Not a server action module: every function takes a
 * playerId, so it must never be callable from the client.
 */

import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { isLensDomainKey } from '@/lib/lenses/domains'
import { parseBrainstormCandidates } from '@/lib/tap-the-vein/charge'
import {
  buildMenu,
  parseStoredMenu,
  type MenuItem,
  type MorningMenuExport,
  type StoredMorningMenu,
} from '@/lib/tap-the-vein/menu'
import type { TtvLensGoalOption } from '@/lib/tap-the-vein/types'

export async function loadActiveLensGoals(playerId: string): Promise<TtvLensGoalOption[]> {
  const goals = await db.lensGoal.findMany({
    where: { playerId, status: 'active', cadence: { in: ['week', 'month', 'quarter', 'year'] } },
    orderBy: [{ cadence: 'asc' }, { domain: 'asc' }, { keepOrder: 'asc' }],
    select: { id: true, title: true, domain: true, cadence: true, parentGoalId: true },
  })
  return goals.filter((goal): goal is TtvLensGoalOption => isLensDomainKey(goal.domain))
}

export type LoadedMenu = {
  sessionId: string
  sessionDate: string
  items: MenuItem[]
  goals: TtvLensGoalOption[]
  stored: StoredMorningMenu
}

/** The menu for one session, built from today's tasks, kept lines and live goals. */
export async function loadMenuForSession(playerId: string, sessionDate: Date): Promise<LoadedMenu | null> {
  const session = await db.tapTheVeinDailySession.findUnique({
    where: { playerId_sessionDate: { playerId, sessionDate } },
    select: {
      id: true,
      sessionDate: true,
      brainstormCandidates: true,
      morningMenu: true,
      // rawEntry is deliberately not selected: the free write never feeds the menu (mm-raw).
      tasks: {
        select: { id: true, originalText: true, status: true, lensGoalId: true },
        orderBy: [{ priorityRank: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
  if (!session) return null
  const goals = await loadActiveLensGoals(playerId)
  const stored = parseStoredMenu(session.morningMenu)
  const items = buildMenu({
    tasks: session.tasks.map((t) => ({ id: t.id, text: t.originalText, status: t.status, lensGoalId: t.lensGoalId })),
    candidates: parseBrainstormCandidates(session.brainstormCandidates),
    goals,
    stored,
  })
  return {
    sessionId: session.id,
    sessionDate: session.sessionDate.toISOString().slice(0, 10),
    items,
    goals,
    stored,
  }
}

/** The most recent sealed menu for a player — what the council reads. */
export async function loadLatestSealedMenu(playerId: string, sessionDate?: string): Promise<MorningMenuExport | null> {
  const sessions = await db.tapTheVeinDailySession.findMany({
    where: {
      playerId,
      morningMenu: { not: Prisma.DbNull },
      ...(sessionDate ? { sessionDate: new Date(`${sessionDate}T00:00:00.000Z`) } : {}),
    },
    orderBy: { sessionDate: 'desc' },
    take: 14,
    select: { sessionDate: true, morningMenu: true },
  })
  for (const s of sessions) {
    const stored = parseStoredMenu(s.morningMenu)
    if (stored.sealedAt && stored.sealed) {
      return {
        version: 1,
        sessionDate: s.sessionDate.toISOString().slice(0, 10),
        sealedAt: stored.sealedAt,
        items: stored.sealed,
      }
    }
  }
  return null
}
