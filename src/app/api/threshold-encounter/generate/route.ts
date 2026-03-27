/**
 * @route POST /api/threshold-encounter/generate
 * @entity QUEST
 * @description Generate a threshold encounter (Twine story) from I Ching hexagram and GM face
 * @permissions authenticated
 * @params sceneType:string (body, optional) - Scene type: "transcend", "generate", or "control" (default: "transcend")
 * @params hexagramId:number (body, optional) - I Ching hexagram ID
 * @params gmFace:string (body, optional) - GM face: shaman/challenger/regent/architect/diplomat/sage (default: "shaman")
 * @params nationSlug:string (body, optional) - Nation slug
 * @params archetypeSlug:string (body, optional) - Archetype slug
 * @params barCandidateSeeds:string[] (body, optional) - BAR seed suggestions
 * @params beatMode:string (body, optional) - Beat mode: "minimal" or "canonical" (default: "canonical")
 * @relationships QUEST (ThresholdEncounter), PLAYER (session), SEED (I Ching, Archetype, Nation)
 * @dimensions WHO:playerId, WHAT:encounter generation, WHERE:threshold space, ENERGY:story generation
 * @example POST /api/threshold-encounter/generate with {sceneType:"transcend",gmFace:"shaman"}
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateThresholdEncounter } from '@/lib/threshold-encounter/generator'
import type { SceneType } from '@/lib/growth-scene/types'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  let body: {
    sceneType?: string
    hexagramId?: number
    gmFace?: string
    nationSlug?: string
    archetypeSlug?: string
    barCandidateSeeds?: string[]
    beatMode?: string
  } = {}
  try {
    body = await request.json() as typeof body
  } catch { /* no body */ }

  const validSceneTypes = ['transcend', 'generate', 'control']
  if (body.sceneType && !validSceneTypes.includes(body.sceneType)) {
    return NextResponse.json({ error: `Invalid sceneType` }, { status: 400 })
  }
  const sceneType: SceneType = (body.sceneType as SceneType) ?? 'transcend'

  const validGmFaces = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  const gmFace = body.gmFace && validGmFaces.includes(body.gmFace) ? body.gmFace : 'shaman'

  const validBeatModes = ['minimal', 'canonical']
  const beatMode = body.beatMode && validBeatModes.includes(body.beatMode)
    ? (body.beatMode as 'minimal' | 'canonical')
    : 'canonical'

  let result: Awaited<ReturnType<typeof generateThresholdEncounter>>
  try {
    result = await generateThresholdEncounter(playerId, sceneType, {
      hexagramId: body.hexagramId,
      gmFace,
      nationSlug: body.nationSlug,
      archetypeSlug: body.archetypeSlug,
      barCandidateSeeds: body.barCandidateSeeds,
      beatMode,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[threshold-encounter/generate]', msg)
    return NextResponse.json({ error: `Generation failed: ${msg}` }, { status: 500 })
  }

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  return NextResponse.json({
    encounter_id: result.encounter.id,
    vector: result.vector,
    twee_source: result.tweeSource,
  })
}
