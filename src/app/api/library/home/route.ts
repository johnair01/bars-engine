import { NextResponse } from 'next/server'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'

/** GET /api/library/home — Narrative OS Library space home (JSON). */
export async function GET() {
  return NextResponse.json(getSpaceHomePayload('library'))
}
