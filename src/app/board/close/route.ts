/**
 * @route GET,POST /board/close
 * @entity SYSTEM
 * @description The closing ritual's board door (six-faces-council .specify/specs/closing-ritual): five moves drawn by the same renderer the chat tools close_read and close_say call, over one close record per day.
 * @permissions owner (BOARD_OWNER_PLAYER_ID); others are sent to /login.
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { closeSay, pacificToday } from '@/lib/close/chat'
import { closePage } from '@/lib/close/page'
import { openClose } from '@/lib/close/store'
import { MOVES, type Move } from '@/lib/close/types'

export const dynamic = 'force-dynamic'
const HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' }

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner()))
    return NextResponse.redirect(new URL('/login?returnTo=' + encodeURIComponent('/board/close'), req.url))
  const r = await openClose(db, req.nextUrl.searchParams.get('date') ?? pacificToday())
  const m = req.nextUrl.searchParams.get('move') as Move | null
  return new NextResponse(closePage(r, m && MOVES.includes(m) ? m : r.move), { headers: HEADERS })
}

export async function POST(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner.' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { say?: unknown; date?: unknown }
  if (typeof body.say !== 'string' || !body.say.trim()) return NextResponse.json({ error: 'Say something.' }, { status: 400 })
  const res = await closeSay(db, body.say, typeof body.date === 'string' ? body.date : undefined)
  return NextResponse.json({ error: res.error ?? null, move: res.move, status: res.status }, { headers: { 'Cache-Control': 'no-store' } })
}
