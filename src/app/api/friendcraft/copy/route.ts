/**
 * @route GET /api/friendcraft/copy
 * @entity INSTANCE
 * @description The default text of the Friendcraft deck pages (the built-in text with an admin's edits over it) and whether the signed-in player may change it
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships INSTANCE (friendcraft)
 * @example GET /api/friendcraft/copy
 *
 * @route PUT /api/friendcraft/copy
 * @description Replaces the edited default text. A field left out, empty or equal to the built-in text goes back to the built-in text
 * @permissions site admin, or steward of the friendcraft instance; 403 otherwise
 * @example PUT /api/friendcraft/copy { "copy": { "ask": "What do you hope a friend will do?" } }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { currentPlayer, friendcraftCopy, mayEditFriendcraftCopy, saveFriendcraftCopy } from '@/lib/between/store'
import { COPY_FIELDS, COPY_MAX, DEFAULT_COPY } from '../../../../../public/between/friendcraft/deck.js'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET() {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine' }, { status: 401 })
  const [copy, canEdit] = await Promise.all([friendcraftCopy(), mayEditFriendcraftCopy(player.id)])
  return NextResponse.json({ copy, defaults: DEFAULT_COPY, fields: COPY_FIELDS, max: COPY_MAX, canEdit }, { headers })
}

export async function PUT(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine' }, { status: 401 })
  if (!(await mayEditFriendcraftCopy(player.id))) return NextResponse.json({ error: 'Only an admin or a Friendcraft steward changes this text.' }, { status: 403 })
  const body = (await req.json().catch(() => null)) as { copy?: unknown } | null
  const copy = await saveFriendcraftCopy(body?.copy)
  if (!copy) return NextResponse.json({ error: 'The friendcraft instance is not set up yet.' }, { status: 409 })
  const sent = (body?.copy && typeof body.copy === 'object' ? body.copy : {}) as Record<string, unknown>
  const rejected = COPY_FIELDS.filter(k => typeof sent[k] === 'string' && (sent[k] as string).trim() && (sent[k] as string).trim() !== DEFAULT_COPY[k as keyof typeof DEFAULT_COPY] && copy[k] === undefined)
  return NextResponse.json({ copy, rejected }, { headers })
}
