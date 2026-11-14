/**
 * @route GET|POST /api/board/outreach/send
 * @entity SYSTEM
 * @description The Council Board's outreach Send with no Claude in the path: GET says which server senders are set up;
 *   POST sends one approved draft (contacts/<id>.draft, status send) whose text still matches his approval hash
 * @permissions owner (bars-engine sign-in cookie naming BOARD_OWNER_PLAYER_ID)
 * @example POST /api/board/outreach/send {"contactId": "jane-doe-ab12c"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { approvalHash, gmailSend, sentPatch, serverRungs, type Letter, type Rung, type SendOutcome } from '@/lib/board/outreach'
import { sendEmail } from '@/lib/email/send'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const BOARD = 'council', COLLECTION = 'contacts'
type Doc = Record<string, unknown>
type Draft = Doc & { status?: string; to?: unknown; cc?: unknown; subject?: unknown; body?: unknown; approvedHash?: unknown; messageId?: unknown }

const list = (v: unknown) => (Array.isArray(v) ? v : []).map(String).map(s => s.trim()).filter(Boolean)
const now = () => new Date().toISOString()

export async function GET() {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const { gmail, resend, first } = serverRungs()
  return NextResponse.json({ gmail, resend, rung: first }, { headers: NO_STORE })
}

/** Each write is a new board_saves row, as a board save is; born recorded, since contacts are board state only. */
async function save(tx: Pick<typeof db, 'boardSave'>, docId: string, data: Doc, record: string) {
  await tx.boardSave.create({ data: { board: BOARD, collection: COLLECTION, docId, recordedAt: new Date(), record, data: data as object } })
}

async function deliver(rung: Rung, l: Letter, key: string): Promise<SendOutcome> {
  if (rung === 'gmail-api') return gmailSend(l)
  const self = process.env.OUTREACH_REPLY_TO?.trim() || process.env.EMAIL_REPLY_TO?.trim() || undefined
  const r = await sendEmail({ to: l.to, cc: l.cc, bcc: self ? [self] : undefined, replyTo: self, subject: l.subject,
    text: l.body, idempotencyKey: `outreach-${key}`, tags: [{ name: 'feature', value: 'outreach' }] })
  if (!r.ok) return { ok: false, error: `resend refused (${r.error})` }
  if (r.skipped) return { ok: false, error: 'resend is not configured' }
  return { ok: true, messageId: r.id }
}

export async function POST(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.nextUrl.host) return NextResponse.json({ error: 'Cross-site send' }, { status: 403 })
  let contactId = ''
  try { contactId = String(((await req.json()) as { contactId?: unknown }).contactId ?? '') } catch { /* below */ }
  if (!/^[^/\\\u0000-\u001f]{1,200}$/.test(contactId)) return NextResponse.json({ error: 'Name a contactId' }, { status: 400 })
  const { first: rung } = serverRungs()
  // No server sender: the card falls to Open in Mail / Copy, which needs nothing.
  if (!rung) return NextResponse.json({ error: 'no_server_sender' }, { status: 503, headers: NO_STORE })

  // Claim it: under a lock per contact, only an approved, unsent draft whose text still matches his Send moves to sending.
  const claim = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'outreach:' + contactId}))`
    const row = await tx.boardSave.findFirst({ where: { board: BOARD, collection: COLLECTION, docId: contactId },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], select: { data: true } })
    const c = (row?.data as Doc | undefined) ?? null, d = (c?.draft ?? null) as Draft | null
    if (!c || !d) return { ok: false as const, status: 404, error: 'no_draft' }
    if (d.status !== 'send') return { ok: false as const, status: 409, error: `draft is ${d.status ?? 'draft'}, not approved to send` }
    if (d.messageId) return { ok: false as const, status: 409, error: 'already sent' }
    if (typeof d.approvedHash !== 'string' || approvalHash(d.to, d.cc, d.subject, d.body) !== d.approvedHash)
      return { ok: false as const, status: 409, error: 'text changed after approval' }
    const letter: Letter = { to: list(d.to), cc: list(d.cc), subject: String(d.subject ?? ''), body: String(d.body ?? '') }
    if (!letter.to.length) return { ok: false as const, status: 422, error: 'no recipient' }
    const next = { ...c, draft: { ...d, status: 'sending', sendingAt: now(), via: rung, lastError: null } }
    await save(tx, contactId, next, `outreach send: sending via ${rung}`)
    return { ok: true as const, c: next, letter, hash: d.approvedHash }
  })
  if (!claim.ok) return NextResponse.json({ error: claim.error }, { status: claim.status, headers: NO_STORE })

  const out = await deliver(rung, claim.letter, claim.hash)
  const d = claim.c.draft as Draft
  if (out.ok) {
    const sent = { ...claim.c, draft: { ...d, status: 'sent', sentAt: now(), messageId: out.messageId,
      threadId: out.threadId ?? null }, letterInHand: null, ...sentPatch(claim.c, rung === 'gmail-api' ? 'Gmail' : 'Resend') }
    await save(db, contactId, sent, `outreach send: sent via ${rung}`)
    return NextResponse.json({ ok: true, via: rung, doc: sent }, { headers: NO_STORE })
  }
  // A refused call sent nothing, so the draft goes back to send. A call that broke mid-way may have sent: it stays in
  // sending, which board/pull.py lists for a Sent-folder check, and is never resent automatically.
  const back = { ...claim.c, draft: { ...d, status: out.unknown ? 'sending' : 'send', lastError: out.error, lastErrorAt: now() } }
  await save(db, contactId, back, `outreach send: ${out.unknown ? 'unknown' : 'failed'} via ${rung}`)
  return NextResponse.json({ error: out.error, unknown: !!out.unknown, via: rung, doc: back },
    { status: 502, headers: NO_STORE })
}
