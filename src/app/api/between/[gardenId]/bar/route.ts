/**
 * @route POST /api/between/:gardenId/bar
 * @entity CUSTOM_BAR
 * @description Write a BAR at the hearth with a kept ember (private BAR, one vibeulon minted with its coin face), or offer a written BAR (public, its vibeulon staked)
 * @permissions a member of the garden; only the ember's holder writes, only the BAR's maker offers
 * @relationships PLAYER (BetweenPrivate pouch), CUSTOM_BAR, VIBULON
 * @example POST /api/between/clx.../bar { "emberAt": "e1", "mark": "I said it kindly" }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer, whoIs } from '@/lib/between/store'
import { writeBar } from '@/lib/between/bar'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await params
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to write a BAR', code: 'unauthenticated' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Send JSON', code: 'invalid_argument' }, { status: 400 })
  const found = await whoIs(gardenId, player.id, null)
  if (!found) return NextResponse.json({ error: 'There is no garden here', code: 'not_found' }, { status: 404 })
  if (!found.who.member) return NextResponse.json({ error: 'Only a member of the garden writes a BAR here', code: 'permission_denied' }, { status: 403 })
  const res = await db.$transaction((tx) => writeBar(tx, { gardenId, playerId: player.id, emberAt: body.emberAt, mark: body.mark, barId: body.barId, offer: body.offer }))
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.code }, { status: res.status })
  const { ok: _ok, ...out } = res
  return NextResponse.json(out)
}
