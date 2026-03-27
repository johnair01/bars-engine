import type { Instance } from '@prisma/client'
import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'

/**
 * Resolve which Instance powers `/event/donate` (+ wizard) and self-report.
 * When `campaignRef` is set (e.g. `bruised-banana`), use that residency's Instance.
 * When absent, fall back to the globally active instance (legacy behavior).
 *
 * If `campaignRef` is non-empty but no row matches, returns **null** (do not fall back — avoids wrong payee).
 */
export async function getInstanceForDonation(campaignRef?: string | null): Promise<Instance | null> {
  const t = campaignRef?.trim() ?? ''
  if (!t) {
    return getActiveInstance()
  }

  try {
    // If multiple rows share campaignRef, prefer non–event-mode residency, then newest.
    const rows = await db.instance.findMany({
      where: { campaignRef: t },
      orderBy: [{ isEventMode: 'asc' }, { createdAt: 'desc' }],
      take: 1,
    })
    return rows[0] ?? null
  } catch (e) {
    console.warn('[getInstanceForDonation]', e)
    return null
  }
}
