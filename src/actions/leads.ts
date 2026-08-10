'use server'

/**
 * Email capture for the quiz surfaces and the character sheet.
 *
 * Persist-then-send, the same shape `launch-leads.ts` and `myths-read.ts` use:
 * the FunnelSignup row is written first and the Kit sync is best-effort after
 * it. A provider outage costs a copy of the lead, never the lead.
 *
 * The list contract these feed lives in `src/lib/esp/list-contract.ts`.
 */

import { db } from '@/lib/db'
import { syncSubscriber } from '@/lib/esp/kit'
import {
  buildSuperpowerTags,
  sourceTag,
  WELCOME_SEQUENCE_TAG,
} from '@/lib/esp/list-contract'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CaptureLeadState = { ok: true; message: string } | { ok: false; error: string }

function normalize(email: string): string {
  return email.trim().toLowerCase()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The Superpower quiz result, saved against an email address.
 *
 * `avoidedFace` is the bottom of the ranking. Chapter 9 argues the avoided Face
 * is the more interesting datum of the two, so it is stored rather than
 * recomputed later from a ranking nobody kept.
 */
export async function captureSuperpowerLead(input: {
  email: string
  name?: string | null
  homeFace: string
  avoidedFace?: string | null
}): Promise<CaptureLeadState> {
  const email = normalize(input.email)
  const name = input.name?.trim() || null
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email.' }
  if (!input.homeFace?.trim()) return { ok: false, error: 'Finish the quiz before saving it.' }

  try {
    await db.funnelSignup.create({
      data: { intent: 'superpower', email, name, source: 'superpower-quiz' },
    })
  } catch (err) {
    console.error('[leads] failed to persist superpower lead', err)
    return { ok: false, error: 'Something went wrong saving that. Please try again.' }
  }

  await syncSubscriber({
    email,
    firstName: name?.split(/\s+/)[0] ?? null,
    tags: [
      ...buildSuperpowerTags({ homeFace: input.homeFace, avoidedFace: input.avoidedFace }),
      WELCOME_SEQUENCE_TAG,
    ],
    fields: {
      home_face: input.homeFace,
      ...(input.avoidedFace ? { avoided_face: input.avoidedFace } : {}),
      taken_at: today(),
    },
  })

  return { ok: true, message: "Saved. Your result is on its way to your inbox." }
}

/**
 * The character sheet's quarterly nudge.
 *
 * Appendix H asks the reader to date every version and re-fill the sheet across
 * a year so she can watch her Face, her shadow and her myths move. One reminder
 * a quarter with a blank copy attached is that instruction, kept. It is not a
 * funnel and it does not enter the welcome sequence — the sheet itself is
 * ungated, and somebody who wants only the reminder gets only the reminder.
 */
export async function captureCharacterSheetNudge(input: {
  email: string
  name?: string | null
}): Promise<CaptureLeadState> {
  const email = normalize(input.email)
  const name = input.name?.trim() || null
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email.' }

  try {
    await db.funnelSignup.create({
      data: { intent: 'character-sheet', email, name, source: 'character-sheet' },
    })
  } catch (err) {
    console.error('[leads] failed to persist character sheet nudge', err)
    return { ok: false, error: 'Something went wrong saving that. Please try again.' }
  }

  await syncSubscriber({
    email,
    firstName: name?.split(/\s+/)[0] ?? null,
    tags: [sourceTag('character-sheet'), 'nudge:quarterly'],
    fields: { nudge_started_at: today() },
  })

  return { ok: true, message: 'Set. One reminder a quarter, with a blank sheet attached.' }
}

/**
 * The certification waitlist, and the founding circle for the in-formation org.
 *
 * Neither sells anything and neither enters a sequence. Both exist because the
 * book prints an address next to a promise, and an address with nothing behind
 * it is the defect these two lists close.
 */
export async function captureInterestList(input: {
  email: string
  name?: string | null
  list: 'succession' | 'nonprofit'
  /** What they said they can bring. Free text, stored on the signup row. */
  note?: string | null
}): Promise<CaptureLeadState> {
  const email = normalize(input.email)
  const name = input.name?.trim() || null
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email.' }

  try {
    await db.funnelSignup.create({
      data: { intent: input.list, email, name, source: input.list },
    })
  } catch (err) {
    console.error(`[leads] failed to persist ${input.list} interest`, err)
    return { ok: false, error: 'Something went wrong saving that. Please try again.' }
  }

  await syncSubscriber({
    email,
    firstName: name?.split(/\s+/)[0] ?? null,
    tags: [sourceTag(input.list)],
    fields: {
      [`${input.list}_joined_at`]: today(),
      ...(input.note ? { [`${input.list}_note`]: input.note.slice(0, 500) } : {}),
    },
  })

  return {
    ok: true,
    message:
      input.list === 'succession'
        ? "You're on the list. You will hear from me when there is something real to say."
        : "You're on the list. I will write when the founding circle meets.",
  }
}
