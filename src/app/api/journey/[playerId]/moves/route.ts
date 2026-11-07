/**
 * @route POST /api/journey/[playerId]/moves
 * @entity PLAYER
 * @description The coach adds a move the player made on paper to the program's record (the paper route is first-class)
 * @permissions signed-in player named as the program's coach; anyone else gets 404
 * @relationships PLAYER (BetweenPrivate journey)
 * @example POST /api/journey/cmplayer123/moves { "move": "window", "on": "2026-11-12" }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer, journeyFor, saveJourney } from '@/lib/between/store'
import { journeyWrite, type Doc } from '@/lib/between/rules'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const coach = await currentPlayer()
  const { playerId } = await params
  const found = coach ? await journeyFor(coach.id, playerId) : null
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((found.doc.program as Doc | undefined)?.closedAt) return NextResponse.json({ error: 'The program is closed.' }, { status: 409 })
  const body = (await req.json().catch(() => null)) as { move?: string; on?: string } | null
  const on = typeof body?.on === 'string' ? body.on : ''
  const record = { move: typeof body?.move === 'string' ? body.move : '', life: false, on, at: new Date().toISOString() }
  const moves = Array.isArray(found.doc.moves) ? found.doc.moves : []
  const doc: Doc = { ...found.doc, moves: [...moves, record] }
  const v = journeyWrite(doc)
  if (!v.ok) return NextResponse.json({ error: 'A move is one of the seven, on a day.' }, { status: 400 })
  await saveJourney(found.gardenId, playerId, doc)
  return NextResponse.json({ ok: true, move: record })
}
