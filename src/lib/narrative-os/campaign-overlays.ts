/**
 * Campaign overlays — optional content injected into Narrative OS spaces (Phase 4 mock).
 * No DB; keyed by campaign ref slug (e.g. bruised-banana).
 */

import type { CampaignOverlay, SpaceId } from './types'

/** URL-safe campaign ref for API routes (alphanumeric + hyphens). */
export function isCampaignRefSlug(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,127}$/.test(id)
}

/** Known mock keys — extend when adding fixtures. */
export const MOCK_OVERLAY_CAMPAIGN_IDS = ['bruised-banana', 'bruised-banana-house'] as const

const MOCK_OVERLAYS: Record<string, CampaignOverlay[]> = {
  'bruised-banana': [
    {
      id: 'bb-overlay-lib-1',
      sourceCampaignId: 'bruised-banana',
      targetSpaceId: 'library',
      title: 'Residency shelf',
      summary: 'Bruised Banana wiki trail and campaign lore — start here.',
      priority: 20,
    },
    {
      id: 'bb-overlay-dojo-1',
      sourceCampaignId: 'bruised-banana',
      targetSpaceId: 'dojo',
      title: 'Playbook drills',
      summary: 'Nation + archetype practice aligned to this residency.',
      priority: 15,
    },
    {
      id: 'bb-overlay-for-1',
      sourceCampaignId: 'bruised-banana',
      targetSpaceId: 'forest',
      title: 'Campaign field',
      summary: 'Hub, board, stalls — collective Show Up for this instance.',
      priority: 25,
    },
    {
      id: 'bb-overlay-forge-1',
      sourceCampaignId: 'bruised-banana',
      targetSpaceId: 'forge',
      title: 'Charge → BAR path',
      summary: 'Metabolize residency charge into BARs and visible commitments.',
      priority: 18,
    },
  ],
  'bruised-banana-house': [
    {
      id: 'bbh-overlay-lib-1',
      sourceCampaignId: 'bruised-banana-house',
      targetSpaceId: 'library',
      title: 'House handbook',
      summary: 'Recurring residency + house rules in wiki.',
      priority: 12,
    },
    {
      id: 'bbh-overlay-for-1',
      sourceCampaignId: 'bruised-banana-house',
      targetSpaceId: 'forest',
      title: 'House room',
      summary: 'Spatial / lobby hooks for house instance playtests.',
      priority: 10,
    },
  ],
}

export function listCampaignOverlays(campaignId: string): CampaignOverlay[] {
  const list = MOCK_OVERLAYS[campaignId]
  if (!list?.length) return []
  return [...list].sort((a, b) => b.priority - a.priority)
}

export function overlaysForSpace(campaignId: string, space: SpaceId): CampaignOverlay[] {
  return listCampaignOverlays(campaignId).filter((o) => o.targetSpaceId === space)
}

export function countOverlaysBySpace(overlays: CampaignOverlay[]): Map<SpaceId, number> {
  const m = new Map<SpaceId, number>()
  for (const o of overlays) {
    m.set(o.targetSpaceId, (m.get(o.targetSpaceId) ?? 0) + 1)
  }
  return m
}
