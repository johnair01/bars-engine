import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { GrowthSceneRunner } from './GrowthSceneRunner'
import { WidgetErrorBoundary } from '@/components/WidgetErrorBoundary'
import type { SceneDsl } from '@/lib/growth-scene/types'

export default async function GrowthScenePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/')

  const scene = await db.growthScene.findUnique({ where: { id } })
  if (!scene || scene.playerId !== playerId) notFound()
  if (scene.status !== 'active') redirect('/wallet')

  let dsl: SceneDsl
  try {
    dsl = JSON.parse(scene.sceneDsl) as SceneDsl
  } catch {
    notFound()
  }

  return (
    <WidgetErrorBoundary label="Growth Scene">
      <GrowthSceneRunner sceneId={scene.id} dsl={dsl} />
    </WidgetErrorBoundary>
  )
}
