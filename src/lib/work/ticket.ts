import { createHash } from 'crypto'
import { cleanLanes, DEFAULT_LANES, type Lane } from './lanes'

/** A board row as sessions post it (rows collection): a question with options; any option, or the row, may carry
 * `then` (the brief a worker runs on that answer) and the row may carry `lanes`. */
export interface RowDoc {
  q?: string
  options?: { v?: string; label?: string; then?: string }[]
  then?: string
  lanes?: string[]
}

/** His saved answer to a council question, as the board page saves it. */
export interface AnswerDoc {
  choice?: string
  choices?: string[]
  steer?: string
  savedAt?: string
}

export interface TicketDraft {
  sourceKey: string
  title: string
  brief: string
  basis: { rows: string[]; answer: string; label: string; steer: string; savedAt: string }
  lanes: Lane[]
}

const COUNCIL = 'wendell-britt/six-faces-council'

/** What he chose, as board/pull.py reads it: several choices joined by commas, else the one choice, else ''. */
export function answerOf(doc: AnswerDoc): string {
  const many = (doc.choices ?? []).filter(Boolean)
  return many.length ? many.join(', ') : (doc.choice ?? '')
}

function labelOf(row: RowDoc | null, answer: string): string {
  const opts = new Map((row?.options ?? []).map(o => [o.v, o.label ?? o.v ?? '']))
  return answer.split(',').map(a => a.trim()).filter(Boolean)
    .map(a => (opts.get(a) ?? a).replace(' (recommended)', '').replace(/^[A-Z]\. /, '')).join(' and ')
}

/**
 * The ticket an answer sends (`wq-who-routes`: by itself, into the default lanes), or null when the save holds no
 * answer and no steer. The brief is the chosen option's `then`, else the row's `then`, else the gate line: the
 * council's callsheet that waits on this id says what runs next (board/gates.py).
 */
export function ticketFromAnswer(board: string, collection: string, docId: string, doc: AnswerDoc,
                                 row: RowDoc | null): TicketDraft | null {
  const answer = answerOf(doc)
  const steer = (doc.steer ?? '').trim()
  if (!answer && !steer) return null
  const label = answer ? labelOf(row, answer) : 'Steer only'
  const picked = (row?.options ?? []).find(o => o.v && o.v === answer)
  const said = `Wendell answered ${docId} on the Council Board: ${label}` + (steer ? `, with the note: "${steer}"` : '') + '.'
  const brief = picked?.then || row?.then
    ? `${said}\n\n${picked?.then || row?.then}`
    : `${said}\n\nIn ${COUNCIL}, this ticket is the gate's claim: no other thread takes ${docId} while you hold it, `
      + `and nothing is claimed on main. Follow the line python3 board/gates.py ${docId} --line --live prints. His answer `
      + `above is the ruling and main may not have it yet; read the board with python3 board/read.py --live, never wait `
      + `for a board-pull run.`
  const key = answer + (steer ? '+' + createHash('sha1').update(steer).digest('hex').slice(0, 8) : '')
  const q = (row?.q ?? '').trim()
  return {
    sourceKey: `${board}/${collection}/${docId}@${key}`,
    title: q ? (q.length > 90 ? q.slice(0, 89) + '…' : q) : `His answer on ${docId}`,
    brief,
    basis: { rows: [docId], answer, label, steer, savedAt: doc.savedAt ?? '' },
    lanes: row?.lanes ? cleanLanes(row.lanes) : [...DEFAULT_LANES],
  }
}

/** A card on Your steps (steps collection) as the board saves it: `grow` is the hand-off Wendell made (Grow Up, Call
 * all six, Take it to the Shaman) and `grown[]` is the record of the faces' readings, written back by the read. */
export interface StepDoc {
  /** The card's words: Your steps saves them as `do` (board/template.html stSteps). */
  do?: string
  title?: string
  text?: string
  name?: string
  grow?: { kind?: string; face?: string; text?: string; at?: string } | null
  grown?: { at?: string }[]
}

const stepTitle = (d: StepDoc, id: string) => (d.do || d.title || d.text || d.name || id).replace(/\s+/g, ' ').trim()

/**
 * The ticket a card sent to a face makes (`sdm-shaman-route`): a `grow` with no `grown[]` entry at or after `grow.at`
 * is a card the face has not read yet. The key holds the step id and `grow.at`, so a resave never makes two and a
 * second hand-off of the same card (a later `at`) makes a new one. Null when the card holds nothing to read.
 */
export function ticketFromStep(board: string, collection: string, docId: string, doc: StepDoc): TicketDraft | null {
  const g = doc.grow
  if (board !== 'council' || collection !== 'steps' || !g || typeof g !== 'object') return null
  const at = String(g.at ?? '')
  if (at && (doc.grown ?? []).some(r => r?.at && r.at >= at)) return null
  const face = (g.face ?? '').trim()
  const kind = g.kind === 'council' ? 'council' : g.kind === 'fit' || (!g.kind && !face) ? 'fit' : 'grow'
  const who = kind === 'council' ? 'Council' : face || 'Face'
  const card = stepTitle(doc, docId)
  const title = kind === 'council' ? `Council read: ${card}` : kind === 'fit' ? `${who} read: ${card}` : `${who} intake: ${card}`
  const note = (g.text ?? '').trim()
  const brief = `Wendell sent a card on Your steps to ${kind === 'council' ? 'the whole council' : `the ${who}`}: "${card}"`
    + (note ? `, with the note: "${note}"` : '') + `.\n\nIn ${COUNCIL}, read the card live with GET /api/board/session-writes?ids=steps/${docId}, `
    + `run the ${kind === 'council' ? 'six faces' : `${who}'s`} intake from council/faces.yaml and the six-faces skill, and write back on that step: `
    + `level 1, one grown[] entry {face, reading, next, at} where next is a verb-first first step he can start, and grow: null. `
    + `No other thread takes steps/${docId} while you hold this ticket.`
  return {
    sourceKey: `${board}/${collection}/${docId}@grow:${at || createHash('sha1').update(note + who).digest('hex').slice(0, 8)}`,
    title: title.length > 90 ? title.slice(0, 89) + '…' : title,
    brief,
    basis: { rows: [docId], answer: `grow:${kind}:${who}`, label: title, steer: note, savedAt: at },
    lanes: ['claude'],
  }
}
