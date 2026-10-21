/**
 * @route GET /api/passport, POST /api/passport
 * @entity PLAYER
 * @description The Calrunian passport: GET reads the signed-in player's; POST { guest } claims a guest passport from the browser
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (Passport)
 * @example POST /api/passport { "guest": { "v": 1, "player": { "id": null, "name": null, "guest_id": "guest-..." }, ... } }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer } from '@/lib/between/store'
import { validatePassport } from '@/lib/passport/passport'
import { claim, passportOf } from '@/lib/passport/store'

export const dynamic = 'force-dynamic'

/** Six-faces-council pass calrunia-world1 (cw-passport): one record crosses places, behind sign-in. */
export async function GET() {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to keep a passport' }, { status: 401 })
  try {
    return NextResponse.json({ player, passport: await passportOf(player.id) })
  } catch {
    return notReady()
  }
}

/** A preview build skips migrations (scripts/build-with-env.ts), so the passports table may not be there yet. */
const notReady = () => NextResponse.json({ error: 'The passport store is not open on this deployment yet' }, { status: 503 })

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to keep a passport' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const r = validatePassport(body?.guest)
  if (!r.ok) return NextResponse.json({ error: 'Not a passport', errors: r.errors }, { status: 400 })
  if (r.passport.player.id !== null) return NextResponse.json({ error: 'Only a guest passport can be claimed' }, { status: 400 })
  try {
    return NextResponse.json({ player, passport: await claim(player, r.passport) })
  } catch {
    return notReady()
  }
}
