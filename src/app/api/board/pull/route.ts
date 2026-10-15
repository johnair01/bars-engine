/**
 * @route GET|POST /api/board/pull
 * @entity SYSTEM
 * @description For six-faces-council's board-pull GitHub Action: every board document plus the saves main has not
 * recorded (GET), and marking saves recorded once main holds them (POST)
 * @permissions BOARD_PULL_TOKEN as a bearer token
 * @example GET /api/board/pull?board=nonprofit&stale_hours=6
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { latestDocs } from '@/lib/board/store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

function authorized(req: NextRequest) {
  const secret = process.env.BOARD_PULL_TOKEN
  const header = req.headers.get('authorization')  // header only: this token writes, so it never rides in a URL
  return !!secret && !!header?.startsWith('Bearer ') && tokenMatches(givenToken(req), secret)
}

export async function GET(req: NextRequest) {
  if (!process.env.BOARD_PULL_TOKEN) return NextResponse.json({ error: 'BOARD_PULL_TOKEN not configured' }, { status: 503 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const board = req.nextUrl.searchParams.get('board') || 'nonprofit'
  const hours = Number(req.nextUrl.searchParams.get('stale_hours') || 'NaN')
  const pending = await db.boardSave.findMany({
    where: { board, recordedAt: null }, orderBy: { receivedAt: 'asc' },
    select: { id: true, collection: true, docId: true, receivedAt: true },
  })
  const body: Record<string, unknown> = { board, docs: await latestDocs(board), unrecorded: pending }
  if (Number.isFinite(hours)) {
    const cutoff = Date.now() - hours * 3600_000
    body.stale = pending.filter(p => p.receivedAt.getTime() < cutoff)
  }
  return NextResponse.json(body, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  if (!process.env.BOARD_PULL_TOKEN) return NextResponse.json({ error: 'BOARD_PULL_TOKEN not configured' }, { status: 503 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as { board?: string; ids?: unknown; record?: unknown } | null
  if (!b || !Array.isArray(b.ids) || !b.ids.every(i => typeof i === 'string') || typeof b.record !== 'string' || !b.record)
    return NextResponse.json({ error: 'Expected {board, ids: string[], record: string}' }, { status: 400 })
  const board = b.board || 'nonprofit'
  const r = await db.boardSave.updateMany({
    where: { board, id: { in: b.ids as string[] }, recordedAt: null }, data: { recordedAt: new Date(), record: b.record },
  })
  await db.boardPull.create({ data: { board, recorded: r.count, record: b.record } })
  return NextResponse.json({ recorded: r.count }, { headers: NO_STORE })
}
