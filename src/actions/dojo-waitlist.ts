'use server'

import { db } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DOJO_WAITLIST_SOURCE = 'listen-dojo-waitlist'

export type DojoWaitlistState =
  | { ok: true; message: string }
  | { ok: false; error: string }

/** Collects a name for the next Dojo cohort (council row lr-dojo-door: waitlist). */
export async function joinDojoWaitlist(input: {
  email: string
  name?: string
}): Promise<DojoWaitlistState> {
  const email = input.email.trim().toLowerCase()
  const name = input.name?.trim() || null
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email.' }

  try {
    await db.funnelSignup.create({
      data: { intent: 'dojo-waitlist', email, name, source: DOJO_WAITLIST_SOURCE },
    })
  } catch (err) {
    console.error('[dojo-waitlist] failed to persist signup', err)
    return { ok: false, error: 'Something went wrong saving that. Please try again.' }
  }
  return { ok: true, message: "You're on the list. I'll write when a cohort has a date." }
}
