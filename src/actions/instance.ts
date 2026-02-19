'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getAppConfig } from '@/actions/config'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'

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

  const isAdmin = player?.roles.some(r => r.role.key === 'admin')
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
      orderBy: { createdAt: 'desc' }
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
    const theme = (formData.get('theme') as string | null)?.trim() || null
    const targetDescription = (formData.get('targetDescription') as string | null)?.trim() || null
    const stripeOneTimeUrl = (formData.get('stripeOneTimeUrl') as string | null)?.trim() || null
    const patreonUrl = (formData.get('patreonUrl') as string | null)?.trim() || null
    const isEventMode = formData.get('isEventMode') === 'on'

    const goalAmountCents = toCents(formData.get('goalAmount'))
    const currentAmountCents = toCents(formData.get('currentAmount'))

    if (!slug) throw new Error('Slug is required')
    if (!name) throw new Error('Name is required')
    if (!domainType) throw new Error('Domain type is required')

    if (id) {
      await db.instance.update({
        where: { id },
        data: {
          slug,
          name,
          domainType,
          theme,
          targetDescription,
          stripeOneTimeUrl,
          patreonUrl,
          isEventMode,
          goalAmountCents,
          ...(currentAmountCents == null ? {} : { currentAmountCents }),
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
          stripeOneTimeUrl,
          patreonUrl,
          isEventMode,
          goalAmountCents,
          ...(currentAmountCents == null ? {} : { currentAmountCents }),
        },
        create: {
          slug,
          name,
          domainType,
          theme,
          targetDescription,
          stripeOneTimeUrl,
          patreonUrl,
          isEventMode,
          goalAmountCents,
          currentAmountCents: currentAmountCents ?? 0,
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

