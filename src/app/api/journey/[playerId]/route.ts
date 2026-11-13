/**
 * @route GET /api/journey/[playerId]
 * @entity PLAYER
 * @description The coach's record of a healing-journey program: each day of the program as made or not made, the move counts, and the diary pages while they may be read. No streak, score or warning
 * @permissions signed-in player named as the program's coach; anyone else gets 404
 * @relationships PLAYER (BetweenPrivate journey)
 * @example GET /api/journey/cmplayer123
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { currentPlayer, journeyFor } from '@/lib/between/store'
import { countsByMove, daysOf, pagesReadable } from '../../../../../public/between/journey.js'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ playerId: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const coach = await currentPlayer()
  const { playerId } = await params
  const found = coach ? await journeyFor(coach.id, playerId) : null
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const d = found.doc as Record<string, any>
  const program = d.program ?? {}
  const today = new Date().toISOString().slice(0, 10)
  return NextResponse.json({
    program,
    days: daysOf(d.moves, program.startsOn, program.endsOn),
    counts: countsByMove(d.moves),
    pages: pagesReadable(program, today) ? d.pages ?? [] : [],
  })
}
