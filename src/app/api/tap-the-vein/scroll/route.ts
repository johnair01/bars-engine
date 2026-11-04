/**
 * @route GET /api/tap-the-vein/scroll
 * @entity PLAYER
 * @description The council's scrolls for the signed-in player's shelf in the nook, newest first, each sealed or opened, with its nuggets of gold
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (CustomBar council_scroll and unchosen_gold)
 * @dimensions WHO:the player, WHAT:the council's weekly scroll, WHERE:the nook's shelf, ENERGY:returned ideas
 * @example GET /api/tap-the-vein/scroll
 * @agentDiscoverable false
 *
 * @route POST /api/tap-the-vein/scroll
 * @entity PLAYER
 * @description Breaking a scroll's seal ({ scrollId, open: true }) or answering an offered nugget with a ribbon ({ goldId, answer: yes | later | no })
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (CustomBar council_scroll and unchosen_gold)
 * @dimensions WHO:the player, WHAT:open or answer, WHERE:the nook's shelf, ENERGY:consent
 * @example POST /api/tap-the-vein/scroll {"goldId":"…","answer":"later"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer } from '@/lib/between/store'
import {
  GOLD_TYPE,
  SCROLL_TYPE,
  answeredGold,
  openedMeta,
  parseMeta,
  parseScrollWrite,
  toShelfScroll,
} from '@/lib/tap-the-vein/council-scroll'

const BAR = { id: true, title: true, description: true, status: true, strandMetadata: true } as const
const NO_STORE = { 'Cache-Control': 'no-store' }

/** six-faces-council `.specify/specs/unchosen-gold` contract 5. Only his own rows; the read writes them for him. */
export async function GET() {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to see your shelf' }, { status: 401 })
  try {
    const scrolls = await db.customBar.findMany({
      where: { creatorId: player.id, type: SCROLL_TYPE, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: BAR,
    })
    const ids = scrolls.flatMap(s => {
      const g = parseMeta(s.strandMetadata).goldIds
      return Array.isArray(g) ? g.filter((x): x is string => typeof x === 'string') : []
    })
    const gold = ids.length
      ? await db.customBar.findMany({ where: { id: { in: ids }, creatorId: player.id, type: GOLD_TYPE }, select: BAR })
      : []
    return NextResponse.json({ scrolls: scrolls.map(s => toShelfScroll(s, gold)) }, { headers: NO_STORE })
  } catch (e) {
    console.error('[api:ttv-scroll]', e)
    return NextResponse.json({ error: 'Failed to load the shelf' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to answer' }, { status: 401 })
  const w = parseScrollWrite(await req.json().catch(() => null))
  if (!w) return NextResponse.json({ error: 'Send { scrollId, open: true } or { goldId, answer }' }, { status: 400 })
  const now = new Date()
  try {
    if ('open' in w) {
      const s = await db.customBar.findFirst({ where: { id: w.scrollId, creatorId: player.id, type: SCROLL_TYPE }, select: BAR })
      if (!s) return NextResponse.json({ error: 'No such scroll' }, { status: 404 })
      const next = openedMeta(parseMeta(s.strandMetadata), now)
      if (next) await db.customBar.update({ where: { id: s.id }, data: { strandMetadata: JSON.stringify(next) } })
      return NextResponse.json({ ok: true, opened: true }, { headers: NO_STORE })
    }
    const g = await db.customBar.findFirst({ where: { id: w.goldId, creatorId: player.id, type: GOLD_TYPE }, select: BAR })
    if (!g) return NextResponse.json({ error: 'No such nugget' }, { status: 404 })
    const r = answeredGold(parseMeta(g.strandMetadata), w.answer, now)
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 409 })
    await db.customBar.update({
      where: { id: g.id },
      data: { strandMetadata: JSON.stringify(r.meta), ...(r.status ? { status: r.status } : {}) },
    })
    return NextResponse.json({ ok: true, answer: w.answer }, { headers: NO_STORE })
  } catch (e) {
    console.error('[api:ttv-scroll]', e)
    return NextResponse.json({ error: 'That did not save' }, { status: 500 })
  }
}
