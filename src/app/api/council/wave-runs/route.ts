/**
 * @route POST /api/council/wave-runs
 * @entity PLAYER
 * @description Saves a WAVE room run opened from the Council Board, for the six-faces council to read back
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (WaveRoomRun)
 * @dimensions WHO:the player, WHAT:a WAVE room run in the blocker record shape, WHERE:cave page, ENERGY:a charge metabolized
 * @example POST /api/council/wave-runs { "ref": "tap-the-vein--mg8x2k1q", "record": { "engine": "wave-room", ... } }
 * @agentDiscoverable false
 *
 * @route GET /api/council/wave-runs
 * @description The runs the council has not landed yet, for its board read
 * @permissions COUNCIL_MENU_TOKEN, as a bearer token or ?token=
 * @example GET /api/council/wave-runs?since=2026-10-14T00:00:00Z&token=<COUNCIL_MENU_TOKEN>
 */
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { checkWaveRun, isNewer } from '@/lib/council/wave-runs'

/**
 * Wendell, 2026-10-14 (board, ttv-skip-wave): "It should deposit me inside the WAVE room and we should move to have
 * the WAVE room be able to metabolize context specific charges and send the results to the board in this case."
 *
 * The cave page (content/ontology-game/cave/board-wave.js) posts the whole run at every step of the room, under the
 * player's own sign-in, so a run left half way still says what came up. The council's board read fetches the runs
 * (Six-faces-council council/wave_runs.py) and lands each as blockers/<ref> on its main.
 *
 * GET reads only COUNCIL_MENU_PLAYER_ID's runs. COUNCIL_MENU_TOKEN already opens his menu and Lens goals; this adds
 * his WAVE room runs, which hold what he wrote in the room.
 */
export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to send the run' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Send JSON' }, { status: 400 })
  }
  const checked = checkWaveRun(body)
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 })
  const { ref, record, savedAt } = checked.run

  try {
    const have = await db.waveRoomRun.findUnique({
      where: { playerId_ref: { playerId: player.id, ref } },
      select: { savedAt: true },
    })
    if (!isNewer(savedAt, have?.savedAt)) return NextResponse.json({ ok: true, kept: 'newer' })
    const json = record as Prisma.InputJsonValue
    await db.waveRoomRun.upsert({
      where: { playerId_ref: { playerId: player.id, ref } },
      create: { playerId: player.id, ref, record: json, savedAt },
      update: { record: json, savedAt },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[api:wave-runs]', e)
    return NextResponse.json({ error: 'Failed to save the run' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.COUNCIL_MENU_TOKEN
  const playerId = process.env.COUNCIL_MENU_PLAYER_ID
  if (!secret || !playerId) {
    return NextResponse.json({ error: 'Council export is not configured' }, { status: 503 })
  }
  if (!tokenMatches(givenToken(req), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const since = req.nextUrl.searchParams.get('since')
  if (since && Number.isNaN(Date.parse(since))) {
    return NextResponse.json({ error: 'since must be a time' }, { status: 400 })
  }

  try {
    const rows = await db.waveRoomRun.findMany({
      where: { playerId, ...(since ? { savedAt: { gt: new Date(since) } } : {}) },
      orderBy: { savedAt: 'asc' },
      take: 200,
      select: { ref: true, record: true, savedAt: true },
    })
    return NextResponse.json(
      { runs: rows.map((r) => ({ ref: r.ref, savedAt: r.savedAt.toISOString(), record: r.record })) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    console.error('[api:wave-runs]', e)
    return NextResponse.json({ error: 'Failed to load the runs' }, { status: 500 })
  }
}
