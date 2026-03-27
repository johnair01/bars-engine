import { redirect, notFound } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getIntakePageData } from '@/actions/cyoa-intake'
import { CyoaIntakeRunner } from './CyoaIntakeRunner'

/**
 * @page /cyoa-intake/:id
 * @entity QUEST
 * @description CYOA (Choose Your Own Adventure) intake runner - playbook-driven quest progression
 * @permissions authenticated
 * @params id:string (path, required) - CyoaAdventure identifier
 * @searchParams portalId:string (optional) - CampaignPortal.id player entered through
 * @relationships loads CyoaAdventure with playbook, creates/updates CyoaCheckIn, links to CAMPAIGN via portalId
 * @energyCost variable (depends on check-in responses)
 * @dimensions WHO:playerId, WHAT:QUEST, WHERE:campaign_portal, ENERGY:check_in, PERSONAL_THROUGHPUT:clean_up+grow_up
 * @example /cyoa-intake/adv_001?portalId=portal_bb
 * @agentDiscoverable false
 */
interface Props {
  params: Promise<{ id: string }>
  /**
   * Supported search params:
   *   portalId — CampaignPortal.id the player entered through.
   *              When present, validated and passed to completeIntakeSession.
   *              When absent, auto-resolved from adventure.campaignRef.
   */
  searchParams: Promise<{ portalId?: string }>
}

export default async function CyoaIntakePage({ params, searchParams }: Props) {
  // 1. Auth guard
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const { id } = await params
  const { portalId: requestedPortalId } = await searchParams

  // 2. Load adventure + playbook + today's check-in + resolve portalId
  let pageData
  try {
    pageData = await getIntakePageData(id, requestedPortalId)
  } catch (err) {
    // 'Adventure not found' → 404; other errors propagate
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('not found')) notFound()
    throw err
  }

  // 3. Render
  return (
    <CyoaIntakeRunner
      adventure={pageData.adventure}
      playbook={pageData.playbook}
      todayCheckIn={pageData.todayCheckIn}
      playerId={pageData.playerId}
      portalId={pageData.portalId}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const player = await getCurrentPlayer()
  if (!player) return {}
  try {
    const pageData = await getIntakePageData(id)
    return {
      title: pageData.adventure.title,
      description: pageData.adventure.description ?? 'A CYOA intake adventure',
    }
  } catch {
    return {}
  }
}
