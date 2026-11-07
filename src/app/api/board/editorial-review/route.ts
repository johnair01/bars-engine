/**
 * @route GET|POST /api/board/editorial-review
 * @description One-push editorial review for the exact Council Board card copy the owner saw.
 * @permissions board owner
 */
import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { pushTicket } from '@/lib/work/queue'
import { wakePickupAfter } from '@/lib/work/wake'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }
const RULE = 'relation-v1'
const MAX_TEXT = 20_000

function digest(cardId: string, text: string) {
  return createHash('sha256').update(RULE + '\n' + cardId + '\n' + text).digest('hex')
}
function key(cardId: string, hash: string) { return 'council/editorial/' + cardId + '@' + hash }

function valid(cardId: unknown, text: unknown): cardId is string {
  return typeof cardId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(cardId)
    && typeof text === 'string' && text.trim().length > 0 && text.length <= MAX_TEXT
}

function view(ticket: { id: string; state: string; result: string | null; createdAt: Date; updatedAt: Date }) {
  return { id: ticket.id, status: ticket.state, result: ticket.result,
    createdAt: ticket.createdAt, updatedAt: ticket.updatedAt, rule: RULE }
}

export async function GET(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const cardId = req.nextUrl.searchParams.get('cardId')
  const hash = req.nextUrl.searchParams.get('hash')
  if (typeof cardId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(cardId) || !/^[a-f0-9]{64}$/.test(hash ?? ''))
    return NextResponse.json({ error: 'Card and version required' }, { status: 400 })
  const ticket = await db.workTicket.findUnique({ where: { sourceKey: key(cardId, hash!) },
    select: { id: true, state: true, result: true, createdAt: true, updatedAt: true } })
  return NextResponse.json({ review: ticket ? view(ticket) : null }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  if (!(await isBoardOwner())) return NextResponse.json({ error: 'Sign in as the board owner' }, { status: 401 })
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.nextUrl.host)
    return NextResponse.json({ error: 'Cross-site request' }, { status: 403 })
  const raw = await req.text()
  if (raw.length > MAX_TEXT + 1_000) return NextResponse.json({ error: 'Review text too large' }, { status: 413 })
  let body: { cardId?: unknown; text?: unknown } | null = null
  try { body = JSON.parse(raw) } catch { /* handled below */ }
  if (!body || !valid(body.cardId, body.text))
    return NextResponse.json({ error: 'Card and text required' }, { status: 400 })
  const cardId = body.cardId as string
  const text = body.text as string
  const sourceKey = key(cardId, digest(cardId, text))
  const brief = `Wendell pressed Send to Editorial Review on Council Board card ${cardId}.
Review only the exact card text below. Apply the established MTGOA relation rule: keep “and” for genuine coordination; name cause, contrast, sequence, or explanation; reject unsupported emotional or psychological conclusions. The scanner supplies candidates, never a verdict. Preserve quoted words. Report each confirmed defect with the original span, reason, proposed wording, and any honest uses kept. Do not edit or publish the card. Put the review in this ticket's result so the board can show it. The blast radius is this card only. Rule: ${RULE}.

CARD TEXT:
${text}`
  const { ticket, created } = await pushTicket(db, {
    sourceKey, title: `Editorial review: ${cardId}`, brief,
    basis: { rows: [cardId], answer: 'editorial_review', label: 'Send to Editorial Review',
      steer: '', savedAt: new Date().toISOString() },
    lanes: ['claude'],
  })
  if (created) wakePickupAfter(`editorial review of ${cardId}`)
  return NextResponse.json({ review: view(ticket), created }, { status: created ? 201 : 200, headers: NO_STORE })
}
