/**
 * @route POST /api/journey/[playerId]/close
 * @entity PLAYER
 * @description The coach closes the program by hand: the player's pages come back once as text for their copy, then are deleted; the world (furnishings, woodpile, places) is kept
 * @permissions signed-in player named as the program's coach; anyone else gets 404
 * @relationships PLAYER (BetweenPrivate journey)
 * @example POST /api/journey/cmplayer123/close
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { currentPlayer, journeyFor, saveJourney } from '@/lib/between/store'
import { composeSummary, type ThreeTwoOnePass } from '@/lib/coaching/three-two-one'
import type { Doc } from '@/lib/between/rules'
import { close } from '../../../../../../public/between/journey.js'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ playerId: string }> }) {
  const coach = await currentPlayer()
  const { playerId } = await params
  const found = coach ? await journeyFor(coach.id, playerId) : null
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { doc, pages } = close(found.doc, new Date().toISOString())
  const copy = (pages as { pass?: ThreeTwoOnePass; startedOn?: string }[])
    .map(p => `${p.startedOn ?? ''}\n${p.pass ? composeSummary(p.pass) : ''}`.trim())
    .join('\n\n---\n\n')
  await saveJourney(found.gardenId, playerId, doc as Doc)
  return NextResponse.json({ ok: true, copy, pagesDeleted: pages.length })
}
