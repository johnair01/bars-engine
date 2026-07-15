'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { sendChapterOneAccessEmail } from '@/lib/email/chapter-one'
import {
  CHAPTER_ONE_ACCESS_COOKIE,
  chapterOneAccessCookieOptions,
  chapterOneAccessPath,
  issueChapterOneAccessGrant,
} from '@/lib/mastering-allyship/chapter-one-access'
import { CHAPTER_ONE_LEAD_SOURCE, CHAPTER_ONE_READ_HREF } from '@/lib/mastering-allyship/chapter-one-lead'
import type { ChapterOneLeadState } from '@/lib/mastering-allyship/chapter-one-lead-state'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function captureChapterOneLead(input: {
  email: string
  name?: string
}): Promise<ChapterOneLeadState> {
  const email = input.email.trim().toLowerCase()
  const name = input.name?.trim() || null

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid email.' }
  }

  let accessToken: string
  try {
    accessToken = issueChapterOneAccessGrant()
  } catch (err) {
    console.error('[launch-leads] Chapter 1 access grant unavailable', err)
    return { ok: false, error: 'Chapter 1 access is not configured yet. Please try again later.' }
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

  const cookieStore = await cookies()
  cookieStore.set(CHAPTER_ONE_ACCESS_COOKIE, accessToken, chapterOneAccessCookieOptions())

  const firstName = name?.split(/\s+/)[0] || null
  const result = await sendChapterOneAccessEmail({
    to: email,
    firstName,
    accessPath: chapterOneAccessPath(accessToken),
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
      readerHref: CHAPTER_ONE_READ_HREF,
    }
  }

  const skipped = 'skipped' in result && result.skipped
  return {
    ok: true,
    emailed: !skipped,
    message: skipped
      ? "You're on the list. Email delivery is not configured here yet, so this is queued for manual follow-up."
      : "You're in. Chapter 1 is on its way to your inbox.",
    readerHref: CHAPTER_ONE_READ_HREF,
  }
}
