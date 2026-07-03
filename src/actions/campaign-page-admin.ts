'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { normalizeCampaignPageOverrides } from '@/lib/campaign-page-editing'

type ActionState = { ok?: boolean; error?: string } | null

const EDITOR_ROLES = ['owner', 'steward']

async function getActorId(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Authentication required')
  return playerId
}

async function isAdmin(playerId: string): Promise<boolean> {
  const admin = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
    select: { id: true },
  })
  return !!admin
}

async function canEditDbCampaign(playerId: string, campaignId: string): Promise<boolean> {
  if (await isAdmin(playerId)) return true

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { instanceId: true, createdById: true },
  })
  if (!campaign) return false
  if (campaign.createdById === playerId) return true

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
    where: { campaignId_playerId: { campaignId, playerId } },
    select: { role: true },
  })

  return campaignMembership?.role === 'OWNER' || campaignMembership?.role === 'STEWARD'
}

function formText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export async function saveCampaignLandingPageContent(
  _prevState: ActionState,
  formData: FormData
) {
  try {
    const actorId = await getActorId()
    const slug = formText(formData, 'slug')
    if (!slug) throw new Error('Campaign page missing')

    const overrides = normalizeCampaignPageOverrides({
      name: formText(formData, 'name'),
      description: formText(formData, 'description'),
      allyshipDomain: formText(formData, 'allyshipDomain'),
      wakeUpContent: formText(formData, 'wakeUpContent'),
      showUpContent: formText(formData, 'showUpContent'),
      storyBridgeCopy: formText(formData, 'storyBridgeCopy'),
      posterImageUrl: formText(formData, 'posterImageUrl'),
    })

    const campaign = await db.campaign.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!campaign) throw new Error('Campaign not found')

    if (!(await canEditDbCampaign(actorId, campaign.id))) {
      throw new Error('Owner or steward access required')
    }

    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        name: overrides.name,
        description: overrides.description,
        allyshipDomain: overrides.allyshipDomain,
        wakeUpContent: overrides.wakeUpContent,
        showUpContent: overrides.showUpContent,
        storyBridgeCopy: overrides.storyBridgeCopy,
        theme: overrides.posterImageUrl
          ? {
              upsert: {
                create: { posterImageUrl: overrides.posterImageUrl },
                update: { posterImageUrl: overrides.posterImageUrl },
              },
            }
          : undefined,
      },
    })

    await db.adminAuditLog.create({
      data: {
        adminId: actorId,
        action: 'campaign_page_update',
        target: slug,
        payload: JSON.stringify({ fields: Object.keys(overrides) }),
      },
    })

    revalidatePath(`/campaign/${encodeURIComponent(slug)}`)
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save campaign page' }
  }
}
