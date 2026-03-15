import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateScene } from '@/lib/growth-scene/generator'
import type { SceneType } from '@/lib/growth-scene/types'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  let opts: { archetypeSlug?: string; nationSlug?: string; campaignPhase?: string; sceneType?: string } = {}
  try {
    const body = await request.json() as typeof opts
    opts = body ?? {}
  } catch { /* no body — fine */ }

  // Validate sceneType if provided
  const validSceneTypes = ['transcend', 'generate', 'control']
  if (opts.sceneType && !validSceneTypes.includes(opts.sceneType)) {
    return NextResponse.json({ error: `Invalid sceneType. Must be one of: ${validSceneTypes.join(', ')}` }, { status: 400 })
  }

  let result: Awaited<ReturnType<typeof generateScene>>
  try {
    result = await generateScene(playerId, { ...opts, sceneType: opts.sceneType as SceneType | undefined })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[growth-scenes/generate]', msg)
    return NextResponse.json({ error: `Scene generation failed: ${msg}` }, { status: 500 })
  }

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  return NextResponse.json({
    scene_id: result.scene.id,
    vector: result.dsl.vector,
    scene_dsl: result.dsl,
  })
}
