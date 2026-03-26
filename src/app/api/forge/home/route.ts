import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/forge/home — Narrative OS Forge space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('forge'))
}
