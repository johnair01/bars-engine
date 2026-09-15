/**
 * The character sheet's quarterly reminder: one email a quarter, with a blank
 * copy attached, to everyone who asked on the sheet page.
 *
 * Recipients come from Postgres, the list of record: every `FunnelSignup` with
 * intent `character-sheet`. Each reader is copied into the reminder-only Resend
 * segment on the way past, which gives them a contact to unsubscribe from.
 *
 * Why single sends: Broadcasts and Resend's batch API cannot carry an
 * attachment, and the page promised the sheet "attached."
 *
 * What makes a rerun safe, with no database column:
 *   - Each contact carries `sheet_reminder_quarter`, set after a successful
 *     send. A reader already stamped with this quarter is skipped.
 *   - Each send carries an idempotency key, so a retry inside 24 hours cannot
 *     deliver twice even if the stamp failed to write.
 * The cron fires on three consecutive days each quarter. The second and third
 * runs pick up anyone the first missed to a time limit, a daily send quota,
 * or a provider error.
 */
import { db } from '@/lib/db'
import { absoluteUrl } from '@/lib/email/awaken'
import { isEmailConfigured } from '@/lib/email/resend'
import { sendEmail } from '@/lib/email/send'
import {
  CHARACTER_SHEET_REMINDER_SUBJECT,
  CharacterSheetReminderEmail,
  characterSheetReminderText,
} from '@/lib/email/templates/CharacterSheetReminderEmail'
import {
  addToList,
  ensureStringProperty,
  listUnsubscribeHeaders,
  setContactProperty,
  unsubscribePageUrl,
} from './resend-list'

export const SHEET_REMINDER_PROPERTY = 'sheet_reminder_quarter'
export const SHEET_PRINT_PATH = '/mastering-allyship/MTGOA_Character_Sheet_print.pdf'
export const SHEET_FILLABLE_PATH = '/mastering-allyship/MTGOA_Character_Sheet_fillable.pdf'

/** Quota errors end the run. The next day's cron resumes where this one stopped. */
const STOP_CODES = new Set(['daily_quota_exceeded', 'monthly_quota_exceeded'])

export type ReminderRecipient = { email: string; firstName: string | null }

export type ReminderReport = {
  quarter: string
  status: 'done' | 'dry-run' | 'stopped' | 'blocked'
  reason?: string
  recipients: number
  sent: number
  skippedUnsubscribed: number
  skippedAlreadySent: number
  failed: number
  /** Readers not reached because the run stopped early. */
  remaining: number
}

/** `2026-Q4` for any date in October to December, in UTC. */
export function quarterLabel(now: Date): string {
  return `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`
}

/** Everyone who asked for the reminder, once each, with their latest name. */
export async function loadReminderRecipients(): Promise<ReminderRecipient[]> {
  const rows = await db.funnelSignup.findMany({
    where: { intent: 'character-sheet' },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
  const byEmail = new Map<string, ReminderRecipient>()
  for (const row of rows) {
    const email = row.email.trim().toLowerCase()
    if (!email) continue
    const firstName = row.name?.trim().split(/\s+/)[0] || byEmail.get(email)?.firstName || null
    byEmail.set(email, { email, firstName })
  }
  return [...byEmail.values()]
}

function blockers(): string[] {
  const out: string[] = []
  if (!isEmailConfigured()) out.push('RESEND_API_KEY and EMAIL_FROM must both be set')
  if (!process.env.EMAIL_POSTAL_ADDRESS?.trim()) {
    out.push('EMAIL_POSTAL_ADDRESS must be set: list mail has to carry a postal address')
  }
  return out
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function runCharacterSheetReminder(
  opts: {
    now?: Date
    dryRun?: boolean
    /** Stop starting new sends after this many milliseconds. */
    budgetMs?: number
    /** Pause between readers, to stay under Resend's request rate. */
    pauseMs?: number
    /** Injected in tests; production reads Postgres. */
    recipients?: ReminderRecipient[]
  } = {},
): Promise<ReminderReport> {
  const now = opts.now ?? new Date()
  const quarter = quarterLabel(now)
  const pauseMs = opts.pauseMs ?? 1000
  const startedAt = Date.now()
  const budgetMs = opts.budgetMs ?? 240_000

  const recipients = opts.recipients ?? (await loadReminderRecipients())
  const report: ReminderReport = {
    quarter,
    status: 'done',
    recipients: recipients.length,
    sent: 0,
    skippedUnsubscribed: 0,
    skippedAlreadySent: 0,
    failed: 0,
    remaining: 0,
  }

  const blocked = blockers()
  if (opts.dryRun) {
    return { ...report, status: 'dry-run', ...(blocked.length ? { reason: blocked.join('; ') } : {}) }
  }
  if (blocked.length) return { ...report, status: 'blocked', reason: blocked.join('; ') }

  if (!(await ensureStringProperty(SHEET_REMINDER_PROPERTY))) {
    return { ...report, status: 'blocked', reason: `could not create contact property ${SHEET_REMINDER_PROPERTY}` }
  }

  const postalAddress = process.env.EMAIL_POSTAL_ADDRESS!.trim()
  const fillableUrl = absoluteUrl(SHEET_FILLABLE_PATH)
  const printUrl = absoluteUrl(SHEET_PRINT_PATH)

  for (let i = 0; i < recipients.length; i++) {
    if (Date.now() - startedAt > budgetMs) {
      return { ...report, status: 'stopped', reason: 'time budget reached', remaining: recipients.length - i }
    }
    if (i > 0 && pauseMs > 0) await sleep(pauseMs)

    const reader = recipients[i]
    const listed = await addToList({ email: reader.email, firstName: reader.firstName, segment: 'character-sheet' })
    if (!listed.ok || listed.skipped) {
      report.failed++
      console.error('[sheet-reminder] contact lookup failed', {
        email: reader.email,
        error: listed.ok ? listed.reason : listed.error,
      })
      continue
    }

    const contact = listed.contact
    if (contact.unsubscribed) {
      report.skippedUnsubscribed++
      continue
    }
    if (contact.properties[SHEET_REMINDER_PROPERTY] === quarter) {
      report.skippedAlreadySent++
      continue
    }

    const props = {
      firstName: reader.firstName,
      fillableUrl,
      unsubscribeUrl: unsubscribePageUrl(contact.id),
      postalAddress,
    }
    const sent = await sendEmail({
      to: reader.email,
      subject: CHARACTER_SHEET_REMINDER_SUBJECT,
      react: CharacterSheetReminderEmail(props),
      text: characterSheetReminderText(props),
      attachments: [{ filename: 'MTGOA_Character_Sheet_print.pdf', path: printUrl }],
      headers: listUnsubscribeHeaders(contact.id),
      idempotencyKey: `sheet-reminder/${quarter}/${contact.id}`,
      tags: [{ name: 'list', value: 'character-sheet' }],
    })

    if (!sent.ok) {
      if (sent.code && STOP_CODES.has(sent.code)) {
        return { ...report, status: 'stopped', reason: sent.code, remaining: recipients.length - i }
      }
      report.failed++
      console.error('[sheet-reminder] send failed', { email: reader.email, error: sent.error })
      continue
    }
    if (sent.skipped) {
      report.failed++
      continue
    }

    report.sent++
    const stamped = await setContactProperty(contact.id, SHEET_REMINDER_PROPERTY, quarter)
    if (!stamped) {
      // The idempotency key still covers a rerun within 24 hours.
      console.error('[sheet-reminder] sent; the quarter stamp failed, so a rerun after 24 hours sends again', {
        email: reader.email,
      })
    }
  }

  return report
}
