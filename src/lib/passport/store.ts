import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { claimGuest, countEarlierMoves, EARLIER_MOVES_MARK, recordMove, validatePassport, type Passport } from './passport'

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

/** A new player's first passport, with nothing in it yet. */
export function blankPassport(player: { id: string; name: string }, at = new Date().toISOString()): Passport {
  return { v: 1, player: { id: player.id, name: player.name, guest_id: null }, spirits: [], hand: [], qi: 0, vibeulons: 0, embers: [], places_reached: [], updated_at: at }
}

/**
 * T006 (cultivated character, FR-003): one completed move adds to the sheet's count once. Read, record and write run in one
 * serializable transaction, so two tabs finishing the same attempt cannot both count it. A stored record that fails the
 * contract is left alone rather than overwritten. Honest limit: nothing here proves the move happened in life; it proves
 * only that one attempt id counts once.
 */
export async function recordCompletedMoveFor(player: { id: string; name: string }, attemptId: string): Promise<{ counted: boolean }> {
  return db.$transaction(
    async tx => {
      const row = await tx.passport.findUnique({ where: { playerId: player.id } })
      let current: Passport
      if (row) {
        const r = validatePassport(row.data)
        if (!r.ok) throw new Error('stored passport fails the contract')
        current = r.passport
      } else current = blankPassport(player)
      const { passport, counted } = recordMove(current, attemptId)
      if (!counted) return { counted }
      const data = passport as unknown as Prisma.InputJsonValue
      await tx.passport.upsert({ where: { playerId: player.id }, create: { playerId: player.id, data, claimedGuestIds: [] }, update: { data } })
      return { counted }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

/**
 * cc-rs-qi-earlier-moves (Wendell, 2026-11-21, answer A): counts the moves this player completed before the glow existed,
 * once. The record of them is the player's quest move logs (QuestMoveLog), the only completed moves stored before the sheet
 * had a count; the deck's move attempts were never saved. The mark in the sheet makes a second call change nothing, and
 * the transaction is serializable so two tabs cannot both count. Returns how many moves it added (0 when already counted).
 */
export async function countEarlierMovesFor(player: { id: string; name: string }): Promise<{ counted: number }> {
  return db.$transaction(
    async tx => {
      const row = await tx.passport.findUnique({ where: { playerId: player.id } })
      let current: Passport
      if (row) {
        const r = validatePassport(row.data)
        if (!r.ok) return { counted: 0 }
        current = r.passport
      } else current = blankPassport(player)
      if (current.sheet?.counted.includes(EARLIER_MOVES_MARK)) return { counted: 0 }
      const moves = await tx.questMoveLog.count({ where: { playerId: player.id } })
      const { passport, counted } = countEarlierMoves(current, moves)
      const data = passport as unknown as Prisma.InputJsonValue
      await tx.passport.upsert({ where: { playerId: player.id }, create: { playerId: player.id, data, claimedGuestIds: [] }, update: { data } })
      return { counted }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}
