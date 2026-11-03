/**
 * @route GET|POST /api/board/saves
 * @entity SYSTEM
 * @description The boards' store (nonprofit, council): read every document, or save one, as the board's single owner;
 *   a council menu seal also writes each item as a Tap the Vein task, and a council seeds save sets that task aside
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID)
 * @example GET /api/board/saves?board=nonprofit
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { boardOwnerId, isBoardOwner } from '@/lib/board/owner'
import { applyWrite, MAX_SAVE_BYTES, RECORD_KINDS, validateSave } from '@/lib/board/save'
import { dispatchBoardPull } from '@/lib/board/dispatch'
import { lastPull, latestDoc, latestDocs, settledSeq, unrecordedSaves } from '@/lib/board/store'
import { writeBoardSeal } from '@/lib/tap-the-vein/board-seal'
import { setAsideFromBoard } from '@/lib/tap-the-vein/board-set-aside'
import { ticketFromSave } from '@/lib/work/from-save'
import { readyDraftsAfterSave } from '@/lib/board/ready-drafts'
import { wakePickupAfter } from '@/lib/work/wake'
import { PAGE_PATHS, pushedSha } from '@/lib/board/content-store'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const board = req.nextUrl.searchParams.get('board') || 'nonprofit'
  // page: the board's current build, so a page open since an older build reloads instead of losing the rows main has
  // recorded since (they leave this read once recorded; board-reverts, 2026-11-03).
  // cursor: the change-log number this read covers, so the page asks GET /api/board/changes for what came after it
  // (live board step 3). Null where the log is not numbered yet; the page then keeps its whole-store refresh.
  const [cursor, docs, pull, waiting, page] = await Promise.all([Promise.resolve().then(() => settledSeq(board)).catch(() => null),
    latestDocs(board, { leaveOutRecordedRows: true }), lastPull(board),
    unrecordedSaves(board), PAGE_PATHS[board] && !(board === 'nonprofit' && process.env.BOARD_PAGE_URL) ? pushedSha(PAGE_PATHS[board]) : null])
  return NextResponse.json({ docs, lastPull: pull, unrecorded: waiting, page, cursor }, { headers: NO_STORE })
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
  if (collection === 'rows')  // rows are the council's, posted by sessions (/api/board/session-writes); his saves are answers
    return NextResponse.json({ error: 'Rows are posted by sessions, not saved from the page' }, { status: 403 })
  const doc = applyWrite(v.save.mode === 'update' ? await latestDoc(board, collection, docId) : null, v.save)
  const data = { board, collection, docId, recordedAt: RECORD_KINDS.has(collection) ? null : new Date(),
                 record: RECORD_KINDS.has(collection) ? null : 'board state; not recorded on main' }
  // The Council Board's seal: each sealed item becomes a Tap the Vein task and the menu carries its id (ttv-one-store).
  const owner = boardOwnerId()
  // "Set aside" on the Council Board: the task rests in his seed library, recorded here, not on main (docs/seed-library.md).
  if (board === 'council' && collection === 'seeds') {
    if (!owner) return NextResponse.json({ error: 'BOARD_OWNER_PLAYER_ID is not set' }, { status: 503 })
    const out = await db.$transaction(async (tx) => {
      const r = await setAsideFromBoard(tx, owner, docId)
      if (!r.ok) return r
      const row = await tx.boardSave.create({ data: { ...data, recordedAt: new Date(), record: 'set aside in bars-engine',
        data: doc as object }, select: { receivedAt: true } })
      return { ...r, receivedAt: row.receivedAt }
    })
    if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status, headers: NO_STORE })
    return NextResponse.json({ ok: true, doc, receivedAt: out.receivedAt }, { headers: NO_STORE })
  }
  const seal = board === 'council' && collection === 'morning' && docId === 'menu' && typeof doc.menu === 'string' && owner
  const row = seal
    ? await db.$transaction(async (tx) => {
        doc.menu = await writeBoardSeal(tx, owner, doc.menu as string)
        return tx.boardSave.create({ data: { ...data, data: doc as object }, select: { receivedAt: true } })
      })
    : await db.boardSave.create({ data: { ...data, data: doc as object }, select: { receivedAt: true } })
  if (RECORD_KINDS.has(collection)) await dispatchBoardPull().catch(() => undefined)
  // Push from the board: his answer to a council question goes to the work lanes as it is saved (work queues, slice 1).
  const work = await ticketFromSave(db, board, collection, docId, doc)
  // His answer starts the work: a new Claude-lane ticket wakes the pickup now, not at the next hourly run.
  if (work?.created && work.lane === 'claude') wakePickupAfter(collection === 'steps' ? `card ${docId} sent to a face` : `answer to ${docId}`)
  // His plain yes on a look readies the drafts that waited on it, after this answers (writers-api FR-004).
  readyDraftsAfterSave(board, collection, docId, doc)
  return NextResponse.json({ ok: true, doc, receivedAt: row.receivedAt, ...(work ? { work } : {}) }, { headers: NO_STORE })
}
