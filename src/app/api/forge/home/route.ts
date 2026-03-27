/**
 * @route GET /api/forge/home
 * @entity SYSTEM
 * @description Retrieve Narrative OS Forge space home configuration and content
 * @permissions public
 * @relationships SYSTEM (Narrative OS spaces)
 * @dimensions WHO:player context, WHAT:space config, WHERE:Forge space, ENERGY:space navigation
 * @example /api/forge/home
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/forge/home — Narrative OS Forge space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('forge'))
}
