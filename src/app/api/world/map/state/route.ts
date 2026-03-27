/**
 * @route GET /api/world/map/state
 * @entity SYSTEM
 * @description Retrieve player-scoped world map state (deterministic, non-persisted in v0)
 * @permissions public
 * @relationships PLAYER (session context), SYSTEM (world map state)
 * @dimensions WHO:playerId, WHAT:map state, WHERE:narrative OS, ENERGY:navigation context
 * @example /api/world/map/state
 * @agentDiscoverable true
 */
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
