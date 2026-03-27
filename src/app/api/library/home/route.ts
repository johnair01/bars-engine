/**
 * @route GET /api/library/home
 * @entity SYSTEM
 * @description Retrieve Narrative OS Library space home configuration and content
 * @permissions public
 * @relationships SYSTEM (Narrative OS spaces)
 * @dimensions WHO:player context, WHAT:space config, WHERE:Library space, ENERGY:space navigation
 * @example /api/library/home
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/library/home — Narrative OS Library space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('library'))
}
