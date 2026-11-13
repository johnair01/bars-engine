/**
 * @route GET /api/specs
 * @entity SYSTEM
 * @description The specs lanes can pull (merged only; the council token with ?drafts=1 also sees drafts). BAR-to-work, slice one.
 * @permissions COUNCIL_MENU_TOKEN or the Freebuff lane token (WORK_TOKEN_FREEBUFF)
 * @example GET /api/specs
 *
 * @route POST /api/specs
 * @description Claude writes the spec for a BAR: {key?, barId, title, markdown, status: "draft"|"merged", specUrl?}. A merged
 *   spec moves the BAR's seed forward and shows its link on the farm.
 * @permissions COUNCIL_MENU_TOKEN
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { laneCaller, councilCaller } from '@/lib/work/lanes'
import { listSpecs, writeSpec } from '@/lib/bar-to-work/specs'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  const who = laneCaller(req, 'freebuff')
  if (!who) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const includeDraft = who === 'council' && req.nextUrl.searchParams.get('drafts') === '1'
  return NextResponse.json({ specs: await listSpecs({ includeDraft }) }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  if (!councilCaller(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Expected a JSON spec.' }, { status: 400 })
  const r = await writeSpec(b)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ spec: r.spec, seed: r.seed }, { status: 201, headers: NO_STORE })
}
