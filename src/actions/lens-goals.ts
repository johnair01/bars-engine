'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { LENS_DOMAIN_KEYS, isLensDomainKey } from '@/lib/lenses/domains'
import {
  ensureCadenceLens,
  ensureYearlyLens,
  getLatestSuperpowerForPlayer,
} from '@/lib/lenses/onboarding-data'
import {
  normalizeLensAlignmentType,
  nextLensCadence,
  validateDescentInput,
} from '@/lib/lenses/workshop'
import { cleanWorkshopKeptIndexes, cleanWorkshopOptions } from '@/lib/lenses/workshop-options'
import type { LensCadence, LensWorkshopOption, LensWorkshopUnit, SaveLensDescentInput, SaveYearFrameInput } from '@/lib/lenses/types'

type GoalScope = {
  playerId: string
  lensId?: string
  cadence: LensCadence
  parentGoalId: string | null
}

function serverStableKey(): string {
  return randomUUID()
}

function canonicalizeOptions(options: unknown): LensWorkshopOption[] {
  return cleanWorkshopOptions(options).map((option) => ({
    ...option,
    stableKey: option.stableKey ?? serverStableKey(),
  }))
}

function cleanOptions(options: unknown): LensWorkshopOption[] {
  return canonicalizeOptions(options)
}

function cleanKeptIndexes(keptIndexes: number[], options: LensWorkshopOption[]) {
  return cleanWorkshopKeptIndexes(keptIndexes, options)
}

function normalizeUnits(units: LensWorkshopUnit[]): LensWorkshopUnit[] {
  return units
    .filter((unit) => isLensDomainKey(unit.domain))
    .map((unit) => {
      const options = cleanOptions(unit.options)
      return {
        ...unit,
        options,
        keptIndexes: cleanKeptIndexes(unit.keptIndexes, options),
      }
    })
}

async function goalIsReferenced(tx: Prisma.TransactionClient, goalId: string) {
  const [children, tasks, bars, drafts, superseded] = await Promise.all([
    tx.lensGoal.count({ where: { parentGoalId: goalId } }),
    tx.tapTheVeinTask.count({ where: { lensGoalId: goalId } }),
    tx.customBar.count({ where: { lensGoalId: goalId } }),
    tx.lensWorkshopDraft.count({ where: { parentGoalId: goalId } }),
    tx.lensGoal.count({ where: { supersededById: goalId } }),
  ])

  return children + tasks + bars + drafts + superseded > 0
}

async function retireRemovedGoals(
  tx: Prisma.TransactionClient,
  scope: GoalScope,
  keptStableKeys: Set<string>,
  successorByDomain: Map<string, string>,
  parkedDomains = new Set<string>(),
) {
  const existing = await tx.lensGoal.findMany({
    where: {
      playerId: scope.playerId,
      cadence: scope.cadence,
      parentGoalId: scope.parentGoalId,
      ...(scope.lensId ? { lensId: scope.lensId } : {}),
      status: { in: ['active', 'parked'] },
    },
    select: { id: true, stableKey: true, domain: true, cadence: true },
  })

  for (const goal of existing) {
    if (keptStableKeys.has(goal.stableKey)) continue

    if (parkedDomains.has(goal.domain)) {
      await tx.lensGoal.update({
        where: { id: goal.id },
        data: { status: 'parked', supersededById: null, archivedAt: null },
      })
      continue
    }

    const referenced = await goalIsReferenced(tx, goal.id)
    if (!referenced) {
      await tx.lensGoal.delete({ where: { id: goal.id } })
      continue
    }

    const successorId = successorByDomain.get(goal.domain)
    if (successorId && successorId !== goal.id && goal.cadence === scope.cadence) {
      await tx.lensGoal.update({
        where: { id: goal.id },
        data: { status: 'superseded', supersededById: successorId, archivedAt: new Date() },
      })
      continue
    }

    await tx.lensGoal.update({
      where: { id: goal.id },
      data: { status: 'archived', archivedAt: new Date() },
    })
  }
}

export async function saveYearLensFrame(input: SaveYearFrameInput) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const lens = await ensureYearlyLens(player.id)
  const superpower = await getLatestSuperpowerForPlayer(player.id)
  const units = normalizeUnits(input.units)

  const missingDomains = LENS_DOMAIN_KEYS.filter(
    (domain) => !units.some((unit) => unit.domain === domain),
  )
  if (missingDomains.length > 0) {
    return { error: 'Visit all five lenses before saving the year frame.' }
  }

  const activeUnits = units.filter((unit) => unit.status !== 'parked' && unit.status !== 'skipped')
  const activeWithoutKept = activeUnits.filter((unit) => {
    return unit.keptIndexes.length === 0
  })

  if (activeWithoutKept.length > 0) {
    return { error: 'Each active lens needs at least one kept goal, or it can be parked.' }
  }

  await db.$transaction(async (tx) => {
    await tx.lensWorkshopDraft.deleteMany({
      where: { playerId: player.id, lensId: lens.id, cadence: 'year', parentGoalId: null },
    })

    const keptStableKeys = new Set<string>()
    const successorByDomain = new Map<string, string>()
    const parkedDomains = new Set<string>()

    for (const unit of units) {
      const options = unit.options
      const keptIndexes = unit.keptIndexes
      const status = unit.status === 'parked' || unit.status === 'skipped' ? unit.status : 'locked'
      if (unit.status === 'parked') parkedDomains.add(unit.domain)

      await tx.lensWorkshopDraft.create({
        data: {
          playerId: player.id,
          lensId: lens.id,
          domain: unit.domain,
          cadence: 'year',
          freewrite: unit.freewrite.trim() || null,
          options,
          keptOrder: keptIndexes,
          feelings: input.feelings,
          vagueMovement: input.vagueMovement.trim() || null,
          status,
        },
      })

      for (const [order, optionIndex] of keptIndexes.entries()) {
        const option = options[optionIndex]
        if (!option?.stableKey) continue
        keptStableKeys.add(option.stableKey)
        const existing = await tx.lensGoal.findUnique({
          where: { stableKey: option.stableKey },
          select: { id: true, playerId: true, domain: true, cadence: true },
        })
        const data = {
            playerId: player.id,
            lensId: lens.id,
            domain: unit.domain,
            cadence: 'year',
            title: option.text,
            satisfactionPayoff: input.feelings.join(', ') || null,
            superpowerSource: superpower.superpower
              ? `${superpower.superpower}${superpower.superpowerOrientation ? `:${superpower.superpowerOrientation}` : ''}`
              : null,
            status: unit.status === 'parked' ? 'parked' : 'active',
            keepOrder: order + 1,
            supersededById: null,
            archivedAt: null,
        }

        if (existing?.playerId === player.id && existing.domain === unit.domain && existing.cadence === 'year') {
          await tx.lensGoal.update({ where: { id: existing.id }, data })
          successorByDomain.set(unit.domain, existing.id)
        } else if (!existing) {
          const created = await tx.lensGoal.create({ data: { ...data, stableKey: option.stableKey } })
          successorByDomain.set(unit.domain, created.id)
        }
      }
    }

    await retireRemovedGoals(
      tx,
      { playerId: player.id, lensId: lens.id, cadence: 'year', parentGoalId: null },
      keptStableKeys,
      successorByDomain,
      parkedDomains,
    )
  })

  revalidatePath('/lenses/onboarding')
  revalidatePath('/lenses/descent')
  return { ok: true, units }
}

export async function saveLensGoalDescent(input: SaveLensDescentInput) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const parent = await db.lensGoal.findFirst({
    where: { id: input.parentGoalId, playerId: player.id, status: 'active' },
  })
  if (!parent) return { error: 'Parent goal not found.' }

  const expectedCadence = nextLensCadence(parent.cadence as LensCadence)
  if (!expectedCadence || input.cadence !== expectedCadence) {
    return { error: 'This goal cannot be descended at that level.' }
  }

  const options = cleanOptions(input.options)
  const keptIndexes = cleanKeptIndexes(input.keptIndexes, options)
  const alignmentType = normalizeLensAlignmentType(input.alignmentType)

  const validation = validateDescentInput({
    parentGoalId: parent.id,
    parentCadence: parent.cadence as LensCadence,
    requestedCadence: input.cadence,
    status: input.status,
    options: options.map((option) => option.text),
    keptIndexes,
  })
  if (!validation.ok) return { error: validation.error }

  const lens = await ensureCadenceLens(player.id, input.cadence)

  await db.$transaction(async (tx) => {
    await tx.lensWorkshopDraft.deleteMany({
      where: {
        playerId: player.id,
        parentGoalId: parent.id,
        cadence: input.cadence,
      },
    })

    const keptStableKeys = new Set<string>()
    const successorByDomain = new Map<string, string>()
    const parkedDomains = input.status === 'parked' ? new Set([parent.domain]) : new Set<string>()

    await tx.lensWorkshopDraft.create({
      data: {
        playerId: player.id,
        lensId: lens.id,
        domain: parent.domain,
        cadence: input.cadence,
        parentGoalId: parent.id,
        freewrite: input.freewrite.trim() || null,
        options,
        keptOrder: keptIndexes,
        status: input.status === 'parked' || input.status === 'skipped' ? input.status : 'locked',
      },
    })

    for (const [order, optionIndex] of keptIndexes.entries()) {
      const option = options[optionIndex]
      if (!option?.stableKey) continue
      keptStableKeys.add(option.stableKey)
      const existing = await tx.lensGoal.findUnique({
        where: { stableKey: option.stableKey },
        select: { id: true, playerId: true, domain: true, cadence: true, parentGoalId: true },
      })
      const data = {
          playerId: player.id,
          lensId: lens.id,
          domain: parent.domain,
          cadence: input.cadence,
          title: option.text,
          parentGoalId: parent.id,
          satisfactionPayoff: parent.satisfactionPayoff,
          superpowerSource: parent.superpowerSource,
          alignmentType,
          status: 'active',
          keepOrder: order + 1,
          supersededById: null,
          archivedAt: null,
      }

      if (
        existing?.playerId === player.id &&
        existing.domain === parent.domain &&
        existing.cadence === input.cadence &&
        existing.parentGoalId === parent.id
      ) {
        await tx.lensGoal.update({ where: { id: existing.id }, data })
        successorByDomain.set(parent.domain, existing.id)
      } else if (!existing) {
        const created = await tx.lensGoal.create({ data: { ...data, stableKey: option.stableKey } })
        successorByDomain.set(parent.domain, created.id)
      }
    }

    await retireRemovedGoals(
      tx,
      { playerId: player.id, cadence: input.cadence, parentGoalId: parent.id },
      keptStableKeys,
      successorByDomain,
      parkedDomains,
    )
  })

  revalidatePath('/lenses/descent')
  return { ok: true, options }
}
