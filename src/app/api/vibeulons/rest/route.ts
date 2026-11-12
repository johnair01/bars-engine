/**
 * @route POST /api/vibeulons/rest
 * @entity VIBULON
 * @description Rest a coin on a page the player shares: catch a worked ember into a BAR (one coin minted), set a coin, or take it back
 * @permissions Signed-in player (bars_player_id cookie)
 * @relationships VIBULON (VibulonMark), CUSTOM_BAR (BarShare)
 * @example POST /api/vibeulons/rest { "do": "set", "barId": "bar_1" }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer } from '@/lib/between/store'
import { setCoinOnPage, takeCoinBack } from '@/lib/economy/coin-marks'
import { catchEmber } from '@/lib/economy/ember'

const PLACE = /^[a-z0-9-]{1,40}$/

/** 403 when the player does not share the page; 409 when the act cannot happen now (no coin, coin already there, ember not worked or already caught). */
export async function POST(req: NextRequest) {
  const me = await currentPlayer()
  if (!me) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { do?: string; barId?: string; emberKey?: string; place?: string } | null
  const barId = typeof body?.barId === 'string' ? body.barId.slice(0, 80) : ''
  const place = typeof body?.place === 'string' && PLACE.test(body.place) ? body.place : 'nook-hearth'
  if (!barId || !['catch', 'set', 'takeBack'].includes(body?.do ?? '')) return NextResponse.json({ error: 'Send { do: catch | set | takeBack, barId }.' }, { status: 400 })

  const result = await db.$transaction(async (tx) => {
    if (body!.do === 'takeBack') {
      const had = await takeCoinBack(tx, { playerId: me.id, barId, place })
      return had ? { ok: true as const } : { status: 409 as const, error: 'You have no coin on this page.' }
    }
    if (body!.do === 'set') return setCoinOnPage(tx, { playerId: me.id, barId, place })
    const emberKey = typeof body?.emberKey === 'string' ? body.emberKey.slice(0, 160) : ''
    if (!emberKey) return { status: 409 as const, error: 'That ember is not worked yet.' }
    return catchEmber(tx, { playerId: me.id, barId, emberKey, place })
  })
  if ('status' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json(result)
}
