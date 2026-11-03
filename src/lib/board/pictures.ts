/**
 * Pictures on demand (council callsheet board-store-size.md, step 4; Wendell, 2026-11-03: "We should only be pulling
 * what each page needs when it's brought up not the whole page all the time").
 *
 * Look steps carry their stills and files as `data:image` text. On 2026-11-03 those pictures were 1.96 MB of the
 * Council Board's 2.61 MB store read, and the page downloaded all of them at every load and every whole refresh, for
 * looks he was not opening. The page's reads (GET /api/board/saves, GET /api/board/changes, a save's answer) now carry
 * each picture as a link to GET /api/board/picture instead, and the browser fetches a picture only when the page draws
 * it. The database keeps the picture: the live store is the truth, and a session's read (/api/board/pull, /live) still
 * gets every document whole. A save from the page that hands a link back gets the picture put back first, so a page
 * that rewrites a whole document never swaps a picture for its own link.
 */
import { createHash } from 'node:crypto'

/** A picture smaller than this stays inline: the link would cost about as much as the picture. */
export const INLINE_BYTES = 2048
export const PICTURE_PATH = '/api/board/picture'
const DATA_IMG = /^data:image\/(png|jpe?g|gif|webp);base64,/i

export type DocRef = { board: string; collection: string; docId: string }

export const pictureHash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)

const isPicture = (v: unknown): v is string => typeof v === 'string' && v.length > INLINE_BYTES && DATA_IMG.test(v)

/** The link the page reads in place of the picture at `path` (dot-joined keys and array indexes). */
export function pictureLink(origin: string, ref: DocRef, path: string, value: string): string {
  const q = new URLSearchParams({ board: ref.board, c: ref.collection, id: ref.docId, p: path, h: pictureHash(value) })
  return `${origin}${PICTURE_PATH}?${q}`
}

/** The document as the page reads it: every large `data:image` string replaced by its link. Returns the same object
 * when it holds no picture, so a document without one costs nothing. */
export function leanDoc<T>(doc: T, origin: string, ref: DocRef): T {
  const walk = (v: unknown, path: string): unknown => {
    if (isPicture(v)) return pictureLink(origin, ref, path, v)
    if (Array.isArray(v)) { let out: unknown[] | null = null
      v.forEach((x, i) => { const y = walk(x, path ? `${path}.${i}` : String(i)); if (y !== x) (out ??= v.slice())[i] = y })
      return out ?? v }
    if (v && typeof v === 'object') { let out: Record<string, unknown> | null = null
      for (const [k, x] of Object.entries(v)) { const y = walk(x, path ? `${path}.${k}` : k); if (y !== x) (out ??= { ...v } as Record<string, unknown>)[k] = y }
      return out ?? v }
    return v
  }
  return walk(doc, '') as T
}

/** Every document of a store read, lean. */
export function leanDocs(docs: Record<string, Record<string, Record<string, unknown>>>, origin: string, board: string) {
  const out: typeof docs = {}
  for (const [collection, byId] of Object.entries(docs)) {
    const col: Record<string, Record<string, unknown>> = out[collection] = {}
    for (const [docId, d] of Object.entries(byId)) col[docId] = leanDoc(d, origin, { board, collection, docId })
  }
  return out
}

/** The value at a dot-joined path, or undefined. */
export function valueAt(doc: unknown, path: string): unknown {
  let v: unknown = doc
  for (const k of path.split('.')) { if (!v || typeof v !== 'object') return undefined; v = (v as Record<string, unknown>)[k] }
  return v
}

/** The picture a link names, read from the document it came from, or null when the document no longer holds that
 * picture there (the hash no longer matches). */
export function pictureIn(doc: unknown, path: string, hash: string): string | null {
  const v = valueAt(doc, path)
  return isPicture(v) && pictureHash(v) === hash ? v : null
}

/** Does this save carry a picture link back? Cheap text test before the latest document is read. */
export const carriesLink = (data: unknown) => JSON.stringify(data).includes(PICTURE_PATH + '?')

/** A save from the page with picture links in it: each link this board and document gave out is put back to the
 * picture it stands for, read from `latest` (the document as stored). A link whose picture is no longer there stays
 * as it is. */
export function restorePictures<T>(data: T, ref: DocRef, latest: unknown): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string' && v.includes(PICTURE_PATH + '?')) {
      let u: URL
      try { u = new URL(v, 'https://x') } catch { return v }
      const q = u.searchParams
      if (u.pathname !== PICTURE_PATH || q.get('board') !== ref.board || q.get('c') !== ref.collection || q.get('id') !== ref.docId) return v
      return pictureIn(latest, q.get('p') ?? '', q.get('h') ?? '') ?? v
    }
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(data) as T
}

/** A data URI's bytes and type, for the picture route. */
export function decodePicture(uri: string): { type: string; bytes: Buffer } | null {
  const m = /^data:(image\/(?:png|jpe?g|gif|webp));base64,(.*)$/is.exec(uri)
  return m ? { type: m[1].toLowerCase(), bytes: Buffer.from(m[2], 'base64') } : null
}

/** Where the page is served from, so a link stays on the host his sign-in cookie belongs to. */
export function originOf(req: { nextUrl?: { origin?: string } }): string {
  return req.nextUrl?.origin || 'https://bars-engine.vercel.app'
}
