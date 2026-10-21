/**
 * @route POST /api/board/session-writes
 * @entity SYSTEM
 * @description A Claude session writes Your steps lists and steps, and Outreach contacts and shows, to the Council
 *   Board's store here, so bars-engine's /board/council stops drifting from what sessions publish (board-home step 5).
 *   Update merges onto the latest document; a write that changes nothing is skipped (src/lib/board/session-write.ts).
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token= (the egress proxy injects it for sessions)
 * @example POST /api/board/session-writes {"docs":[{"collection":"steps","docId":"feat-01","data":{"do":"..."}}],"dry":true}
 * @agentDiscoverable false
 *
 * @route GET /api/board/session-writes
 * @description A short hash of each document per collection, so a session can compare this store with the claude.ai
 *   artifact's (board/store_write.py diff) without the contents leaving bars-engine
 * @permissions COUNCIL_MENU_TOKEN
 * @example GET /api/board/session-writes?collection=steps
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { latestDocs } from '@/lib/board/store'
import { docHash, sessionWrite, SESSION_COLLECTIONS, type SessionDoc } from '@/lib/board/session-write'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_DOCS = 100

function refused(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function GET(req: NextRequest) {
  const no = refused(req); if (no) return no
  const want = req.nextUrl.searchParams.get('collection')
  if (want && !SESSION_COLLECTIONS.has(want))
    return NextResponse.json({ error: 'collection must be lists, steps, contacts or shows' }, { status: 400 })
  const docs = (await latestDocs('council')) as Record<string, Record<string, unknown>>
  const hashes: Record<string, Record<string, string>> = {}
  for (const c of want ? [want] : [...SESSION_COLLECTIONS])
    hashes[c] = Object.fromEntries(Object.entries(docs[c] ?? {}).map(([id, d]) => [id, docHash(d)]))
  return NextResponse.json({ board: 'council', hashes }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const no = refused(req); if (no) return no
  const b = (await req.json().catch(() => null)) as { docs?: unknown; dry?: unknown } | null
  if (!b || !Array.isArray(b.docs) || b.docs.length > MAX_DOCS
      || !b.docs.every(d => d && typeof d.collection === 'string' && typeof d.docId === 'string'))
    return NextResponse.json({ error: `Expected {docs: [{collection, docId, mode?, data}] (at most ${MAX_DOCS})}` },
      { status: 400 })
  const r = await sessionWrite(db, b.docs as SessionDoc[], b.dry === true)
  return NextResponse.json({ board: 'council', dry: b.dry === true, ...r }, { headers: NO_STORE })
}
