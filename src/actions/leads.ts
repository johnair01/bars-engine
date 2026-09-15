'use server'

/**
 * Email capture for the quiz surfaces and the character sheet.
 *
 * Persist-then-send, the same shape `launch-leads.ts` and `myths-read.ts` use:
 * the FunnelSignup row is written first and the list copy is best-effort after
 * it. A provider outage costs a copy of the lead, never the lead.
 *
 * Only a page that promised later mail puts anyone on the list. Which pages
 * those are lives in `src/lib/esp/list-contract.ts`.
 */

import { db } from '@/lib/db'
import { sendSuperpowerResultEmail } from '@/lib/email/superpower'
import { addToList } from '@/lib/esp/resend-list'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CaptureLeadState = { ok: true; message: string } | { ok: false; error: string }

function normalize(email: string): string {
  return email.trim().toLowerCase()
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

  const firstName = name?.split(/\s+/)[0] ?? null

  // No list copy. The reveal promises the result and the superpower ranked
  // last, and nothing after that, so the address stays on the FunnelSignup row.

  // The reveal promises the result and the avoided Face by email before it asks
  // for the address, so this send is the promise itself rather than a courtesy.
  // Until 2026-08-18 this action had no send path at all and returned the
  // sentence below regardless, which meant the one surface that states its terms
  // up front was the one breaking them.
  const sent = await sendSuperpowerResultEmail({
    to: email,
    homeFace: input.homeFace,
    avoidedFace: input.avoidedFace,
    firstName,
  })
  if (!sent.ok) {
    console.error('[leads] superpower result email failed to send', {
      email,
      error: sent.error,
    })
    return {
      ok: true,
      message:
        'Saved. The email hiccuped on my side, so it may not arrive. Your result is still on this page, and taking the quiz again will resend it.',
    }
  }
  if ('skipped' in sent && sent.skipped) {
    return { ok: true, message: 'Saved. Email is not switched on here yet, so nothing was sent.' }
  }

  return { ok: true, message: 'Saved. Your result is on its way to your inbox.' }
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

  // The quarterly job reads its recipients from FunnelSignup, so this copy is
  // what gives the reader a contact to unsubscribe from before the first send.
  await addToList({
    email,
    firstName: name?.split(/\s+/)[0] ?? null,
    list: 'character-sheet',
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

  await addToList({
    email,
    firstName: name?.split(/\s+/)[0] ?? null,
    list: input.list,
  })

  return {
    ok: true,
    message:
      input.list === 'succession'
        ? "You're on the list. You will hear from me when there is something real to say."
        : "You're on the list. I will write when the founding circle meets.",
  }
}
