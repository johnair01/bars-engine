import { db } from '@/lib/db'

/** Resolve deliverable email for a player (account first, then contact). */
export async function getPlayerEmail(playerId: string): Promise<string | null> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: {
      contactType: true,
      contactValue: true,
      account: { select: { email: true } },
    },
  })
  if (!player) return null
  if (player.account?.email?.trim()) return player.account.email.trim().toLowerCase()
  if (player.contactType === 'email' && player.contactValue?.trim()) {
    return player.contactValue.trim().toLowerCase()
  }
  return null
}

export async function getPlayerFirstName(playerId: string): Promise<string | null> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { name: true },
  })
  if (!player?.name?.trim()) return null
  return player.name.trim().split(/\s+/)[0] ?? null
}
