import { sendEmail, type SendEmailResult } from './send'
import { ChapterOneEmail, chapterOneText } from './templates/ChapterOneEmail'
import { AWAKEN_CHAPTER_FILE_HREF } from '@/lib/awaken/content'

/**
 * Awaken funnel email sends. Thin wrappers over the canonical sendEmail so the
 * route stays declarative and the absolute-URL logic lives in one place.
 */

/**
 * Resolve an app-absolute URL for use in email (links must be absolute).
 * Mirrors the repo convention: NEXT_PUBLIC_BASE_URL → NEXT_PUBLIC_APP_URL →
 * VERCEL_URL, with a production fallback.
 */
export function absoluteUrl(path: string): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://bars-engine.vercel.app'
  const base = raw.replace(/\/$/, '')
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

export async function sendChapterOneEmail(opts: {
  to: string
  firstName?: string | null
}): Promise<SendEmailResult> {
  const downloadUrl = absoluteUrl(AWAKEN_CHAPTER_FILE_HREF)
  const homeUrl = absoluteUrl('/awaken')
  const props = { downloadUrl, homeUrl, firstName: opts.firstName ?? null }
  return sendEmail({
    to: opts.to,
    subject: 'Chapter One is yours',
    react: ChapterOneEmail(props),
    text: chapterOneText(props),
    tags: [{ name: 'funnel', value: 'awaken-chapter' }],
  })
}
