/** The council's board content, pushed here instead of read from GitHub (Wendell, 2026-10-30: "let's wait for the push
 * version and align everything toward that goal"; six-faces-council council/callsheets/board-content-push.md).
 *
 * six-faces-council went private on 2026-10-30, so nothing here may read its repo at page load. Its board Actions send
 * the built board pages, the look pictures and the files the studio pages read to /api/board/content; this module
 * keeps them and hands them to the routes that used to fetch raw.githubusercontent.com.
 *
 * Every file is stored once under its content hash (`sha/<sha256>`); a manifest maps each repo path to its hash, so a
 * push sends only what changed and a page swaps to new content in one manifest write. Where the bytes live sits behind
 * `ContentBackend`: the asset-storage pass (council #647, board question as-where-art-lives) chooses the store, and a
 * new one is one more backend here. Today's backend is a private Vercel Blob store. The old raw fetch stays only behind
 * BOARD_CONTENT_RAW_FALLBACK=1 until every picture serves from the store. */
import { get, put } from '@vercel/blob'

export type Entry = { sha: string; type: string; size: number }
export type Manifest = { at: string; files: Record<string, Entry> }

export interface ContentBackend {
  name: string
  read(key: string): Promise<{ body: ReadableStream<Uint8Array>; type?: string } | null>
  write(key: string, bytes: Uint8Array, type: string): Promise<void>
}

const RAW = 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/'
const ROOT = 'board-content/'

/** The paths the council may push and the board may serve: the two board pages, board_data.json, look pictures, and
 * the studio's files. Nothing else in the repo comes here. */
const ALLOWED = [
  /^board\/council-board\.html$/,
  /^board\/nonprofit\/nonprofit-board\.html$/,
  /^board\/board_data\.json$/,
  /^board\/stills\/[0-9a-f]{16}\.(jpe?g|png|gif|webp)$/,
  /^council\/callsheets\/stills\/[A-Za-z0-9._\/ -]+\.(jpe?g|png|gif|webp)$/i,
  /^council\/callsheets\/INDEX\.md$/,
  /^council\/loops\/[A-Za-z0-9._-]+\.json$/,
  /^council\/ledger\/[A-Za-z0-9._-]+\.json$/,
  /^council\/needs-work-done\.json$/,
]
export function allowedPath(p: string): boolean {
  return !p.includes('..') && !p.includes('//') && ALLOWED.some(r => r.test(p))
}

export const TYPES = new Set(['text/html; charset=utf-8', 'application/json', 'text/markdown; charset=utf-8',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/** Blob tokens the project already uses for other stores; the board's store is any other one. */
const OTHER_STORES = new Set(['BLOB_READ_WRITE_TOKEN', 'FAMILY_ROOM_BLOB_READ_WRITE_TOKEN'])

/** The env names that could hold the board's store token. Vercel names it `<custom prefix>_READ_WRITE_TOKEN` when the
 * store is connected, so a prefix other than BOARD_BLOB still works (2026-10-31: the first connection got another). */
export function tokenNames(env: Record<string, string | undefined> = process.env): string[] {
  return Object.keys(env).filter(k => k.endsWith('_READ_WRITE_TOKEN') && env[k]).sort()
}

/** BOARD_BLOB_READ_WRITE_TOKEN; else the one Blob token that belongs to no other store; else the family room's private
 * store, under its own board-content/ folder (Wendell, 2026-10-31, "Existing private store": the CouncilBoard store
 * he made never reached production's env, and this is the private store production already has); else the project's
 * own, which is public and refuses private files. */
export function boardToken(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.BOARD_BLOB_READ_WRITE_TOKEN) return env.BOARD_BLOB_READ_WRITE_TOKEN
  const own = tokenNames(env).filter(k => !OTHER_STORES.has(k))
  if (own.length === 1) return env[own[0]]
  return env.FAMILY_ROOM_BLOB_READ_WRITE_TOKEN || env.BLOB_READ_WRITE_TOKEN
}

/** A private Vercel Blob store: the board's own store when it is connected (`boardToken`), else the project's. */
export function blobBackend(token = boardToken()): ContentBackend | null {
  if (!token) return null
  return {
    name: 'vercel-blob',
    async read(key) {
      const r = await get(ROOT + key, { access: 'private', token, useCache: false }).catch(() => null)
      return r && r.statusCode === 200 && r.stream ? { body: r.stream, type: r.blob.contentType } : null
    },
    async write(key, bytes, type) {
      await put(ROOT + key, Buffer.from(bytes), { access: 'private', token, contentType: type, addRandomSuffix: false,
        allowOverwrite: true })
    },
  }
}

let backendOverride: ContentBackend | null | undefined
/** Tests swap the backend in; production reads the env. */
export function setBackend(b: ContentBackend | null | undefined) { backendOverride = b; manifestCache = null; texts.clear() }
export function backend(): ContentBackend | null { return backendOverride !== undefined ? backendOverride : blobBackend() }

let manifestCache: { m: Manifest; at: number } | null = null
const MANIFEST_MS = 60_000

/** The manifest as the last push left it, cached a minute; an empty one when nothing was pushed yet. */
export async function manifest(fresh = false): Promise<Manifest> {
  if (!fresh && manifestCache && Date.now() - manifestCache.at < MANIFEST_MS) return manifestCache.m
  const b = backend()
  let m: Manifest = { at: '', files: {} }
  const got = b ? await b.read('manifest.json').catch(() => null) : null
  if (got) { try { m = JSON.parse(await new Response(got.body).text()) as Manifest } catch { /* keep empty */ } }
  else if (manifestCache) return manifestCache.m
  manifestCache = { m, at: Date.now() }
  return m
}

/** Adds and removes manifest entries in one write. The caller has stored each new hash first. */
export async function setEntries(set: Record<string, Entry>, remove: string[] = []): Promise<Manifest> {
  const b = backend()
  if (!b) throw new Error('no content store configured')
  const m = await manifest(true)
  const files = { ...m.files, ...set }
  for (const p of remove) delete files[p]
  const next: Manifest = { at: new Date().toISOString(), files }
  await b.write('manifest.json', new TextEncoder().encode(JSON.stringify(next)), 'application/json')
  manifestCache = { m: next, at: Date.now() }
  return next
}

/** One stored object by its content hash, as a stream; null when the store does not hold it. A picture a session pushed
 * from a branch is served this way, with no repo path and no merge (Homeport level 1, the seal: six-faces-council
 * canon/mechanics/lading-seal.yaml). */
export async function readObject(sha: string): Promise<{ body: ReadableStream<Uint8Array>; type?: string } | null> {
  const b = backend()
  if (!b || !/^[0-9a-f]{64}$/.test(sha)) return null
  return b.read('sha/' + sha).catch(() => null)
}

/** The hashes of `shas` the store does not hold. Each check reads the object's head and drops the stream. */
export async function missingObjects(shas: string[]): Promise<string[]> {
  const out: string[] = []
  for (const sha of [...new Set(shas)]) {
    const got = await readObject(sha)
    if (got) await got.body.cancel().catch(() => undefined)
    else out.push(sha)
  }
  return out
}

export async function storeObject(sha: string, bytes: Uint8Array, type: string): Promise<void> {
  const b = backend()
  if (!b) throw new Error('no content store configured')
  await b.write('sha/' + sha, bytes, type)
}

const rawOn = () => process.env.BOARD_CONTENT_RAW_FALLBACK === '1'

/** One pushed file as a stream, with its type and hash; null when the store does not have it. */
export async function readFile(path: string): Promise<{ body: ReadableStream<Uint8Array>; type: string; sha: string | null } | null> {
  if (!allowedPath(path)) return null
  const e = (await manifest()).files[path], b = backend()
  if (e && b) {
    const got = await b.read('sha/' + e.sha).catch(() => null)
    if (got) return { body: got.body, type: e.type, sha: e.sha }
  }
  if (!rawOn()) return null
  try {
    const r = await fetch(RAW + path.split('/').map(encodeURIComponent).join('/'), { cache: 'no-store' })
    return r.ok && r.body ? { body: r.body, type: r.headers.get('content-type') ?? '', sha: null } : null
  } catch { return null }
}

const texts = new Map<string, string>()
/** A pushed text file. Each hash is read from the store once per instance, so a page load after a quiet minute costs
 * one manifest read. */
export async function readText(path: string): Promise<string | null> {
  const e = (await manifest()).files[path]
  if (e && texts.has(e.sha)) return texts.get(e.sha)!
  const f = await readFile(path)
  if (!f) return null
  const t = await new Response(f.body).text()
  if (f.sha) { if (texts.size > 200) texts.clear(); texts.set(f.sha, t) }
  return t
}

/** The file names pushed under a folder (`council/ledger/`), as the GitHub contents listing used to give them. */
export async function listNames(folder: string): Promise<string[]> {
  const names = Object.keys((await manifest()).files).filter(p => p.startsWith(folder) && !p.slice(folder.length).includes('/'))
    .map(p => p.slice(folder.length))
  if (names.length || !rawOn()) return names
  try {
    const r = await fetch(`https://api.github.com/repos/wendell-britt/Six-faces-council/contents/${folder.replace(/\/$/, '')}?ref=main`, { cache: 'no-store' })
    return r.ok ? ((await r.json()) as { name: string }[]).map(f => f.name) : []
  } catch { return [] }
}
