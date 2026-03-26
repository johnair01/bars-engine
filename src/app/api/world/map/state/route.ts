import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { buildWorldMapState } from '@/lib/narrative-os/world-map'

/**
 * GET /api/world/map/state
 * Player-scoped map state (v0: deterministic; no persistence).
 */
export async function GET() {
  const player = await getCurrentPlayer()
  return NextResponse.json(buildWorldMapState(player?.id ?? null))
}
