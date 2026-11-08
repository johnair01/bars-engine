/**
 * @route GET /api/board/spec/[sha]
 * @entity SYSTEM
 * @description Read an immutable Council spec review packet by its content SHA
 * @permissions board owner or COUNCIL_MENU_TOKEN in Authorization header
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isBoardOwner } from '@/lib/board/owner'
import { tokenMatches } from '@/lib/council/token'
import { loadSpecPacket } from '@/lib/board/spec-packet'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ sha: string }> }) {
  const auth = req.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const byToken = !!process.env.COUNCIL_MENU_TOKEN && tokenMatches(bearer, process.env.COUNCIL_MENU_TOKEN)
  if (!byToken && !(await isBoardOwner()))
    return NextResponse.json({ error: 'The spec is open to the board owner only.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const packet = await loadSpecPacket((await params).sha)
  return packet
    ? NextResponse.json(packet, { headers: { 'Cache-Control': 'private, no-store' } })
    : NextResponse.json({ error: 'Spec packet not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
}
