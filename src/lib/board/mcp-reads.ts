import 'server-only'
import { db } from '@/lib/db'
import { latestDoc } from '@/lib/board/store'
import { answerOf, type AnswerDoc, type RowDoc } from '@/lib/work/ticket'

/**
 * The board MCP's two read-only views of his answers: read_answers (what he said to each row, and when) and list_open
 * (what still waits on him, and what waits on a lane). Both read the store, never main's copy.
 */

export interface AnswerRead {
  id: string
  state: 'answered' | 'open' | 'unknown id'
  choice?: string
  label?: string
  steer?: string
  deferred?: boolean
  savedAt?: string
}

type Opt = { v?: string; label?: string }

/** The option labels of a chosen answer, "A. Yes (recommended)" read as "Yes". */
export function labelsOf(row: RowDoc | null, answer: string): string {
  const opts = new Map(((row?.options ?? []) as Opt[]).map(o => [o.v, o.label ?? o.v ?? '']))
  return answer.split(',').map(a => a.trim()).filter(Boolean)
    .map(a => (opts.get(a) ?? a).replace(' (recommended)', '').replace(/^[A-Z]\. /, '')).join(' and ')
}

/** Pure: one id's answer from its latest `questions` save, its row, and its settled `resolved` entry. */
export function answerFrom(id: string, save: (AnswerDoc & { deferred?: boolean }) | null, row: RowDoc | null,
                           settled: Record<string, unknown> | null): AnswerRead {
  const choice = save ? answerOf(save) : ''
  const steer = (save?.steer ?? '').trim()
  if (save && (choice || steer || save.deferred)) {
    return {
      id, state: 'answered', choice, label: choice ? labelsOf(row, choice) : save.deferred ? 'Later' : 'Steer only',
      ...(steer ? { steer } : {}), ...(save.deferred ? { deferred: true } : {}),
      ...(save.savedAt ? { savedAt: save.savedAt } : {}),
    }
  }
  // Answers settled before the store kept saves live only in `resolved/questions--<id>`.
  if (settled && typeof settled.decision === 'string') {
    return {
      id, state: 'answered', choice: settled.decision, label: String(settled.label ?? ''),
      ...(typeof settled.steer === 'string' && settled.steer ? { steer: settled.steer } : {}),
      ...(typeof settled.saved_at === 'string' ? { savedAt: settled.saved_at } : {}),
    }
  }
  return { id, state: row ? 'open' : 'unknown id' }
}

export async function readAnswers(ids: string[]): Promise<AnswerRead[]> {
  return Promise.all(ids.map(async (id) => {
    const [save, row, settled] = await Promise.all([
      latestDoc('council', 'questions', id), latestDoc('council', 'rows', id), latestDoc('council', 'resolved', `questions--${id}`),
    ])
    return answerFrom(id, save as never, row as RowDoc | null, settled)
  }))
}

interface Head {
  collection: string
  doc_id: string
  kind: string | null
  q: string | null
  name: string | null
  choice: string | null
  choices: unknown
  steer: string | null
  deferred: string | null
  rounds: unknown
  saved_at: string | null
  received_at: Date
}

export interface OpenQuestion { id: string; q: string; kind: string; postedAt: string }
export interface OpenTurn { battle: string; name: string; round: number; open: string[] }
export interface ReadyTicket { sourceKey: string; title: string; brief: string; owner: string; lanes: string[]; createdAt: string }

const BRIEF_CHARS = 600
const PER_LANE = 10

/** Pure: which rows are open questions and which battles have an open turn, from the latest head of each document. */
export function openFrom(heads: Head[], limit: number) {
  const saved = new Map<string, Head>()
  const rows = new Map<string, Head>()
  for (const h of heads) (h.collection === 'questions' ? saved : rows).set(h.doc_id, h)
  const answered = (id: string) => {
    const s = saved.get(id)
    if (!s) return false
    const many = Array.isArray(s.choices) ? s.choices.filter(Boolean) : []
    return !!(s.choice || many.length || (s.steer ?? '').trim() || s.deferred === 'true')
  }
  const questions: OpenQuestion[] = []
  for (const h of rows.values()) {
    if (h.kind !== 'questions' || answered(h.doc_id)) continue
    questions.push({ id: h.doc_id, q: (h.q ?? '').slice(0, 300), kind: h.kind, postedAt: h.received_at.toISOString() })
  }
  questions.sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  const turns: OpenTurn[] = []
  for (const h of heads) {
    if (!Array.isArray(h.rounds) || !(h.kind === 'battles' || h.collection === 'battles')) continue
    for (const r of h.rounds as { n?: number; questions?: unknown }[]) {
      const open = (Array.isArray(r.questions) ? r.questions : []).filter((q): q is string => typeof q === 'string' && !answered(q))
      if (open.length) { turns.push({ battle: h.doc_id, name: h.name ?? h.doc_id, round: r.n ?? 0, open }); break }
    }
  }
  return { totalQuestions: questions.length, questions: questions.slice(0, limit), battleTurns: turns.slice(0, limit) }
}

export async function listOpen(limit: number) {
  const heads = await db.$queryRaw<Head[]>`
    SELECT DISTINCT ON (collection, doc_id) collection, doc_id,
      data->>'kind' AS kind, data->>'q' AS q, data->>'name' AS name,
      data->>'choice' AS choice, data->'choices' AS choices, data->>'steer' AS steer, data->>'deferred' AS deferred,
      CASE WHEN data->>'kind' = 'battles' OR collection = 'battles' THEN data->'rounds' END AS rounds,
      data->>'savedAt' AS saved_at, received_at
    FROM board_saves
    WHERE board = 'council' AND collection IN ('rows', 'questions', 'battles')
    ORDER BY collection, doc_id, received_at DESC, id DESC`
  const ready = await db.workTicket.findMany({
    where: { state: 'ready' }, orderBy: { createdAt: 'asc' },
    select: { sourceKey: true, title: true, brief: true, lane: true, lanes: true, createdAt: true },
  })
  const lanes: Record<string, { count: number; tickets: ReadyTicket[] }> = {}
  for (const t of ready) {
    const l = (lanes[t.lane] ??= { count: 0, tickets: [] })
    l.count++
    if (l.tickets.length < PER_LANE) {
      l.tickets.push({
        sourceKey: t.sourceKey, title: t.title, brief: t.brief.length > BRIEF_CHARS ? t.brief.slice(0, BRIEF_CHARS) + '…' : t.brief,
        owner: t.lane, lanes: t.lanes, createdAt: t.createdAt.toISOString(),
      })
    }
  }
  return { board: 'council', asOf: new Date().toISOString(), ...openFrom(heads, limit), readyTickets: lanes }
}
