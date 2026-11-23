/**
 * @route POST /api/work/tickets
 * @entity SYSTEM
 * @description The council pushes a piece of work into the lanes (a gate, a brief) without his answer passing
 *   through the board save first. A second push with the same sourceKey is a no-op. His board answers push their own
 *   tickets as they are saved (src/app/api/board/saves).
 * @permissions COUNCIL_MENU_TOKEN
 * @example POST /api/work/tickets {"sourceKey":"council/gates/wq-look-3@A","title":"...","brief":"...","basis":{"rows":["wq-look-3"]},"lanes":["claude","freebuff"]}
 *
 * @route GET /api/work/tickets
 * @description The tickets of one lane or all, newest first (up to 50), for a session checking what is queued.
 * @permissions COUNCIL_MENU_TOKEN, or (GET only) the board owner's sign-in, which the harbour's lanterns read
 * @example GET /api/work/tickets?lane=claude&state=ready
 * @example GET /api/work/tickets?rows=ctw-nook-look-2,harbour-loop-look-1   (every ticket whose basis.rows names one,
 *   any state, up to 200: board/gates.py counts a claimed or done ticket as the gate's claim, writers-api FR-003)
 *
 * @route PATCH /api/work/tickets
 * @description Record the draft a ticket produced, so the harbour's steer card can link it: {"rows":["hq-talk-look-2"],
 *   "draft":{"url":"https://github.com/<owner>/<repo>/pull/834","label":"bars-engine #834"}}. Every ticket whose
 *   basis.rows names one of the rows (or `ids`) gets `basis.draft`. The url must be https on github.com.
 * @permissions COUNCIL_MENU_TOKEN
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBoardOwner } from '@/lib/board/owner'
import { cleanLanes, councilCaller } from '@/lib/work/lanes'
import { pushTicket } from '@/lib/work/queue'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const str = (k: string, max: number) => (typeof b?.[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '')
  const sourceKey = str('sourceKey', 300), title = str('title', 200), brief = str('brief', 20000)
  if (!sourceKey || !title || !brief) return NextResponse.json({ error: 'Expected {sourceKey, title, brief, basis?, lanes?}' }, { status: 400 })
  const basis = b?.basis && typeof b.basis === 'object' ? b.basis : {}
  const r = await pushTicket(db, { sourceKey, title, brief, basis: basis as never, lanes: cleanLanes(b?.lanes) })
  return NextResponse.json({ created: r.created, ticket: { id: r.ticket.id, lane: r.ticket.lane, state: r.ticket.state } },
    { status: r.created ? 201 : 200, headers: NO_STORE })
}

export async function GET(req: NextRequest) {
  if (!councilCaller(req) && !(await isBoardOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const lane = req.nextUrl.searchParams.get('lane') || undefined
  const state = req.nextUrl.searchParams.get('state') || undefined
  const rows = (req.nextUrl.searchParams.get('rows') || '').split(',').map(r => r.trim()).filter(Boolean).slice(0, 100)
  const where = rows.length
    ? { lane, state, OR: rows.map(r => ({ basis: { path: ['rows'], array_contains: [r] } })) }
    : { lane, state }
  const tickets = await db.workTicket.findMany({ where, orderBy: { createdAt: 'desc' }, take: rows.length ? 200 : 50,
    select: { id: true, title: true, lane: true, lanes: true, state: true, claimedBy: true, leaseUntil: true,
      attempts: true, result: true, createdAt: true, basis: true } })
  return NextResponse.json({ tickets }, { headers: NO_STORE })
}

const DRAFT_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/

export async function PATCH(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as { rows?: unknown; ids?: unknown; draft?: { url?: unknown; label?: unknown } } | null
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, 100) : [])
  const rows = list(b?.rows), ids = list(b?.ids)
  const url = typeof b?.draft?.url === 'string' ? b.draft.url.trim() : ''
  const label = typeof b?.draft?.label === 'string' ? b.draft.label.trim().slice(0, 80) : ''
  if (!DRAFT_URL.test(url) || (!rows.length && !ids.length)) {
    return NextResponse.json({ error: 'Expected {rows?: string[], ids?: string[], draft: {url: a github.com pull request link, label?}}' }, { status: 400 })
  }
  const found = await db.workTicket.findMany({
    where: { OR: [...rows.map(r => ({ basis: { path: ['rows'], array_contains: [r] } })), ...(ids.length ? [{ id: { in: ids } }] : [])] },
    select: { id: true, basis: true }, take: 200 })
  for (const t of found) {
    await db.workTicket.update({ where: { id: t.id }, data: { basis: { ...((t.basis ?? {}) as object), draft: { url, label } } } })
  }
  return NextResponse.json({ updated: found.map(t => t.id) }, { headers: NO_STORE })
}
