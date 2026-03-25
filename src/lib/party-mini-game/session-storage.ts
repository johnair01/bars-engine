/**
 * Browser session persistence for party mini-game checked squares.
 * Keys: bars.pmg.v1:{eventKey}:{miniGameId} — scope by campaign/event + game id to avoid cross-event bleed.
 */

export const PARTY_MINI_GAME_STORAGE_SCHEMA_VERSION = 1 as const

export function buildPartyMiniGameSessionKey(eventKey: string, miniGameId: string): string {
  return `bars.pmg.v${PARTY_MINI_GAME_STORAGE_SCHEMA_VERSION}:${eventKey}:${miniGameId}`
}

export function parseStoredCheckedIds(
  raw: string | null,
  validIds: ReadonlySet<string>,
): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string' && validIds.has(x))
  } catch {
    return []
  }
}

export function serializeCheckedIds(ids: Iterable<string>): string {
  return JSON.stringify([...ids].sort())
}
