/**
 * @route POST /api/awaken/signup
 * @entity CAMPAIGN
 * @description Public lead capture for the /awaken funnel — Chapter One email
 *   signups and July weekend event RSVPs. No auth required (brand-new visitors).
 * @permissions public
 * @relationships writes FunnelSignup rows
 * @dimensions WHO:visitor, WHAT:email lead / RSVP, WHERE:awaken funnel, ENERGY:show_up
 * @example POST /api/awaken/signup { "intent": "chapter", "email": "a@b.com" }
 * @agentDiscoverable true
 */
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { AWAKEN_EVENT_KEYS } from '@/lib/awaken/content'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Body = {
  intent?: string
  email?: string
  name?: string
  events?: unknown
}

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const intent = body.intent === 'event' ? 'event' : 'chapter'
  const email = (body.email ?? '').trim().toLowerCase()
  const name = body.name?.trim() || null

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email.' }, { status: 400 })
  }

  let events: string[] = []
  if (intent === 'event') {
    const raw = Array.isArray(body.events) ? body.events : []
    events = raw
      .filter((e): e is string => typeof e === 'string')
      .filter((e) => AWAKEN_EVENT_KEYS.has(e))
    if (events.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Pick at least one event to RSVP.' },
        { status: 400 },
      )
    }
  }

  try {
    await db.funnelSignup.create({
      data: { intent, email, name, events, source: 'awaken' },
    })
  } catch (err) {
    // Don't strand the visitor if persistence hiccups — log and acknowledge.
    console.error('[awaken/signup] failed to persist', err)
    return NextResponse.json(
      { ok: false, error: 'Something went wrong saving that. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, intent, events })
}
