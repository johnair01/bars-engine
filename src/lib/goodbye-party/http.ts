import 'server-only'

import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { isGoodbyePartyAdmin } from './service'

/** Own cookie namespace so a guest at this party is not a guest at Valkyrie's. */
export const PARTY_SESSION_COOKIE = 'goodbye_party_session'

export async function getPartySessionId() {
  const cookieStore = await cookies()
  return cookieStore.get(PARTY_SESSION_COOKIE)?.value || null
}

export async function withPartySession<T extends Record<string, unknown>>(body: T) {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(PARTY_SESSION_COOKIE)?.value || null
  const response = NextResponse.json({ ...body, session_id: sessionId })

  if (!sessionId) {
    sessionId = randomUUID()
    response.cookies.set(PARTY_SESSION_COOKIE, sessionId, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    })
  }

  return response
}

export async function getCurrentPartyActor() {
  const player = await getCurrentPlayer()
  const sessionId = await getPartySessionId()
  return { playerId: player?.id || null, playerName: player?.name || null, sessionId }
}

export async function requirePartyPlayer() {
  const actor = await getCurrentPartyActor()
  if (!actor.playerId) throw new Error('Join the party first')
  return { ...actor, playerId: actor.playerId }
}

export async function requirePartyAdmin(adminToken?: string | null) {
  const actor = await getCurrentPartyActor()
  const allowed = await isGoodbyePartyAdmin(actor.playerId, adminToken)
  if (!allowed) throw new Error('Host access required')
  return actor
}

export function setPartyPlayerCookie(response: NextResponse, playerId: string) {
  response.cookies.set('bars_player_id', playerId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })
}

export function errorResponse(error: unknown, fallback: string, status = 400) {
  const message = error instanceof Error ? error.message : fallback
  return Response.json({ ok: false, error: message }, { status })
}
