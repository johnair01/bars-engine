'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  getTheCrossingSupportRole,
  THE_CROSSING_CAMPAIGN_REF,
  THE_CROSSING_PARENT_CAMPAIGN_REF,
} from '@/lib/the-crossing-support-moves'

const SOURCE = 'the_crossing_campaign_landing_page'

function clean(value: FormDataEntryValue | null, max = 1000): string {
  return String(value ?? '').trim().slice(0, max)
}

async function findStewardPlayerId(): Promise<string | null> {
  const envPlayerId = process.env.THE_CROSSING_STEWARD_PLAYER_ID?.trim()
  if (envPlayerId) {
    const player = await db.player.findUnique({ where: { id: envPlayerId }, select: { id: true } })
    if (player) return player.id
  }

  const crossingCampaign = await db.campaign.findFirst({
    where: { slug: THE_CROSSING_CAMPAIGN_REF },
    select: { createdById: true },
  })
  if (crossingCampaign?.createdById) return crossingCampaign.createdById

  const parentCampaign = await db.campaign.findFirst({
    where: { OR: [{ slug: THE_CROSSING_PARENT_CAMPAIGN_REF }, { instance: { campaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF } }] },
    select: { createdById: true },
  })
  if (parentCampaign?.createdById) return parentCampaign.createdById

  const parentInstance = await db.instance.findFirst({
    where: { OR: [{ slug: THE_CROSSING_PARENT_CAMPAIGN_REF }, { campaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF }] },
    select: { id: true },
  })
  if (parentInstance) {
    const membership = await db.instanceMembership.findFirst({
      where: {
        instanceId: parentInstance.id,
        roleKey: { in: ['owner', 'steward'] },
      },
      orderBy: { createdAt: 'asc' },
      select: { playerId: true },
    })
    if (membership?.playerId) return membership.playerId
  }

  const firstPlayer = await db.player.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  return firstPlayer?.id ?? null
}

export async function submitTheCrossingSupport(formData: FormData) {
  const roleId = clean(formData.get('role'), 80)
  const role = getTheCrossingSupportRole(roleId)
  if (!role) redirect('/campaign/the-crossing?error=role')

  const contributorName = clean(formData.get('name'), 120)
  const contributorContact = clean(formData.get('contact'), 180)
  const offerSummary = clean(formData.get('offerSummary'), 180)
  const details = clean(formData.get('details'), 2400)
  const url = clean(formData.get('url'), 500)

  if (!contributorName || !contributorContact || !offerSummary) {
    redirect(`/campaign/the-crossing?role=${encodeURIComponent(role.id)}&error=missing`)
  }

  const stewardPlayerId = await findStewardPlayerId()
  if (!stewardPlayerId) {
    redirect(`/campaign/the-crossing?role=${encodeURIComponent(role.id)}&error=steward`)
  }

  const starterCardId = role.starterCardIds[0] ?? null
  const title = `[${role.label}] ${offerSummary}`

  // Campaign-captured BAR: administratively steward-owned, semantically belonging
  // to The Crossing campaign field via campaignRef + lineage metadata.
  const bar = await db.customBar.create({
    data: {
      creatorId: stewardPlayerId,
      title,
      description: details || offerSummary,
      type: 'vibe',
      reward: 0,
      visibility: 'private',
      status: 'active',
      inputs: '[]',
      rootId: 'temp',
      campaignRef: THE_CROSSING_CAMPAIGN_REF,
      allyshipDomain: role.primaryDomain,
      moveType: 'show_up',
      evidenceKind: 'support_intake',
      contextLines: JSON.stringify({
        contributorName,
        contributorContact,
        role: role.id,
        roleLabel: role.label,
        offerSummary,
        url: url || null,
      }),
      docQuestMetadata: JSON.stringify({
        source: SOURCE,
        parentCampaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF,
        campaignLineage: [THE_CROSSING_PARENT_CAMPAIGN_REF, THE_CROSSING_CAMPAIGN_REF],
        artifact: role.artifact,
        tinyMove: role.tinyMove,
        starterCardId,
        starterCardIds: role.starterCardIds,
        secondaryDomains: role.secondaryDomains,
      }),
      agentMetadata: JSON.stringify({
        sourceType: 'campaign_support_intake',
        campaignRef: THE_CROSSING_CAMPAIGN_REF,
        parentCampaignRef: THE_CROSSING_PARENT_CAMPAIGN_REF,
      }),
    },
    select: { id: true },
  })

  await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })

  revalidatePath('/campaign/the-crossing')
  redirect(`/campaign/the-crossing?thanks=1&role=${encodeURIComponent(role.id)}`)
}

