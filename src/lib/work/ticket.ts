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
    : `${said}\n\nIn ${COUNCIL}, claim the gate first: python3 board/gates.py ${docId} --claim "<this thread's title>" --push `
      + `(if it says "already claimed", another thread has it: release nothing, call done with that line as the result). `
      + `Then follow the line python3 board/gates.py ${docId} --line prints. His answer above is the ruling; `
      + `board-pull lands it on main within fifteen minutes, so do not wait for it to start reading.`
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
