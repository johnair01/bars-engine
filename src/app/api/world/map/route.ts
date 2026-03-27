/**
 * @route GET /api/world/map
 * @entity SYSTEM
 * @description Retrieve Narrative OS world map configuration with space summaries and navigation
 * @permissions public
 * @relationships SYSTEM (Narrative OS spaces: Library, Dojo, Forest, Forge)
 * @dimensions WHO:player context, WHAT:world map, WHERE:narrative OS, ENERGY:space discovery
 * @example /api/world/map
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { buildWorldMapPayload } from '@/lib/narrative-os/world-map'

/**
 * GET /api/world/map
 * Narrative OS — world shell: space summaries, baseline recommendations, starter availability.
 */
export async function GET() {
  return NextResponse.json(buildWorldMapPayload())
}
