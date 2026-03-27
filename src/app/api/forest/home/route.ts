/**
 * @route GET /api/forest/home
 * @entity SYSTEM
 * @description Retrieve Narrative OS Forest space home configuration and content
 * @permissions public
 * @relationships SYSTEM (Narrative OS spaces)
 * @dimensions WHO:player context, WHAT:space config, WHERE:Forest space, ENERGY:space navigation
 * @example /api/forest/home
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/forest/home — Narrative OS Forest space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('forest'))
}
