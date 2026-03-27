import { db } from '@/lib/db'

/** When no instance / ref is configured — BB residency default. */
export const DEFAULT_MARKETPLACE_CAMPAIGN_REF = 'bruised-banana'

/**
 * Campaign ref for Vault / global nav marketplace links — follows active app instance
 * (`app_config.activeInstanceId` → `Instance.campaignRef` or `slug`), not a hardcoded slug.
 */
export async function resolveMarketplaceCampaignRef(): Promise<string> {
  try {
    const cfg = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { activeInstanceId: true },
    })
    let row: { campaignRef: string | null; slug: string | null } | null = null
    if (cfg?.activeInstanceId) {
      row = await db.instance.findUnique({
        where: { id: cfg.activeInstanceId },
        select: { campaignRef: true, slug: true },
      })
    }
    if (!row) {
      row = await db.instance.findFirst({
        where: { isEventMode: true },
        orderBy: { createdAt: 'desc' },
        select: { campaignRef: true, slug: true },
      })
    }
    const ref = row?.campaignRef?.trim() || row?.slug?.trim()
    return ref || DEFAULT_MARKETPLACE_CAMPAIGN_REF
  } catch {
    return DEFAULT_MARKETPLACE_CAMPAIGN_REF
  }
}
