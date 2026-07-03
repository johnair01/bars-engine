'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  LAUNCH_DEFAULT_CONTENT,
  LAUNCH_INTENT_KEYS,
  LAUNCH_OFFER_KEYS,
  normalizeLaunchPageContent,
  type LaunchIntent,
  type LaunchPageContent,
} from '@/lib/launch/page-content'

async function requireAdminId(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) throw new Error('Authentication required')

  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
    select: { playerId: true },
  })

  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

function formText(formData: FormData, key: string, fallback: string): string {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function parseOfferIntents(formData: FormData, offerKey: string, fallback: LaunchIntent[]) {
  const raw = formData.get(`offers.${offerKey}.intents`)
  if (typeof raw !== 'string') return fallback
  const values = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is LaunchIntent =>
      LAUNCH_INTENT_KEYS.includes(item as LaunchIntent)
    )
  return values.length ? values : fallback
}

function contentFromFormData(formData: FormData): LaunchPageContent {
  const defaults = LAUNCH_DEFAULT_CONTENT
  return normalizeLaunchPageContent({
    hero: {
      eyebrow: formText(formData, 'hero.eyebrow', defaults.hero.eyebrow),
      title: formText(formData, 'hero.title', defaults.hero.title),
      body: formText(formData, 'hero.body', defaults.hero.body),
    },
    pieces: defaults.pieces.map((piece, index) => ({
      step: formText(formData, `pieces.${index}.step`, piece.step),
      name: formText(formData, `pieces.${index}.name`, piece.name),
      role: formText(formData, `pieces.${index}.role`, piece.role),
    })),
    intents: defaults.intents.map((intent) => ({
      key: intent.key,
      element: intent.element,
      label: formText(formData, `intents.${intent.key}.label`, intent.label),
      sub: formText(formData, `intents.${intent.key}.sub`, intent.sub),
    })),
    offers: LAUNCH_OFFER_KEYS.reduce(
      (acc, offerKey) => {
        const fallback = defaults.offers[offerKey]
        acc[offerKey] = {
          name: formText(formData, `offers.${offerKey}.name`, fallback.name),
          blurb: formText(formData, `offers.${offerKey}.blurb`, fallback.blurb),
          bestFor: formText(formData, `offers.${offerKey}.bestFor`, fallback.bestFor),
          unlocks: formText(formData, `offers.${offerKey}.unlocks`, fallback.unlocks),
          context: formText(formData, `offers.${offerKey}.context`, fallback.context),
          kicker: formText(formData, `offers.${offerKey}.kicker`, fallback.kicker),
          image: formText(formData, `offers.${offerKey}.image`, fallback.image),
          heroImage: formText(formData, `offers.${offerKey}.heroImage`, fallback.heroImage),
          intents: parseOfferIntents(formData, offerKey, fallback.intents),
        }
        return acc
      },
      {} as LaunchPageContent['offers']
    ),
  })
}

export async function saveLaunchPageContent(
  _prevState: { ok?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    const adminId = await requireAdminId()
    const launchPage = contentFromFormData(formData)
    const existing = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })

    let theme: Record<string, unknown> = {}
    try {
      theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
    } catch {
      theme = {}
    }

    const nextTheme = JSON.stringify({ ...theme, launchPage })

    await db.appConfig.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        theme: nextTheme,
        updatedBy: adminId,
      },
      update: {
        theme: nextTheme,
        updatedBy: adminId,
      },
    })

    await db.adminAuditLog.create({
      data: {
        adminId,
        action: 'config_update',
        target: 'launch_page',
        payload: JSON.stringify({ updatedKeys: ['theme.launchPage'] }),
      },
    })

    revalidatePath('/launch')
    revalidatePath('/admin/config')
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save launch page' }
  }
}
