'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'

export type CampaignLandingData = {
  instance: {
    name: string
    targetDescription: string | null
    primaryCampaignDomain: string | null
    allyshipDomain: string | null
    slug: string
    campaignRef: string | null
  }
  inviter: { name: string } | null
  starterQuest: { id: string; title: string } | null
  firstQuestCta: { questId: string; label: string }
}

/**
 * Resolve campaign landing data for /campaigns/landing/[slug].
 * Instance slug in URL; inviter from invite token or player.invitedBy; starter quest from invite or campaign pool.
 */
export async function getCampaignLandingData(
  slug: string,
  inviteToken?: string | null
): Promise<CampaignLandingData | null> {
  const instance = await db.instance.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      targetDescription: true,
      primaryCampaignDomain: true,
      allyshipDomain: true,
      campaignRef: true,
    },
  })

  if (!instance) return null

  const campaignRef = instance.campaignRef ?? instance.slug

  // Resolve inviter and starter quest from invite (if token) or player
  let inviter: { name: string } | null = null
  let starterQuest: { id: string; title: string } | null = null

  if (inviteToken) {
    const invite = await db.invite.findUnique({
      where: { token: inviteToken, status: 'active' },
      include: {
        forger: { select: { name: true } },
        starterQuest: { select: { id: true, title: true } },
      },
    })
    if (invite?.forger) inviter = { name: invite.forger.name }
    if (invite?.starterQuest) starterQuest = { id: invite.starterQuest.id, title: invite.starterQuest.title }
  }

  if (!inviter) {
    const player = await getCurrentPlayer()
    if (player?.invitedByPlayerId) {
      const inviterPlayer = await db.player.findUnique({
        where: { id: player.invitedByPlayerId },
        select: { name: true },
      })
      if (inviterPlayer) inviter = { name: inviterPlayer.name }
    }
  }

  if (!starterQuest) {
    const firstQuest = await db.customBar.findFirst({
      where: {
        campaignRef,
        type: { in: ['quest', 'onboarding'] },
        status: 'active',
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true },
    })
    if (firstQuest) {
      starterQuest = { id: firstQuest.id, title: firstQuest.title }
    }
  }

  const firstQuestCta = starterQuest
    ? { questId: starterQuest.id, label: 'Accept your first quest' }
    : { questId: '', label: 'Start' }

  return {
    instance: {
      name: instance.name,
      targetDescription: instance.targetDescription,
      primaryCampaignDomain: instance.primaryCampaignDomain,
      allyshipDomain: instance.allyshipDomain,
      slug: instance.slug,
      campaignRef: instance.campaignRef,
    },
    inviter,
    starterQuest,
    firstQuestCta,
  }
}

