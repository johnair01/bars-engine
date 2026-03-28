'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getAppConfig } from '@/actions/config'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import {
  isBruisedBananaHouseInstance,
  mergeBruisedBananaHouseGoalData,
} from '@/lib/bruised-banana-house-state'
import { parseCampaignDeckTopology } from '@/lib/campaign-deck-topology'

function toCents(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

async function ensureAdmin() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not authenticated')

  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { roles: { include: { role: true } } }
  })

  if (!player) throw new Error('Not authenticated')
  const isAdmin = player.roles.some(r => r.role.key === 'admin')
  if (!isAdmin) throw new Error('Forbidden')

  return player
}

function redirectWithMessage(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params)
  redirect(`${path}?${qs.toString()}`)
}

function toUserSafeErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2021' || error.code === 'P2022') {
      return 'Database schema is not updated yet. Run Prisma db push against production, then retry.'
    }
  }
  if (error instanceof Error) return error.message || 'Unknown error'
  return 'Unknown error'
}

/**
 * Best-effort fetch for the active instance.
 * Important: this catches schema drift (table missing) during rollouts.
 */
export async function getActiveInstance() {
  try {
    const config = await getAppConfig()

    if (config.activeInstanceId) {
      const byId = await db.instance.findUnique({
        where: { id: config.activeInstanceId }
      })
      if (byId) return byId
    }

    // Fallback: latest event-mode instance
    const fallback = await db.instance.findFirst({
      where: { isEventMode: true },
      orderBy: { createdAt: 'desc' }
    })

    return fallback
  } catch (e) {
    // If the `instances` table doesn’t exist yet (deploy ordering), don’t 500 the whole app.
    console.warn('[instance] getActiveInstance failed (likely schema drift):', e)
    return null
  }
}

export async function getInstanceDbReadiness() {
  try {
    const [instanceTableRow] = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'instances'
      ) AS exists;
    `

    const [activeInstanceColumnRow] = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'app_config'
          AND column_name = 'activeInstanceId'
      ) AS exists;
    `

    return {
      instancesTableReady: !!instanceTableRow?.exists,
      appConfigActiveInstanceReady: !!activeInstanceColumnRow?.exists,
    }
  } catch (e) {
    console.warn('[instance] getInstanceDbReadiness failed:', e)
    return {
      instancesTableReady: false,
      appConfigActiveInstanceReady: false,
    }
  }
}

export async function listInstances() {
  try {
    return await db.instance.findMany({
      orderBy: { createdAt: 'desc' },
      include: { childInstances: true }
    })
  } catch (e) {
    console.warn('[instance] listInstances failed:', e)
    return []
  }
}

export async function upsertInstance(formData: FormData): Promise<void> {
  let errorMessage: string | null = null
  let successParams: Record<string, string> | null = null

  try {
    await ensureAdmin()

    const id = (formData.get('id') as string | null)?.trim() || null
    const slug = (formData.get('slug') as string | null)?.trim() || ''
    const name = (formData.get('name') as string | null)?.trim() || ''
    const domainType = (formData.get('domainType') as string | null)?.trim() || ''
    const sourceInstanceId = (formData.get('sourceInstanceId') as string | null)?.trim() || null
    const parentInstanceId = (formData.get('parentInstanceId') as string | null)?.trim() || null
    const linkedInstanceId = (formData.get('linkedInstanceId') as string | null)?.trim() || null
    const theme = (formData.get('theme') as string | null)?.trim() || null
    const targetDescription = (formData.get('targetDescription') as string | null)?.trim() || null
    const wakeUpContent = (formData.get('wakeUpContent') as string | null)?.trim() || null
    const showUpContent = (formData.get('showUpContent') as string | null)?.trim() || null
    const storyBridgeCopy = (formData.get('storyBridgeCopy') as string | null)?.trim() || null
    const campaignRef = (formData.get('campaignRef') as string | null)?.trim() || null
    const stripeOneTimeUrl = (formData.get('stripeOneTimeUrl') as string | null)?.trim() || null
    const patreonUrl = (formData.get('patreonUrl') as string | null)?.trim() || null
    const venmoUrl = (formData.get('venmoUrl') as string | null)?.trim() || null
    const cashappUrl = (formData.get('cashappUrl') as string | null)?.trim() || null
    const paypalUrl = (formData.get('paypalUrl') as string | null)?.trim() || null
    const donationButtonLabelRaw = (formData.get('donationButtonLabel') as string | null)?.trim() || null
    const donationButtonLabel = donationButtonLabelRaw && donationButtonLabelRaw.length > 0 ? donationButtonLabelRaw.slice(0, 120) : null
    const isEventMode = formData.get('isEventMode') === 'on'

    const goalAmountCents = toCents(formData.get('goalAmount'))
    const currentAmountCents = toCents(formData.get('currentAmount'))

    const kotterStageRaw = (formData.get('kotterStage') as string | null)?.trim()
    const kotterStage = kotterStageRaw ? Math.min(8, Math.max(1, parseInt(kotterStageRaw, 10) || 1)) : 1

    const allyshipDomain = (formData.get('allyshipDomain') as string | null)?.trim() || null
    const validAllyshipDomain =
      allyshipDomain && ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'].includes(allyshipDomain)
        ? allyshipDomain
        : null

    const campaignDeckTopology = parseCampaignDeckTopology(
      (formData.get('campaignDeckTopology') as string | null)?.trim(),
    )

    const moveIdsRaw = formData.getAll('moveIds')
    const moveIds = Array.isArray(moveIdsRaw)
      ? (moveIdsRaw as string[]).filter((id) => typeof id === 'string' && id.trim().length > 0)
      : []
    const moveIdsJson = JSON.stringify(moveIds)

    if (!slug) throw new Error('Slug is required')
    if (!name) throw new Error('Name is required')
    if (!domainType) throw new Error('Domain type is required')

    let mergedHouseGoalData: string | undefined
    if (isBruisedBananaHouseInstance(slug, campaignRef)) {
      const opNote = (formData.get('houseOperatorNote') as string | null) ?? ''
      const healthRaw = (formData.get('houseHealthSignal') as string | null)?.trim() ?? ''
      const patch: { operatorNote: string; healthSignal?: number | null } = { operatorNote: opNote }
      if (healthRaw === 'clear') patch.healthSignal = null
      else if (/^[1-5]$/.test(healthRaw)) patch.healthSignal = parseInt(healthRaw, 10)

      const existingGoal =
        id != null && id.length > 0
          ? (await db.instance.findUnique({ where: { id }, select: { goalData: true } }))?.goalData
          : null
      mergedHouseGoalData = mergeBruisedBananaHouseGoalData(existingGoal, patch)
    }

    const hierarchyData = {
      sourceInstanceId: sourceInstanceId || null,
      parentInstanceId: parentInstanceId || null,
      linkedInstanceId: linkedInstanceId || null,
    }

    if (id) {
      await db.instance.update({
        where: { id },
        data: {
          slug,
          name,
          domainType,
          theme,
          targetDescription,
          wakeUpContent,
          showUpContent,
          storyBridgeCopy,
          campaignRef,
          stripeOneTimeUrl,
          patreonUrl,
          venmoUrl,
          cashappUrl,
          paypalUrl,
          donationButtonLabel,
          isEventMode,
          goalAmountCents,
          kotterStage,
          allyshipDomain: validAllyshipDomain,
          campaignDeckTopology,
          moveIds: moveIdsJson,
          ...hierarchyData,
          ...(currentAmountCents == null ? {} : { currentAmountCents }),
          ...(mergedHouseGoalData != null ? { goalData: mergedHouseGoalData } : {}),
        }
      })
    } else {
      await db.instance.upsert({
        where: { slug },
        update: {
          name,
          domainType,
          theme,
          targetDescription,
          wakeUpContent,
          showUpContent,
          storyBridgeCopy,
          campaignRef,
          stripeOneTimeUrl,
          patreonUrl,
          venmoUrl,
          cashappUrl,
          paypalUrl,
          donationButtonLabel,
          isEventMode,
          goalAmountCents,
          kotterStage,
          allyshipDomain: validAllyshipDomain,
          campaignDeckTopology,
          moveIds: moveIdsJson,
          ...hierarchyData,
          ...(currentAmountCents == null ? {} : { currentAmountCents }),
          ...(mergedHouseGoalData != null ? { goalData: mergedHouseGoalData } : {}),
        },
        create: {
          slug,
          name,
          domainType,
          theme,
          targetDescription,
          wakeUpContent,
          showUpContent,
          storyBridgeCopy,
          campaignRef,
          stripeOneTimeUrl,
          patreonUrl,
          venmoUrl,
          cashappUrl,
          paypalUrl,
          donationButtonLabel,
          isEventMode,
          goalAmountCents,
          kotterStage,
          allyshipDomain: validAllyshipDomain,
          campaignDeckTopology,
          moveIds: moveIdsJson,
          currentAmountCents: currentAmountCents ?? 0,
          ...hierarchyData,
          ...(mergedHouseGoalData != null ? { goalData: mergedHouseGoalData } : {}),
        }
      })
    }

    revalidatePath('/admin/instances')
    revalidatePath('/event')
    revalidatePath('/')
    successParams = { saved: '1' }
  } catch (e) {
    console.error('[instance] upsertInstance failed:', e)
    errorMessage = toUserSafeErrorMessage(e)
  }

  if (errorMessage) {
    redirectWithMessage('/admin/instances', { error: errorMessage })
  } else if (successParams) {
    redirectWithMessage('/admin/instances', successParams)
  }
}

/**
 * Update fundraiser progress (currentAmount, goalAmount). Admin only.
 * Used by event page and instances list for quick progress updates.
 */
export async function updateInstanceFundraise(formData: FormData): Promise<{ error?: string }> {
  try {
    await ensureAdmin()

    const instanceId = (formData.get('instanceId') as string | null)?.trim() || null
    const currentAmountCents = toCents(formData.get('currentAmount'))
    const goalAmountCents = toCents(formData.get('goalAmount'))

    if (!instanceId) return { error: 'Instance ID is required' }

    const data: { currentAmountCents?: number; goalAmountCents?: number } = {}
    if (currentAmountCents != null) data.currentAmountCents = currentAmountCents
    if (goalAmountCents != null) data.goalAmountCents = goalAmountCents
    if (Object.keys(data).length === 0) return { error: 'Provide at least currentAmount or goalAmount' }

    await db.instance.update({
      where: { id: instanceId },
      data,
    })

    revalidatePath('/admin/instances')
    revalidatePath('/event')
    revalidatePath('/')
    return {}
  } catch (e) {
    console.error('[instance] updateInstanceFundraise failed:', e)
    return { error: toUserSafeErrorMessage(e) }
  }
}

const KOTTER_STAGE_NAMES: Record<number, string> = {
  1: 'Urgency',
  2: 'Coalition',
  3: 'Vision',
  4: 'Communicate',
  5: 'Obstacles',
  6: 'Wins',
  7: 'Build On',
  8: 'Anchor',
}

export async function updateInstanceKotterStage(formData: FormData): Promise<void> {
  let errorMessage: string | null = null

  try {
    const admin = await ensureAdmin()

    const instanceId = (formData.get('instanceId') as string | null)?.trim() || null
    const stageRaw = (formData.get('kotterStage') as string | null)?.trim()
    const kotterStage = stageRaw ? Math.min(8, Math.max(1, parseInt(stageRaw, 10) || 1)) : 1

    if (!instanceId) throw new Error('Instance ID is required')

    const instance = await db.instance.findUnique({
      where: { id: instanceId },
      select: { name: true },
    })

    await db.instance.update({
      where: { id: instanceId },
      data: { kotterStage }
    })

    // Regent: Declare period — every face move produces a BAR
    const { createFaceMoveBarAs } = await import('@/actions/face-move-bar')
    const stageName = KOTTER_STAGE_NAMES[kotterStage] ?? `Stage ${kotterStage}`
    await createFaceMoveBarAs(admin.id, 'regent', 'declare_period', {
      title: `Period declared: ${stageName}`,
      description: `${instance?.name ?? 'Campaign'} is now in ${stageName} (Stage ${kotterStage}).`,
      barType: 'vibe',
      instanceId,
      metadata: { kotterStage },
    })

    revalidatePath('/admin/instances')
    revalidatePath('/event')
    revalidatePath('/')
    redirectWithMessage('/admin/instances', { saved: '1' })
  } catch (e) {
    console.error('[instance] updateInstanceKotterStage failed:', e)
    errorMessage = toUserSafeErrorMessage(e)
  }

  if (errorMessage) {
    redirectWithMessage('/admin/instances', { error: errorMessage })
  }
}

/**
 * Update campaign copy (Wake Up, Show Up, theme, target description).
 * Admin only. Used by event page Edit modal.
 */
export async function updateInstanceCampaignCopy(
  instanceId: string,
  data: {
    wakeUpContent?: string | null
    showUpContent?: string | null
    storyBridgeCopy?: string | null
    theme?: string | null
    targetDescription?: string | null
  }
): Promise<{ error?: string }> {
  try {
    await ensureAdmin()
    if (!instanceId?.trim()) return { error: 'Instance ID is required' }

    await db.instance.update({
      where: { id: instanceId },
      data: {
        ...(data.wakeUpContent !== undefined && { wakeUpContent: data.wakeUpContent?.trim() || null }),
        ...(data.showUpContent !== undefined && { showUpContent: data.showUpContent?.trim() || null }),
        ...(data.storyBridgeCopy !== undefined && { storyBridgeCopy: data.storyBridgeCopy?.trim() || null }),
        ...(data.theme !== undefined && { theme: data.theme?.trim() || null }),
        ...(data.targetDescription !== undefined && { targetDescription: data.targetDescription?.trim() || null }),
      },
    })

    revalidatePath('/event')
    revalidatePath('/')
    revalidatePath('/admin/instances')
    return {}
  } catch (e) {
    console.error('[instance] updateInstanceCampaignCopy failed:', e)
    return { error: toUserSafeErrorMessage(e) }
  }
}

export async function setActiveInstance(formData: FormData): Promise<void> {
  let errorMessage: string | null = null
  let activeParam: string | null = null

  try {
    await ensureAdmin()

    const instanceId = (formData.get('instanceId') as string | null)?.trim() || null

    // Ensure singleton exists
    await getAppConfig()

    await db.appConfig.update({
      where: { id: 'singleton' },
      data: { activeInstanceId: instanceId }
    })

    revalidatePath('/admin/instances')
    revalidatePath('/event')
    revalidatePath('/')
    activeParam = instanceId ? '1' : '0'
  } catch (e) {
    console.error('[instance] setActiveInstance failed:', e)
    errorMessage = toUserSafeErrorMessage(e)
  }

  if (errorMessage) {
    redirectWithMessage('/admin/instances', { error: errorMessage })
  } else if (activeParam !== null) {
    redirectWithMessage('/admin/instances', { active: activeParam })
  }
}

