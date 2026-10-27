import 'server-only'
import { db } from '@/lib/db'
import { toUnchosen, UNCHOSEN_WINDOW_DAYS, type UnchosenLine } from './unchosen'
import { toPitchViews, type PitchView, type ReadPlan } from './unchosen-read'

/** Every unchosen line in the view's window, for the council's weekly read (the same lines the view shows). */
export async function loadPile(playerId: string, today: Date): Promise<UnchosenLine[]> {
  const since = new Date(today.getTime() - UNCHOSEN_WINDOW_DAYS * 86_400_000)
  const rows = await db.tapTheVeinDailySession.findMany({
    where: { playerId, sessionDate: { gte: since, lt: today } },
    select: { sessionDate: true, brainstormCandidates: true, morningMenu: true, tasks: { select: { originalText: true } } },
  })
  return toUnchosen(rows, today.toISOString().slice(0, 10))
}

const PITCH_SELECT = {
  id: true, word: true, face: true, kernel: true, pitch: true, quotes: true, weekOf: true, status: true, replacedById: true,
} as const

export async function loadPitchViews(playerId: string): Promise<PitchView[]> {
  return toPitchViews(await db.tapTheVeinUnchosenPitch.findMany({ where: { playerId }, select: PITCH_SELECT }))
}

export async function livePitches(playerId: string) {
  const rows = await db.tapTheVeinUnchosenPitch.findMany({
    where: { playerId, status: 'live' }, select: { id: true, word: true, pitch: true, weekOf: true },
  })
  return rows.map((r) => ({ ...r, weekOf: r.weekOf.toISOString().slice(0, 10) }))
}

export async function weekRead(playerId: string, weekOf: string): Promise<boolean> {
  return (await db.tapTheVeinUnchosenPitch.count({ where: { playerId, weekOf: new Date(`${weekOf}T00:00:00.000Z`) } })) > 0
}

/** Write a checked read in one transaction: the new pitches, then each returning pattern's old pitch composted. */
export async function writeRead(playerId: string, plan: ReadPlan): Promise<{ created: number; composted: number }> {
  const weekOf = new Date(`${plan.weekOf}T00:00:00.000Z`)
  return db.$transaction(async (tx) => {
    const ids = new Map<string, string>()
    for (const p of plan.create) {
      const row = await tx.tapTheVeinUnchosenPitch.create({
        data: { playerId, weekOf, word: p.word, face: p.face, kernel: p.kernel, pitch: p.pitch, quotes: p.quotes },
        select: { id: true },
      })
      ids.set(p.word, row.id)
    }
    for (const c of plan.compost) {
      await tx.tapTheVeinUnchosenPitch.update({
        where: { id: c.id },
        data: { status: 'composted', compostedAt: new Date(), replacedById: ids.get(c.word) ?? null },
      })
    }
    return { created: plan.create.length, composted: plan.compost.length }
  })
}
