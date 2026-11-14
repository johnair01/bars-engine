import type { PrismaClient } from '@prisma/client'
import { recentAnswers, type SavedAnswer } from './saves'

/**
 * The unworked read (homeport FR-002): every answer saved more than `minutes` ago whose ticket is missing, ready or
 * waiting. A claimed or done ticket counts as a crew on it. Served by bars-engine, never read from main.
 */
export type Why = 'no ticket' | 'not picked' | 'lane dry' | 'worker gave up'

export interface UnworkedTicket { sourceKey: string; state: string; lane: string; lanes: string[] }
export interface Unworked { row: string; answer: string; savedAt: string; why: Why }

export function unworkedFrom(answers: SavedAnswer[], tickets: UnworkedTicket[], dry: Set<string>,
                             now: Date, minutes: number): Unworked[] {
  const byKey = new Map(tickets.map(t => [t.sourceKey, t]))
  const cutoff = now.getTime() - minutes * 60_000
  const out: Unworked[] = []
  for (const a of answers) {
    if (+a.savedAt > cutoff) continue
    const t = byKey.get(a.draft.sourceKey)
    let why: Why | null = null
    if (!t) why = 'no ticket'
    else if (t.state === 'failed') why = 'worker gave up'
    else if (t.state === 'held') why = 'not picked'
    else if (t.state === 'ready') {
      const order = t.lanes.slice(Math.max(0, t.lanes.indexOf(t.lane)))
      why = order.length && order.every(l => dry.has(l)) ? 'lane dry' : 'not picked'
    }
    if (why) out.push({ row: a.docId, answer: a.draft.basis.label || a.draft.basis.answer, savedAt: a.savedAt.toISOString(), why })
  }
  return out.sort((x, y) => x.savedAt.localeCompare(y.savedAt))
}

export async function unworkedRead(db: PrismaClient, minutes: number, now = new Date()) {
  const answers = await recentAnswers(db, now)
  const tickets = await db.workTicket.findMany({ where: { sourceKey: { in: answers.map(a => a.draft.sourceKey) } },
    select: { sourceKey: true, state: true, lane: true, lanes: true } })
  const lanes = await db.workLane.findMany({ where: { dry: true }, select: { lane: true, dryUntil: true } })
  const dry = new Set(lanes.filter(l => !l.dryUntil || l.dryUntil > now).map(l => l.lane))
  return { asOf: now.toISOString(), unworked: unworkedFrom(answers, tickets, dry, now, minutes) }
}
