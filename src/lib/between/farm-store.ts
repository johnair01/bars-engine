import type { Prisma, PrismaClient } from '@prisma/client'
import { newFarm, type Farm } from './farm'

/**
 * The server-side store of one player's farm (hole H-farm-store): the BetweenPrivate row with key "farm" on the player's
 * homeroom. The farm route reads and writes it for the player's own acts; the game master's mark writes it through
 * `updatePlayerFarm` for a gift. Both go through here, so there is one reading of the row and one way to write it.
 * `farm.ts` stays pure; this file holds only the document move, and a test hands it a small db.
 */
type Db = Pick<PrismaClient, 'betweenPrivate'>
const KEY = 'farm'
const where = (gardenId: string, playerId: string) => ({ gardenId_playerId_key: { gardenId, playerId, key: KEY } })

/** Read whatever the row holds into a well-formed farm; a missing or malformed row is a new farm. */
export function asFarm(raw: unknown): Farm {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...newFarm(), ...(raw as Partial<Farm>) } : newFarm()
}

export async function loadFarm(db: Db, gardenId: string, playerId: string): Promise<Farm> {
  const row = await db.betweenPrivate.findUnique({ where: where(gardenId, playerId) })
  return asFarm(row?.data)
}

export async function saveFarm(db: Db, gardenId: string, playerId: string, farm: Farm) {
  const data = farm as unknown as Prisma.InputJsonValue
  await db.betweenPrivate.upsert({ where: where(gardenId, playerId), create: { gardenId, playerId, key: KEY, data }, update: { data } })
}

/** Read, change, write. `change` returns the new farm, or null to write nothing (a refused act leaves the row alone). */
export async function updateFarm(db: Db, gardenId: string, playerId: string, change: (farm: Farm) => Farm | null): Promise<Farm | null> {
  const next = change(await loadFarm(db, gardenId, playerId))
  if (next) await saveFarm(db, gardenId, playerId, next)
  return next
}

/** The same, by player id alone: finds (or makes) the homeroom first. This is the door a game master's mark uses. */
export async function updatePlayerFarm(playerId: string, change: (farm: Farm) => Farm | null): Promise<Farm | null> {
  const [{ db }, { ensureHome }] = await Promise.all([import('@/lib/db'), import('./store')])
  const { home } = await ensureHome(playerId)
  if (!home) return null
  return updateFarm(db, home.id, playerId, change)
}
