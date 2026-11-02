/**
 * @route POST /api/board/receipts
 * @entity SYSTEM
 * @description A Claude session leaves the receipt of its browser checks for one commit (six-faces-council
 *   council/tools/browser_gate.py; browser-checks-1, Wendell, 2026-11-02: "Let's get the 6 game masters on browser
 *   checks outside of actions"). Body: {sha, passed, failed, skipped, seconds}. A receipt for a sha is written once
 *   per content; a new run for the same sha replaces it. Stored as a board save on its own board (`browser-receipts`),
 *   so the Council Board's reads and board-pull never carry it.
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or a bare Authorization header (a write never takes the URL)
 * @example POST /api/board/receipts {"sha":"0b61617873a8e202041156a90a11062628b24d21","passed":101,"failed":0,"skipped":0,"seconds":151.6}
 *
 * @route GET /api/board/receipts
 * @description The receipt for ?sha=<40 hex>, as {receipt}, or 404 when no session left one. The merge path reads this
 *   and refuses a missing, stale, failed or skipped receipt (browser_gate.py check).
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token, a bare Authorization header or ?token=
 * @example GET /api/board/receipts?sha=0b61617873a8e202041156a90a11062628b24d21
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { latestDoc } from '@/lib/board/store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
export const RECEIPT_BOARD = 'browser-receipts'
const SHA = /^[0-9a-f]{40}$/
const count = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1_000_000

function refused(req: NextRequest, write = false) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (write && !req.headers.get('authorization')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function GET(req: NextRequest) {
  const no = refused(req)
  if (no) return no
  const sha = (req.nextUrl.searchParams.get('sha') ?? '').toLowerCase()
  if (!SHA.test(sha)) return NextResponse.json({ error: 'Expected ?sha=<40 hex characters>' }, { status: 400 })
  const receipt = await latestDoc(RECEIPT_BOARD, 'receipts', sha)
  if (!receipt) return NextResponse.json({ error: 'No receipt for this commit' }, { status: 404, headers: NO_STORE })
  return NextResponse.json({ receipt }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const no = refused(req, true)
  if (no) return no
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const sha = typeof b?.sha === 'string' ? b.sha.toLowerCase() : ''
  if (!b || !SHA.test(sha) || !count(b.passed) || !count(b.failed) || !count(b.skipped)
      || typeof b.seconds !== 'number' || !(b.seconds >= 0 && b.seconds < 86_400))
    return NextResponse.json({ error: 'Expected {sha: 40 hex, passed, failed, skipped: whole numbers, seconds: number}' }, { status: 400 })
  const receipt = { sha, passed: b.passed, failed: b.failed, skipped: b.skipped, seconds: b.seconds, postedAt: new Date().toISOString() }
  await db.boardSave.create({ data: {
    board: RECEIPT_BOARD, collection: 'receipts', docId: sha, data: receipt, source: 'session',
    recordedAt: new Date(), record: 'browser receipt; not an answer',
  } })
  return NextResponse.json({ receipt }, { status: 201, headers: NO_STORE })
}
