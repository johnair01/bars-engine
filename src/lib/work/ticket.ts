import { createHash } from 'crypto'
import { cleanLanes, DEFAULT_LANES, type Lane } from './lanes'

/** The brief an answer runs: text, a list of steps, or a mapping keyed by answer. A mapping used to be stringified, so
 * a lane read `[object Object]` where its brief goes (council position bf-card-brief-lands-object-object, 2026-11-16). */
type ThenValue = string | string[] | Record<string, string | string[]>

/** A board row as sessions post it (rows collection): a question with options; any option, or the row, may carry
 * `then` (the brief a worker runs on that answer) and the row may carry `lanes`. */
export interface RowDoc {
  q?: string
  options?: { v?: string; label?: string; then?: ThenValue }[]
  then?: ThenValue
  lanes?: string[]
  /** The Council Board card riding on the row (Board v2); only its hold and face matter to a ticket. */
  card?: { project?: string; wildcard?: { branch?: string } | null; hold?: { text?: string; at?: string } | null; front?: { next_step?: string } } | null
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
  /** 'held' makes the ticket rest until an unhold move; default ready. */
  state?: 'ready' | 'held'
}

const COUNCIL = 'wendell-britt/six-faces-council'

/** A row's `then` as the text a worker reads: a string as it stands, a list one step per line, a mapping by the
 * chosen answer's key. An answer no key holds gives '' and the caller falls back to the gate line. */
export function thenText(value: ThenValue | null | undefined, answer = ''): string {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(v => v.trim()).filter(Boolean).join('\n')
  return thenText(answer ? value[answer] : undefined)
}

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
  const carried = thenText(picked?.then, answer) || thenText(row?.then, answer)
  const brief = carried
    ? `${said}\n\n${carried}`
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
  /** A look on Your eyes: his tap (`charge`), his note and when he gave them. */
  look?: boolean
  list?: string
  charge?: string
  note?: string
  noteAt?: string
  doneAt?: string
  sealed?: string
}

/** The five taps of a "not yet" (council board/charge.py): what he felt, and the move the next round takes. */
export const CHARGE_MOVES: Record<string, { felt: string; move: string; how: string }> = {
  fire: { felt: 'still wrong', move: 'proof', how: 'come back only with a hosted preview at the exact state, before and after, or a walkthrough; the report lists what is not evidence' },
  metal: { felt: "can't tell why", move: 'four theories', how: 'write four theories, check all four, report which held, then build' },
  wood: { felt: 'close, let me play', move: 'spread', how: 'many variations on one combine page, not one more round' },
  water: { felt: 'we lost something', move: 'chronicle', how: 'recover the keep list from earlier rounds, threads and git, and build from it' },
  earth: { felt: "doesn't move me", move: 'compost', how: 'the line stops and its parts go to compost; no new round' },
}

/** A "not yet" older than this when it is saved is a resave of old work, not a fresh answer, so it makes no ticket. */
export const NOT_YET_FRESH_MS = 24 * 60 * 60 * 1000

const stepTitle = (d: StepDoc, id: string) => (d.do || d.title || d.text || d.name || id).replace(/\s+/g, ' ').trim()

/**
 * The ticket a card sent to a face makes (`sdm-shaman-route`): a `grow` with no `grown[]` entry at or after `grow.at`
 * is a card the face has not read yet. The key holds the step id and `grow.at`, so a resave never makes two and a
 * second hand-off of the same card (a later `at`) makes a new one. Null when the card holds nothing to read.
 */
export function ticketFromStep(board: string, collection: string, docId: string, doc: StepDoc,
                               now = new Date()): TicketDraft | null {
  const g = doc.grow
  if (board !== 'council' || collection !== 'steps') return null
  if (!g || typeof g !== 'object') return ticketFromNotYet(docId, doc, now)
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

/** His saved Claude Takes It pull on a card (positions collection): `move` is the card move, `hold` the hold line. */
export interface LeverDoc {
  move?: string
  savedAt?: string
  hold?: { text?: string; at?: string } | null
}

/**
 * The ticket a Claude Takes It pull makes (Board v2 part 2, slice 1b): the lever saves `positions/<id>` with
 * `move: claude_takes_it`. The ticket works the card, and the read receipt comes first. A hold line, on the save or on
 * the rows-store card, makes the ticket `held`, so it waits until an unhold. Null for any other save.
 */
export function ticketFromLever(board: string, collection: string, docId: string, doc: LeverDoc, row: RowDoc | null): TicketDraft | null {
  if (board !== 'council' || collection !== 'positions' || doc.move !== 'claude_takes_it') return null
  const hold = (doc.hold ?? row?.card?.hold) as { text?: string } | null | undefined
  const held = !!hold && typeof hold === 'object'
  const step = (row?.card?.front?.next_step ?? '').trim()
  const q = (row?.q ?? '').trim()
  const name = step || q || `card ${docId}`
  const at = doc.savedAt ?? ''
  const brief = `Wendell pulled Claude Takes It on the card ${docId}${row?.card?.project ? ` (${row.card.project})` : ''}`
    + (step ? `: "${step}"` : '') + `.\n\nIn ${COUNCIL}, this ticket works the card. Read it live with python3 board/read.py --live, `
    + `write the read receipt first (python3 board/receipt.py write ${docId} --read <files> --acceptance "..." --standard "..."), `
    + `then work it; python3 board/work.py claim prints the line too. A card with no receipt goes back without review. `
    + `No other thread takes ${docId} while you hold this ticket.`
    + (row?.card?.wildcard?.branch ? `\n\nThis card is a wildcard: build it on ${row.card.wildcard.branch}, apart from the main card, and it never gates the main card's merge.` : '')
    + (held ? `\n\nThe card is on hold: "${(hold?.text ?? '').trim()}". This ticket waits until the hold is lifted.` : '')
  return {
    sourceKey: `${board}/${collection}/${docId}@lever:${at}`,
    title: name.length > 90 ? name.slice(0, 89) + '…' : name,
    brief,
    basis: { rows: [docId], answer: 'claude_takes_it', label: 'Claude Takes It', steer: '', savedAt: at },
    lanes: row?.lanes ? cleanLanes(row.lanes) : ['claude'],
    ...(held ? { state: 'held' as const } : {}),
  }
}

/**
 * The ticket a "not yet" on a look makes (self-restock map M3, 2026-11-25). A look on Your eyes saved with a charge
 * tap and no seal is his redirect: the next round of that look, built from his words. Before this, a "not yet" on a
 * step card made no ticket, so his note waited for a board read to find it. His note travels unaltered and is a
 * fail-only check the next round must pass. Only a fresh save counts (NOT_YET_FRESH_MS), so a resave of old steps
 * never refills the queue; the key holds the note's time, so a resave of the same note never makes two.
 */
export function ticketFromNotYet(docId: string, doc: StepDoc, now = new Date()): TicketDraft | null {
  const charge = (doc.charge ?? '').trim()
  const move = CHARGE_MOVES[charge]
  if (!doc.look || !move || doc.sealed || charge === 'earth') return null
  const at = String(doc.noteAt ?? doc.doneAt ?? '')
  const t = Date.parse(at)
  if (!at || Number.isNaN(t) || now.getTime() - t > NOT_YET_FRESH_MS) return null
  const note = (doc.note ?? '').trim()
  const card = stepTitle(doc, docId)
  const title = `Next round after your not yet: ${card}`
  const brief = `Wendell answered the look "${card}" (steps/${docId}${doc.list ? `, strand ${doc.list}` : ''}) with "not yet, ${charge} (${move.felt})"`
    + (note ? `, and the note, in his words: "${note}"` : '') + `.\n\nThe next round's move is ${move.move}: ${move.how}. `
    + `His note is a check that can only fail the round: the next look does not post until it answers every point in it. `
    + `In ${COUNCIL}, read the card live with GET /api/board/session-writes?ids=steps/${docId}, write the read receipt, `
    + `run python3 council/tools/preflight.py --draw "<subject>", build, run python3 council/tools/critic.py <earlier still> <new still>`
    + `${doc.list ? ` --strand ${doc.list}` : ''}, and post the next look with supersedes naming ${docId}. `
    + `If a newer look on this strand already answers the note, close this ticket as superseded and name that look.`
  return {
    sourceKey: `council/steps/${docId}@notyet:${at}`,
    title: title.length > 90 ? title.slice(0, 89) + '…' : title,
    brief,
    basis: { rows: [docId], answer: `notyet:${charge}`, label: title, steer: note, savedAt: at },
    lanes: ['claude'],
  }
}
