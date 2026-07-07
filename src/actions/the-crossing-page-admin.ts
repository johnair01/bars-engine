'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  normalizeTheCrossingPageContent,
  THE_CROSSING_PAGE_DEFAULT_CONTENT,
  type TheCrossingPageContent,
} from '@/lib/the-crossing-page-content'

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

function formList(formData: FormData, key: string, fallback: string[]): string[] {
  const value = formData.get(key)
  if (typeof value !== 'string') return fallback
  const items = value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length ? items : fallback
}

function contentFromFormData(formData: FormData): TheCrossingPageContent {
  const defaults = THE_CROSSING_PAGE_DEFAULT_CONTENT
  return normalizeTheCrossingPageContent({
    chrome: {
      label: formText(formData, 'chrome.label', defaults.chrome.label),
      awakenLink: formText(formData, 'chrome.awakenLink', defaults.chrome.awakenLink),
    },
    hero: {
      parentLabel: formText(formData, 'hero.parentLabel', defaults.hero.parentLabel),
      title: formText(formData, 'hero.title', defaults.hero.title),
      subtitle: formText(formData, 'hero.subtitle', defaults.hero.subtitle),
      body: formText(formData, 'hero.body', defaults.hero.body),
      primaryCta: formText(formData, 'hero.primaryCta', defaults.hero.primaryCta),
      secondaryCta: formText(formData, 'hero.secondaryCta', defaults.hero.secondaryCta),
    },
    howToPlay: formList(formData, 'howToPlay', defaults.howToPlay),
    paths: {
      title: formText(formData, 'paths.title', defaults.paths.title),
      gates: defaults.paths.gates.map((gate) => ({
        domain: gate.domain,
        blurb: formText(formData, `paths.gates.${gate.domain}.blurb`, gate.blurb),
      })),
    },
    unsure: {
      body: formText(formData, 'unsure.body', defaults.unsure.body),
      cta: formText(formData, 'unsure.cta', defaults.unsure.cta),
      href: formText(formData, 'unsure.href', defaults.unsure.href),
    },
    deck: {
      blurb: formText(formData, 'deck.blurb', defaults.deck.blurb),
    },
    awaken: {
      body: formText(formData, 'awaken.body', defaults.awaken.body),
      href: formText(formData, 'awaken.href', defaults.awaken.href),
      cta: formText(formData, 'awaken.cta', defaults.awaken.cta),
    },
    footer: formText(formData, 'footer', defaults.footer),
  })
}

export async function saveTheCrossingPageContent(
  _prevState: { ok?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    const adminId = await requireAdminId()
    const theCrossingPage = contentFromFormData(formData)
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

    const nextTheme = JSON.stringify({ ...theme, theCrossingPage })

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
        target: 'the_crossing_page',
        payload: JSON.stringify({ updatedKeys: ['theme.theCrossingPage'] }),
      },
    })

    revalidatePath('/campaign/the-crossing')
    revalidatePath('/admin/config')
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save The Crossing page' }
  }
}
