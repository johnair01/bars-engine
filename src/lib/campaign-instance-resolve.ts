/**
 * Resolve `Instance` for campaign hub / Kotter flows (ref or slug + active fallback).
 */

import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'
import type { AllyshipDomain } from '@/lib/kotter'

export const CAMPAIGN_INSTANCE_HUB_SELECT = {
  campaignRef: true,
  slug: true,
  kotterStage: true,
  allyshipDomain: true,
} as const

export type CampaignInstanceHubRow = {
  campaignRef: string | null
  slug: string | null
  kotterStage: number | null
  allyshipDomain: string | null
}

const VALID_DOMAINS: readonly AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
]

/**
 * Validate a campaign instance's domain, or say there isn't one.
 *
 * This used to return GATHERING_RESOURCES for any missing or unrecognised value — a silent default that made a
 * domainless instance produce Gather quests with nobody choosing. Instance.allyshipDomain is nullable, so the
 * fallback was reachable, not theoretical (Wendell, 2026-11-20: "a default here is exactly how Gather Resources
 * silently became every quest's answer"). Returning null forces every caller to decide: carry a real domain, or
 * stop and ask a person. There is no third option.
 */
export function clampCampaignAllyshipDomain(d: string | null | undefined): AllyshipDomain | null {
  const x = d as AllyshipDomain | null | undefined
  return x && VALID_DOMAINS.includes(x) ? x : null
}

export async function resolveCampaignInstanceForRef(
  campaignRef: string,
): Promise<CampaignInstanceHubRow | null> {
  const ref = campaignRef.trim()
  let inst = await db.instance.findFirst({
    where: { OR: [{ campaignRef: ref }, { slug: ref }] },
    select: CAMPAIGN_INSTANCE_HUB_SELECT,
  })
  if (!inst) {
    const active = await getActiveInstance()
    if (active) {
      inst = await db.instance.findUnique({
        where: { id: active.id },
        select: CAMPAIGN_INSTANCE_HUB_SELECT,
      })
    }
  }
  return inst
}

export function resolvedCampaignRefFromRow(
  row: CampaignInstanceHubRow,
  fallbackInput: string,
): string {
  return (row.campaignRef ?? row.slug ?? fallbackInput).trim()
}
