/**
 * One rule for turning the identifier WorkAdventure sends into a bars-engine Player.
 *
 * The pusher relays either the OIDC `sub` (Player.id) or the account email. `/api/room/access` already tried both;
 * `/api/save-textures` and `/api/save-name` tried the id only, so a login that arrived as an email could join and
 * then fail to save (box log, 2026-11-24: three 404s from /api/save-textures). Whether that was the cause is
 * unproven; the miss log below captures the identifier to settle it.
 */
export type WaLookup<T> = {
  byId: (id: string) => Promise<T | null>
  byEmail: (email: string) => Promise<T | null>
}

export type WaLookupResult<T> = { player: T | null; via: 'id' | 'email' | 'none' }

export async function resolveWaPlayer<T>(userIdentifier: string, lookup: WaLookup<T>): Promise<WaLookupResult<T>> {
  const byId = await lookup.byId(userIdentifier)
  if (byId) return { player: byId, via: 'id' }
  const byEmail = await lookup.byEmail(userIdentifier)
  if (byEmail) return { player: byEmail, via: 'email' }
  return { player: null, via: 'none' }
}

/** What a miss prints. The identifier is the thing we could not see; it is a player id or an email, so it is
 * masked to a short, recognisable shape rather than logged whole. */
export function describeIdentifier(userIdentifier: string): string {
  const at = userIdentifier.indexOf('@')
  if (at > 0) return `email(${userIdentifier[0]}***@${userIdentifier.slice(at + 1)}) len=${userIdentifier.length}`
  return `id(${userIdentifier.slice(0, 4)}…${userIdentifier.slice(-4)}) len=${userIdentifier.length}`
}

export function logWaMiss(route: string, userIdentifier: string): void {
  console.warn(`[wa] ${route}: no player for identifier ${describeIdentifier(userIdentifier)}`)
}
