'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { cookies } from 'next/headers'

const WATERING_FACES = ['shaman', 'regent', 'challenger', 'architect', 'diplomat', 'sage'] as const
export type WateringFace = (typeof WATERING_FACES)[number]

function isWateringFace(s: string): s is WateringFace {
  return WATERING_FACES.includes(s as WateringFace)
}

async function ensureAdmin() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not authenticated')
  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { roles: { include: { role: true } } },
  })
  if (!player) throw new Error('Not authenticated')
  const isAdmin = player.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) throw new Error('Forbidden')
  return player
}

/**
 * Create a campaign seed BAR (campaign_kernel type).
 * Admin-only for Phase 1.
 */
export async function createCampaignSeed(formData: FormData) {
  const player = await ensureAdmin()

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const targetDescription = (formData.get('targetDescription') as string)?.trim() || null
  const allyshipDomain = (formData.get('allyshipDomain') as string)?.trim() || null

  if (!title || !description) {
    return { error: 'Title and description are required' }
  }

  const validDomain =
    allyshipDomain &&
    ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'].includes(allyshipDomain)
      ? allyshipDomain
      : null

  const bar = await db.customBar.create({
    data: {
      creatorId: player.id,
      title,
      description,
      type: 'campaign_kernel',
      reward: 0,
      visibility: 'private',
      status: 'active',
      isSystem: true,
      inputs: '[]',
      rootId: 'temp',
      storyContent: targetDescription ? JSON.stringify({ targetDescription }) : null,
      allyshipDomain: validDomain ?? undefined,
      wateringProgress: JSON.stringify(
        Object.fromEntries(WATERING_FACES.map((f) => [f, false]))
      ),
    },
  })
  await db.customBar.update({
    where: { id: bar.id },
    data: { rootId: bar.id },
  })

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true, barId: bar.id }
}

/**
 * Advance watering progress for a campaign kernel BAR.
 * Called from completion effect when a watering quest is completed.
 * Stores the player's response in wateringContent so it becomes the campaign.
 */
export async function advanceCampaignWatering(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  playerId: string,
  face: WateringFace,
  campaignBarId?: string,
  response?: string
) {
  const bar = campaignBarId
    ? await tx.customBar.findUnique({
        where: { id: campaignBarId, type: 'campaign_kernel' },
      })
    : await tx.customBar.findFirst({
        where: {
          creatorId: playerId,
          type: 'campaign_kernel',
          promotedInstance: null,
        },
      })

  if (!bar) return

  let progress: Record<string, boolean>
  try {
    progress = JSON.parse(bar.wateringProgress || '{}')
  } catch {
    progress = Object.fromEntries(WATERING_FACES.map((f) => [f, false]))
  }

  progress[face] = true

  let content: Record<string, string> = {}
  try {
    content = JSON.parse(bar.wateringContent || '{}')
  } catch {
    //
  }
  if (response != null && response.trim()) {
    content[face] = response.trim()
  }

  await tx.customBar.update({
    where: { id: bar.id },
    data: {
      wateringProgress: JSON.stringify(progress),
      wateringContent: JSON.stringify(content),
    },
  })
}

/**
 * Promote a campaign kernel BAR to an Instance (campaign).
 * All 6 faces must be complete.
 * Admin or the creator can promote. Uses wateringContent to populate the campaign.
 */
export async function promoteCampaignBarToInstance(barId: string) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { error: 'Not authenticated' }

  const [bar, currentPlayer] = await Promise.all([
    db.customBar.findUnique({
      where: { id: barId, type: 'campaign_kernel' },
      include: { promotedInstance: true },
    }),
    db.player.findUnique({
      where: { id: playerId },
      include: { roles: { include: { role: true } } },
    }),
  ])

  if (!bar) return { error: 'Campaign seed not found' }
  if (bar.promotedInstance) return { error: 'Already promoted' }

  const isAdmin = currentPlayer?.roles.some((r) => r.role.key === 'admin') ?? false
  const isCreator = bar.creatorId === playerId
  if (!isAdmin && !isCreator) return { error: 'Forbidden' }

  let progress: Record<string, boolean>
  try {
    progress = JSON.parse(bar.wateringProgress || '{}')
  } catch {
    progress = {}
  }

  const allComplete = WATERING_FACES.every((f) => progress[f])
  if (!allComplete) {
    const missing = WATERING_FACES.filter((f) => !progress[f]).join(', ')
    return { error: `Watering incomplete. Missing: ${missing}` }
  }

  let content: Record<string, string> = {}
  try {
    content = JSON.parse(bar.wateringContent || '{}')
  } catch {
    //
  }

  const baseSlug = bar.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const slug = baseSlug ? `${baseSlug}-${barId.slice(0, 6)}` : `campaign-${barId.slice(0, 6)}`

  const existing = await db.instance.findUnique({ where: { slug } })
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  // Use watering content to populate campaign. Shaman = narrative kernel; Regent = structure; etc.
  let targetDesc = bar.description
  if (bar.storyContent) {
    try {
      const meta = JSON.parse(bar.storyContent) as { targetDescription?: string }
      if (meta.targetDescription) targetDesc = meta.targetDescription
    } catch {
      //
    }
  }
  // Shaman: mythic entry point — enrich narrative kernel
  const shamanText = content.shaman?.trim()
  const narrativeKernel = shamanText
    ? `${bar.description}\n\n${shamanText}`
    : bar.description

  const instance = await db.instance.create({
    data: {
      slug: finalSlug,
      name: bar.title,
      domainType: 'campaign',
      targetDescription: targetDesc,
      narrativeKernel,
      allyshipDomain: bar.allyshipDomain,
      kotterStage: 1,
      kernelBarId: bar.id,
    },
  })

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true, instanceId: instance.id, slug: instance.slug }
}

/**
 * List campaign seeds created by the current player (for promote-your-own flow).
 */
export async function listMyCampaignSeeds(playerId: string) {
  const bars = await db.customBar.findMany({
    where: {
      creatorId: playerId,
      type: 'campaign_kernel',
      promotedInstance: null,
    },
    include: { promotedInstance: { select: { id: true, slug: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return bars.map((b) => {
    let progress: Record<string, boolean> = {}
    try {
      progress = JSON.parse(b.wateringProgress || '{}')
    } catch {
      //
    }
    const completed = WATERING_FACES.filter((f) => progress[f]).length
    return {
      id: b.id,
      title: b.title,
      description: b.description,
      wateringProgress: progress,
      completedFaces: completed,
      totalFaces: WATERING_FACES.length,
      isComplete: completed === WATERING_FACES.length,
      promotedInstance: b.promotedInstance,
    }
  })
}

/**
 * List campaign kernel BARs (admin).
 */
export async function listCampaignSeeds() {
  await ensureAdmin()

  const bars = await db.customBar.findMany({
    where: { type: 'campaign_kernel' },
    include: { creator: { select: { name: true } }, promotedInstance: { select: { id: true, slug: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return bars.map((b) => {
    let progress: Record<string, boolean> = {}
    try {
      progress = JSON.parse(b.wateringProgress || '{}')
    } catch {
      //
    }
    const completed = WATERING_FACES.filter((f) => progress[f]).length
    return {
      id: b.id,
      title: b.title,
      description: b.description,
      creatorName: b.creator.name,
      wateringProgress: progress,
      completedFaces: completed,
      totalFaces: WATERING_FACES.length,
      isComplete: completed === WATERING_FACES.length,
      promotedInstance: b.promotedInstance,
    }
  })
}
