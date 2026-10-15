/**
 * @route GET|POST /api/board/saves
 * @entity SYSTEM
 * @description The Nonprofit Board's store: read every document, or save one, as the board's single owner
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID)
 * @example GET /api/board/saves?board=nonprofit
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { applyWrite, MAX_SAVE_BYTES, RECORD_KINDS, validateSave } from '@/lib/board/save'
import { lastPull, latestDoc, latestDocs } from '@/lib/board/store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const board = req.nextUrl.searchParams.get('board') || 'nonprofit'
  const [docs, pull] = await Promise.all([latestDocs(board), lastPull(board)])
  return NextResponse.json({ docs, lastPull: pull }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.nextUrl.host) return NextResponse.json({ error: 'Cross-site save' }, { status: 403 })
  const raw = await req.text()
  if (raw.length > MAX_SAVE_BYTES) return NextResponse.json({ error: 'Save too large' }, { status: 413 })
  let body: unknown
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Not JSON' }, { status: 400 }) }
  const v = validateSave(body)
  if (!v.ok) return NextResponse.json({ error: 'Not a board save', details: v.errors }, { status: 422 })
  const { board, collection, docId } = v.save
  const doc = applyWrite(v.save.mode === 'update' ? await latestDoc(board, collection, docId) : null, v.save)
  const row = await db.boardSave.create({
    data: { board, collection, docId, data: doc as object, recordedAt: RECORD_KINDS.has(collection) ? null : new Date(),
            record: RECORD_KINDS.has(collection) ? null : 'board state; not recorded on main' },
    select: { receivedAt: true },
  })
  return NextResponse.json({ ok: true, doc, receivedAt: row.receivedAt }, { headers: NO_STORE })
}
