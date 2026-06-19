import { Resend } from 'resend'

/**
 * Resend client + email env contract — the single source of truth for outbound
 * transactional email. Every feature sends through {@link getResend} /
 * {@link sendEmail}; do not instantiate Resend anywhere else (Regent: one tool,
 * one owner).
 *
 * Required env (set in Vercel, never committed):
 *   RESEND_API_KEY   — secret API key from the Resend dashboard
 *   EMAIL_FROM       — verified sender, e.g.
 *                      "Wendell · Mastering Allyship <hello@send.masteringallyship.com>"
 * Optional:
 *   EMAIL_REPLY_TO   — a human inbox so replies reach a person
 *                      (Diplomat), e.g. "wendell@masteringallyship.com"
 *
 * When RESEND_API_KEY is unset (local dev, previews), the layer degrades
 * gracefully: sends are logged and no-op'd instead of throwing, so the funnel
 * never strands a visitor over missing config.
 */

export type EmailConfig = {
  apiKey: string
  from: string
  replyTo: string | null
}

/** Read + validate email env. Returns null when email is not configured. */
export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim()
  if (!apiKey || !from) return null
  return {
    apiKey,
    from,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || null,
  }
}

/** True when RESEND_API_KEY + EMAIL_FROM are both present. */
export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null
}

// Singleton, mirroring src/lib/db.ts so hot-reload doesn't spawn many clients.
const globalForResend = globalThis as unknown as {
  resend?: Resend
  resendKey?: string
}

/**
 * Return a Resend client, or null when email isn't configured. Cached per
 * API key so a rotated key in dev picks up cleanly.
 */
export function getResend(): Resend | null {
  const config = getEmailConfig()
  if (!config) return null
  if (globalForResend.resend && globalForResend.resendKey === config.apiKey) {
    return globalForResend.resend
  }
  const client = new Resend(config.apiKey)
  if (process.env.NODE_ENV !== 'production') {
    globalForResend.resend = client
    globalForResend.resendKey = config.apiKey
  }
  return client
}
