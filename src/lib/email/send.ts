import type { ReactElement } from 'react'
import type { CreateEmailOptions } from 'resend'
import { getResend, getEmailConfig } from './resend'

/**
 * The one canonical email send. Every feature routes through here.
 *
 * Design (Architect: persist-then-send): this never throws. Callers persist
 * their record first, then call sendEmail and tolerate a non-ok result — a
 * flaky provider must not 500 the request or lose the lead. Wire retries /
 * re-send tooling on top of the returned result, not by catching exceptions.
 */

export type SendEmailInput = {
  to: string | string[]
  subject: string
  /** Provide one of `react` or `html` (react wins if both given). */
  react?: ReactElement
  html?: string
  /** Plain-text fallback — improves deliverability and accessibility. */
  text?: string
  /** Override the default human reply-to for this send. */
  replyTo?: string
  /** Optional tags for Resend analytics (e.g. funnel:awaken). */
  tags?: { name: string; value: string }[]
}

export type SendEmailResult =
  | { ok: true; id: string | null; skipped?: false }
  | { ok: true; id: null; skipped: true; reason: string }
  | { ok: false; error: string }

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getEmailConfig()
  const resend = getResend()

  // Graceful no-op when email isn't configured (local/preview). The caller's
  // record is already saved; we just can't deliver yet.
  if (!config || !resend) {
    console.warn(
      `[email] not configured (RESEND_API_KEY/EMAIL_FROM missing) — skipped "${input.subject}" to ${String(input.to)}`,
    )
    return { ok: true, id: null, skipped: true, reason: 'email_not_configured' }
  }

  // CreateEmailOptions is a discriminated union over the content field
  // (react | html | text), so build exactly one variant rather than spreading.
  const base = {
    from: config.from,
    to: input.to,
    subject: input.subject,
    replyTo: input.replyTo ?? config.replyTo ?? undefined,
    tags: input.tags,
  }
  let payload: CreateEmailOptions
  if (input.react) {
    payload = { ...base, react: input.react }
  } else if (input.html) {
    payload = { ...base, html: input.html, text: input.text }
  } else {
    payload = { ...base, text: input.text ?? '' }
  }

  try {
    const { data, error } = await resend.emails.send(payload)

    if (error) {
      console.error('[email] resend returned an error', error)
      return { ok: false, error: error.message }
    }
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    console.error('[email] send threw', err)
    return { ok: false, error: err instanceof Error ? err.message : 'unknown send error' }
  }
}
