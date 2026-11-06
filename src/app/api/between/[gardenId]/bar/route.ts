/**
 * @route GET|POST /api/between/:gardenId/bar
 * @entity PLAYER
 * @description The BAR written at the Nook's hearth with the brush, its ink a kept ember (ember-to-vibeulon FR-004 to FR-008)
 * @permissions a member of the garden
 * @relationships PLAYER (BetweenPrivate pouch, CustomBar, Vibulon)
 * @example POST /api/between/clx.../bar { "ember": "e1730...", "mark": "I asked for help" }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer, whoIs } from '@/lib/between/store'
import { MOVES } from '@/lib/between/rules'
import { mintBarVibulon, releaseBarStake, stakeBarVibulon } from '@/lib/economy/bar-mint'

export const dynamic = 'force-dynamic'

/** Each element's ink as it sets on talisman yellow: its Between light deepened (stills round 2026-11-04-ember-first-1). */
const INK: Record<string, string> = { wood: '#2f6a2a', fire: '#c2401c', earth: '#7a5420', metal: '#55585e', water: '#1f4f96' }
const MARK_MAX = 80
const KEPT = new Set(['held', 'lit', 'written'])
type Ember = { move?: string; state?: string; bar?: string | null }
const embersOf = (data: unknown): Record<string, Ember> => {
  const e = data && typeof data === 'object' ? (data as { embers?: unknown }).embers : null
  return e && typeof e === 'object' ? (e as Record<string, Ember>) : {}
}
const keptIn = (data: unknown) => Object.values(embersOf(data)).filter(e => e && KEPT.has(String(e.state)) && e.move && MOVES[e.move]).length

async function member(gardenId: string) {
  const player = await currentPlayer()
  if (!player) return { error: NextResponse.json({ error: 'Sign in to bars-engine to tend the garden', code: 'unauthenticated' }, { status: 401 }) }
  const found = await whoIs(gardenId, player.id, null)
  if (!found || !found.who.member) return { error: NextResponse.json({ error: 'There is no garden here', code: 'not_found' }, { status: 404 }) }
  return { player }
}

/** Kept embers go with you (the hearth moment's line): a member's count is every pouch they keep, in any garden. */
async function keptBy(playerIds: string[]) {
  const rows = await db.betweenPrivate.findMany({ where: { playerId: { in: playerIds }, key: 'pouch' }, select: { playerId: true, data: true } })
  const by: Record<string, number> = Object.fromEntries(playerIds.map(id => [id, 0]))
  for (const r of rows) by[r.playerId] = (by[r.playerId] ?? 0) + keptIn(r.data)
  return by
}

/** The room's light: `mine`, and `room` summed over the garden's members (FR-008). Neither is written anywhere. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await params
  const m = await member(gardenId)
  if ('error' in m) return m.error
  const ids = (await db.betweenMember.findMany({ where: { gardenId }, select: { playerId: true } })).map(r => r.playerId)
  const by = await keptBy([...new Set([m.player.id, ...ids])])
  return NextResponse.json({ mine: by[m.player.id] ?? 0, room: ids.reduce((s, id) => s + (by[id] ?? 0), 0) || (by[m.player.id] ?? 0) })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId } = await params
  const m = await member(gardenId)
  if ('error' in m) return m.error
  const me = m.player.id
  const body = (await req.json().catch(() => null)) as { ember?: unknown; mark?: unknown; barId?: unknown; offer?: unknown } | null
  if (!body) return NextResponse.json({ error: 'Send JSON', code: 'invalid_argument' }, { status: 400 })

  // Offering a written BAR in the Hollow, or taking it back (FR-006): public stakes its vibeulon, private releases it.
  if (typeof body.barId === 'string' && typeof body.offer === 'boolean') {
    const bar = await db.customBar.findUnique({ where: { id: body.barId }, select: { id: true, creatorId: true, storyPath: true } })
    if (!bar || bar.creatorId !== me || bar.storyPath !== 'between') return NextResponse.json({ error: 'Only its maker offers a BAR', code: 'permission_denied' }, { status: 403 })
    const offer = body.offer
    const staked = await db.$transaction(async tx => {
      await tx.customBar.update({ where: { id: bar.id }, data: { visibility: offer ? 'public' : 'private' } })
      if (offer) return !!(await stakeBarVibulon(tx, { barId: bar.id, playerId: me }))
      await releaseBarStake(tx, { barId: bar.id })
      return false
    })
    return NextResponse.json({ barId: bar.id, staked })
  }

  // Writing a BAR with the brush dipped in a kept ember (FR-004, FR-005).
  const emberId = typeof body.ember === 'string' ? body.ember : ''
  const mark = typeof body.mark === 'string' ? body.mark.trim().replace(/\s+/g, ' ') : ''
  if (!emberId || !mark) return NextResponse.json({ error: 'Choose an ember and write its mark', code: 'invalid_argument' }, { status: 400 })
  if (mark.length > MARK_MAX) return NextResponse.json({ error: 'A mark is one short line', code: 'invalid_argument' }, { status: 400 })
  const where = { gardenId_playerId_key: { gardenId, playerId: me, key: 'pouch' } }
  const pouch = await db.betweenPrivate.findUnique({ where })
  if (!pouch || keptIn(pouch.data) < 1) return NextResponse.json({ error: 'Work a charge at the hearth first', code: 'not_yet' }, { status: 409 })
  const ember = embersOf(pouch.data)[emberId]
  const move = ember && ember.move ? MOVES[ember.move] : undefined
  if (!ember || !move) return NextResponse.json({ error: 'That ember is not in your pouch', code: 'not_found' }, { status: 404 })
  if (ember.state !== 'held') return NextResponse.json({ error: 'That ember is already in a lantern or a BAR', code: 'conflict' }, { status: 409 })
  const element = move.from, ink = INK[element]

  const out = await db.$transaction(async tx => {
    const bar = await tx.customBar.create({
      data: { creatorId: me, title: mark, description: mark, type: 'vibe', reward: 1, visibility: 'private', storyPath: 'between', storyMood: element },
      select: { id: true },
    })
    await tx.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
    const vibulonId = await mintBarVibulon(tx, { barId: bar.id, playerId: me, title: mark })
    // The ember stays kept (ee2-one-ember-per-lantern): written, naming its BAR. No words, feel or glow leave the pouch.
    const cur = (pouch.data && typeof pouch.data === 'object' ? pouch.data : {}) as Record<string, unknown>
    const embers = { ...embersOf(cur), [emberId]: { ...ember, state: 'written', bar: bar.id } }
    await tx.betweenPrivate.update({ where, data: { data: { ...cur, embers } as object } })
    return { barId: bar.id, vibulonId }
  })
  return NextResponse.json({ ...out, ink, element, staked: false })
}
