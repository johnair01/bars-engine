'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { isAllowedEventInviteSlug } from '@/lib/event-invite-party'
import { playerCanEditEventInviteBar } from '@/lib/event-invite-bar-permissions'
import { EVENT_INVITE_BAR_TYPE, parseEventInviteStory } from '@/lib/event-invite-story/schema'

const partifulSchema = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .url()
    .refine((u) => u.startsWith('https:'), 'Partiful link must use HTTPS'),
])

const eventSlugSchema = z.string().trim().max(64)

const inputSchema = z.object({
  barId: z.string().min(1),
  partifulUrl: z.string(),
  eventSlug: z.string(),
})

export type UpdateEventInviteBarLinksResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateEventInviteBarLinks(formData: FormData): Promise<UpdateEventInviteBarLinksResult> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Sign in required.' }

  const parsed = inputSchema.safeParse({
    barId: String(formData.get('barId') ?? ''),
    partifulUrl: String(formData.get('partifulUrl') ?? ''),
    eventSlug: String(formData.get('eventSlug') ?? ''),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join('; ') || 'Invalid input.' }
  }

  const { barId, partifulUrl: rawPartiful, eventSlug: rawSlug } = parsed.data

  const allowed = await playerCanEditEventInviteBar(player.id, barId, player.roles)
  if (!allowed) return { ok: false, error: 'You cannot edit this invitation BAR.' }

  const partifulResult = partifulSchema.safeParse(rawPartiful.trim())
  if (!partifulResult.success) {
    return { ok: false, error: partifulResult.error.flatten().formErrors.join('; ') || 'Invalid Partiful URL.' }
  }

  const slugResult = eventSlugSchema.safeParse(rawSlug)
  if (!slugResult.success) {
    return { ok: false, error: slugResult.error.flatten().formErrors.join('; ') || 'Invalid event slug.' }
  }

  const existingSlug = (
    await db.customBar.findUnique({
      where: { id: barId },
      select: { eventSlug: true },
    })
  )?.eventSlug?.trim() ?? ''

  const slugCandidate = slugResult.data
  const slugOk =
    slugCandidate === '' ||
    isAllowedEventInviteSlug(slugCandidate) ||
    (existingSlug !== '' && slugCandidate === existingSlug)

  if (!slugOk) {
    return {
      ok: false,
      error: 'Event slug must be blank, a known preset (apr-4-dance / apr-5-game), or unchanged.',
    }
  }

  const partifulUrl = partifulResult.data === '' ? null : partifulResult.data
  const eventSlug = slugCandidate === '' ? null : slugCandidate

  await db.customBar.update({
    where: { id: barId },
    data: { partifulUrl, eventSlug },
  })

  revalidatePath('/hand')
  revalidatePath(`/invite/event/${barId}`)
  return { ok: true }
}

const contentInputSchema = z.object({
  barId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required').max(400),
  description: z.string().max(12000),
  storyContentJson: z.string().min(1, 'Story JSON is required'),
})

export type UpdateEventInviteBarContentResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Update headline, subtitle, and CYOA JSON for an event_invite BAR (same auth as link editor).
 */
export async function updateEventInviteBarContent(input: {
  barId: string
  title: string
  description: string
  storyContentJson: string
}): Promise<UpdateEventInviteBarContentResult> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Sign in required.' }

  const parsed = contentInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join('; ') || 'Invalid input.' }
  }

  const { barId, title, description, storyContentJson } = parsed.data

  const allowed = await playerCanEditEventInviteBar(player.id, barId, player.roles)
  if (!allowed) return { ok: false, error: 'You cannot edit this invitation BAR.' }

  const story = parseEventInviteStory(storyContentJson.trim())
  if (!story) {
    return {
      ok: false,
      error: 'Story JSON is invalid. Check structure: id, start, passages (with text and choices or ending).',
    }
  }

  const bar = await db.customBar.findFirst({
    where: {
      id: barId,
      type: EVENT_INVITE_BAR_TYPE,
      archivedAt: null,
      status: 'active',
    },
    select: { id: true },
  })
  if (!bar) return { ok: false, error: 'Invitation BAR not found or not active.' }

  await db.customBar.update({
    where: { id: barId },
    data: {
      title: title.trim(),
      description: description.trim(),
      storyContent: JSON.stringify(story),
    },
  })

  revalidatePath('/hand')
  revalidatePath('/event')
  revalidatePath(`/invite/event/${barId}`)
  return { ok: true }
}
