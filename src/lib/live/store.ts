/**
 * Live game files: a game prototype's files kept in the board content store (src/lib/board/content-store.ts) and served
 * at /live/<game>/<file>, so an agent changes a prototype through the MCP tools with no pull request, no build and no
 * daily ship (Wendell, 2026-11-24: "so that our agents aren't being gummed up with lint tests for every change").
 *
 * The files have their own manifest, `live/manifest.json`, apart from the council's: a council push removes every
 * path main does not hold (six-faces-council board/push_content.py), so live files in that manifest would vanish on
 * its next push. Bytes are stored once by sha256 under `sha/`, beside the board's, and never deleted, so each path's
 * last versions stay one call away (`revertLiveFile`).
 */
import { createHash } from 'node:crypto'
import { backend } from '@/lib/board/content-store'

export type LiveEntry = { sha: string; type: string; size: number; at: string; by?: string }
export type LiveManifest = { at: string; files: Record<string, LiveEntry>; history: Record<string, LiveEntry[]> }

const MANIFEST_KEY = 'live/manifest.json'
const HISTORY = 10
export const MAX_FILE_BYTES = 3 * 1024 * 1024

/** The file types a live game may hold, by extension. */
export const LIVE_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json',
  tmj: 'application/json',
  tsj: 'application/json',
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  glb: 'model/gltf-binary',
  wasm: 'application/wasm',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
}

const TEXT_EXT = new Set(['html', 'js', 'mjs', 'css', 'json', 'tmj', 'tsj', 'md', 'txt', 'svg'])

/** `<game>/<file>`: a lower-case game slug, then folders and a file name with a known extension. */
export function livePathError(path: string): string | null {
  if (typeof path !== 'string' || !path) return 'path is `<game>/<file>`, e.g. `lantern-walk/index.html`'
  if (path.includes('..') || path.includes('//') || path.startsWith('/')) return `${path}: no "..", "//" or leading "/"`
  if (!/^[a-z0-9][a-z0-9-]{0,47}\/[A-Za-z0-9._\/-]{1,200}$/.test(path))
    return `${path}: a game slug (a-z, 0-9, -) then a file path of letters, digits, ".", "_", "-" and "/"`
  if (!typeExt(path)) return `${path}: the extension must be one of ${Object.keys(LIVE_TYPES).join(', ')}`
  return null
}

const extOf = (path: string) => (path.split('/').pop() ?? '').split('.').pop()?.toLowerCase() ?? ''
export const typeExt = (path: string): string | null => LIVE_TYPES[extOf(path)] ?? null
export const isText = (path: string) => TEXT_EXT.has(extOf(path))
export const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

function store() {
  const b = backend()
  if (!b) throw new Error('no content store configured (BOARD_BLOB_READ_WRITE_TOKEN)')
  return b
}

let cache: { m: LiveManifest; at: number; b: unknown } | null = null
const CACHE_MS = 5_000

export async function liveManifest(fresh = false): Promise<LiveManifest> {
  const b = store()
  if (!fresh && cache && cache.b === b && Date.now() - cache.at < CACHE_MS) return cache.m
  const got = await b.read(MANIFEST_KEY).catch(() => null)
  let m: LiveManifest = { at: '', files: {}, history: {} }
  if (got) {
    try {
      const parsed = JSON.parse(await new Response(got.body).text()) as Partial<LiveManifest>
      m = { at: parsed.at ?? '', files: parsed.files ?? {}, history: parsed.history ?? {} }
    } catch { /* keep empty */ }
  }
  cache = { m, at: Date.now(), b }
  return m
}

async function writeManifest(m: LiveManifest) {
  const b = store()
  await b.write(MANIFEST_KEY, new TextEncoder().encode(JSON.stringify(m)), 'application/json')
  cache = { m, at: Date.now(), b }
}

function point(m: LiveManifest, path: string, e: LiveEntry): LiveManifest {
  const prev = m.files[path]
  const history = { ...m.history }
  if (prev && prev.sha !== e.sha) history[path] = [prev, ...(history[path] ?? []).filter(h => h.sha !== prev.sha)].slice(0, HISTORY)
  return { at: e.at, files: { ...m.files, [path]: e }, history }
}

export type PutResult = { path: string; sha: string; size: number; previous: string | null; same: boolean; url: string }

/** Stores one file's bytes and points its path at them. Writing the same bytes again changes nothing. */
export async function putLiveFile(path: string, bytes: Uint8Array, by?: string): Promise<PutResult> {
  const err = livePathError(path)
  if (err) throw new Error(err)
  if (bytes.length > MAX_FILE_BYTES) throw new Error(`${path}: ${bytes.length} bytes is over the ${MAX_FILE_BYTES}-byte limit`)
  const sha = sha256(bytes), type = typeExt(path)!
  const m = await liveManifest(true)
  const prev = m.files[path] ?? null
  const url = liveUrl(path)
  if (prev?.sha === sha) return { path, sha, size: bytes.length, previous: sha, same: true, url }
  await store().write('sha/' + sha, bytes, type)
  await writeManifest(point(m, path, { sha, type, size: bytes.length, at: new Date().toISOString(), ...(by ? { by } : {}) }))
  return { path, sha, size: bytes.length, previous: prev?.sha ?? null, same: false, url }
}

/** Points a path back at one of its earlier versions (any sha its history holds). */
export async function revertLiveFile(path: string, sha: string, by?: string): Promise<PutResult> {
  const err = livePathError(path)
  if (err) throw new Error(err)
  const m = await liveManifest(true)
  const prev = m.files[path] ?? null
  const old = (m.history[path] ?? []).find(h => h.sha === sha)
  if (!old) throw new Error(`${path}: no earlier version ${sha.slice(0, 12)}; list_live_files with history shows them`)
  await writeManifest(point(m, path, { ...old, at: new Date().toISOString(), ...(by ? { by } : {}) }))
  return { path, sha, size: old.size, previous: prev?.sha ?? null, same: false, url: liveUrl(path) }
}

/** Takes a path off the live manifest. Its bytes and history stay, so revert brings it back. */
export async function removeLiveFile(path: string): Promise<{ path: string; removed: boolean }> {
  const m = await liveManifest(true)
  const prev = m.files[path]
  if (!prev) return { path, removed: false }
  const files = { ...m.files }
  delete files[path]
  const history = { ...m.history, [path]: [prev, ...(m.history[path] ?? []).filter(h => h.sha !== prev.sha)].slice(0, HISTORY) }
  await writeManifest({ at: new Date().toISOString(), files, history })
  return { path, removed: true }
}

export async function readLiveFile(path: string): Promise<{ body: ReadableStream<Uint8Array>; entry: LiveEntry } | null> {
  if (livePathError(path)) return null
  const entry = (await liveManifest()).files[path]
  if (!entry) return null
  const got = await store().read('sha/' + entry.sha).catch(() => null)
  return got ? { body: got.body, entry } : null
}

export async function listLiveFiles(game?: string): Promise<{ games: string[]; files: Record<string, LiveEntry>; history: LiveManifest['history'] }> {
  const m = await liveManifest(true)
  const pick = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).filter(([p]) => !game || p.startsWith(game + '/')))
  const games = [...new Set(Object.keys(m.files).map(p => p.split('/')[0]))].sort()
  return { games, files: pick(m.files), history: pick(m.history) }
}

export const liveUrl = (path: string) => `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://bars-engine.vercel.app'}/live/${path}`

/** No allow-same-origin: the document gets an opaque origin, cut off from bars-engine's cookies and storage. */
export const LIVE_CSP = 'sandbox allow-scripts allow-pointer-lock allow-popups allow-forms allow-modals allow-downloads'

export function liveHeaders(type: string, sha: string): Record<string, string> {
  return {
    'Content-Type': type,
    'Content-Security-Policy': LIVE_CSP,
    // A sandboxed page's origin is "null", so its own module scripts, JSON and models load as cross-origin requests.
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    ETag: `"${sha}"`,
  }
}

/** A sandboxed page's localStorage and sessionStorage throw on first touch, and 25 prototypes in public/ use them. This
 * shim, put first in each live HTML page, gives them memory-backed stores, so the game runs and forgets on reload. */
export const STORAGE_SHIM = '<script>(function(){function M(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},'
  + 'setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},'
  + 'get length(){return Object.keys(d).length}}}["localStorage","sessionStorage"].forEach(function(n){try{window[n].length}catch(e){'
  + 'try{Object.defineProperty(window,n,{value:M(),configurable:true})}catch(_){}}})})()</script>'

/** The page with the storage shim before its first script: after <head> when it has one, else at the very start. */
export function withShim(html: string): string {
  const head = /<head[^>]*>/i.exec(html)
  return head ? html.slice(0, head.index + head[0].length) + STORAGE_SHIM + html.slice(head.index + head[0].length) : STORAGE_SHIM + html
}
