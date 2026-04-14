'use server'

/**
 * Campaign Home Server Actions — data for the post-join campaign home page.
 *
 * After joining a campaign, the member lands on `/campaign/[slug]/home`
 * showing actionable items: welcome quest, character creation prompt,
 * first scene, or contribution opportunities.
 *
 * Auth: requires authenticated player with InstanceMembership for the campaign's instance.
 * Pattern: follows campaign-crud.ts auth helpers and getCampaignSkin theming.
 */

import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignHomeActivityItem = {
  id: string
  type: 'welcome' | 'quest' | 'character_creation' | 'contribution' | 'scene' | 'explore'
  title: string
  description: string
  href: string
  /** Priority ordering (lower = more urgent) */
  priority: number
  /** Whether this item has been completed by the player */
  completed: boolean
  /** Visual element channel for UI_COVENANT encoding */
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water'
}

export type CampaignHomeData = {
  campaign: {
    id: string
    slug: string
    name: string
    description: string | null
    allyshipDomain: string | null
    wakeUpContent: string | null
    showUpContent: string | null
    storyBridgeCopy: string | null
    status: string
    instanceId: string
    instanceName: string
    instanceSlug: string
  }
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
  membership: {
    roleKey: string | null
    joinedAt: string
  }
  /** Actionable items for the player, ordered by priority */
  activityItems: CampaignHomeActivityItem[]
  /** Quest templates configured for this campaign (from questTemplateConfig) */
  questTemplateCount: number
  /** Whether the player has Steward+ role */
  isStewardPlus: boolean
}

// ---------------------------------------------------------------------------
// getCampaignHomeData
// ---------------------------------------------------------------------------

/**
 * Fetch all data needed for the campaign home page.
 *
 * Returns campaign details, theming, membership info, and actionable
 * activity items for the authenticated member.
 *
 * Returns { error } if:
 * - Not authenticated
 * - Campaign not found or not visible (APPROVED/LIVE)
 * - Player is not a member of the campaign's instance
 */
export async function getCampaignHomeData(
  campaignSlug: string
): Promise<{ data: CampaignHomeData } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  // Fetch campaign with theme + instance
  const campaign = await db.campaign.findUnique({
    where: { slug: campaignSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      status: true,
      allyshipDomain: true,
      wakeUpContent: true,
      showUpContent: true,
      storyBridgeCopy: true,
      questTemplateConfig: true,
      instanceId: true,
      instance: {
        select: {
          id: true,
          name: true,
          slug: true,
          campaignRef: true,
        },
      },
      theme: true,
    },
  })

  if (!campaign) return { error: 'Campaign not found' }

  // Only APPROVED or LIVE campaigns are accessible to members
  if (campaign.status !== 'APPROVED' && campaign.status !== 'LIVE') {
    return { error: 'Campaign is not currently active' }
  }

  // Check membership
  const membership = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: {
        instanceId: campaign.instanceId,
        playerId,
      },
    },
    select: {
      roleKey: true,
      createdAt: true,
    },
  })

  if (!membership) {
    return { error: 'You are not a member of this campaign' }
  }

  const isStewardPlus =
    membership.roleKey === 'owner' ||
    membership.roleKey === 'steward' ||
    // Check admin role
    !!(await db.playerRole.findFirst({
      where: { playerId, role: { key: 'admin' } },
      select: { id: true },
    }))

  // Count quest templates from config
  const questTemplateConfig = Array.isArray(campaign.questTemplateConfig)
    ? (campaign.questTemplateConfig as Record<string, unknown>[])
    : []
  const questTemplateCount = questTemplateConfig.length

  // Build activity items
  const activityItems = await buildActivityItems({
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      name: campaign.name,
      wakeUpContent: campaign.wakeUpContent,
      allyshipDomain: campaign.allyshipDomain,
      instanceSlug: campaign.instance.slug,
      campaignRef: campaign.instance.campaignRef,
    },
    playerId,
    questTemplateConfig,
    isStewardPlus,
  })

  return {
    data: {
      campaign: {
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        description: campaign.description,
        allyshipDomain: campaign.allyshipDomain,
        wakeUpContent: campaign.wakeUpContent,
        showUpContent: campaign.showUpContent,
        storyBridgeCopy: campaign.storyBridgeCopy,
        status: campaign.status,
        instanceId: campaign.instanceId,
        instanceName: campaign.instance.name,
        instanceSlug: campaign.instance.slug,
      },
      theme: campaign.theme
        ? {
            bgGradient: campaign.theme.bgGradient,
            bgDeep: campaign.theme.bgDeep,
            titleColor: campaign.theme.titleColor,
            accentPrimary: campaign.theme.accentPrimary,
            accentSecondary: campaign.theme.accentSecondary,
            accentTertiary: campaign.theme.accentTertiary,
            fontDisplayKey: campaign.theme.fontDisplayKey,
            posterImageUrl: campaign.theme.posterImageUrl,
            cssVarOverrides: campaign.theme.cssVarOverrides as Record<string, string> | null,
          }
        : null,
      membership: {
        roleKey: membership.roleKey,
        joinedAt: membership.createdAt.toISOString(),
      },
      activityItems,
      questTemplateCount,
      isStewardPlus,
    },
  }
}

// ---------------------------------------------------------------------------
// Activity item builder — assembles the "something to do" list
// ---------------------------------------------------------------------------

type BuildActivityContext = {
  campaign: {
    id: string
    slug: string
    name: string
    wakeUpContent: string | null
    allyshipDomain: string | null
    instanceSlug: string
    campaignRef: string | null
  }
  playerId: string
  questTemplateConfig: Record<string, unknown>[]
  isStewardPlus: boolean
}

async function buildActivityItems(
  ctx: BuildActivityContext
): Promise<CampaignHomeActivityItem[]> {
  const items: CampaignHomeActivityItem[] = []
  const campaignRef = ctx.campaign.campaignRef ?? ctx.campaign.slug

  // 1. Welcome quest — always present for new members
  //    "Learn the story" is the first action for any campaign member
  if (ctx.campaign.wakeUpContent) {
    items.push({
      id: `welcome-${ctx.campaign.id}`,
      type: 'welcome',
      title: 'Learn the Story',
      description:
        ctx.campaign.wakeUpContent.length > 120
          ? ctx.campaign.wakeUpContent.slice(0, 120) + '…'
          : ctx.campaign.wakeUpContent,
      href: `/campaign/${encodeURIComponent(ctx.campaign.slug)}`,
      priority: 1,
      completed: false,
      element: 'water',
    })
  }

  // 2. Character creation — check for CHARACTER_CREATOR adventures
  const characterAdventure = await db.adventure.findFirst({
    where: {
      campaignRef,
      adventureType: 'CHARACTER_CREATOR',
      status: 'ACTIVE',
    },
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' },
  })

  if (characterAdventure) {
    // Check if player already has a character playbook
    const existingPlaybook = await db.playerPlaybook.findFirst({
      where: {
        adventureId: characterAdventure.id,
        playerId: ctx.playerId,
      },
      select: { id: true },
    })

    items.push({
      id: `character-${characterAdventure.id}`,
      type: 'character_creation',
      title: existingPlaybook ? 'View Your Character' : 'Create Your Character',
      description: existingPlaybook
        ? 'Review and update your campaign character.'
        : 'Build your character to begin your journey in this campaign.',
      href: `/character-creator`,
      priority: existingPlaybook ? 5 : 2,
      completed: !!existingPlaybook,
      element: 'fire',
    })
  }

  // 3. CYOA Intake — check for intake adventures
  const intakeAdventure = await db.adventure.findFirst({
    where: {
      campaignRef,
      adventureType: 'CYOA_INTAKE',
      status: 'ACTIVE',
    },
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' },
  })

  if (intakeAdventure) {
    items.push({
      id: `intake-${intakeAdventure.id}`,
      type: 'scene',
      title: intakeAdventure.title || 'Begin Your Journey',
      description: 'Start with an interactive story to orient yourself in the campaign world.',
      href: `/playbook-cyoa/${intakeAdventure.id}`,
      priority: 3,
      completed: false,
      element: 'wood',
    })
  }

  // 4. Quest templates — prompt for campaign quests if configured
  if (ctx.questTemplateConfig.length > 0) {
    const firstQuest = ctx.questTemplateConfig[0]
    const questName = (firstQuest?.templateName as string) || 'First Quest'
    const questCopy = firstQuest?.copy as Record<string, unknown> | undefined

    items.push({
      id: `quest-template-${ctx.campaign.id}`,
      type: 'quest',
      title: questName,
      description:
        (questCopy?.description as string) ||
        'Your first quest awaits — contribute to the campaign.',
      href: `/campaign/hub?ref=${encodeURIComponent(ctx.campaign.slug)}`,
      priority: 4,
      completed: false,
      element: 'earth',
    })
  }

  // 5. Contribution opportunity — allyship domain prompt
  if (ctx.campaign.allyshipDomain) {
    const domainLabels: Record<string, string> = {
      GATHERING_RESOURCES: 'Gather Resources',
      DIRECT_ACTION: 'Take Direct Action',
      RAISE_AWARENESS: 'Raise Awareness',
      SKILLFUL_ORGANIZING: 'Organize Skillfully',
    }
    const label = domainLabels[ctx.campaign.allyshipDomain] ?? 'Contribute'

    items.push({
      id: `contribute-${ctx.campaign.id}`,
      type: 'contribution',
      title: label,
      description: 'Make your mark — contribute to the campaign\'s mission.',
      href: `/campaign/hub?ref=${encodeURIComponent(ctx.campaign.slug)}`,
      priority: 6,
      completed: false,
      element: 'metal',
    })
  }

  // 6. Explore the campaign hub — always available as a fallback
  items.push({
    id: `explore-${ctx.campaign.id}`,
    type: 'explore',
    title: 'Explore Campaign Hub',
    description: 'Browse portals, discover quests, and connect with other members.',
    href: `/campaign/hub?ref=${encodeURIComponent(ctx.campaign.slug)}`,
    priority: 10,
    completed: false,
    element: 'wood',
  })

  // Sort by priority
  return items.sort((a, b) => a.priority - b.priority)
}
