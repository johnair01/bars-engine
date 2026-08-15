'use server'

/**
 * Capture one crowdsourced tour lead.
 *
 * Persist-then-send, the same shape the rest of the site uses: the row is
 * committed first, and the Kit sync afterward is best-effort.
 *
 * **This never accepts contact details for the person being named.** The form
 * does not ask, and the action does not store — see the model comment in
 * prisma/schema.prisma. `canIntroduce` is how a warm path gets recorded, and it
 * keeps the introduction with the one person in the exchange who agreed to be
 * in it.
 */

import { db } from '@/lib/db'
import { syncSubscriber } from '@/lib/esp/kit'
import { LEAD_KIND_KEYS } from '@/lib/tour-leads/corridor'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type IntroductionState =
  | { ok: true; message: string }
  | { ok: false; error: string }

export async function submitIntroduction(input: {
  place: string
  city: string
  kind: string
  canIntroduce: boolean
  note?: string
  submitterName?: string
  submitterEmail: string
  consent: boolean
}): Promise<IntroductionState> {
  const place = input.place?.trim()
  const city = input.city?.trim()
  const email = input.submitterEmail?.trim().toLowerCase()

  if (!place) return { ok: false, error: 'Name the place, shop, org or show.' }
  if (!city) return { ok: false, error: 'Which town is it in?' }
  if (!LEAD_KIND_KEYS.has(input.kind)) return { ok: false, error: 'Pick what kind it is.' }
  if (!EMAIL_RE.test(email ?? '')) {
    return { ok: false, error: 'An email so I can come back to you about it.' }
  }

  try {
    await db.tourIntroduction.create({
      data: {
        place: place.slice(0, 200),
        city: city.slice(0, 120),
        kind: input.kind,
        canIntroduce: Boolean(input.canIntroduce),
        note: input.note?.trim().slice(0, 1000) || null,
        submitterName: input.submitterName?.trim().slice(0, 120) || null,
        submitterEmail: email,
        consent: Boolean(input.consent),
      },
    })
  } catch (err) {
    console.error('[introductions] failed to persist lead', err)
    return { ok: false, error: 'Something went wrong saving that. Please try again.' }
  }

  // Best-effort. A tagged subscriber is a copy of a lead already committed.
  await syncSubscriber({
    email,
    firstName: input.submitterName?.trim().split(/\s+/)[0] ?? null,
    tags: ['source:introductions', 'gather-resources:rep'],
    fields: { last_introduction_city: city.slice(0, 120) },
  })

  return {
    ok: true,
    message: input.canIntroduce
      ? 'Got it. I will come back to you before I write to them, so the introduction stays yours to make.'
      : 'Got it. That is on the board, and I will chase it myself.',
  }
}
