import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/dojo/home — Narrative OS Dojo space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('dojo'))
}
