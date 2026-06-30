import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { isLensDomainKey } from './domains'
import { normalizeLensWorkshopOptions } from './workshop-options'
import type {
  LensCadence,
  LensDescentParentDTO,
  LensGoalDTO,
  LensesDescentState,
  LensesOnboardingState,
  LensWorkshopDraftDTO,
} from './types'

export function yearlyPeriodKey(d: Date = new Date()): string {
  return `yearly:${d.getFullYear()}`
}

export async function ensureYearlyLens(playerId: string, d: Date = new Date()) {
  const periodKey = yearlyPeriodKey(d)
  return db.lens.upsert({
    where: { playerId_type_periodKey: { playerId, type: 'yearly', periodKey } },
    update: {},
    create: {
      playerId,
      type: 'yearly',
      title: `${d.getFullYear()} Year Frame`,
      periodKey,
    },
    select: { id: true, type: true, title: true, periodKey: true },
  })
}

export function cadenceToLensType(cadence: LensCadence): string {
  switch (cadence) {
    case 'year':
      return 'yearly'
    case 'quarter':
      return 'quarterly'
    case 'month':
      return 'monthly'
    case 'week':
      return 'weekly'
  }
}

export function nextCadence(cadence: LensCadence): Exclude<LensCadence, 'year'> | null {
  switch (cadence) {
    case 'year':
      return 'quarter'
    case 'quarter':
      return 'month'
    case 'month':
      return 'week'
    case 'week':
      return null
  }
}

export function periodKeyForCadence(cadence: LensCadence, d: Date = new Date()): string {
  const y = d.getFullYear()
  switch (cadence) {
    case 'year':
      return `yearly:${y}`
    case 'quarter':
      return `quarterly:${y}-Q${Math.floor(d.getMonth() / 3) + 1}`
    case 'month':
      return `monthly:${y}-${String(d.getMonth() + 1).padStart(2, '0')}`
    case 'week': {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const dayNum = (date.getUTCDay() + 6) % 7
      date.setUTCDate(date.getUTCDate() - dayNum + 3)
      const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
      const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
      return `weekly:${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    }
  }
}

export async function ensureCadenceLens(playerId: string, cadence: LensCadence, d: Date = new Date()) {
  if (cadence === 'year') return ensureYearlyLens(playerId, d)
  const type = cadenceToLensType(cadence)
  const periodKey = periodKeyForCadence(cadence, d)
  const title = periodKey.replace(':', ' ')
  return db.lens.upsert({
    where: { playerId_type_periodKey: { playerId, type, periodKey } },
    update: {},
    create: { playerId, type, title, periodKey },
    select: { id: true, type: true, title: true, periodKey: true },
  })
}

function asNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item)) : []
}

export async function getLatestSuperpowerForPlayer(playerId: string) {
  const membership = await db.campaignMembership.findFirst({
    where: { playerId, superpower: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { superpower: true, superpowerOrientation: true },
  })
  return membership ?? { superpower: null, superpowerOrientation: null }
}

export async function loadLensesOnboardingState(): Promise<LensesOnboardingState | null> {
  const player = await getCurrentPlayer()
  if (!player) return null

  const lens = await ensureYearlyLens(player.id)
  const [superpower, goals, drafts] = await Promise.all([
    getLatestSuperpowerForPlayer(player.id),
    db.lensGoal.findMany({
      where: { playerId: player.id, lensId: lens.id, cadence: 'year' },
      orderBy: [{ domain: 'asc' }, { keepOrder: 'asc' }],
    }),
    db.lensWorkshopDraft.findMany({
      where: { playerId: player.id, lensId: lens.id, cadence: 'year' },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const goalDtos: LensGoalDTO[] = goals.flatMap((goal) => {
    if (!isLensDomainKey(goal.domain)) return []
    return [{
      id: goal.id,
      stableKey: goal.stableKey,
      domain: goal.domain,
      cadence: goal.cadence as LensCadence,
      title: goal.title,
      satisfactionPayoff: goal.satisfactionPayoff,
      metric: goal.metric,
      status: goal.status,
      alignmentType: goal.alignmentType,
      keepOrder: goal.keepOrder,
      parentGoalId: goal.parentGoalId,
      supersededById: goal.supersededById,
      archivedAt: goal.archivedAt ? goal.archivedAt.toISOString() : null,
    }]
  })

  const draftDtos: LensWorkshopDraftDTO[] = drafts.map((draft) => ({
    id: draft.id,
    domain: draft.domain && isLensDomainKey(draft.domain) ? draft.domain : null,
    cadence: draft.cadence as LensCadence,
    parentGoalId: draft.parentGoalId,
    freewrite: draft.freewrite,
    options: normalizeLensWorkshopOptions(draft.options),
    keptOrder: asNumberArray(draft.keptOrder),
    status: draft.status,
    vagueMovement: draft.vagueMovement,
    feelings: Array.isArray(draft.feelings) ? draft.feelings.filter((item): item is string => typeof item === 'string') : [],
  }))

  return {
    playerName: player.name,
    superpower: superpower.superpower,
    superpowerOrientation: superpower.superpowerOrientation,
    yearlyLensId: lens.id,
    goals: goalDtos,
    drafts: draftDtos,
  }
}

export async function loadLensesDescentState(): Promise<LensesDescentState | null> {
  const player = await getCurrentPlayer()
  if (!player) return null

  const [goals, drafts] = await Promise.all([
    db.lensGoal.findMany({
      where: {
        playerId: player.id,
        status: { in: ['active', 'parked'] },
        cadence: { in: ['year', 'quarter', 'month'] },
      },
      orderBy: [{ cadence: 'asc' }, { domain: 'asc' }, { keepOrder: 'asc' }],
    }),
    db.lensWorkshopDraft.findMany({
      where: {
        playerId: player.id,
        parentGoalId: { not: null },
        cadence: { in: ['quarter', 'month', 'week'] },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const childCounts = await db.lensGoal.groupBy({
    by: ['parentGoalId'],
    where: {
      playerId: player.id,
      parentGoalId: { not: null },
      status: 'active',
    },
    _count: { _all: true },
  })
  const countByParent = new Map(childCounts.map((row) => [row.parentGoalId, row._count._all]))

  const parents: LensDescentParentDTO[] = goals.flatMap((goal) => {
    if (!isLensDomainKey(goal.domain)) return []
    const cadence = goal.cadence as LensCadence
    const next = nextCadence(cadence)
    if (!next) return []
    return [{
      id: goal.id,
      stableKey: goal.stableKey,
      domain: goal.domain,
      cadence,
      title: goal.title,
      satisfactionPayoff: goal.satisfactionPayoff,
      metric: goal.metric,
      status: goal.status,
      alignmentType: goal.alignmentType,
      keepOrder: goal.keepOrder,
      parentGoalId: goal.parentGoalId,
      supersededById: goal.supersededById,
      archivedAt: goal.archivedAt ? goal.archivedAt.toISOString() : null,
      nextCadence: next,
      childCount: countByParent.get(goal.id) ?? 0,
    }]
  })

  const draftDtos: LensWorkshopDraftDTO[] = drafts.map((draft) => ({
    id: draft.id,
    domain: draft.domain && isLensDomainKey(draft.domain) ? draft.domain : null,
    cadence: draft.cadence as LensCadence,
    parentGoalId: draft.parentGoalId,
    freewrite: draft.freewrite,
    options: normalizeLensWorkshopOptions(draft.options),
    keptOrder: asNumberArray(draft.keptOrder),
    status: draft.status,
    vagueMovement: draft.vagueMovement,
    feelings: Array.isArray(draft.feelings) ? draft.feelings.filter((item): item is string => typeof item === 'string') : [],
  }))

  return { playerName: player.name, parents, drafts: draftDtos }
}
