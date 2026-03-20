import { NextRequest, NextResponse } from 'next/server'
import { parseNarrative } from '@/lib/narrative-transformation'

/**
 * POST /api/narrative-transformations/parse
 * Body: `{ "rawText": string }`
 * Returns heuristic parse + lock (see NarrativeParseResult).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { rawText?: unknown }
    const rawText = typeof body.rawText === 'string' ? body.rawText : ''
    if (!rawText.trim()) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 })
    }
    const parse = parseNarrative(rawText)
    return NextResponse.json({ parse })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
