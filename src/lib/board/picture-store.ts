/**
 * Pictures for the board's MCP server (six-faces-council .specify/specs/mcp-board-server).
 *
 * A picture is stored once, under its sha256, and named by that hash: `/board/stills/sha/<sha256>.<ext>`, which
 * ../bars-engine/src/app/board/art.ts serves from the content store and the seal (src/lib/board/session-write.ts)
 * checks. A picture that belongs to a stills round also takes its repo path in the manifest, and one under a round's
 * `refs/` folder goes to the refs namespace that only the owner and a session can read.
 *
 * The art index (`art.json` beside the manifest) is a mirror, not the record: council/callsheets/stills/ART.jsonl on
 * main stays the record, and this file only lets a client with no checkout list what the server stored.
 */
import { createHash } from 'node:crypto'
import { allowedPath, backend, readObject, setEntries, storeObject, storeRefObject, type Entry } from './content-store'

export const PICTURE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

/** Vercel refuses a request body over 4.5 MB, and base64 adds a third, so one picture stays under 3 MB decoded. */
export const MAX_PICTURE_BYTES = 3 * 1024 * 1024
/** One post_rows call stores at most this much in pictures, and at most PICTURE_LIMIT of them. */
export const MAX_LIFT_BYTES = 8 * 1024 * 1024
export const PICTURE_LIMIT = 8
export const ART_KEY = 'art.json'
export const ART_LIMIT = 2000
export const PICTURE_BASE = 'https://bars-engine.vercel.app'

const DATA_IMG = /^data:(image\/(?:png|jpe?g|gif|webp));base64,([\s\S]+)$/i
const SHA = /^[0-9a-f]{64}$/
const STILLS = 'council/callsheets/stills/'

export type StoredPicture = { sha: string; type: string; size: number; url: string; round?: string; path?: string }
export type ArtEntry = StoredPicture & { at: string; maker: string }

const ext = (type: string) => PICTURE_TYPES[type] ?? 'png'
export const sha256Of = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

/** The link a stored picture is served at, by hash or under its repo path. */
export function pictureUrl(sha: string, type: string, path?: string): string {
  if (path && path.includes('/refs/')) return `${PICTURE_BASE}/board/refs/${path}`
  if (path) return `${PICTURE_BASE}/board/stills/${path}`
  return `${PICTURE_BASE}/board/stills/sha/${sha}.${ext(type)}`
}

/** The sha256 a board picture URL names, or null. */
export function shaFromUrl(value: string): string | null {
  const m = /\/(?:board\/stills\/)?sha(?:%2F|\/)([0-9a-f]{64})(?:\.|\b)/i.exec(value)
  return m ? m[1].toLowerCase() : null
}

/** A data URI's bytes, or raw base64 with the type given; a sentence says what is wrong. */
export function decodePictureData(data: string, type?: string): { type: string; bytes: Buffer } | { error: string } {
  const text = data.trim()
  const uri = DATA_IMG.exec(text)
  const mime = (uri ? uri[1] : type ?? '').toLowerCase()
  if (!PICTURE_TYPES[mime])
    return { error: `a picture is ${Object.keys(PICTURE_TYPES).join(', ')}; this one says ${mime || 'nothing'}` }
  const b64 = (uri ? uri[2] : text).replace(/\s+/g, '')
  if (!b64) return { error: 'the picture is empty' }
  const bytes = Buffer.from(b64, 'base64')
  if (!bytes.length) return { error: 'the picture is not base64' }
  if (bytes.length > MAX_PICTURE_BYTES)
    return { error: `the picture is ${bytes.length} bytes; the most one call carries is ${MAX_PICTURE_BYTES}` }
  return { type: mime, bytes }
}

/** The round a stills path belongs to, as art_store.py reads it. */
export function roundOfPath(path: string): string | undefined {
  return path.startsWith(STILLS) ? path.slice(STILLS.length).split('/')[0] || undefined : undefined
}

async function readIndex(): Promise<ArtEntry[]> {
  const b = backend()
  if (!b) return []
  const got = await b.read(ART_KEY).catch(() => null)
  if (!got) return []
  try {
    const body = JSON.parse(await new Response(got.body).text()) as { pictures?: unknown }
    return Array.isArray(body.pictures) ? (body.pictures as ArtEntry[]) : []
  } catch {
    return []
  }
}

async function writeIndex(entries: ArtEntry[]): Promise<void> {
  const b = backend()
  if (!b) return
  const pictures = entries.slice(-ART_LIMIT)
  await b.write(ART_KEY, new TextEncoder().encode(JSON.stringify({ at: new Date().toISOString(), pictures })),
    'application/json')
}

/** Store one picture and answer its link; a refusal is a sentence for the caller. */
export async function storePicture(input: { data: string; type?: string; round?: string; maker?: string; path?: string }):
    Promise<{ picture?: StoredPicture; error?: string }> {
  const decoded = decodePictureData(input.data, input.type)
  if ('error' in decoded) return { error: decoded.error }
  const path = input.path?.trim() || undefined
  if (path && (!path.startsWith(STILLS) || !allowedPath(path)))
    return { error: `${path} is not a stills path the store takes; a picture path starts council/callsheets/stills/` }
  const sha = sha256Of(decoded.bytes)
  const entry: Entry = { sha, type: decoded.type, size: decoded.bytes.length }
  try {
    if (path && path.includes('/refs/')) await storeRefObject(sha, decoded.bytes, decoded.type)
    else await storeObject(sha, decoded.bytes, decoded.type)
    if (path) await setEntries({ [path]: entry })
  } catch (e) {
    return { error: `the content store refused the write: ${e instanceof Error ? e.message : String(e)}` }
  }
  const round = input.round?.trim() || (path ? roundOfPath(path) : undefined)
  const picture: StoredPicture = {
    sha, type: decoded.type, size: decoded.bytes.length, url: pictureUrl(sha, decoded.type, path),
    ...(round ? { round } : {}), ...(path ? { path } : {}),
  }
  const maker = input.maker?.trim() || 'mcp'
  const index = (await readIndex()).filter((p) => !(p.sha === sha && p.path === path))
  index.push({ ...picture, at: new Date().toISOString(), maker })
  await writeIndex(index).catch(() => undefined)
  return { picture }
}

/** The bytes a sha256 names, with the type the store holds; null when the store lacks it. */
export async function readPictureBytes(sha: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  if (!SHA.test(sha)) return null
  const got = await readObject(sha)
  if (!got) return null
  const bytes = new Uint8Array(await new Response(got.body).arrayBuffer())
  const type = got.type && PICTURE_TYPES[got.type] ? got.type : 'image/png'
  return { bytes, type }
}

/** Every picture a round or the whole store holds: the art index, then the manifest's stills paths. */
export async function listPictures(round?: string): Promise<StoredPicture[]> {
  const out = new Map<string, StoredPicture>()
  for (const p of await readIndex()) {
    const key = p.path ?? p.sha
    if (!round || p.round === round || p.path?.startsWith(STILLS + round + '/')) out.set(key, p)
  }
  const b = backend()
  const manifest = b ? await b.read('manifest.json').catch(() => null) : null
  if (manifest) {
    try {
      const files = JSON.parse(await new Response(manifest.body).text()) as { files?: Record<string, Entry> }
      for (const [path, e] of Object.entries(files?.files ?? {})) {
        if (!path.startsWith(STILLS) || path.includes('/refs/')) continue
        const at = roundOfPath(path)
        if (round && at !== round) continue
        if (!out.has(path)) out.set(path, { sha: e.sha, type: e.type, size: e.size, url: pictureUrl(e.sha, e.type, path),
          ...(at ? { round: at } : {}), path })
      }
    } catch { /* an unreadable manifest leaves the index alone */ }
  }
  return [...out.values()].sort((x, y) => (x.path ?? x.url).localeCompare(y.path ?? y.url))
}

export type FoundPicture = { path: (string | number)[]; uri: string }

/** Every inline `data:image` a value carries, with the path to it (dot-joined keys and array indexes). */
export function findDataPictures(value: unknown): FoundPicture[] {
  const out: FoundPicture[] = []
  const walk = (v: unknown, path: (string | number)[]) => {
    if (typeof v === 'string') { if (DATA_IMG.test(v.trim())) out.push({ path, uri: v.trim() }); return }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, [...path, i])); return }
    if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) walk(x, [...path, k])
  }
  walk(value, [])
  return out
}

function setAt(root: unknown, path: (string | number)[], next: string): unknown {
  if (path.length === 0) return next
  const [head, ...rest] = path
  if (Array.isArray(root)) { const copy = root.slice(); copy[head as number] = setAt(root[head as number], rest, next); return copy }
  const copy = { ...(root as Record<string, unknown>) }
  copy[head as string] = setAt((root as Record<string, unknown>)[head as string], rest, next)
  return copy
}

/**
 * A row's inline pictures, stored and rewritten to their links, which is the order board/post_rows.py uses. One
 * picture over the cap stops the call, so a half-lifted row never lands.
 */
export async function liftInlinePictures(data: unknown, opts: { round?: string; maker?: string } = {}):
    Promise<{ data: unknown; pictures: StoredPicture[]; error?: string }> {
  const found = findDataPictures(data)
  if (!found.length) return { data, pictures: [] }
  if (found.length > PICTURE_LIMIT)
    return { data, pictures: [], error: `the row carries ${found.length} inline pictures; one call lifts ${PICTURE_LIMIT}` }
  const seen = new Map<string, StoredPicture>()
  let total = 0
  let next = data
  for (const { path, uri } of found) {
    let picture = seen.get(uri)
    if (!picture) {
      const stored = await storePicture({ data: uri, round: opts.round, maker: opts.maker ?? 'mcp' })
      if (stored.error || !stored.picture) return { data, pictures: [], error: stored.error ?? 'the picture was not stored' }
      picture = stored.picture
      total += picture.size
      if (total > MAX_LIFT_BYTES)
        return { data, pictures: [], error: `the row's inline pictures pass ${MAX_LIFT_BYTES} bytes; split the call` }
      seen.set(uri, picture)
    }
    next = setAt(next, path, picture.url)
  }
  return { data: next, pictures: [...seen.values()] }
}
