import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { VALKYRIE_PARTY_SLUG, ensurePartyExperience, isPartyAdmin } from '@/lib/valkyrie-party/service'

export const PARTY_SESSION_COOKIE = 'valkyrie_party_session'

export async function getPartySessionId() {
  const cookieStore = await cookies()
  return cookieStore.get(PARTY_SESSION_COOKIE)?.value || null
}

export async function withPartySession<T extends Record<string, unknown>>(body: T) {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(PARTY_SESSION_COOKIE)?.value || null
  const response = NextResponse.json({
    ...body,
    session_id: sessionId,
  })

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
  return {
    playerId: player?.id || null,
    playerName: player?.name || null,
    sessionId,
  }
}

export async function requirePartyPlayer() {
  const actor = await getCurrentPartyActor()
  if (!actor.playerId) {
    throw new Error('Join the party first')
  }
  return actor
}

export async function getCurrentParticipant() {
  const actor = await getCurrentPartyActor()
  if (!actor.playerId) return null
  const party = await ensurePartyExperience()
  return db.partyParticipant.findFirst({
    where: { partyId: party.id, playerId: actor.playerId },
  })
}

export async function requirePartyAdmin(adminToken?: string | null) {
  const actor = await getCurrentPartyActor()
  const allowed = await isPartyAdmin(actor.playerId, adminToken)
  if (!allowed) throw new Error('Admin access required')
  return actor
}

export async function partyParticipantSummary() {
  const participant = await getCurrentParticipant()
  return participant
    ? {
        name: participant.displayName,
        email: participant.email || '',
        keep_party_data: participant.keepPartyData,
        wants_full_signup: participant.wantsFullSignup,
      }
    : null
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

export async function findParticipantByName(displayName: string) {
  const party = await ensurePartyExperience()
  return db.partyParticipant.findFirst({
    where: {
      partyId: party.id,
      displayName: { equals: displayName.trim(), mode: 'insensitive' },
    },
  })
}

export function partyUploadPath(kind: string) {
  return `party/${VALKYRIE_PARTY_SLUG}/${kind}/${randomUUID()}`
}
