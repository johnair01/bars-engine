/**
 * @route POST /api/between/carry
 * @entity PLAYER
 * @description Carries a spark from the Between's claude.ai artifact store into a bars-engine garden owned by the council's player, once
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @relationships PLAYER (BetweenGarden)
 * @example POST /api/between/carry { "from": "artifact:NTi4jcpaHkDEMnqpVA9LBq", "garden": { "phase": "spark", "setup": { ... } } }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { plant } from '@/lib/between/store'
import { carriedGarden, type Doc } from '@/lib/between/rules'

/**
 * bh-spark-carries (six-faces-council, 2026-10-17): the spark Wendell planted in the artifact's store moves once into
 * these tables, so nothing of it passes through a repo, a log or a chat reply. The garden belongs to
 * COUNCIL_MENU_PLAYER_ID, the player the council's token already speaks for. Carrying the same `from` twice returns
 * the garden the first carry made.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const owner = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !owner || !tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { from?: string; garden?: Doc } | null
  const from = typeof body?.from === 'string' ? body.from.slice(0, 120) : ''
  const garden = body?.garden && typeof body.garden === 'object' ? carriedGarden(owner, body.garden, from) : null
  if (!from || !garden) return NextResponse.json({ error: 'Send { from, garden } with a spark garden' }, { status: 400 })
  const have = await db.betweenGarden.findFirst({ where: { startedById: owner, data: { path: ['carriedFrom'], equals: from } }, select: { id: true } })
  if (have) return NextResponse.json({ id: have.id, carried: 'already' })
  // He may have planted the spark again on bars-engine while the carry waited: then there is nothing to carry.
  const planted = await db.betweenGarden.findFirst({ where: { startedById: owner, NOT: { data: { path: ['phase'], equals: 'closed' } } }, select: { id: true } })
  if (planted) return NextResponse.json({ id: planted.id, carried: 'not needed' })
  const { id } = await plant(owner, garden)
  return NextResponse.json({ id, carried: 'now' })
}
