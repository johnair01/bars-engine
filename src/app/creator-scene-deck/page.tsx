import { redirect } from 'next/navigation'
import { SCENE_GRID_INSTANCE_SLUG } from '@/lib/creator-scene-grid-deck/suits'

/**
 * @page /creator-scene-deck
 * @entity CAMPAIGN
 * @description Redirects to default scene deck instance (Scene Atlas creator lab)
 * @permissions authenticated, game_account_ready
 * @relationships redirects to /creator-scene-deck/:slug with SCENE_GRID_INSTANCE_SLUG
 * @energyCost 0 (redirect only)
 * @dimensions WHO:N/A, WHAT:CAMPAIGN, WHERE:creator_lab, ENERGY:N/A, PERSONAL_THROUGHPUT:N/A
 * @example /creator-scene-deck → redirects to /creator-scene-deck/bruised-banana
 * @agentDiscoverable false
 */
export default function CreatorSceneDeckIndexPage() {
  redirect(`/creator-scene-deck/${SCENE_GRID_INSTANCE_SLUG}`)
}
