'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { validateSocialUrl, getMaxLinksPerBar } from '@/lib/bar-social-links'

async function getPlayerId(): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return store.get('bars_player_id')?.value ?? null
}

export async function addBarSocialLink(
  barId: string,
  url: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { success: false, error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true },
  })
  if (!bar) return { success: false, error: 'BAR not found' }
  if (bar.creatorId !== playerId) return { success: false, error: 'Only the owner can add inspiration links' }

  const count = await db.barSocialLink.count({ where: { barId } })
  if (count >= getMaxLinksPerBar()) {
    return { success: false, error: `Maximum ${getMaxLinksPerBar()} inspiration links per BAR` }
  }

  const result = validateSocialUrl(url)
  if (!result.ok) return { success: false, error: result.error }

  try {
    await db.barSocialLink.create({
      data: {
        barId,
        platform: result.platform,
        url: url.trim(),
        note: note?.trim() || null,
        sortOrder: count,
      },
    })
    revalidatePath('/bars')
    revalidatePath(`/bars/${barId}`)
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to add link'
    console.error('[BAR] addBarSocialLink error:', msg)
    return { success: false, error: msg }
  }
}

export async function removeBarSocialLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { success: false, error: 'Not logged in' }

  const link = await db.barSocialLink.findUnique({
    where: { id: linkId },
    include: { bar: { select: { id: true, creatorId: true } } },
  })
  if (!link) return { success: false, error: 'Link not found' }
  if (link.bar.creatorId !== playerId) return { success: false, error: 'Only the owner can remove links' }

  try {
    await db.barSocialLink.delete({ where: { id: linkId } })
    revalidatePath('/bars')
    revalidatePath(`/bars/${link.barId}`)
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to remove link'
    console.error('[BAR] removeBarSocialLink error:', msg)
    return { success: false, error: msg }
  }
}
