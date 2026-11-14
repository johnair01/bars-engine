/**
 * @route PUT /api/between/:gardenId/coin
 * @entity VIBULON
 * @description The coin turn: finish the player's bare coin once (colour and material) and keep it as their coin style, or change the style for the next coins
 * @permissions a member of the garden; only the coin's maker finishes it
 * @relationships PLAYER (BetweenPrivate pouch), VIBULON (face)
 * @example PUT /api/between/clx.../coin { "vibulonId": "clv...", "color": "jade", "mat": "brass" }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer, whoIs } from '@/lib/between/store'
import { finishCoin } from '@/lib/between/coin'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await params
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to turn your coin', code: 'unauthenticated' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { vibulonId?: unknown; color?: unknown; mat?: unknown } | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Send JSON', code: 'invalid_argument' }, { status: 400 })
  const found = await whoIs(gardenId, player.id, null)
  if (!found) return NextResponse.json({ error: 'There is no garden here', code: 'not_found' }, { status: 404 })
  if (!found.who.member) return NextResponse.json({ error: 'Only a member of the garden turns a coin here', code: 'permission_denied' }, { status: 403 })
  const res = await db.$transaction((tx) => finishCoin(tx, { gardenId, playerId: player.id, vibulonId: body.vibulonId, color: body.color, mat: body.mat }))
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.code }, { status: res.status })
  return NextResponse.json({ ok: true, style: res.style, face: res.face ?? null })
}
