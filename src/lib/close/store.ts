import type { PrismaClient } from '@prisma/client'
import { latestDoc } from '@/lib/board/store'
import { sessionWrite } from '@/lib/board/session-write'
import { boardOwnerId } from '@/lib/board/owner'
import { dayId, newClose, MAX_KEPT, type CloseRecord, type Item, type Kept } from './types'

type Db = Pick<PrismaClient, 'boardSave' | 'workTicket' | 'tapTheVeinTask'>

/**
 * Where a close lives. A new store collection needs a paired council schema pull request, so the close is kept as a
 * `records` document of kind `ledger` (docId `close-<date>`, body the record as JSON), which the store already takes.
 * Moving it to its own `close` collection later changes only this file.
 */
export const closePath = (date: string) => `council/ledger/${dayId(date)}.json`

export async function loadClose(date: string): Promise<CloseRecord | null> {
  const doc = await latestDoc('council', 'records', dayId(date))
  if (!doc || typeof doc.body !== 'string') return null
  try { return JSON.parse(doc.body) as CloseRecord } catch { return null }
}

export async function saveClose(db: Db, r: CloseRecord): Promise<string | null> {
  const res = await sessionWrite(db, [{ collection: 'records', docId: dayId(r.date), mode: 'set',
    data: { kind: 'ledger', path: closePath(r.date), body: JSON.stringify(r) } }])
  return res.refused[0] ?? null
}

/** The Pacific day (UTC-8 in winter, UTC-7 in summer) as a [from, to) window in UTC. */
export function dayWindow(date: string): { from: Date; to: Date } {
  const noon = new Date(`${date}T12:00:00Z`)
  const offset = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'shortOffset' })
    .formatToParts(noon).find(p => p.type === 'timeZoneName')?.value.replace('GMT', '') || '-8')
  const from = new Date(new Date(`${date}T00:00:00Z`).getTime() - offset * 3600_000)
  return { from, to: new Date(from.getTime() + 24 * 3600_000) }
}

const base = { reversible: true, oneLane: true, endsInPrOrRow: true, merges: false, spend: false, outreach: false, touchesFaces: false }

/**
 * The day's work, from the work tickets (the sealed record: `result` is the proof of a finished one; a ticket still in
 * flight is sealed by its own id). A ticket still waiting is marked not reversible on purpose, so it reads as ready for
 * tomorrow and is never offered as safe to run tonight from here; only a face pick's own safety facts can do that.
 */
export async function collectDay(db: Pick<PrismaClient, 'workTicket'>, date: string): Promise<Item[]> {
  const { from, to } = dayWindow(date)
  const rows = await db.workTicket.findMany({
    where: { OR: [{ state: 'done', doneAt: { gte: from, lt: to } }, { state: { in: ['claimed', 'ready'] } }] },
    orderBy: { createdAt: 'asc' }, take: 60,
    select: { id: true, title: true, state: true, result: true, brief: true },
  })
  return rows.map((t): Item => {
    const nextOwner = /Next owner \+ wake:/i.test(t.brief)
    if (t.state === 'done') return { ...base, nextOwner, id: t.id, title: t.title, stage: 'done', proof: t.result?.trim() || undefined, check: 'none' }
    if (t.state === 'claimed') return { ...base, nextOwner, id: t.id, title: t.title, stage: 'doing', proof: `ticket:${t.id}`, check: 'none' }
    return { ...base, reversible: false, nextOwner, id: t.id, title: t.title, stage: 'next', proof: `ticket:${t.id}`, check: 'none' }
  })
}

/**
 * The things he kept this morning: his Tap the Vein tasks for that day's sitting, in the order he kept them, at most
 * three. A composted task is gone; a finished one still comes back, so the close can light its lantern. Any failure
 * reads as "nothing kept", since the close must open without the morning.
 */
export async function collectKept(db: Pick<PrismaClient, 'tapTheVeinTask'>, date: string, playerId = boardOwnerId()): Promise<Kept[]> {
  if (!playerId || !db.tapTheVeinTask) return []
  try {
    const rows = await db.tapTheVeinTask.findMany({
      where: { playerId, status: { notIn: ['composted'] }, dailySession: { sessionDate: new Date(`${date}T00:00:00Z`) } },
      orderBy: [{ priorityRank: 'asc' }, { createdAt: 'asc' }], take: MAX_KEPT,
      select: { id: true, originalText: true },
    })
    return rows.map(t => ({ id: t.id, title: t.originalText.trim().slice(0, 160) }))
  } catch { return [] }
}

/** Today's close, started from the day's tickets when none exists yet. */
export async function openClose(db: Db, date: string, now = new Date()): Promise<CloseRecord> {
  const held = await loadClose(date)
  if (held) {
    // A close begun before the kept cards existed picks them up once, so the Glass can show them.
    if (held.kept === undefined && held.status === 'open') { held.kept = await collectKept(db, date); await saveClose(db, held) }
    return held
  }
  const r = newClose(date, await collectDay(db, date), now.toISOString(), await collectKept(db, date))
  await saveClose(db, r)
  return r
}
