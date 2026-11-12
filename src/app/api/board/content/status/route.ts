/**
 * @route GET /api/board/content/status
 * @entity SYSTEM
 * @description How old the board content this site serves is: the manifest's last write, its age in minutes, whether
 *   that passes BOARD_CONTENT_STALE_MINUTES, and each board page's hash and size. Reads the same store /board and
 *   /board/council read, so it answers for what a visitor is seeing, not for what six-faces-council last built.
 * @permissions public
 * @example GET /api/board/content/status
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { manifest } from '@/lib/board/content-store'
import { freshness, staleAfterMinutes } from '@/lib/board/content-freshness'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

/** No token and no content. A page's sha is a fingerprint, not the page: someone who cannot sign in as the board owner
 * still cannot read a row out of this, and the manifest itself (paths, every file's size) stays behind the token at
 * /api/board/content. What is public is the clock — that is the whole point, since a stale board is invisible by
 * nature. A store that was never configured answers 503 rather than claiming a healthy age. */
export async function GET() {
  const m = await manifest(true).catch(() => ({ at: '', files: {} }))
  const said = freshness(m, Date.now(), staleAfterMinutes())
  return NextResponse.json(said, { headers: NO_STORE, status: said.configured ? 200 : 503 })
}
