import type { PrismaClient } from '@prisma/client'
import { latestDoc } from '@/lib/board/store'
import { pushTicket } from './queue'
import { ticketFromAnswer, type AnswerDoc, type RowDoc } from './ticket'

/**
 * Push from the board: his answer to a council question becomes a ticket in the default lanes as it is saved, so the
 * work never waits on board-pull or a merge (homeport). The save stands even when this fails; the gate routine on main
 * still finds the answer.
 */
export async function ticketFromSave(db: PrismaClient, board: string, collection: string, docId: string,
                                     doc: Record<string, unknown>) {
  if (board !== 'council' || collection !== 'questions') return null
  try {
    const row = (await latestDoc(board, 'rows', docId)) as RowDoc | null
    const draft = ticketFromAnswer(board, collection, docId, doc as AnswerDoc, row)
    if (!draft) return null
    const r = await pushTicket(db, draft)
    return { id: r.ticket.id, lane: r.ticket.lane, created: r.created }
  } catch (e) {
    console.error('[work] ticket from save failed', docId, e)
    return null
  }
}
