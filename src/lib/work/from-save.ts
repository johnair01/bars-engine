import type { PrismaClient } from '@prisma/client'
import { latestDoc } from '@/lib/board/store'
import { pushTicket } from './queue'
import { ticketFromAnswer, ticketFromLever, ticketFromStep, type AnswerDoc, type LeverDoc, type RowDoc, type StepDoc } from './ticket'

/**
 * Push from the board: his answer to a council question becomes a ticket in the default lanes as it is saved, so the
 * work never waits on board-pull or a merge (homeport). The save stands even when this fails; the gate routine on main
 * still finds the answer.
 */
export async function ticketFromSave(db: PrismaClient, board: string, collection: string, docId: string,
                                     doc: Record<string, unknown>) {
  if (board !== 'council' || (collection !== 'questions' && collection !== 'steps' && collection !== 'positions')) return null
  try {
    // A card he sent to a face (Grow Up, Take it to the Shaman) is read by Claude as an answer is: same lane, same wake.
    const row = collection === 'steps' ? null : (await latestDoc(board, 'rows', docId)) as RowDoc | null
    const draft = collection === 'steps'
      ? ticketFromStep(board, collection, docId, doc as StepDoc)
      : collection === 'positions'
        ? ticketFromLever(board, collection, docId, doc as LeverDoc, row)
        : ticketFromAnswer(board, collection, docId, doc as AnswerDoc, row)
    if (!draft) return null
    const r = await pushTicket(db, draft)
    return { id: r.ticket.id, lane: r.ticket.lane, state: r.ticket.state, created: r.created }
  } catch (e) {
    console.error('[work] ticket from save failed', docId, e)
    return null
  }
}
