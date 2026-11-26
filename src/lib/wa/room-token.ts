/**
 * Reads the player identifier out of WorkAdventure's `userRoomToken`, the JWT a map script gets from
 * `WA.player.userRoomToken` for a signed-in player. WorkAdventure signs it with the box's SECRET_KEY (HS256);
 * put the same value in WA_ROOM_TOKEN_SECRET on bars-engine. Unset means the quest payout is off.
 */
import { verifyJwt } from './jwt'

export type RoomTokenResult =
  | { ok: true; userIdentifier: string }
  | { ok: false; status: 401 | 503; error: string }

export function userIdentifierFromRoomToken(token: unknown, secret = process.env.WA_ROOM_TOKEN_SECRET || ''): RoomTokenResult {
  if (!secret) return { ok: false, status: 503, error: 'WA_ROOM_TOKEN_SECRET is not set on bars-engine' }
  if (typeof token !== 'string' || !token) return { ok: false, status: 401, error: 'no room token' }
  const r = verifyJwt(token, secret)
  if (!r.ok) return { ok: false, status: 401, error: `room token ${r.reason}` }
  const id = r.payload.identifier ?? r.payload.sub
  if (typeof id !== 'string' || !id.trim()) return { ok: false, status: 401, error: 'room token has no identifier' }
  return { ok: true, userIdentifier: id.trim() }
}
