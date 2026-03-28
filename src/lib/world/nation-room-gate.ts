import { slugifyName } from '@/lib/avatar-utils'

/** Room metadata needed to gate portal navigation (same instance). */
export type WorldRoomNavMeta = {
  id: string
  slug: string
  name: string
  roomType: string | null
  nationKey: string | null
}

/**
 * Resolve canonical nation key for lobby / spatial gates.
 * Prefer linked `Nation` row; fall back to `avatarConfig.nationKey` (onboarding / CYOA).
 */
export function getPlayerNationKey(player: {
  nation: { name: string } | null
  avatarConfig: string | null
}): string | null {
  if (player.nation?.name) return slugifyName(player.nation.name)
  if (player.avatarConfig) {
    try {
      const j = JSON.parse(player.avatarConfig) as { nationKey?: string }
      const k = j.nationKey?.trim().toLowerCase()
      if (k) return k
    } catch {
      /* ignore */
    }
  }
  return null
}

export function isNationRestrictedRoom(roomType: string | null | undefined): boolean {
  return roomType === 'nation_room'
}

/** When `roomNationKey` is set on a nation room, player must match (unless bypass). */
export function canAccessNationRoom(
  roomNationKey: string | null | undefined,
  playerNationKey: string | null,
  bypass: boolean
): boolean {
  if (bypass) return true
  if (!roomNationKey?.trim()) return true
  const pk = playerNationKey?.toLowerCase() ?? ''
  const rk = roomNationKey.toLowerCase()
  return pk.length > 0 && pk === rk
}

/**
 * Server-only bypass for nation rooms (SCL FR-A3): `Player.roles` admin **or**
 * `SKIP_NATION_GATE=1` in env (local cert / QA — never use NEXT_PUBLIC; keep off in production).
 */
export function resolveNationGateBypass(isAdmin: boolean): boolean {
  return isAdmin || process.env.SKIP_NATION_GATE === '1'
}

export function formatNationKeyForDisplay(key: string): string {
  return key
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
