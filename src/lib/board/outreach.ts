import { createHash } from 'node:crypto'

/**
 * Outreach Send without Claude (six-faces-council council/callsheets/email-pipeline.md, 2026-10-26). His Send press on
 * the Council Board saves `draft.status = 'send'` with `approvedHash`; the server sends only text whose hash still
 * matches. approvalHash is a port of board/email_pipeline.py approval_hash and the page's approvalHash: the same
 * canonical string and the same sha256, pinned by one vector in all three.
 */
const lower = (s: string) => s.replace(/[A-Z]/g, c => c.toLowerCase())
const trim = (s: string) => s.replace(/^[ \t]+|[ \t]+$/g, '')
const addrs = (a: unknown) => [...new Set((Array.isArray(a) ? a : []).map(x => lower(trim(String(x).normalize('NFC')))))]
  .filter(Boolean).sort()

export function canonical(to: unknown, cc: unknown, subject: unknown, body: unknown): string {
  const b = String(body ?? '').normalize('NFC').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+$/gm, '')
    .replace(/\n+$/, '')
  return JSON.stringify({ body: b, cc: addrs(cc), subject: trim(String(subject ?? '').normalize('NFC')), to: addrs(to) })
}

export const approvalHash = (to: unknown, cc: unknown, subject: unknown, body: unknown) =>
  createHash('sha256').update(canonical(to, cc, subject, body), 'utf8').digest('hex')

export type Rung = 'gmail-api' | 'resend'

/** Which server senders are set up. Gmail first: it sends as him and lands in his Sent folder. */
export function serverRungs() {
  const gmail = !!(process.env.GMAIL_CLIENT_ID?.trim() && process.env.GMAIL_CLIENT_SECRET?.trim()
    && process.env.GMAIL_REFRESH_TOKEN?.trim())
  const resend = !!(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim())
  const first: Rung | null = gmail ? 'gmail-api' : resend ? 'resend' : null
  return { gmail, resend, first }
}

export type Letter = { to: string[]; cc: string[]; subject: string; body: string }

/** RFC 2047 for a header that is not plain ASCII. */
const header = (s: string) => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`
const noBreak = (s: string) => s.replace(/[\r\n]+/g, ' ')

/** The raw message Gmail's messages.send takes, base64url. From is left to Gmail (the signed-in account) unless set. */
export function rfc2822(l: Letter, from?: string): string {
  const lines = [
    ...(from ? [`From: ${noBreak(from)}`] : []),
    `To: ${noBreak(l.to.join(', '))}`,
    ...(l.cc.length ? [`Cc: ${noBreak(l.cc.join(', '))}`] : []),
    `Subject: ${header(noBreak(l.subject))}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    (Buffer.from(l.body.replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64').match(/.{1,76}/g) || []).join('\r\n'),
  ]
  return Buffer.from(lines.join('\r\n'), 'utf8').toString('base64url')
}

export type SendOutcome =
  | { ok: true; messageId: string | null; threadId?: string | null }
  /** sent false: the provider refused, so nothing went out. unknown: the call broke mid-way and it may have. */
  | { ok: false; error: string; unknown?: boolean }

export async function gmailSend(l: Letter, fetcher: typeof fetch = fetch): Promise<SendOutcome> {
  let token: string
  try {
    const r = await fetcher('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token', client_id: process.env.GMAIL_CLIENT_ID!.trim(),
        client_secret: process.env.GMAIL_CLIENT_SECRET!.trim(), refresh_token: process.env.GMAIL_REFRESH_TOKEN!.trim(),
      }),
    })
    const j = await r.json().catch(() => ({})) as { access_token?: string; error?: string }
    if (!r.ok || !j.access_token) return { ok: false, error: `gmail token refresh failed (${r.status} ${j.error ?? ''})`.trim() }
    token = j.access_token
  } catch (e) {
    return { ok: false, error: `gmail token refresh failed (${e instanceof Error ? e.message : 'network'})` }
  }
  try {
    const r = await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rfc2822(l, process.env.GMAIL_FROM?.trim() || undefined) }),
    })
    const j = await r.json().catch(() => ({})) as { id?: string; threadId?: string; error?: { message?: string } }
    if (!r.ok) return { ok: false, error: `gmail refused (${r.status}${j.error?.message ? ': ' + j.error.message : ''})` }
    return { ok: true, messageId: j.id ?? null, threadId: j.threadId ?? null }
  } catch (e) {
    return { ok: false, unknown: true, error: `gmail send broke mid-way (${e instanceof Error ? e.message : 'network'})` }
  }
}
