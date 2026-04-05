/**
 * BAR Forge routes that accept either Custom GPT Bearer (BARS_API_KEY) or logged-in player session.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'

export type ForgeOrSessionOk =
  | { ok: true; via: 'bearer' }
  | { ok: true; via: 'session'; playerId: string }

export type ForgeOrSessionResult = ForgeOrSessionOk | { ok: false; response: NextResponse }

/**
 * Valid Bearer OR authenticated player. If BARS_API_KEY is unset, session-only is allowed (local dev).
 */
export async function requireForgeBearerOrSession(request: NextRequest): Promise<ForgeOrSessionResult> {
  const expected = process.env.BARS_API_KEY?.trim()
  const auth = request.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
  if (expected && bearer === expected) {
    return { ok: true, via: 'bearer' }
  }

  const player = await getCurrentPlayer()
  if (player) {
    return { ok: true, via: 'session', playerId: player.id }
  }

  if (expected) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: 'Unauthorized — set BARS_API_KEY or sign in' },
      { status: 401 }
    ),
  }
}
