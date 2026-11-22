/**
 * @route POST /api/founder-gate/mark
 * @entity SYSTEM
 * @description The chat twin of /admin/payment-mark (board gm-mark-surface-1 "C. Both"). A session the game master talks to
 *   posts the payment note he pasted in chat; the route calls markPayment and answers with the result and one sentence.
 *   Body: {note, amount?, ref?}. Amount is dollars as a number or text ("$11"); without one, the first $ amount in the note.
 *   Without a ref, a fingerprint of the paste is used, so the same paste marks once.
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or a bare Authorization header (a write never takes the URL)
 * @example POST /api/founder-gate/mark {"note":"Venmo: J. Doe paid you $11.00 for fern-07","ref":"venmo 2026-11-21 J. Doe"}
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { markPayment } from '@/lib/founder-gate/mark-payment-server'
import { parseMark, sayMark } from '@/lib/founder-gate/mark-input'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (!req.headers.get('authorization') || !tokenMatches(givenToken(req), secret))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Expected a JSON body {note, amount?, ref?}' }, { status: 400 })
  const parsed = parseMark(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400, headers: NO_STORE })
  const result = await markPayment({ ref: parsed.ref, note: parsed.note, cents: parsed.cents })
  return NextResponse.json({ result, say: sayMark(result), ref: parsed.ref }, { headers: NO_STORE })
}
