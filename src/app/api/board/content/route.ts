/**
 * @route GET /api/board/content
 * @entity SYSTEM
 * @description The manifest of the council's pushed board content: each repo path with its sha256, type and size, so
 *   six-faces-council board/push_content.py sends only what changed (council/callsheets/board-content-push.md there)
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @agentDiscoverable false
 *
 * @route PUT /api/board/content
 * @description One file's bytes, gzipped, stored under its content hash: PUT ?sha=<sha256>&type=<content type>. The
 *   hash is checked against the bytes. Gzip keeps board_data.json under Vercel's 4.5 MB request cap.
 * @permissions COUNCIL_MENU_TOKEN
 *
 * @route POST /api/board/content
 * @description Points repo paths at stored hashes and drops paths main no longer has, in one manifest write:
 *   {"set": {"board/council-board.html": {"sha": "...", "type": "text/html; charset=utf-8", "size": 1}}, "remove": []}
 * @permissions COUNCIL_MENU_TOKEN
 */
import { createHash } from 'crypto'
import { gunzipSync } from 'zlib'
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { allowedPath, backend, tokenNames, manifest, setEntries, storeObject, TYPES, type Entry } from '@/lib/board/content-store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_BYTES = 40 * 1024 * 1024

function refused(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!backend()) return NextResponse.json({ error: 'No content store: set BOARD_BLOB_READ_WRITE_TOKEN (a private Vercel Blob store)' }, { status: 503 })
  return null
}

const storeError = (e: unknown) => NextResponse.json({ error: `The content store refused the write: ${e instanceof Error ? e.message : String(e)}`
  + ' (a public Blob store refuses private files; connect a private store as BOARD_BLOB_READ_WRITE_TOKEN)',
  tokenNamesSeen: tokenNames() }, { status: 502 })

export async function GET(req: NextRequest) {
  const no = refused(req); if (no) return no
  return NextResponse.json(await manifest(true), { headers: NO_STORE })
}

export async function PUT(req: NextRequest) {
  const no = refused(req); if (no) return no
  const sha = req.nextUrl.searchParams.get('sha') ?? '', type = req.nextUrl.searchParams.get('type') ?? ''
  if (!/^[0-9a-f]{64}$/.test(sha) || !TYPES.has(type))
    return NextResponse.json({ error: `Expected ?sha=<sha256 hex>&type=<one of ${[...TYPES].join(', ')}>` }, { status: 400 })
  let bytes: Buffer
  try { bytes = gunzipSync(Buffer.from(await req.arrayBuffer()), { maxOutputLength: MAX_BYTES }) }
  catch { return NextResponse.json({ error: 'The body must be the file gzipped, under 40 MB unpacked' }, { status: 400 }) }
  if (createHash('sha256').update(bytes).digest('hex') !== sha)
    return NextResponse.json({ error: 'The bytes do not match ?sha' }, { status: 400 })
  try { await storeObject(sha, bytes, type) } catch (e) { return storeError(e) }
  return NextResponse.json({ stored: sha, size: bytes.length }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const no = refused(req); if (no) return no
  const b = (await req.json().catch(() => null)) as { set?: Record<string, Entry>; remove?: string[] } | null
  const set = b?.set ?? {}, remove = b?.remove ?? []
  if (!b || typeof set !== 'object' || !Array.isArray(remove))
    return NextResponse.json({ error: 'Expected {set: {path: {sha, type, size}}, remove: [path]}' }, { status: 400 })
  const bad = [...Object.keys(set).filter(p => !allowedPath(p) || !/^[0-9a-f]{64}$/.test(set[p]?.sha ?? '')
    || !TYPES.has(set[p]?.type ?? '') || typeof set[p]?.size !== 'number'), ...remove.filter(p => typeof p !== 'string')]
  if (bad.length) return NextResponse.json({ error: 'Refused paths or entries', refused: bad.slice(0, 20) }, { status: 400 })
  try {
    const m = await setEntries(Object.fromEntries(Object.entries(set).map(([p, e]) => [p, { sha: e.sha, type: e.type, size: e.size }])), remove)
    return NextResponse.json({ at: m.at, files: Object.keys(m.files).length, set: Object.keys(set).length, removed: remove.length }, { headers: NO_STORE })
  } catch (e) { return storeError(e) }
}
