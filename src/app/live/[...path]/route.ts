/**
 * @route GET /live/:game/:file
 * @entity SYSTEM
 * @description A live game file, as the MCP tool put_live_file last set it (src/lib/live/store.ts). `/live/<game>` redirects to
 *   its index.html. Every answer is sandboxed: the page runs in an opaque origin, so a script
 *   an agent published cannot read a player's cookies or call bars-engine's signed-in routes.
 * @permissions public
 * @example GET /live/lantern-walk/index.html
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { liveHeaders, readLiveFile, withShim } from '@/lib/live/store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path ?? []
  if (parts.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (parts.length === 1) {
    // /live/<game> opens the game's index.html. A redirect, so the index's relative links resolve inside its folder
    // (Next strips a trailing slash, so /live/<game>/ cannot be served as the folder itself).
    return NextResponse.redirect(new URL(`/live/${parts[0]}/index.html`, req.url), 307)
  }
  const path = parts.join('/')
  const got = await readLiveFile(path).catch(() => null)
  if (!got) return new NextResponse('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
  if (req.headers.get('if-none-match') === `"${got.entry.sha}"`) {
    await got.body.cancel().catch(() => undefined)
    return new NextResponse(null, { status: 304, headers: liveHeaders(got.entry.type, got.entry.sha) })
  }
  if (got.entry.type.startsWith('text/html')) {
    const html = withShim(await new Response(got.body).text())
    return new NextResponse(html, { status: 200, headers: liveHeaders(got.entry.type, got.entry.sha) })
  }
  return new NextResponse(got.body, { status: 200, headers: liveHeaders(got.entry.type, got.entry.sha) })
}
