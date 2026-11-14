import type { PrismaClient } from '@prisma/client'
import { pushTicket } from './queue'
import { recentAnswers, SWEEP_DAYS } from './saves'

/**
 * The sweep (homeport FR-001): every council answer and every card sent in the last seven days that has no ticket
 * gets one, by the sourceKey ticketFromSave would have used, so a second sweep creates nothing and a ticket his live
 * save already made is never doubled. `dry` lists what it would make and makes nothing.
 */
export async function sweepTickets(db: PrismaClient, opts: { dry?: boolean; now?: Date; days?: number } = {}) {
  const now = opts.now ?? new Date()
  const answers = await recentAnswers(db, now, opts.days ?? SWEEP_DAYS)
  const keys = answers.map(a => a.draft.sourceKey)
  const have = new Set((await db.workTicket.findMany({ where: { sourceKey: { in: keys } }, select: { sourceKey: true } }))
    .map(t => t.sourceKey))
  const missing = answers.filter(a => !have.has(a.draft.sourceKey))
  const made: { row: string; sourceKey: string; savedAt: string }[] = []
  for (const a of missing) {
    if (!opts.dry) await pushTicket(db, a.draft)
    made.push({ row: a.docId, sourceKey: a.draft.sourceKey, savedAt: a.savedAt.toISOString() })
  }
  return { dry: !!opts.dry, looked: answers.length, created: made.length, tickets: made }
}
