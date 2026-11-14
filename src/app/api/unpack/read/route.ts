/**
 * @route POST /api/unpack/read
 * @entity PLAYER
 * @description Reads one text through the six Unpacking Questions with the lantern table's reader (no language model) and returns the six pencilled answers, the channel, the state, the shadow voices, the words heard, and the feeling words of q4 (feel_now) and q2 (feel_want). Stores nothing.
 * @permissions public (pure function of the text)
 * @relationships none
 * @example POST /api/unpack/read { "text": "I'm stuck and scared about the application", "lexicon": { "fire": ["blocked"] } }
 * @agentDiscoverable true
 */
import { NextRequest, NextResponse } from 'next/server'
import { MAX_TEXT, parseLexicon, unpackRead } from '@/lib/lantern/unpack-read'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { text?: unknown; lexicon?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Send JSON: { "text": "..." }' }, { status: 400 }) }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
  if (text.length > MAX_TEXT) return NextResponse.json({ error: `text is over ${MAX_TEXT} characters` }, { status: 400 })
  const lexicon = parseLexicon(body.lexicon)
  if (!lexicon) return NextResponse.json({ error: 'lexicon is a map of channel to words, 200 words at most' }, { status: 400 })
  return NextResponse.json(unpackRead(text, lexicon))
}
