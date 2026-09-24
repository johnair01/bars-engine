import crypto from 'crypto'
import { cookies } from 'next/headers'

export const FAMILY_ROOM_SLUG = 'mom'
const ACCESS_COOKIE = 'family_room_access'
const PARTICIPANT_COOKIE = 'family_room_participant'

function secret() {
  const value = process.env.FAMILY_ROOM_SESSION_SECRET
  if (value) return value
  if (process.env.NODE_ENV !== 'production') return 'local-family-room-secret-change-before-sharing'
  throw new Error('FAMILY_ROOM_SESSION_SECRET must be set in production.')
}

function configuredPassphrase() {
  const value = process.env.FAMILY_ROOM_PASSWORD
  if (value) return value
  if (process.env.NODE_ENV !== 'production') return 'family-room-local-only'
  throw new Error('FAMILY_ROOM_PASSWORD must be set in production.')
}

export const hashParticipantToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex')

/** A stable, non-reversible rate-limit key. Raw IP addresses are never stored. */
export const hashAccessIdentity = (identity: string) =>
  crypto.createHmac('sha256', secret()).update(identity).digest('hex')

const accessValue = () => crypto.createHmac('sha256', secret()).update('family-room:v1').digest('hex')

export function isValidPassphrase(value: string) {
  const expected = Buffer.from(configuredPassphrase())
  const received = Buffer.from(value)
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

export async function hasFamilyRoomAccess() {
  const store = await cookies()
  const candidate = store.get(ACCESS_COOKIE)?.value
  if (!candidate) return false
  const expected = accessValue()
  return candidate.length === expected.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))
}

export async function participantToken() {
  const store = await cookies()
  return store.get(PARTICIPANT_COOKIE)?.value ?? null
}

export async function grantFamilyRoomAccess(token: string) {
  const store = await cookies()
  const common = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 }
  store.set(ACCESS_COOKIE, accessValue(), common)
  store.set(PARTICIPANT_COOKIE, token, common)
}
