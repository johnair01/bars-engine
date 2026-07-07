'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  AWAKEN_DEFAULT_CONTENT,
  normalizeAwakenPageContent,
  type AwakenPageContent,
} from '@/lib/awaken/content'

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

function formParagraphs(formData: FormData, key: string, fallback: string[]): string[] {
  const value = formData.get(key)
  if (typeof value !== 'string') return fallback
  const paragraphs = value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
  return paragraphs.length ? paragraphs : fallback
}

function contentFromFormData(formData: FormData): AwakenPageContent {
  const defaults = AWAKEN_DEFAULT_CONTENT
  return normalizeAwakenPageContent({
    steps: {
      wake: formText(formData, 'steps.wake', defaults.steps.wake),
      show: formText(formData, 'steps.show', defaults.steps.show),
    },
    wake: {
      eyebrow: formText(formData, 'wake.eyebrow', defaults.wake.eyebrow),
      title: formText(formData, 'wake.title', defaults.wake.title),
      paragraphs: formParagraphs(formData, 'wake.paragraphs', defaults.wake.paragraphs),
      stats: defaults.wake.stats.map((stat, index) => ({
        key: stat.key,
        label: formText(formData, `wake.stats.${index}.label`, stat.label),
        value: formText(formData, `wake.stats.${index}.value`, stat.value),
      })),
      cta: formText(formData, 'wake.cta', defaults.wake.cta),
    },
    show: {
      eyebrow: formText(formData, 'show.eyebrow', defaults.show.eyebrow),
      title: formText(formData, 'show.title', defaults.show.title),
      subtitle: formText(formData, 'show.subtitle', defaults.show.subtitle),
    },
    moves: {
      donate: {
        badge: formText(formData, 'moves.donate.badge', defaults.moves.donate.badge),
        title: formText(formData, 'moves.donate.title', defaults.moves.donate.title),
        body: formText(formData, 'moves.donate.body', defaults.moves.donate.body),
        cta: formText(formData, 'moves.donate.cta', defaults.moves.donate.cta),
        href: formText(formData, 'moves.donate.href', defaults.moves.donate.href ?? ''),
      },
      events: {
        badge: formText(formData, 'moves.events.badge', defaults.moves.events.badge),
        title: formText(formData, 'moves.events.title', defaults.moves.events.title),
        body: formText(formData, 'moves.events.body', defaults.moves.events.body),
        cta: formText(formData, 'moves.events.cta', defaults.moves.events.cta),
      },
      deck: {
        badge: formText(formData, 'moves.deck.badge', defaults.moves.deck.badge),
        title: formText(formData, 'moves.deck.title', defaults.moves.deck.title),
        body: formText(formData, 'moves.deck.body', defaults.moves.deck.body),
        cta: formText(formData, 'moves.deck.cta', defaults.moves.deck.cta),
        href: formText(formData, 'moves.deck.href', defaults.moves.deck.href ?? ''),
      },
      book: {
        badge: formText(formData, 'moves.book.badge', defaults.moves.book.badge),
        title: formText(formData, 'moves.book.title', defaults.moves.book.title),
        body: formText(formData, 'moves.book.body', defaults.moves.book.body),
        cta: formText(formData, 'moves.book.cta', defaults.moves.book.cta),
        href: formText(formData, 'moves.book.href', defaults.moves.book.href ?? ''),
      },
      chapter: {
        badge: formText(formData, 'moves.chapter.badge', defaults.moves.chapter.badge),
        title: formText(formData, 'moves.chapter.title', defaults.moves.chapter.title),
        body: formText(formData, 'moves.chapter.body', defaults.moves.chapter.body),
        cta: formText(formData, 'moves.chapter.cta', defaults.moves.chapter.cta),
        href: formText(formData, 'moves.chapter.href', defaults.moves.chapter.href ?? ''),
      },
    },
    events: defaults.events.map((event, index) => ({
      key: event.key,
      title: formText(formData, `events.${index}.title`, event.title),
      when: formText(formData, `events.${index}.when`, event.when),
      date: formText(formData, `events.${index}.date`, event.date),
      where: formText(formData, `events.${index}.where`, event.where),
      blurb: formText(formData, `events.${index}.blurb`, event.blurb),
      partifulUrl: formText(formData, `events.${index}.partifulUrl`, event.partifulUrl),
    })),
    secondary: {
      eyebrow: formText(formData, 'secondary.eyebrow', defaults.secondary.eyebrow),
      products: {
        title: formText(formData, 'secondary.products.title', defaults.secondary.products.title),
        body: formText(formData, 'secondary.products.body', defaults.secondary.products.body),
        href: formText(formData, 'secondary.products.href', defaults.secondary.products.href),
      },
      nonprofit: {
        title: formText(formData, 'secondary.nonprofit.title', defaults.secondary.nonprofit.title),
        body: formText(formData, 'secondary.nonprofit.body', defaults.secondary.nonprofit.body),
        href: formText(formData, 'secondary.nonprofit.href', defaults.secondary.nonprofit.href),
      },
    },
  })
}

export async function saveAwakenPageContent(
  _prevState: { ok?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    const adminId = await requireAdminId()
    const awakenPage = contentFromFormData(formData)
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

    const nextTheme = JSON.stringify({ ...theme, awakenPage })

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
        target: 'awaken_page',
        payload: JSON.stringify({ updatedKeys: ['theme.awakenPage'] }),
      },
    })

    revalidatePath('/awaken')
    revalidatePath('/admin/config')
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save awaken page' }
  }
}
