/**
 * @route GET /api/specs/{key}
 * @entity SYSTEM
 * @description One merged spec, whole, for a lane to build from. A draft answers 404 to a lane.
 * @permissions COUNCIL_MENU_TOKEN or the Freebuff lane token (WORK_TOKEN_FREEBUFF)
 *
 * @route POST /api/specs/{key}
 * @description The lane's link back: {prUrl} records the pull request it opened for this spec; the BAR's seed shows it.
 * @permissions COUNCIL_MENU_TOKEN or the Freebuff lane token
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { laneCaller } from '@/lib/work/lanes'
import { linkPr, readSpec, validKey } from '@/lib/bar-to-work/specs'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const who = laneCaller(req, 'freebuff')
  if (!who) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await ctx.params
  if (!validKey(key)) return NextResponse.json({ error: 'Bad key' }, { status: 400 })
  const spec = await readSpec(key, { includeDraft: who === 'council' && req.nextUrl.searchParams.get('drafts') === '1' })
  if (!spec) return NextResponse.json({ error: 'No merged spec with that key.' }, { status: 404 })
  return NextResponse.json({ spec }, { headers: NO_STORE })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  if (!laneCaller(req, 'freebuff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await ctx.params
  if (!validKey(key)) return NextResponse.json({ error: 'Bad key' }, { status: 400 })
  const b = (await req.json().catch(() => null)) as { prUrl?: unknown } | null
  const r = await linkPr(key, b?.prUrl)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ spec: r.spec, seed: r.seed }, { headers: NO_STORE })
}
