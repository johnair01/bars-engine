import { sendEmail, type SendEmailResult } from './send'
import { ChapterOneEmail, chapterOneText } from './templates/ChapterOneEmail'
import { RsvpConfirmationEmail, rsvpConfirmationText } from './templates/RsvpConfirmationEmail'
import { AWAKEN_CHAPTER_FILE_HREF, AWAKEN_EVENTS, type AwakenEvent } from '@/lib/awaken/content'

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
  homePath?: string
  funnelTag?: string
  downloadPath?: string
}): Promise<SendEmailResult> {
  const downloadUrl = absoluteUrl(opts.downloadPath ?? AWAKEN_CHAPTER_FILE_HREF)
  const homeUrl = absoluteUrl(opts.homePath ?? '/awaken')
  const props = { downloadUrl, homeUrl, firstName: opts.firstName ?? null }
  return sendEmail({
    to: opts.to,
    subject: 'Chapter One is yours',
    react: ChapterOneEmail(props),
    text: chapterOneText(props),
    tags: [{ name: 'funnel', value: opts.funnelTag ?? 'awaken-chapter' }],
  })
}

export async function sendRsvpConfirmationEmail(opts: {
  to: string
  firstName?: string | null
  /** Validated event keys the visitor RSVP'd to. */
  eventKeys: string[]
}): Promise<SendEmailResult> {
  const keys = new Set(opts.eventKeys)
  // Preserve canonical event order and drop anything unrecognized.
  const events: AwakenEvent[] = AWAKEN_EVENTS.filter((e) => keys.has(e.key))
  if (events.length === 0) {
    return { ok: true, id: null, skipped: true, reason: 'no_matching_events' }
  }
  const homeUrl = absoluteUrl('/awaken')
  const props = { events, homeUrl, firstName: opts.firstName ?? null }
  return sendEmail({
    to: opts.to,
    subject: `You're on the list — July 17–19`,
    react: RsvpConfirmationEmail(props),
    text: rsvpConfirmationText(props),
    tags: [{ name: 'funnel', value: 'awaken-rsvp' }],
  })
}
