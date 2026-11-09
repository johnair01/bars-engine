import { createHash } from 'crypto'
import type { PrismaClient } from '@prisma/client'
import { applyWrite, validateSave } from './save'
import { missingObjects } from './content-store'

/** What a Claude session writes to the Council Board: the Your steps lists and steps, Outreach's contacts and shows,
 * the council's rows (src/lib/board/rows.ts), and the council's records — its callsheets, passes and ledger as
 * whole documents (src/lib/board/records.ts, born recorded). His answers (positions, questions, ...) are his to
 * save, never a session's. */
export const SESSION_COLLECTIONS = new Set(['lists', 'steps', 'contacts', 'shows', 'rows', 'draws', 'records',
  'constraint'])  // the council's dated constraint read, one document a day (six-faces-council constraint-route-brief.md)
/** Collections whose session writes the board-pull Action lands on main, so they are born unrecorded: a posted row
 * waits for board-pull to put it in board_data.json and acknowledge it, and the staleness check alarms if it does not. */
export const UNRECORDED_COLLECTIONS = new Set(['rows'])

/** The picture gate (six-faces-council board/look_gate.py, Wendell 2026-11-04 18:25: "they should have failed and
 * failed loudly before they posted something that wasn't able to be seen"). A look is a row or step with `look: true`
 * or an id ending `-look-<n>`. Its card draws `still` (a step's also draws its first image file); previews are off, so
 * its pictures are all he can judge it by. Same rules as the council's gate, so a lane that skips post_rows.py is caught. */
const IMG = /\.(png|jpe?g|gif|webp)(\?|$)/i
const DATA_IMG = /^data:image\/(png|jpe?g|gif|webp);base64,/i
const BARS_ANY = /^https:\/\/bars-engine\.vercel\.app(\/|$)/i
const BARS_OK = /^https:\/\/bars-engine\.vercel\.app\/board\/(look|stills)([/?]|$)/i
const PREVIEW = /^https:\/\/(?!bars-engine\.vercel\.app\/)[^/]+\.vercel\.app(\/|$)/i
const isPicture = (u: unknown): u is string => typeof u === 'string' && (DATA_IMG.test(u) || (u.startsWith('https://') && IMG.test(u)))
export const isLook = (docId: string, data: Record<string, unknown>) => data.look === true || /-look-\d+$/.test(docId)

export function cardPicture(data: Record<string, unknown>): string {
  if (isPicture(data.still)) return data.still
  const files = Array.isArray(data.files) ? data.files : []
  for (const f of files) { const src = (f as Record<string, unknown> | null)?.src; if (isPicture(src)) return src }
  return ''
}

/** Reasons a look cannot be seen, from the document alone. */
export function lookErrors(docId: string, data: Record<string, unknown>): string[] {
  if (!isLook(docId, data)) return []
  const out: string[] = []
  if (!cardPicture(data)) out.push(`LOOK NOT POSTED: its card has no picture (\`still\` is ${data.still ? 'not a picture' : 'empty'}); `
    + 'take pictures from a local build (scripts/local/dev.sh shot) and put one in `still`')
  const href = typeof data.href === 'string' ? data.href : ''
  if (PREVIEW.test(href)) out.push(`LOOK NOT POSTED: Open it leads to a Vercel preview (${href.slice(0, 70)}), and previews are off; `
    + 'point it at the look\'s pictures (a /board/look link)')
  // A live app page shows only what has shipped, not the look (ctw-own-charge-look-1, 2026-11-04: it led to sign-in).
  else if (BARS_ANY.test(href) && !BARS_OK.test(href)) out.push(`LOOK NOT POSTED: Open it is a bars-engine app page (${href.slice(0, 70)}), `
    + 'which shows only what has shipped; make Open it the look\'s /board/look picture page and put the live page in `href2`')
  else if (/^https:\/\/bars-engine\.vercel\.app\/board\/look([/?]|$)/i.test(href) && !/[?&]i=/.test(href))
    out.push(`LOOK NOT POSTED: Open it is a /board/look page that names no picture (${href.slice(0, 70)}); add each picture as \`i=\``)
  return out
}

/** Does a picture outside the content store load as an image? (Pictures in the store are checked by the seal.) */
export async function pictureLoads(url: string): Promise<boolean> {
  if (url.startsWith('data:')) return true
  try {
    const r = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15000) })
    return r.status === 200 && (r.headers.get('content-type') ?? '').startsWith('image/')
  } catch { return false }
}

export type SessionDoc = { collection: string; docId: string; mode?: 'set' | 'update'; data: unknown }
export type SessionResult = { written: string[]; same: number; refused: string[] }

/** The content hashes a row names: a picture at /board/stills/sha/<sha256>.<ext>, or a look page's `i=sha/<sha256>...`
 * (escaped or not). board/post_rows.py pushes each one before it posts the row. */
const HOLD_URL = /\/board\/stills\/sha\/[0-9a-f]{64}\./i
const HOLD = /sha(?:\/|%2F)([0-9a-f]{64})\.(?:jpe?g|png|gif|webp)/gi
export function holdOf(data: unknown): string[] {
  return [...new Set([...canonical(data).matchAll(HOLD)].map(m => m[1].toLowerCase()))]
}

/** JSON with keys sorted at every level, so a document hashes the same here (jsonb reorders keys) and in
 * Six-faces-council board/store_write.py (json.dumps sort_keys, no spaces). */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (v && typeof v === 'object')
    return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}`
  return JSON.stringify(v)
}
export const docHash = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex').slice(0, 16)

/**
 * A session's write to board=council (board-home step 5). `update` (the default) merges top-level fields onto the
 * latest document, so a session that rewrites a step's text keeps the tick, note and moves Wendell saved on the page;
 * `set` replaces; a row is always `set`. A write that changes nothing is skipped, so a rerun adds nothing. Lists, steps,
 * contacts and shows are born recorded: they are the council's own board state, not answers for board-pull to land.
 * Rows are born unrecorded, because main is their record (worklist-api, FR-002). A row naming a picture hash the
 * content store lacks is refused (`hold not aboard`).
 */
export async function sessionWrite(db: Pick<PrismaClient, 'boardSave'>, docs: SessionDoc[], dry = false,
    missing: (shas: string[]) => Promise<string[]> = missingObjects,
    loads: (url: string) => Promise<boolean> = pictureLoads): Promise<SessionResult> {
  const out: SessionResult = { written: [], same: 0, refused: [] }
  for (const { collection, docId, mode = collection === 'rows' || collection === 'records' ? 'set' : 'update', data } of docs) {
    const key = `${collection}/${docId}`
    if (!SESSION_COLLECTIONS.has(collection)) { out.refused.push(`${key}: sessions write ${[...SESSION_COLLECTIONS].join(', ')}`); continue }
    const v = validateSave({ board: 'council', collection, docId, mode, data })
    if (!v.ok) { out.refused.push(`${key}: ${v.errors.join('; ')}`); continue }
    // The seal (six-faces-council canon/mechanics/lading-seal.yaml): a row docks only with every picture it names
    // already in the content store, so he never opens a card whose frames wait on a merge.
    const hold = collection === 'rows' ? holdOf(data) : []
    const gone = hold.length ? await missing(hold) : []
    if (gone.length) {
      out.refused.push(`${key}: refused: hold not aboard (${gone.length} of ${hold.length} pictures not in the content store: `
        + `${gone.slice(0, 3).map(h => h.slice(0, 12)).join(', ')}${gone.length > 3 ? ', ...' : ''}); push them with board/post_rows.py`)
      continue
    }
    const latest = await db.boardSave.findFirst({
      where: { board: 'council', collection, docId }, orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    })
    const prev = (latest?.data as Record<string, unknown> | undefined) ?? null
    const next = applyWrite(prev, v.save)
    if (collection === 'rows' || collection === 'steps') {
      // Judged on the document as it will stand (an update merges onto the latest), so a step edit cannot strip the picture.
      const bad = lookErrors(docId, next)
      const pic = cardPicture(next)
      if (!bad.length && pic && !(collection === 'rows' && HOLD_URL.test(pic)) && !(await loads(pic)))
        bad.push(`LOOK NOT POSTED: its picture ${pic.slice(-70)} does not answer 200 as an image; push it or take it again`)
      if (bad.length && isLook(docId, next)) { out.refused.push(`${key}: ${bad.join('; ')}`); continue }
    }
    if (prev && canonical(prev) === canonical(next)) { out.same++; continue }
    out.written.push(key)
    const landed = UNRECORDED_COLLECTIONS.has(collection)
    if (!dry) await db.boardSave.create({ data: {
      board: 'council', collection, docId, data: next as object, source: 'session',
      recordedAt: landed ? null : new Date(), record: landed ? null : 'session write; not an answer',
    } })
  }
  return out
}
