import 'server-only'
import { db } from '@/lib/db'
import { latestDoc, latestDocs } from '@/lib/board/store'
import { merge, recordedAt, LISTS, type Resolved } from '@/lib/board/data'
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
  body: string | null
  decision: string | null
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
  for (const h of heads) if (h.collection === 'questions') saved.set(h.doc_id, h)
    else if (h.collection === 'rows') rows.set(h.doc_id, h)
  // A row the record settled (a `resolved` doc, or a `records` file named resolved/questions/<id>) is not open either,
  // the page leaves it off Open; a deferred one comes back, so it stays.
  const settled = new Set<string>()
  for (const h of heads) {
    if (h.collection === 'resolved' && h.doc_id.startsWith('questions--') && h.decision !== 'deferred') settled.add(h.doc_id.slice('questions--'.length))
    if (h.collection === 'records' && h.kind === 'resolved' && h.name?.startsWith('questions/')) {
      let deferred = false
      try { deferred = JSON.parse(h.body ?? '{}').decision === 'deferred' } catch { /* settled */ }
      if (!deferred) settled.add(h.name.slice('questions/'.length))
    }
  }
  const answered = (id: string) => {
    if (settled.has(id)) return true
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
      data->>'decision' AS decision,
      CASE WHEN collection = 'records' THEN data->>'body' END AS body,
      data->>'choice' AS choice, data->'choices' AS choices, data->>'steer' AS steer, data->>'deferred' AS deferred,
      CASE WHEN data->>'kind' = 'battles' OR collection = 'battles' THEN data->'rounds' END AS rounds,
      data->>'savedAt' AS saved_at, received_at
    FROM board_saves
    WHERE board = 'council' AND collection IN ('rows', 'questions', 'battles', 'resolved', 'records')
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

export interface VisibleRead {
  id: string
  visible: boolean
  where: string
  why: string
}

/**
 * Pure: for each id, whether the page will draw it and where, from the data the page's script would carry. It runs the
 * same `merge` as /board/data.js, then the page's own status rule (`status` and `qLook` in board/template.html): a save
 * later than the record is `saved`, a record alone is `recorded`, neither is `open`; a look sits on Your eyes, a card
 * inside a battle sits in the battle, and a look a newer open look supersedes asks nothing.
 */
export function visibleFrom(docs: Parameters<typeof merge>[0], ids: string[]): VisibleRead[] {
  const out = merge(docs)
  const resolved = (out.resolved ?? {}) as Resolved
  const inBattle = new Set<string>()
  for (const b of (out.battles as Record<string, unknown>[] | undefined) ?? [])
    for (const r of (b.rounds as Record<string, unknown>[] | undefined) ?? [])
      for (const id of [...((r.questions as string[]) ?? []), ...((r.positions as string[]) ?? [])]) inBattle.add(id)
  const cards = (kind: string) => (out[kind] as Record<string, unknown>[] | undefined) ?? []
  const statusOf = (kind: string, c: Record<string, unknown>) => {
    const r = resolved[kind]?.[String(c.id)]
    if (typeof c.savedAt === 'string' && (!r || Date.parse(c.savedAt) > recordedAt(r))) return 'saved'
    return r ? 'recorded' : 'open'
  }
  const openLooks = cards('questions').filter((q) => q.look === true && statusOf('questions', q) === 'open')
  const superseded = new Set(openLooks.flatMap((q) => (Array.isArray(q.supersedes) ? (q.supersedes as string[]) : [])))
  return ids.map((id): VisibleRead => {
    const raw = docs.rows?.[id]
    if (!raw) return { id, visible: false, where: 'nowhere', why: 'No row with this id in the store, so the page has nothing to draw.' }
    const kind = typeof raw.kind === 'string' ? raw.kind : ''
    if (!(LISTS as readonly string[]).includes(kind))
      return { id, visible: false, where: 'nowhere', why: `The row's kind is "${kind}", and the page draws only ${LISTS.join(', ')}.` }
    const card = cards(kind).find((c) => c.id === id)
    if (!card) return { id, visible: false, where: 'nowhere', why: 'The record settled it, so /board/data.js leaves it out; it stays in the store.' }
    const st = statusOf(kind, card)
    if (st === 'saved') return { id, visible: false, where: 'Answered', why: `He answered it (saved ${String(card.savedAt)}), so it left Open. It is not missing.` }
    if (st === 'recorded') return { id, visible: false, where: 'Settled', why: 'The record holds a decision for it, so it is off Open.' }
    if (inBattle.has(id)) return { id, visible: true, where: 'a battle card', why: 'A battle names it, so it draws inside the battle, not on Open.' }
    if (kind === 'questions' && superseded.has(id)) return { id, visible: false, where: 'nowhere', why: 'A newer open look supersedes it.' }
    if (kind === 'questions' && card.look === true) return { id, visible: true, where: 'Your eyes', why: 'Open look; the page draws it on Your eyes.' }
    return { id, visible: true, where: 'Open', why: 'Open and not in a battle; the page draws it on Open.' }
  })
}

export async function checkVisible(ids: string[]): Promise<VisibleRead[]> {
  return visibleFrom(await latestDocs('council'), ids)
}
