/**
 * @route POST /api/between/:gardenId/doc
 * @entity PLAYER
 * @description One write from the Between page (set, update or delete of one document), checked against the garden's rules
 * @permissions a member of the garden; someone holding the invite token may only ask to join a spark
 * @relationships PLAYER (BetweenGarden, BetweenItem, BetweenSpirit, BetweenDaemon, BetweenShown, BetweenPrivate)
 * @example POST /api/between/clx.../doc { "path": "items/ilmn-ab12", "op": "update", "data": { "status": "agreed" } }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer, whoIs, write } from '@/lib/between/store'
import { invitedView, parsePath, type Doc, type Op } from '@/lib/between/rules'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 64_000

export async function POST(req: NextRequest, { params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await params
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to tend the garden', code: 'unauthenticated' }, { status: 401 })
  const raw = await req.text()
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: 'That is too long to set down', code: 'invalid_argument' }, { status: 413 })
  let body: { path?: string; op?: Op; data?: Doc | null; invite?: string }
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Send JSON', code: 'invalid_argument' }, { status: 400 }) }
  const target = parsePath(body.path)
  const op = body.op
  const data = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null
  if (!target || !op || !['set', 'update', 'delete'].includes(op) || (op !== 'delete' && !data))
    return NextResponse.json({ error: 'Not a garden write', code: 'invalid_argument' }, { status: 400 })
  const found = await whoIs(gardenId, player.id, body.invite)
  if (!found) return NextResponse.json({ error: 'There is no garden here', code: 'not_found' }, { status: 404 })
  const res = await write(gardenId, found.who, target, op, data)
  if (!res.ok) return NextResponse.json({ error: res.error, code: res.status === 403 ? 'permission_denied' : 'invalid_argument' }, { status: res.status })
  // Someone who only holds the invite link asked to join: they get back the spark as they may see it, never the hopes.
  const doc = !found.who.member && target.table === 'garden' && res.doc ? invitedView(res.doc) : res.doc
  return NextResponse.json({ ok: true, doc })
}
