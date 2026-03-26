import { NextResponse } from 'next/server'
import { buildWorldMapPayload } from '@/lib/narrative-os/world-map'

/**
 * GET /api/world/map
 * Narrative OS — world shell: space summaries, baseline recommendations, starter availability.
 */
export async function GET() {
  return NextResponse.json(buildWorldMapPayload())
}
