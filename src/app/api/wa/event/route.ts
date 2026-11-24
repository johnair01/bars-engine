/**
 * @route POST /api/wa/event
 * @entity SYSTEM
 * @description Receives a claim from a WorkAdventure map script: "this browser uuid did <event> in <room>".
 * A claim is logged and rate limited; it grants nothing (wa-world-kit-1, answer A).
 * @permissions public
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'
import { allow, forget, parseClaim, recordPresence } from '@/lib/wa/claims'
import { waCors } from '@/lib/wa/cors'

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: waCors(request) })
}

export async function POST(request: Request) {
  const headers = waCors(request)
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers }) }
  const claim = parseClaim(body)
  if (!claim) return NextResponse.json({ error: 'Invalid claim' }, { status: 400, headers })
  if (!allow(claim.uuid)) return NextResponse.json({ error: 'Slow down' }, { status: 429, headers })
  if (claim.event === 'leave') forget(claim.uuid)
  else recordPresence(claim)
  console.info('[wa-claim]', JSON.stringify(claim))
  return NextResponse.json({ ok: true }, { headers })
}
