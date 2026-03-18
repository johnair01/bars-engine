'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'

export type CampaignLandingData = {
  instance: {
    id: string
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
  /** When shareToken present: BAR share context for onboarding-first flow */
  shareContext: { shareToken: string; senderName: string; barTitle: string } | null
}

/**
 * Resolve campaign landing data for /campaigns/landing/[slug].
 * Instance slug in URL; inviter from invite token or player.invitedBy or shareToken; starter quest from invite or campaign pool.
 */
export async function getCampaignLandingData(
  slug: string,
  inviteToken?: string | null,
  shareToken?: string | null
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

  let shareContext: CampaignLandingData['shareContext'] = null
  if (shareToken) {
    const share = await db.barShareExternal.findUnique({
      where: { shareToken },
      select: {
        status: true,
        expiresAt: true,
        instanceId: true,
        bar: { select: { title: true } },
        fromUser: { select: { name: true } },
      },
    })
    const validInstance = !share?.instanceId || share.instanceId === instance.id
    if (share && share.status === 'pending' && new Date() < share.expiresAt && validInstance) {
      shareContext = {
        shareToken,
        senderName: share.fromUser.name,
        barTitle: share.bar.title,
      }
      if (!inviter) inviter = { name: share.fromUser.name }
    }
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
    ? { questId: starterQuest.id, label: shareContext ? 'Start orientation to view reflection' : 'Accept your first quest' }
    : { questId: '', label: shareContext ? 'Start orientation' : 'Start' }

  return {
    instance: {
      id: instance.id,
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
    shareContext,
  }
}

