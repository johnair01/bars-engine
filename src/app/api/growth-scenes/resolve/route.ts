/**
 * @route POST /api/growth-scenes/resolve
 * @entity QUEST
 * @description Resolve a growth scene with player choice, potentially advancing altitude and minting vibeulons
 * @permissions owner
 * @params scene_id:string (body, required) - GrowthScene identifier
 * @params choice:string (body, required) - Choice key from scene DSL
 * @relationships PLAYER (scene owner), QUEST (GrowthScene), SYSTEM (emotional state, vibeulons)
 * @energyCost -1
 * @dimensions WHO:playerId, WHAT:scene resolution, WHERE:growth pathway, ENERGY:vibeulon mint + altitude advance
 * @example POST /api/growth-scenes/resolve with {scene_id:"abc123",choice:"transcend"}
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { advancePlayerAltitude } from '@/actions/alchemy'
import type { SceneDsl, SceneArtifact } from '@/lib/growth-scene/types'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const body = await request.json() as { scene_id?: string; choice?: string }
  if (!body.scene_id || !body.choice) {
    return NextResponse.json({ error: 'scene_id and choice are required' }, { status: 400 })
  }

  let scene: Awaited<ReturnType<typeof db.growthScene.findUnique>>
  try {
    scene = await db.growthScene.findUnique({ where: { id: body.scene_id } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[growth-scenes/resolve]', msg)
    return NextResponse.json({ error: `DB error: ${msg}` }, { status: 500 })
  }
  if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
  if (scene.playerId !== playerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (scene.status !== 'active') {
    return NextResponse.json({ error: `Scene already ${scene.status}` }, { status: 422 })
  }

  // Parse DSL + validate choice
  let dsl: SceneDsl
  try {
    dsl = JSON.parse(scene.sceneDsl) as SceneDsl
  } catch {
    return NextResponse.json({ error: 'Scene DSL is corrupted' }, { status: 500 })
  }

  const choiceObj = dsl.choices.find((c) => c.key === body.choice)
  if (!choiceObj) {
    return NextResponse.json(
      { error: `Invalid choice "${body.choice}". Valid: ${dsl.choices.map((c) => c.key).join(', ')}` },
      { status: 400 }
    )
  }

  // Advance altitude if growth choice
  let emotionalStateUpdate: { altitude: string; advanced: boolean } | null = null
  if (choiceObj.isGrowth) {
    const result = await advancePlayerAltitude(playerId)
    if (!('error' in result)) {
      emotionalStateUpdate = result as { altitude: string; advanced: boolean }
    }
  }

  // Emit artifacts
  const artifacts: SceneArtifact[] = []

  if (choiceObj.isGrowth) {
    // Growth choice always emits a memory_entry
    artifacts.push({
      type: 'memory_entry',
      payload: {
        vector: dsl.vector,
        choice: choiceObj.key,
        choiceLabel: choiceObj.label,
        advice: dsl.advice,
      },
    })

    // Vibeulon for completing a growth move
    artifacts.push({
      type: 'vibeulon',
      payload: { amount: 1, source: 'growth_scene', vector: dsl.vector },
    })
  }

  // Persist artifacts
  if (artifacts.length > 0) {
    await db.growthSceneArtifact.createMany({
      data: artifacts.map((a) => ({
        sceneId: scene.id,
        type: a.type,
        payload: JSON.stringify(a.payload),
      })),
    })

    // Mint vibeulon if earned
    const vibArtifact = artifacts.find((a) => a.type === 'vibeulon')
    if (vibArtifact) {
      await db.vibulonEvent.create({
        data: {
          playerId,
          source: 'growth_scene',
          amount: (vibArtifact.payload.amount as number) ?? 1,
          notes: `Growth scene: ${dsl.vector}`,
        },
      }).catch(() => null) // non-fatal if vibeulon schema differs
    }
  }

  // Mark scene resolved
  await db.growthScene.update({
    where: { id: scene.id },
    data: { status: 'resolved', choiceMade: body.choice, resolvedAt: new Date() },
  })

  return NextResponse.json({
    emotional_state_update: emotionalStateUpdate,
    artifacts_emitted: artifacts,
    npc_actions: [], // GSG-6 wires NPC verbs here
  })
}
