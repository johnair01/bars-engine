/**
 * @route POST /api/list/unsubscribe?c=<contactId>
 * @entity SYSTEM
 * @description RFC 8058 one-click unsubscribe, the target of the List-Unsubscribe header on list mail
 * @permissions public (the random contact id is the credential)
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { isContactId, unsubscribeContact } from '@/lib/esp/resend-list'

export const dynamic = 'force-dynamic'

/**
 * A mail client's own unsubscribe button POSTs here with the body
 * `List-Unsubscribe=One-Click`. RFC 8058 asks for no further confirmation, so
 * this acts at once and answers 200.
 */
export async function POST(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('c')
  if (!isContactId(contactId)) {
    return NextResponse.json({ error: 'invalid contact id' }, { status: 400 })
  }
  const result = await unsubscribeContact(contactId)
  if (!result.ok) {
    console.error('[unsubscribe] one-click failed', { contactId, error: result.error })
    return NextResponse.json({ error: 'could not unsubscribe' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}

/** Someone who opens the header URL in a browser gets the page that asks first. */
export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('c')
  const target = new URL('/unsubscribe', req.nextUrl.origin)
  if (isContactId(contactId)) target.searchParams.set('c', contactId)
  return NextResponse.redirect(target, 303)
}
