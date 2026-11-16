/**
 * @route POST /api/between/slip
 * @entity BAR
 * @description The coin table's two-move slip as a BAR seed: take it, mark it done, write where it fits in the story
 * @permissions Signed-in player (bars_player_id cookie)
 * @relationships PLAYER (CustomBar, creator)
 * @example POST /api/between/slip { "do": "take", "hexagram": 11, "slip": { "side": "inner", "trigram": "Heaven", "good": "Restraint" } }
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { markSlipDone, setSlipStory, takeSlip } from '@/actions/iching-slip'

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, any> | null
  if (!b) return NextResponse.json({ error: 'Send JSON.' }, { status: 400 })
  const r =
    b.do === 'take' ? await takeSlip({ hexagram: Number(b.hexagram), slip: b.slip, chargeId: b.chargeId, campaignRef: b.campaignRef })
    : b.do === 'done' ? await markSlipDone(String(b.barId ?? ''), { whatHappened: String(b.whatHappened ?? '') })
    : b.do === 'story' ? await setSlipStory(String(b.barId ?? ''), { storyFit: String(b.storyFit ?? '') })
    : { error: 'Say take, done or story.' }
  return NextResponse.json(r, { status: 'error' in r && r.error ? (r.error === 'Not logged in' ? 401 : 400) : 200 })
}
