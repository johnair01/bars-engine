/**
 * @route GET /board/refs/[...path]
 * @entity SYSTEM
 * @description A look's reference frames and their recipe, kept apart from the look pictures: /board/stills publishes
 *   what the council drew, and these are the pictures it was drawn against, which belong to whoever made them. The
 *   owner or a council session reads them; the board does not publish them.
 * @permissions the board owner's sign-in, or COUNCIL_MENU_TOKEN
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { manifest, readRefObject } from '@/lib/board/content-store'
import { councilCaller } from '@/lib/work/lanes'

export const dynamic = 'force-dynamic'

/** A look's refs folder under the callsheet stills: `council/callsheets/stills/<look>/refs/<source>/<file>`. Nothing
 *  else, and never a path that climbs out of one. */
const REF = /^council\/callsheets\/stills\/[A-Za-z0-9._/ -]+\/refs\/[A-Za-z0-9._/ -]+$/

/** A session sends `Authorization: Bearer $COUNCIL_MENU_TOKEN`; his own page arrives with the sign-in cookie.
 *
 *  The bytes come from the refs namespace, never from `sha/`: that one is what /board/stills serves by hash, so reading
 *  a reference from it would leave the picture reachable to anyone who learned the hash (2026-11-09, the first
 *  reference pushed answered 200 at /board/stills/sha/<sha> to a caller /board/refs refused). The manifest path is
 *  still the index, so a reference is named the way every other board file is. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!councilCaller(req) && !(await isBoardOwner()))
    return NextResponse.json({ error: 'Sign in as the board owner, or send COUNCIL_MENU_TOKEN' }, { status: 401 })
  const parts = (await params).path ?? []
  let p = ''
  try { p = parts.map(decodeURIComponent).join('/') } catch { return new NextResponse('Not a reference.', { status: 404 }) }
  if (!REF.test(p) || p.includes('..')) return new NextResponse('Not a reference picture or recipe.', { status: 404 })
  const entry = (await manifest()).files[p]
  const got = entry ? await readRefObject(entry.sha) : null
  if (!entry || !got) return new NextResponse('That reference has not been pushed.', { status: 404 })
  return new NextResponse(got.body, {
    headers: { 'Content-Type': entry.type, 'Cache-Control': 'private, max-age=31536000, immutable' },
  })
}
