'use server'
import { dbBase } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'

export async function updateSpriteUrl(spriteUrl: string) {
  const playerId = await requirePlayer()
  await dbBase.player.update({ where: { id: playerId }, data: { spriteUrl } })
  return { success: true }
}
