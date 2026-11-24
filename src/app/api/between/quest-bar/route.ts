/**
 * @route GET,POST /api/between/quest-bar
 * @entity BAR
 * @description The Heaven Sect quest's BAR: take it (one sentence and the seal strokes), look for the one still open (GET), list the player's BARs with their seals (GET ?all=1), report how it went
 * @permissions Signed-in player (bars_player_id cookie); a guest gets 401 and keeps the BAR in the tab
 * @relationships PLAYER (CustomBar, creator)
 * @example POST /api/between/quest-bar { "do": "take", "sentence": "Tonight I will ask my sister to lunch by Friday; it costs me one pride.", "seal": [[[0.2, 0.3], [0.6, 0.7]]] }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { listQuestBars, openQuestBar, reportQuestBar, takeQuestBar } from '@/actions/heaven-quest-bar'

const status = (r: { error?: string }) => (r.error ? (r.error === 'Not logged in' ? 401 : 400) : 200)

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('all') === '1') {
    const l = await listQuestBars()
    return NextResponse.json(l, { status: status(l) })
  }
  const r = await openQuestBar()
  return NextResponse.json(r, { status: status(r) })
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Send JSON.' }, { status: 400 })
  const r =
    b.do === 'take' ? await takeQuestBar({ sentence: String(b.sentence ?? ''), seal: b.seal })
    : b.do === 'report' ? await reportQuestBar(String(b.barId ?? ''), { ending: String(b.ending ?? ''), whatHappened: String(b.whatHappened ?? '') })
    : { error: 'Say take or report.' }
  return NextResponse.json(r, { status: status(r) })
}
