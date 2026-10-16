/**
 * The board-save contract, mirrored from six-faces-council schema/board-save.schema.json. Both repos check the same
 * fixtures (fixtures/board-saves here, tests/fixtures/board-saves there), so a change to one without the other fails
 * a test. No AJV dependency: the schema is small and this mirror is the readable form of it.
 */
export const BOARDS = ['nonprofit', 'council'] as const
export const COLLECTIONS = [
  'positions', 'questions', 'terms', 'causes', 'steer', 'steps', 'blockers', 'picks',
  'morning', 'ttv', 'lists', 'contacts', 'shows', 'pickup',
] as const
/** Collections board/pull.py reads. A save to any other (contacts, shows, lists, pickup) is board state only and is
 * born recorded, so it never counts as stale. */
export const RECORD_KINDS = new Set<string>([
  'positions', 'questions', 'terms', 'causes', 'steer', 'steps', 'blockers', 'picks', 'morning', 'ttv',
])
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
