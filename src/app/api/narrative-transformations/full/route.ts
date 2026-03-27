/**
 * @route POST /api/narrative-transformations/full
 * @entity QUEST
 * @description Parse raw narrative text and generate full quest seed with archetype/nation context
 * @permissions public
 * @params rawText:string (body, required) - Raw narrative input
 * @params archetypeKey:string (body, optional) - Archetype identifier
 * @params moveOverrides:object (body, optional) - Four-move overrides
 * @params useAlchemyChannelInSeed:boolean (body, optional) - Include alchemy channel
 * @params nationName:string (body, optional) - Nation name
 * @params archetypeName:string (body, optional) - Archetype name
 * @relationships SEED (Archetype, Nation), QUEST (quest seed generation)
 * @dimensions WHO:narrator, WHAT:quest seed, WHERE:narrative transformation, ENERGY:semantic parsing
 * @example POST /api/narrative-transformations/full with {rawText:"I want to learn guitar"}
 * @agentDiscoverable true
 */
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
