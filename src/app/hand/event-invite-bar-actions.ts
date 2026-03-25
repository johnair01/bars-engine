'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { isAllowedEventInviteSlug } from '@/lib/event-invite-party'
import { playerCanEditEventInviteBar } from '@/lib/event-invite-bar-permissions'

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
