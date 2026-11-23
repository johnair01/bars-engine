/**
 * @route POST /api/founder/mark
 * @entity SYSTEM
 * @description The chat half of the game master's marking surface (gm-mark-surface-1, Wendell answered C, 2026-11-21).
 *   He pastes a payment note into a Claude session; the session calls this and tells him whose farm it grew. Body:
 *   {note, cents, ref}. The ref is his reference for the payment (payer and day), so marking twice writes once.
 *   A note with no word, or a word nobody owns, marks nothing and says so.
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or a bare Authorization header (a write never takes the URL)
 * @example POST /api/founder/mark {"note":"for the book fern-07","cents":1100,"ref":"venmo 2026-11-23 J. Doe"}
 *
 * @route GET /api/founder/mark
 * @description Reads a note and names the player without writing: ?note=<payment note>.
 * @permissions COUNCIL_MENU_TOKEN
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { markPayment, previewNote } from '@/lib/founder-gate/mark-payment-server'
import { isCents, isRef } from '@/lib/founder-gate/mark-payment'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store' }

function refused(req: NextRequest, write = false) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503 })
  if (write && !req.headers.get('authorization')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function GET(req: NextRequest) {
  const no = refused(req)
  if (no) return no
  const note = req.nextUrl.searchParams.get('note') ?? ''
  if (!note.trim()) return NextResponse.json({ error: 'Expected ?note=<payment note>' }, { status: 400 })
  return NextResponse.json({ reading: await previewNote(note) }, { headers: NO_STORE })
}

export async function POST(req: NextRequest) {
  const no = refused(req, true)
  if (no) return no
  let body: { note?: unknown; cents?: unknown; ref?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 }) }
  if (typeof body.note !== 'string' || !body.note.trim()) return NextResponse.json({ error: 'note: the payment note, as written' }, { status: 400 })
  if (!isCents(body.cents)) return NextResponse.json({ error: 'cents: whole cents, 1 to 10000000' }, { status: 400 })
  if (!isRef(body.ref)) return NextResponse.json({ error: 'ref: the payer and the day, 1 to 80 characters' }, { status: 400 })
  const result = await markPayment({ ref: body.ref, note: body.note, cents: body.cents })
  const status = result.kind === 'marked' ? 201 : result.kind === 'already' ? 200 : 422
  return NextResponse.json({ result }, { status, headers: NO_STORE })
}
