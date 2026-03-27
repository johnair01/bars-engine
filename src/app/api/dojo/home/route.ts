/**
 * @route GET /api/dojo/home
 * @entity SYSTEM
 * @description Retrieve Narrative OS Dojo space home configuration and content
 * @permissions public
 * @relationships SYSTEM (Narrative OS spaces)
 * @dimensions WHO:player context, WHAT:space config, WHERE:Dojo space, ENERGY:space navigation
 * @example /api/dojo/home
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/dojo/home — Narrative OS Dojo space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('dojo'))
}
