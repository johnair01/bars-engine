'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getAppConfig } from '@/actions/config'

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

export async function upsertInstance(formData: FormData) {
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

  if (!slug) return { error: 'Slug is required' }
  if (!name) return { error: 'Name is required' }
  if (!domainType) return { error: 'Domain type is required' }

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
    // Create, but allow re-submitting the form to update by slug.
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
  return { success: true }
}

export async function setActiveInstance(formData: FormData) {
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
  return { success: true }
}

