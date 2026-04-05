'use server'

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { CampaignStatus } from '@prisma/client'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { validateEdit, validateDelete } from '@/lib/campaign-lifecycle'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

/** True when the player holds the global `admin` role. */
async function isGlobalAdmin(playerId: string): Promise<boolean> {
  const row = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  return !!row
}

/**
 * True when the player is an admin, or holds owner/steward membership on the
 * given instance. Used for campaign creation (no campaign exists yet).
 */
async function isStewardPlusForInstance(
  playerId: string,
  instanceId: string
): Promise<boolean> {
  if (await isGlobalAdmin(playerId)) return true

  const membership = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: {
        instanceId,
        playerId,
      },
    },
  })

  return membership?.roleKey === 'owner' || membership?.roleKey === 'steward'
}

/**
 * True when the player is an admin, or holds owner/steward membership on the
 * instance that owns the given campaign.
 */
async function isStewardPlusForCampaign(
  playerId: string,
  campaignId: string
): Promise<boolean> {
  if (await isGlobalAdmin(playerId)) return true

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { instanceId: true },
  })
  if (!campaign) return false

  return isStewardPlusForInstance(playerId, campaign.instanceId)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult =
  | { success: true; message: string }
  | { error: string }

export type CreateCampaignInput = {
  /** Instance this campaign belongs to */
  instanceId: string
  /** Human-readable campaign name */
  name: string
  /** URL-safe slug (unique) */
  slug: string
  /** Rich description for campaign landing */
  description?: string
  /** Allyship domain focus */
  allyshipDomain?: string
  /** Wake Up copy */
  wakeUpContent?: string
  /** Show Up copy */
  showUpContent?: string
  /** Story bridge copy */
  storyBridgeCopy?: string
  /** L1: Quest template configuration (array of quest entries or object) */
  questTemplateConfig?: Record<string, unknown> | Record<string, unknown>[]
  /** L1: Invite configuration */
  inviteConfig?: Record<string, unknown>
  /** Scheduled start */
  startDate?: string | null
  /** Scheduled end */
  endDate?: string | null
}

export type CreateCampaignResult =
  | { success: true; campaignId: string; slug: string }
  | { error: string }

export type CampaignDetail = {
  id: string
  slug: string
  name: string
  description: string | null
  status: string
  allyshipDomain: string | null
  wakeUpContent: string | null
  showUpContent: string | null
  storyBridgeCopy: string | null
  questTemplateConfig: unknown
  inviteConfig: unknown
  narrativeConfig: unknown
  shareUrl: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy: { id: string; name: string | null }
  instance: { id: string; name: string; slug: string }
  theme: {
    id: string
    bgGradient: string | null
    bgDeep: string | null
    titleColor: string | null
    accentPrimary: string | null
    accentSecondary: string | null
    accentTertiary: string | null
    fontDisplayKey: string | null
    posterImageUrl: string | null
    cssVarOverrides: unknown
  } | null
  reviewedBy: { id: string; name: string | null } | null
  reviewedAt: Date | null
  rejectionReason: string | null
  submittedAt: Date | null
}

// ---------------------------------------------------------------------------
// createCampaign — Steward+ creates a new DRAFT campaign under an Instance
// ---------------------------------------------------------------------------

export async function createCampaign(
  input: CreateCampaignInput
): Promise<CreateCampaignResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  // --- Steward+ guard on the target instance ---
  const allowed = await isStewardPlusForInstance(playerId, input.instanceId)
  if (!allowed) {
    return { error: 'Not authorized — steward or higher role required on this instance' }
  }

  // --- Validate required fields ---
  if (!input.name?.trim()) return { error: 'Campaign name is required' }
  if (!input.slug?.trim()) return { error: 'Campaign slug is required' }

  // Sanitise slug: lowercase, alphanumeric + hyphens only
  const slug = input.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!slug) return { error: 'Invalid slug — must contain at least one alphanumeric character' }

  // --- Check instance exists ---
  const instance = await db.instance.findUnique({
    where: { id: input.instanceId },
    select: { id: true },
  })
  if (!instance) return { error: 'Instance not found' }

  // --- Check slug uniqueness ---
  const existing = await db.campaign.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (existing) return { error: `A campaign with slug "${slug}" already exists` }

  // --- Create the campaign in DRAFT status ---
  const campaign = await db.campaign.create({
    data: {
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: 'DRAFT',
      allyshipDomain: input.allyshipDomain || null,
      wakeUpContent: input.wakeUpContent?.trim() || null,
      showUpContent: input.showUpContent?.trim() || null,
      storyBridgeCopy: input.storyBridgeCopy?.trim() || null,
      questTemplateConfig: input.questTemplateConfig
        ? (input.questTemplateConfig as Prisma.InputJsonValue)
        : undefined,
      inviteConfig: input.inviteConfig
        ? (input.inviteConfig as Prisma.InputJsonValue)
        : undefined,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      instanceId: input.instanceId,
      createdById: playerId,
    },
  })

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${slug}`)

  return { success: true, campaignId: campaign.id, slug: campaign.slug }
}

// ---------------------------------------------------------------------------
// getCampaign — Fetch a single campaign by ID or slug (Steward+ sees all
// fields; public sees only LIVE campaigns with limited fields)
// ---------------------------------------------------------------------------

export async function getCampaign(
  idOrSlug: string
): Promise<{ campaign: CampaignDetail } | { error: string }> {
  const playerId = await getPlayerId()

  // Look up by id first, then slug
  const campaign = await db.campaign.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug },
      ],
    },
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
      inviteConfig: true,
      narrativeConfig: true,
      shareUrl: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      instanceId: true,
      submittedAt: true,
      rejectionReason: true,
      reviewedAt: true,
      createdBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      instance: { select: { id: true, name: true, slug: true } },
      theme: true,
    },
  })

  if (!campaign) return { error: 'Campaign not found' }

  // Access control: LIVE campaigns are public; anything else requires Steward+
  if (campaign.status !== 'LIVE') {
    if (!playerId) return { error: 'Campaign not found' }

    const allowed = await isStewardPlusForInstance(playerId, campaign.instanceId)
    if (!allowed) return { error: 'Campaign not found' }
  }

  return { campaign }
}

// ---------------------------------------------------------------------------
// updateCampaign — Steward+ edits a DRAFT or REJECTED campaign
// ---------------------------------------------------------------------------

export type UpdateCampaignInput = Partial<
  Omit<CreateCampaignInput, 'instanceId' | 'slug'>
>

export async function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const allowed = await isStewardPlusForCampaign(playerId, campaignId)
  if (!allowed) return { error: 'Not authorized — steward or higher role required' }

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true, slug: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  // Centralised state-machine guard for editability
  const editCheck = validateEdit(campaign.status as CampaignStatus)
  if (!editCheck.valid) return { error: editCheck.reason }

  // Build update data — only include fields that were explicitly passed
  const data: Prisma.CampaignUpdateInput = {}
  if (input.name !== undefined) data.name = input.name.trim()
  if (input.description !== undefined) data.description = input.description?.trim() || null
  if (input.allyshipDomain !== undefined) data.allyshipDomain = input.allyshipDomain || null
  if (input.wakeUpContent !== undefined) data.wakeUpContent = input.wakeUpContent?.trim() || null
  if (input.showUpContent !== undefined) data.showUpContent = input.showUpContent?.trim() || null
  if (input.storyBridgeCopy !== undefined) data.storyBridgeCopy = input.storyBridgeCopy?.trim() || null
  if (input.questTemplateConfig !== undefined) {
    data.questTemplateConfig = input.questTemplateConfig as Prisma.InputJsonValue ?? Prisma.DbNull
  }
  if (input.inviteConfig !== undefined) {
    data.inviteConfig = input.inviteConfig as Prisma.InputJsonValue ?? Prisma.DbNull
  }
  if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null
  if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null

  // Check if any fields were set
  if (Object.keys(data).length === 0) {
    return { error: 'No fields to update' }
  }

  await db.campaign.update({
    where: { id: campaignId },
    data,
  })

  revalidatePath(`/campaigns/${campaign.slug}`)
  revalidatePath('/campaigns')

  return { success: true, message: 'Campaign updated' }
}

// ---------------------------------------------------------------------------
// listCampaignsForInstance — Steward+ lists all campaigns under an instance
// ---------------------------------------------------------------------------

export type CampaignListItem = {
  id: string
  slug: string
  name: string
  description: string | null
  status: string
  allyshipDomain: string | null
  shareUrl: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  createdBy: { id: string; name: string | null }
}

export async function listCampaignsForInstance(
  instanceId: string
): Promise<CampaignListItem[]> {
  const playerId = await getPlayerId()
  if (!playerId) return []

  const allowed = await isStewardPlusForInstance(playerId, instanceId)
  if (!allowed) return []

  return db.campaign.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      status: true,
      allyshipDomain: true,
      shareUrl: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
    },
  })
}

// ---------------------------------------------------------------------------
// deleteCampaign — Steward+ deletes a DRAFT campaign (soft-guard: only DRAFT)
// ---------------------------------------------------------------------------

export async function deleteCampaign(
  campaignId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const allowed = await isStewardPlusForCampaign(playerId, campaignId)
  if (!allowed) return { error: 'Not authorized — steward or higher role required' }

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true, slug: true, instanceId: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  // Centralised state-machine guard for deletability
  const deleteCheck = validateDelete(campaign.status as CampaignStatus)
  if (!deleteCheck.valid) return { error: deleteCheck.reason }

  await db.campaign.delete({ where: { id: campaignId } })

  revalidatePath(`/campaigns/${campaign.slug}`)
  revalidatePath('/campaigns')

  return { success: true, message: 'Campaign deleted' }
}

// ---------------------------------------------------------------------------
// listStewardInstances — Instances where current user is steward+ (or admin)
// ---------------------------------------------------------------------------

export type StewardInstance = {
  id: string
  slug: string
  name: string
  campaignCount: number
}

export async function listStewardInstances(): Promise<StewardInstance[]> {
  const playerId = await getPlayerId()
  if (!playerId) return []

  const isAdmin = await isGlobalAdmin(playerId)

  if (isAdmin) {
    // Admins see all instances
    const instances = await db.instance.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        _count: { select: { campaigns: true } },
      },
    })
    return instances.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      campaignCount: i._count.campaigns,
    }))
  }

  // Non-admin: only instances where player is owner or steward
  const memberships = await db.instanceMembership.findMany({
    where: {
      playerId,
      roleKey: { in: ['owner', 'steward'] },
    },
    include: {
      instance: {
        select: {
          id: true,
          slug: true,
          name: true,
          _count: { select: { campaigns: true } },
        },
      },
    },
  })

  return memberships
    .filter((m) => m.instance)
    .map((m) => ({
      id: m.instance.id,
      slug: m.instance.slug,
      name: m.instance.name,
      campaignCount: m.instance._count.campaigns,
    }))
}

// ---------------------------------------------------------------------------
// generateCampaignInviteLink — Steward+ generates a shareable invite URL
// ---------------------------------------------------------------------------

export type GenerateInviteLinkInput = {
  /** Campaign to generate invite for */
  campaignId: string
  /** Max number of times this invite can be used (default: unlimited = 0) */
  maxUses?: number
  /** Optional personal message from the inviter */
  message?: string
}

export type GenerateInviteLinkResult =
  | { success: true; inviteUrl: string; token: string; inviteId: string }
  | { error: string }

/**
 * Generate a unique invite link for a campaign.
 *
 * Creates an Invite record linked to the campaign and its parent instance,
 * returning a shareable URL that recipients can use to join.
 *
 * Requires Steward+ role on the campaign's parent instance.
 * Campaign must be in LIVE or APPROVED status to generate invites.
 */
export async function generateCampaignInviteLink(
  input: GenerateInviteLinkInput
): Promise<GenerateInviteLinkResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  // --- Steward+ guard ---
  const allowed = await isStewardPlusForCampaign(playerId, input.campaignId)
  if (!allowed) {
    return { error: 'Not authorized — steward or higher role required' }
  }

  // --- Fetch campaign & verify status ---
  const campaign = await db.campaign.findUnique({
    where: { id: input.campaignId },
    select: {
      id: true,
      slug: true,
      status: true,
      instanceId: true,
      name: true,
    },
  })
  if (!campaign) return { error: 'Campaign not found' }

  // Only LIVE or APPROVED campaigns can have invite links
  const invitableStatuses: CampaignStatus[] = ['LIVE', 'APPROVED']
  if (!invitableStatuses.includes(campaign.status as CampaignStatus)) {
    return {
      error: `Cannot generate invite links for a ${campaign.status} campaign — campaign must be APPROVED or LIVE`,
    }
  }

  // --- Generate secure token ---
  const token = randomBytes(24).toString('base64url')

  // --- Create the invite record ---
  const invite = await db.invite.create({
    data: {
      token,
      status: 'active',
      maxUses: input.maxUses && input.maxUses > 0 ? input.maxUses : 0, // 0 = unlimited
      uses: 0,
      forgerId: playerId,
      instanceId: campaign.instanceId,
      campaignId: campaign.id,
      invitationMessage: input.message?.trim() || null,
    },
  })

  // --- Build shareable URL ---
  const baseUrl =
    typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
      : ''

  const inviteUrl = `${baseUrl}/campaigns/join/${campaign.slug}?invite=${encodeURIComponent(token)}`

  return {
    success: true,
    inviteUrl,
    token,
    inviteId: invite.id,
  }
}

// ---------------------------------------------------------------------------
// getCampaignInviteLinks — Steward+ lists active invite links for a campaign
// ---------------------------------------------------------------------------

export type CampaignInviteLink = {
  id: string
  token: string
  status: string
  maxUses: number
  uses: number
  createdAt: Date
  invitationMessage: string | null
  forger: { id: string; name: string | null } | null
}

export async function getCampaignInviteLinks(
  campaignId: string
): Promise<CampaignInviteLink[]> {
  const playerId = await getPlayerId()
  if (!playerId) return []

  const allowed = await isStewardPlusForCampaign(playerId, campaignId)
  if (!allowed) return []

  return db.invite.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      token: true,
      status: true,
      maxUses: true,
      uses: true,
      createdAt: true,
      invitationMessage: true,
      forger: { select: { id: true, name: true } },
    },
  })
}

// ---------------------------------------------------------------------------
// revokeCampaignInviteLink — Steward+ deactivates a campaign invite link
// ---------------------------------------------------------------------------

export async function revokeCampaignInviteLink(
  inviteId: string
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const invite = await db.invite.findUnique({
    where: { id: inviteId },
    select: { id: true, campaignId: true, status: true },
  })
  if (!invite) return { error: 'Invite not found' }
  if (!invite.campaignId) return { error: 'This invite is not a campaign invite' }

  const allowed = await isStewardPlusForCampaign(playerId, invite.campaignId)
  if (!allowed) return { error: 'Not authorized — steward or higher role required' }

  if (invite.status !== 'active') {
    return { error: 'Invite is already inactive' }
  }

  await db.invite.update({
    where: { id: inviteId },
    data: { status: 'revoked' },
  })

  return { success: true, message: 'Invite link revoked' }
}
