import { encounterErrors } from './encounter-beats'
import { recordErrors } from './records'
import { rowErrors } from './rows'

/**
 * The board-save contract, mirrored from six-faces-council schema/board-save.schema.json. Both repos check the same
 * fixtures (fixtures/board-saves here, tests/fixtures/board-saves there), so a change to one without the other fails
 * a test. No AJV dependency: the schema is small and this mirror is the readable form of it.
 */
export const BOARDS = ['nonprofit', 'council'] as const
export const COLLECTIONS = [
  'positions', 'questions', 'terms', 'causes', 'steer', 'steps', 'blockers', 'picks',
  'morning', 'ttv', 'lists', 'contacts', 'shows', 'pickup', 'seeds', 'rows', 'stores', 'draws', 'records',
  'battles',  // one battle's record at battles/<id>, written by board/copy_write.py
  'intake',   // the intake's one run at intake/latest, written by board/copy_write.py
  'constraint',  // the council's dated constraint read, one document a day
  'resolved',  // one settled answer at <kind>--<id>, written by board/resolved_write.py
] as const
/** Collections board/pull.py reads. A save to any other (contacts, shows, lists, pickup, seeds) is board state only
 * and is born recorded, so it never counts as stale. A seeds save is recorded in bars-engine itself: it sets the task
 * aside (src/lib/tap-the-vein/board-set-aside.ts). */
export const RECORD_KINDS = new Set<string>([
  'positions', 'questions', 'terms', 'causes', 'steer', 'steps', 'blockers', 'picks', 'morning', 'ttv', 'stores', 'draws',
  'battles', 'intake',
])
/** The `board` of a request: absent means the nonprofit board; anything not in BOARDS is null. */
export function parseBoard(v: unknown): (typeof BOARDS)[number] | null {
  if (v === undefined || v === null || v === '') return 'nonprofit'
  return BOARDS.includes(v as never) ? (v as (typeof BOARDS)[number]) : null
}
export const MAX_SAVE_BYTES = 256 * 1024

export type BoardSaveInput = {
  board: (typeof BOARDS)[number]
  collection: (typeof COLLECTIONS)[number]
  docId: string
  mode?: 'set' | 'update'
  data: Record<string, unknown>
}

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const DOC_ID = /^[^/\\\u0000-\u001f]+$/
const KEYS = new Set(['board', 'collection', 'docId', 'mode', 'data'])

const str = (v: unknown): v is string => typeof v === 'string'
const nonBlank = (v: unknown) => str(v) && /\S/.test(v)
const decided = (d: Record<string, unknown>) => d.deferred === true || nonBlank(d.steer)

export function validateSave(input: unknown): { ok: true; save: BoardSaveInput } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['save must be an object'] }
  const s = input as Record<string, unknown>
  for (const k of Object.keys(s)) if (!KEYS.has(k)) errors.push(`unknown field ${k}`)
  if (!BOARDS.includes(s.board as never)) errors.push('board must be nonprofit or council')
  if (!COLLECTIONS.includes(s.collection as never)) errors.push('unknown collection')
  if (!str(s.docId) || !s.docId.length || s.docId.length > 200 || !DOC_ID.test(s.docId)) errors.push('bad docId')
  if (s.mode !== undefined && s.mode !== 'set' && s.mode !== 'update') errors.push('mode must be set or update')
  const d = s.data
  if (!d || typeof d !== 'object' || Array.isArray(d)) errors.push('data must be an object')
  else if (Object.keys(d).length > 200) errors.push('data has too many fields')
  if (errors.length) return { ok: false, errors }

  const data = d as Record<string, unknown>
  if (s.collection === 'rows') {
    if (s.board !== 'council') errors.push('rows are the Council Board\'s')
    if (s.mode === 'update') errors.push('a row is posted whole: mode set (a revision is a new id)')
    errors.push(...rowErrors(data))
  }
  if (s.collection === 'records') { // the council's record-only files, stored not mirrored (store-only FR-001)
    if (s.board !== 'council') errors.push('records are the Council Board\'s')
    if (s.mode === 'update') errors.push('a record is posted whole: mode set (a revision is a new docId)')
    errors.push(...recordErrors(data))
  }
  if (s.mode !== 'update') {
    const c = s.collection as string
    if (['positions', 'questions', 'terms', 'causes', 'picks', 'blockers'].includes(c) && !(str(data.savedAt) && ISO.test(data.savedAt)))
      errors.push('data.savedAt must be an ISO UTC time')
    if (c === 'positions' && !(['stands', 'overrule', 'retire'].includes(data.status as string) || decided(data)))
      errors.push('a position needs status stands, overrule or retire, a deferral or a steer')
    if (c === 'questions' && !((str(data.choice) && data.choice.length > 0)
        || (Array.isArray(data.choices) && data.choices.length > 0 && data.choices.every(str)) || decided(data)))
      errors.push('a question needs a choice, choices, a deferral or a steer')
    if (c === 'picks' && !(nonBlank(data.text) && str(data.date) && DATE.test(data.date)))
      errors.push('a pick needs text and a date')
    if (c === 'steer') {
      if (s.docId !== 'general') errors.push('steer lives at steer/general')
      if (!str(data.text) || !(str(data.savedAt) && ISO.test(data.savedAt))) errors.push('steer needs text and savedAt')
    }
    if (c === 'seeds') {
      if (s.board !== 'council') errors.push('the seed library is the Council Board\'s')
      if (!nonBlank(data.taskId) || data.taskId !== s.docId) errors.push('a seed lives at seeds/<taskId> and names its taskId')
      if (!(str(data.savedAt) && ISO.test(data.savedAt))) errors.push('data.savedAt must be an ISO UTC time')
    }
    if (c === 'stores') { // the Stores' move: one placement of a run's thing (src/lib/studio/stores.ts)
      if (s.board !== 'council') errors.push('the Stores are the Council Board\'s')
      if (!nonBlank(data.run) || !nonBlank(data.thing) || !nonBlank(data.words)) errors.push('a placement names its run, thing and words')
      if (!['jar', 'seed', 'thread', 'husk'].includes(data.kind as string)) errors.push('a placement\'s kind is jar, seed, thread or husk')
      if (!['shelf', 'seeds', 'bell', 'compost', 'tide'].includes(data.to as string)) errors.push('a placement goes to shelf, seeds, bell, compost or tide')
      if (!(str(data.savedAt) && ISO.test(data.savedAt))) errors.push('data.savedAt must be an ISO UTC time')
    }
    if (c === 'draws') { // the draw: a project deck's top card turned up, at <deck>--<card id>
      if (s.board !== 'council') errors.push('the draws are the Council Board\'s')
      if (!nonBlank(data.deck) || !nonBlank(data.card) || !(str(data.at) && ISO.test(data.at))) errors.push('a draw names its deck, card and at')
    }
    if (c === 'resolved') { // one settled answer, the record the page's Resolved tab draws (six-faces-council board/resolved_write.py)
      if (s.board !== 'council') errors.push('the resolved entries are the Council Board\'s')
      if (!['positions', 'questions', 'terms', 'causes'].includes(data.kind as string)) errors.push('a resolved entry names its kind')
      if (!nonBlank(data.id)) errors.push('a resolved entry names its id')
      if (!(str(data.savedAt) && ISO.test(data.savedAt))) errors.push('a resolved entry needs savedAt, an ISO UTC time')
      else if (nonBlank(data.kind) && nonBlank(data.id) && s.docId !== `${data.kind}--${data.id}`)
        errors.push('a resolved entry lives at <kind>--<id>')
    }
    if (c === 'battles') { // one battle's record, its rounds and questions (six-faces-council board/copy_write.py)
      if (s.board !== 'council') errors.push('the battles are the Council Board\'s')
      if (!nonBlank(data.name)) errors.push('a battle names its name')
      if (data.id !== s.docId) errors.push('a battle lives at battles/<id> and names that id')
      // An encounter on the epiphany bridge (encounter-bridge-look-1, A): its beats and buds, checked when present.
      if (data.encounter !== undefined) errors.push(...encounterErrors(data.encounter))
      if (data.budOf !== undefined && !nonBlank(data.budOf)) errors.push('a bud battle names the battle it grew from in budOf')
    }
    if (c === 'intake') { // the intake's one run, at intake/latest
      if (s.board !== 'council') errors.push('the intake is the Council Board\'s')
      if (s.docId !== 'latest') errors.push('the intake lives at intake/latest')
      if (!(str(data.date) && DATE.test(data.date))) errors.push('the intake names its date')
      if (!Array.isArray(data.items)) errors.push('the intake carries its items')
      if (!(str(data.savedAt) && ISO.test(data.savedAt))) errors.push('data.savedAt must be an ISO UTC time')
    }
    if (c === 'morning' && s.docId === 'gather') { // the gather the page draws
      if (!(str(data.date) && DATE.test(data.date))) errors.push('the gather names its date')
      if (!(str(data.savedAt) && ISO.test(data.savedAt))) errors.push('data.savedAt must be an ISO UTC time')
    }
    if (c === 'morning' && s.docId === 'menu') {
      if (!str(data.menu) || !(str(data.savedAt) && ISO.test(data.savedAt))) errors.push('the menu needs menu and savedAt')
      else if (data.menu.includes('"rawEntry"')) errors.push('the menu carries the free write (mm-raw)')
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, save: s as unknown as BoardSaveInput }
}

/** The document after a write: set replaces, update merges top-level fields onto the latest document. */
export function applyWrite(latest: Record<string, unknown> | null, save: BoardSaveInput): Record<string, unknown> {
  return save.mode === 'update' ? { ...(latest ?? {}), ...save.data } : { ...save.data }
}
