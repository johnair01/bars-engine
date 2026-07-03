import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export type CampaignPageOverrides = {
  name?: string
  description?: string
  allyshipDomain?: string
  wakeUpContent?: string
  showUpContent?: string
  storyBridgeCopy?: string
  posterImageUrl?: string
}

const EDITOR_ROLES = ['owner', 'steward']

type EditableCampaignPageData = {
  id: string
  name: string
  description: string | null
  allyshipDomain: string | null
  wakeUpContent: string | null
  showUpContent: string | null
  storyBridgeCopy: string | null
  instanceId: string
  theme: {
    bgGradient: string | null
    bgDeep: string | null
    titleColor: string | null
    accentPrimary: string | null
    accentSecondary: string | null
    accentTertiary: string | null
    fontDisplayKey: string | null
    posterImageUrl: string | null
    cssVarOverrides: Record<string, string> | null
  } | null
}

function textOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function normalizeCampaignPageOverrides(input: unknown): CampaignPageOverrides {
  const raw = (input && typeof input === 'object' ? input : {}) as CampaignPageOverrides
  return {
    name: textOrUndefined(raw.name),
    description: textOrUndefined(raw.description),
    allyshipDomain: textOrUndefined(raw.allyshipDomain),
    wakeUpContent: textOrUndefined(raw.wakeUpContent),
    showUpContent: textOrUndefined(raw.showUpContent),
    storyBridgeCopy: textOrUndefined(raw.storyBridgeCopy),
    posterImageUrl: textOrUndefined(raw.posterImageUrl),
  }
}

export async function currentPlayerCanEditCampaignPage(
  campaign: EditableCampaignPageData
): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return false

    const admin = await db.playerRole.findFirst({
      where: { playerId, role: { key: 'admin' } },
      select: { id: true },
    })
    if (admin) return true

    if (campaign.id.startsWith('static-')) return false

    const instanceMembership = await db.instanceMembership.findUnique({
      where: {
        instanceId_playerId: {
          instanceId: campaign.instanceId,
          playerId,
        },
      },
      select: { roleKey: true },
    })

    if (instanceMembership?.roleKey && EDITOR_ROLES.includes(instanceMembership.roleKey)) {
      return true
    }

    const campaignMembership = await db.campaignMembership.findUnique({
      where: {
        campaignId_playerId: {
          campaignId: campaign.id,
          playerId,
        },
      },
      select: { role: true },
    })

    return campaignMembership?.role === 'OWNER' || campaignMembership?.role === 'STEWARD'
  } catch {
    return false
  }
}
