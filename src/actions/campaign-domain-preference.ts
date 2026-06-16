'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { parseCampaignDomainPreference } from '@/lib/allyship-domains'

const VALID_DOMAIN_KEYS = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING']

/**
 * Update the player's campaign domain preference (multi-select).
 * Empty array = show all quests. Non-empty = filter Market to those domains.
 */
export async function updateCampaignDomainPreference(domains: string[]) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const filtered = domains.filter((d) => VALID_DOMAIN_KEYS.includes(d))

  const value = filtered.length > 0 ? JSON.stringify(filtered) : null

  await db.player.update({
    where: { id: player.id },
    data: { campaignDomainPreference: value },
  })

  revalidatePath('/bars/available')
  revalidatePath('/')
  return { success: true }
}

/**
 * Add a single allyship domain to the player's preference without removing any
 * existing ones (non-destructive). Used by the Handbook reader's House select
 * (HOOK A): tapping a House records that the player works in that domain.
 *
 * Returns { pending: true } for logged-out readers so the client can keep using
 * its localStorage fallback (mirrors createOnboardingBar / createHandbookBar).
 */
export async function addCampaignDomainPreference(
  domain: string
): Promise<{ success: true } | { pending: true } | { error: string }> {
  if (!VALID_DOMAIN_KEYS.includes(domain)) return { error: 'Unknown allyship domain' }

  const player = await getCurrentPlayer()
  if (!player) return { pending: true }

  const current = parseCampaignDomainPreference(player.campaignDomainPreference ?? null)
  if (current.includes(domain)) return { success: true } // already recorded

  const merged = Array.from(new Set([...current, domain])).filter((d) => VALID_DOMAIN_KEYS.includes(d))

  await db.player.update({
    where: { id: player.id },
    data: { campaignDomainPreference: JSON.stringify(merged) },
  })

  revalidatePath('/bars/available')
  revalidatePath('/')
  return { success: true }
}
