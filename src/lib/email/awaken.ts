import { sendEmail, type SendEmailResult } from './send'
import { ChapterOneEmail, chapterOneText } from './templates/ChapterOneEmail'
import { RsvpConfirmationEmail, rsvpConfirmationText } from './templates/RsvpConfirmationEmail'
import { AWAKEN_CHAPTER_FILE_HREF, AWAKEN_EVENTS, type AwakenEvent } from '@/lib/awaken/content'
import { absoluteUrl } from './urls'

/**
 * Awaken funnel email sends. Thin wrappers over the canonical sendEmail so the
 * route stays declarative and the absolute-URL logic lives in one place.
 */

export { absoluteUrl } from './urls'

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
