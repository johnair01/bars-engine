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

/**
 * The guest's party session id, minting one if the browser has no cookie yet.
 *
 * Join must never depend on a prior successful page load: if the party payload
 * fails for any reason — an unapplied migration, a transient database blip
 * mid-party — a guest who has no session cookie would otherwise be locked out
 * of joining entirely, with a misleading error.
 */
export async function ensurePartySessionId() {
  return (await getPartySessionId()) || randomUUID()
}

function attachSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(PARTY_SESSION_COOKIE, sessionId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })
}

export async function withPartySession<T extends Record<string, unknown>>(
  body: T,
  sessionId?: string | null,
) {
  const cookieStore = await cookies()
  const existing = cookieStore.get(PARTY_SESSION_COOKIE)?.value || null
  const resolved = sessionId || existing || randomUUID()
  const response = NextResponse.json({ ...body, session_id: resolved })
  if (existing !== resolved) attachSessionCookie(response, resolved)
  return response
}

/**
 * Error response that still establishes the session cookie. A failed party load
 * must not leave the browser sessionless, or the guest cannot join afterwards.
 */
export async function errorResponseWithSession(error: unknown, fallback: string, status = 500) {
  const cookieStore = await cookies()
  const existing = cookieStore.get(PARTY_SESSION_COOKIE)?.value || null
  const resolved = existing || randomUUID()
  const message = error instanceof Error ? error.message : fallback
  const response = NextResponse.json({ ok: false, error: message, session_id: resolved }, { status })
  if (existing !== resolved) attachSessionCookie(response, resolved)
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
