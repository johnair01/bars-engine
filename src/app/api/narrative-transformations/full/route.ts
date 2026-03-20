import { NextRequest, NextResponse } from 'next/server'
import {
  runNarrativeTransformationFull,
  type BuildQuestSeedOptions,
} from '@/lib/narrative-transformation'

/**
 * POST /api/narrative-transformations/full
 * Body: `{ "rawText": string, "archetypeKey"?: string, "moveOverrides"?: object, ... }`
 * Returns `{ parse, hints, questSeed }`.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      rawText?: unknown
      archetypeKey?: string | null
      moveOverrides?: BuildQuestSeedOptions['moveOverrides']
      useAlchemyChannelInSeed?: boolean
      nationName?: string | null
      archetypeName?: string | null
    }
    const rawText = typeof body.rawText === 'string' ? body.rawText : ''
    if (!rawText.trim()) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 })
    }

    const opts: BuildQuestSeedOptions = {
      archetypeKey: body.archetypeKey,
      moveOverrides: body.moveOverrides,
      useAlchemyChannelInSeed: body.useAlchemyChannelInSeed,
      nationName: body.nationName,
      archetypeName: body.archetypeName,
    }

    const result = runNarrativeTransformationFull(rawText, opts)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
