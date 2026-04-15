import { NextResponse } from 'next/server'
import { SOURCE_ANALYSIS_PROFILES } from '@/lib/source-genre-profiles'

export async function GET() {
  return NextResponse.json({
    profiles: SOURCE_ANALYSIS_PROFILES.map((p) => ({
      id: p.id,
      label: p.label,
      barTypes: p.barTypes,
      description: p.description,
    })),
  })
}
