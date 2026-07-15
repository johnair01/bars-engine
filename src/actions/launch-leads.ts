'use server'

import { db } from '@/lib/db'
import { sendChapterOneEmail } from '@/lib/email/awaken'
import { CHAPTER_ONE_LEAD_SOURCE, CHAPTER_ONE_PDF_HREF } from '@/lib/mastering-allyship/chapter-one-lead'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ChapterOneLeadState =
  | { ok: true; emailed: boolean; message: string }
  | { ok: false; error: string }

export async function captureChapterOneLead(input: {
  email: string
  name?: string
}): Promise<ChapterOneLeadState> {
  const email = input.email.trim().toLowerCase()
  const name = input.name?.trim() || null

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid email.' }
  }

  try {
    await db.funnelSignup.create({
      data: {
        intent: 'chapter',
        email,
        name,
        source: CHAPTER_ONE_LEAD_SOURCE,
      },
    })
  } catch (err) {
    console.error('[launch-leads] failed to persist Chapter 1 lead', err)
    return {
      ok: false,
      error: 'Something went wrong saving that. Please try again.',
    }
  }

  const firstName = name?.split(/\s+/)[0] || null
  const result = await sendChapterOneEmail({
    to: email,
    firstName,
    homePath: '/launch',
    funnelTag: CHAPTER_ONE_LEAD_SOURCE,
    downloadPath: CHAPTER_ONE_PDF_HREF,
  })
  if (!result.ok) {
    console.error('[launch-leads] Chapter 1 email failed to send', {
      email,
      error: result.error,
    })
    return {
      ok: true,
      emailed: false,
      message:
        "You're on the list. The email hiccuped on our side, so we'll follow up manually if it does not arrive.",
    }
  }

  const skipped = 'skipped' in result && result.skipped
  return {
    ok: true,
    emailed: !skipped,
    message: skipped
      ? "You're on the list. Email delivery is not configured here yet, so this is queued for manual follow-up."
      : "You're in. Chapter 1 is on its way to your inbox.",
  }
}
