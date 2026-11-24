import type { PrismaClient } from '@prisma/client'
import { ticketFromAnswer, ticketFromStep, type AnswerDoc, type RowDoc, type StepDoc, type TicketDraft } from './ticket'

/**
 * His saved answers as the work queue reads them (homeport level 2, council .specify/specs/homeport-return/). A save
 * that made no ticket (a save before the push existed, or a push that failed, which the save survives by design) is
 * found here, so the sweep can make the ticket and the unworked read can name the answer.
 */
export const SWEEP_DAYS = 7
/**
 * Saves made before his answers pushed their own tickets (from-save.ts went live 2026-10-31 15:20 UTC) have no ticket by
 * design: the council routed them by hand on 2026-11-04. The first dry sweep on production found 100 of them, 10-28 to
 * 10-31 14:54, none after, so a sweep that reached back to them would send a hundred worked answers out again (the
 * spec's own risk). Neither the sweep nor the unworked read looks before this.
 */
export const TICKETS_LIVE = new Date('2026-10-31T15:20:00Z')
const SAVE_PAGE = 100
const ROW_CHUNK = 20
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
  const since = new Date(Math.max(now.getTime() - days * DAY_MS, TICKETS_LIVE.getTime()))
  // Prisma's `distinct` runs in memory after the fetch, so one findMany pulled every save of the window and passed the
  // data proxy's 5MB response cap (P6009, /api/work/unworked 500s from 2026-11-24). Page newest-first and keep the
  // first save seen per document: the same rows, one bounded page at a time.
  const saves: { collection: string; docId: string; data: unknown; receivedAt: Date }[] = []
  const seen = new Set<string>()
  let cursor: string | undefined
  for (;;) {
    const page = await db.boardSave.findMany({
      where: { board: 'council', collection: { in: ['questions', 'steps'] }, receivedAt: { gt: since } },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
      take: SAVE_PAGE, ...(cursor === undefined ? {} : { cursor: { id: cursor }, skip: 1 }),
      select: { id: true, collection: true, docId: true, data: true, receivedAt: true },
    })
    for (const s of page) {
      const k = `${s.collection}\u0000${s.docId}`
      if (!seen.has(k)) { seen.add(k); saves.push(s) }
    }
    if (page.length < SAVE_PAGE) break
    cursor = page[page.length - 1].id
  }
  const docs: SavedDoc[] = saves.map(s => ({ collection: s.collection, docId: s.docId, data: (s.data ?? {}) as Record<string, unknown>, receivedAt: s.receivedAt }))
  const ids = docs.filter(d => d.collection === 'questions').map(d => d.docId)
  // Same cap, same remedy: a few rows at a time, so no response holds every saved version of every row.
  const rowSaves: { docId: string; data: unknown }[] = []
  for (let i = 0; i < ids.length; i += ROW_CHUNK) {
    rowSaves.push(...await db.boardSave.findMany({
      where: { board: 'council', collection: 'rows', docId: { in: ids.slice(i, i + ROW_CHUNK) } },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], distinct: ['docId'],
      select: { docId: true, data: true },
    }))
  }
  const rows = new Map(rowSaves.map(r => [r.docId, r.data as RowDoc]))
  return answersFrom(docs, rows)
}
