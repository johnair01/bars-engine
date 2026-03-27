/**
 * Campaign overlays for the active instance — DB-only (no `use server` actions).
 * Avoids importing `@/actions/instance` from Route Handlers / fragile RSC edges.
 * Mirrors getActiveInstance resolution: AppConfig.activeInstanceId → else latest event-mode instance.
 */

import { db } from '@/lib/db'
import { listCampaignOverlays } from './campaign-overlays'
import type { CampaignOverlay } from './types'

async function readActiveInstanceId(): Promise<string | null> {
  try {
    const row = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { activeInstanceId: true },
    })
    return row?.activeInstanceId ?? null
  } catch {
    // Schema drift: activeInstanceId column missing on older DBs
    return null
  }
}

export async function resolveNarrativeCampaignOverlays(): Promise<{
  campaignRef: string | null
  overlays: CampaignOverlay[]
}> {
  try {
    const activeId = await readActiveInstanceId()
    let inst: { campaignRef: string | null } | null = null
    if (activeId) {
      inst = await db.instance.findUnique({
        where: { id: activeId },
        select: { campaignRef: true },
      })
    }
    if (!inst) {
      inst = await db.instance.findFirst({
        where: { isEventMode: true },
        orderBy: { createdAt: 'desc' },
        select: { campaignRef: true },
      })
    }
    const ref = inst?.campaignRef?.trim() || null
    if (!ref) return { campaignRef: null, overlays: [] }
    return { campaignRef: ref, overlays: listCampaignOverlays(ref) }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[narrative-os] resolveNarrativeCampaignOverlays failed:', e)
    }
    return { campaignRef: null, overlays: [] }
  }
}
