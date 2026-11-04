import type { PrismaClient } from '@prisma/client'
import type { RowDoc, AnswerDoc } from './ticket'
import { answerOf } from './ticket'
import { rowOf } from './seals'

/**
 * The crew's rings (homeport FR-006, council positions af-crew-ring and af-ring-home-whole). A voyage earns one brass
 * ring when its ticket closes done and it came home whole:
 *   - it brought home a look (`basis.look`, recorded by `board/work.py done --look`) and his FIRST answer on that
 *     look is a plain yes; or
 *   - it brought home no look and no later save of his reopened its row within 7 days (so the ring is earned once
 *     those 7 days have passed quietly).
 * A ring is never taken away: this read is computed from the record and only ever grows, since a done ticket stays done
 * and the first answer on a look never changes. It carries no count; the page draws hoops, never a number.
 */
export const REOPEN_MS = 7 * 24 * 60 * 60 * 1000
const NEGATIVE = /\b(?:not yet|rethink|redo|redraw|steer|no)\b/i

/** Council board/answered.py plain_yes: his first option, no note, nothing negative in its label. */
export function plainYes(answer: AnswerDoc | null, row: RowDoc | null): boolean {
  if (!answer) return false
  const choice = answerOf(answer)
  const first = row?.options?.[0]
  if (!choice || !first?.v || choice !== first.v) return false
  if ((answer.steer ?? '').trim()) return false
  return !NEGATIVE.test(`${first.label ?? ''} ${choice}`)
}

export interface RingTicket {
  sourceKey: string
  basis: unknown
  state: string
  createdAt: Date
  doneAt: Date | null
}

export interface Ring { row: string; doneAt: string; look: string | null }

export function ringsFrom(tickets: RingTicket[], lookYes: Map<string, boolean>, now = new Date()): Ring[] {
  const out: Ring[] = []
  for (const t of tickets) {
    if (t.state !== 'done' || !t.doneAt) continue
    const row = rowOf(t)
    if (!row) continue
    const look = (t.basis as { look?: unknown } | null)?.look
    if (typeof look === 'string' && look) {
      if (lookYes.get(look)) out.push({ row, doneAt: t.doneAt.toISOString(), look })
      continue
    }
    const end = t.doneAt.getTime() + REOPEN_MS
    if (now.getTime() < end) continue
    const reopened = tickets.some(o => o !== t && rowOf(o) === row && o.sourceKey !== t.sourceKey
      && +o.createdAt > +t.doneAt! && +o.createdAt <= end)
    if (!reopened) out.push({ row, doneAt: t.doneAt.toISOString(), look: null })
  }
  return out.sort((a, b) => a.doneAt.localeCompare(b.doneAt))
}

export async function ringsRead(db: PrismaClient, now = new Date()) {
  const tickets = await db.workTicket.findMany({
    where: { sourceKey: { startsWith: 'council/questions/' } },
    select: { sourceKey: true, basis: true, state: true, createdAt: true, doneAt: true },
  })
  const looks = [...new Set(tickets.filter(t => t.state === 'done')
    .map(t => (t.basis as { look?: unknown } | null)?.look).filter((l): l is string => typeof l === 'string' && !!l))]
  const yes = new Map<string, boolean>()
  for (const look of looks) {
    // his FIRST answer on the look: the earliest save that holds an answer (the store keeps every save)
    const saves = await db.boardSave.findMany({ where: { board: 'council', collection: 'questions', docId: look },
      orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }], select: { data: true } })
    const first = saves.map(s => s.data as AnswerDoc).find(d => answerOf(d))
    const rowSave = await db.boardSave.findFirst({ where: { board: 'council', collection: 'rows', docId: look },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], select: { data: true } })
    yes.set(look, plainYes(first ?? null, (rowSave?.data ?? null) as RowDoc | null))
  }
  return { asOf: now.toISOString(), rings: ringsFrom(tickets, yes, now) }
}
