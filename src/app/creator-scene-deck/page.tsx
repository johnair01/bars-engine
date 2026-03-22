import { redirect } from 'next/navigation'
import { SCENE_GRID_INSTANCE_SLUG } from '@/lib/creator-scene-grid-deck/suits'

export default function CreatorSceneDeckIndexPage() {
  redirect(`/creator-scene-deck/${SCENE_GRID_INSTANCE_SLUG}`)
}
