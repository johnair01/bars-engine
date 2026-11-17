/**
 * @route GET /ontology-game/between
 * @entity PLAYER
 * @description Old address of the Between. It moved to /between; this keeps saved links, invitations and notices working.
 * @permissions public redirect
 * @relationships /between
 * @example GET /ontology-game/between?g=clx... redirects to /between?g=clx...
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/between' + req.nextUrl.search, req.url), 308)
}
