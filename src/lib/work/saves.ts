import type { PrismaClient } from '@prisma/client'
import { ticketFromAnswer, ticketFromStep, type AnswerDoc, type RowDoc, type StepDoc, type TicketDraft } from './ticket'

/**
 * His saved answers as the work queue reads them (homeport level 2, council .specify/specs/homeport-return/). A save
 * that made no ticket (a save before the push existed, or a push that failed, which the save survives by design) is
 * found here, so the sweep can make the ticket and the unworked read can name the answer.
 */
export const SWEEP_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export interface SavedDoc { collection: string; docId: string; data: Record<string, unknown>; receivedAt: Date }

export interface SavedAnswer {
  collection: 'questions' | 'steps'
  docId: string
  /** When he saved it: the doc's own savedAt when it is a date, else when the store received it. */
  savedAt: Date
  draft: TicketDraft
}

function savedAtOf(s: SavedDoc): Date {
  const own = typeof s.data.savedAt === 'string' ? new Date(s.data.savedAt) : null
  return own && !isNaN(+own) ? own : s.receivedAt
}

/** The answers behind the latest saves, as tickets would be drafted: the same functions ticketFromSave uses, so a key
 * made here is the key a live save would have made. Saves that hold no answer and no hand-off make nothing. */
export function answersFrom(saves: SavedDoc[], rows: Map<string, RowDoc>): SavedAnswer[] {
  const out: SavedAnswer[] = []
  for (const s of saves) {
    if (s.collection === 'questions') {
      const draft = ticketFromAnswer('council', 'questions', s.docId, s.data as AnswerDoc, rows.get(s.docId) ?? null)
      if (draft) out.push({ collection: 'questions', docId: s.docId, savedAt: savedAtOf(s), draft })
    } else if (s.collection === 'steps') {
      const draft = ticketFromStep('council', 'steps', s.docId, s.data as StepDoc)
      if (draft) out.push({ collection: 'steps', docId: s.docId, savedAt: savedAtOf(s), draft })
    }
  }
  return out.sort((a, b) => +b.savedAt - +a.savedAt)
}

/** Every council answer and every card sent in the last `days` days, newest save per document. */
export async function recentAnswers(db: PrismaClient, now = new Date(), days = SWEEP_DAYS): Promise<SavedAnswer[]> {
  const since = new Date(now.getTime() - days * DAY_MS)
  const saves = await db.boardSave.findMany({
    where: { board: 'council', collection: { in: ['questions', 'steps'] }, receivedAt: { gt: since } },
    orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    distinct: ['collection', 'docId'],
    select: { collection: true, docId: true, data: true, receivedAt: true },
  })
  const docs: SavedDoc[] = saves.map(s => ({ collection: s.collection, docId: s.docId, data: (s.data ?? {}) as Record<string, unknown>, receivedAt: s.receivedAt }))
  const ids = docs.filter(d => d.collection === 'questions').map(d => d.docId)
  const rowSaves = ids.length ? await db.boardSave.findMany({
    where: { board: 'council', collection: 'rows', docId: { in: ids } },
    orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], distinct: ['docId'],
    select: { docId: true, data: true },
  }) : []
  const rows = new Map(rowSaves.map(r => [r.docId, r.data as RowDoc]))
  return answersFrom(docs, rows)
}
