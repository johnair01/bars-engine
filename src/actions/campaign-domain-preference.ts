'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * Update the player's campaign domain preference (multi-select).
 * Empty array = show all quests. Non-empty = filter Market to those domains.
 */
export async function updateCampaignDomainPreference(domains: string[]) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const validKeys = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING']
  const filtered = domains.filter((d) => validKeys.includes(d))

  const value = filtered.length > 0 ? JSON.stringify(filtered) : null

  await db.player.update({
    where: { id: player.id },
    data: { campaignDomainPreference: value },
  })

  revalidatePath('/bars/available')
  revalidatePath('/')
  return { success: true }
}
