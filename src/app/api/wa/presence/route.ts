/**
 * @route POST|GET /api/wa/presence
 * @entity SYSTEM
 * @description POST: a map script's heartbeat for one browser uuid. GET: how many visitors each room
 * has had a heartbeat from in the last minute. Counts only, never ids. Per server instance, best effort.
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { allow, parsePresenceClaim, presenceCounts, recordPresence } from '@/lib/wa/claims'
import { waCors } from '@/lib/wa/cors'

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: waCors(request) })
}

export async function GET(request: Request) {
  return NextResponse.json({ rooms: presenceCounts() }, { headers: waCors(request) })
}

export async function POST(request: Request) {
  const headers = waCors(request)
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers }) }
  const claim = parsePresenceClaim(body)
  if (!claim) return NextResponse.json({ error: 'Invalid claim' }, { status: 400, headers })
  if (!allow(claim.uuid)) return NextResponse.json({ error: 'Slow down' }, { status: 429, headers })
  recordPresence(claim)
  return NextResponse.json({ ok: true }, { headers })
}
