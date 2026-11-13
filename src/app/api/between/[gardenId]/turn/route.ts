/**
 * @route POST /api/between/:gardenId/turn
 * @entity PLAYER
 * @description One move at the Between's low table: draw a card from the other friend's deck, ask for it, earn it with tea, open it, offer it, say not today, put it back, or write a line (Friendcraft slice 2)
 * @permissions a member of a Between shared by two friends who are both in Friendcraft; some moves belong to the drawer, some to the card's owner
 * @relationships PLAYER (BetweenItem kind turn and spend, BetweenPrivate deck, CustomBar and BarShare for the slip and the kept page)
 * @example POST /api/between/clx.../turn { "do": "draw" } · { "do": "line", "turn": "tAb12", "words": "I would love that." }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer, playTurn } from '@/lib/between/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await params
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to sit at the table.' }, { status: 401 })
  const raw = await req.text()
  if (raw.length > 4_000) return NextResponse.json({ error: 'That is too long to set down.' }, { status: 413 })
  let body: { do?: unknown; turn?: unknown; words?: unknown }
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Send JSON.' }, { status: 400 }) }
  const res = await playTurn(gardenId, player.id, body && typeof body === 'object' ? body : {})
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ turn: { id: res.id, ...res.turn } }, { headers: { 'Cache-Control': 'no-store' } })
}
