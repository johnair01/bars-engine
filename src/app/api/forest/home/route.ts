import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/forest/home — Narrative OS Forest space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('forest'))
}
