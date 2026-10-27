import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { claimGuest, validatePassport, type Passport } from './passport'

/** The signed-in player's passport, or null before their first claim. A stored record that fails the contract reads as null. */
export async function passportOf(playerId: string): Promise<Passport | null> {
  const row = await db.passport.findUnique({ where: { playerId } })
  if (!row) return null
  const r = validatePassport(row.data)
  return r.ok ? r.passport : null
}

/**
 * Claim-on-sign-in: folds a guest passport into the player's (claimGuest). The same guest passport claimed again changes
 * nothing, and a player with no passport yet gets one made from the guest's.
 */
export async function claim(player: { id: string; name: string }, guest: Passport): Promise<Passport> {
  const row = await db.passport.findUnique({ where: { playerId: player.id } })
  const current = row ? validatePassport(row.data) : null
  const server = current?.ok ? current.passport : null
  const next = claimGuest(server, guest, player)
  const ids = Array.from(new Set([...(row?.claimedGuestIds ?? []), ...(guest.player.guest_id ? [guest.player.guest_id] : [])]))
  const data = next as unknown as Prisma.InputJsonValue
  await db.passport.upsert({ where: { playerId: player.id }, create: { playerId: player.id, data, claimedGuestIds: ids }, update: { data, claimedGuestIds: ids } })
  return next
}
