/**
 * @route POST /api/narrative-transformations/parse
 * @entity QUEST
 * @description Heuristically parse raw narrative text into structured components
 * @permissions public
 * @params rawText:string (body, required) - Raw narrative input
 * @relationships QUEST (narrative parsing)
 * @dimensions WHO:narrator, WHAT:parse result, WHERE:narrative layer, ENERGY:semantic analysis
 * @example POST /api/narrative-transformations/parse with {rawText:"I want to clean my room"}
 * @agentDiscoverable true
 */
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
