/**
 * @route GET /api/between/notices/stop
 * @entity PLAYER
 * @description "Stop these emails" from a Between notice: one tap, a signed link, no sign-in (friendship-between-growth FR-010)
 * @permissions anyone holding the signed token the email carried
 * @relationships PLAYER (BetweenPrivate home)
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readStopToken } from '@/lib/between/notice'

export const dynamic = 'force-dynamic'

const page = (line: string) => new NextResponse(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Between</title>` +
  `<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#1a1018;color:#f2e6d8;font:18px/1.5 Georgia,serif;padding:24px;text-align:center"><p>${line}</p>`,
  { headers: { 'content-type': 'text/html; charset=utf-8' } })

export async function GET(req: NextRequest) {
  const id = readStopToken(req.nextUrl.searchParams.get('t') ?? '')
  if (!id) return page('That link is not one of ours.')
  const rows = await db.betweenPrivate.findMany({ where: { playerId: id, key: 'home' } })
  if (rows.length) {
    for (const r of rows) await db.betweenPrivate.update({ where: { gardenId_playerId_key: { gardenId: r.gardenId, playerId: id, key: 'home' } }, data: { data: { ...((r.data as object) ?? {}), notices: 'off' } } })
  } else {
    const m = await db.betweenMember.findFirst({ where: { playerId: id } })
    if (!m) return page('That link is not one of ours.')
    // no homeroom doc yet: plant one holding only the switch, in the first room they tend
    await db.betweenPrivate.create({ data: { gardenId: m.gardenId, playerId: id, key: 'home', data: { notices: 'off' } } })
  }
  return page('Those emails have stopped. You can turn them back on in your nook.')
}
