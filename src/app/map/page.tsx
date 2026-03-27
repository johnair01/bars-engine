import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getActiveInstance } from '@/actions/instance'
import { db } from '@/lib/db'

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

/**
 * @page /map
 * @entity SYSTEM
 * @description Map router - redirects to wallet, hand, adventure, or campaign hub based on type parameter
 * @permissions authenticated
 * @searchParams type:string (optional) - Map type: vibeulon, thread, story
 * @searchParams threadId:string (optional) - Thread identifier for type=thread
 * @searchParams adventureId:string (optional) - Adventure identifier for type=story
 * @relationships redirects to /wallet, /hand, /adventure/:id/play, or /campaign/hub based on params
 * @energyCost 0 (router only)
 * @dimensions WHO:playerId, WHAT:SYSTEM, WHERE:router, ENERGY:N/A, PERSONAL_THROUGHPUT:N/A
 * @example /map?type=vibeulon → redirects to /wallet
 * @agentDiscoverable false
 */
export default async function MapPage(props: {
  searchParams: Promise<{ type?: string; threadId?: string; adventureId?: string }>
}) {
  const { type, threadId, adventureId } = await props.searchParams

  // type=vibeulon → wallet
  if (type === 'vibeulon') {
    redirect('/wallet')
  }

  // type=thread&threadId → hand (threads live there)
  if (type === 'thread' && threadId) {
    redirect('/hand')
  }

  // type=story&adventureId → adventure play (if valid)
  if (type === 'story' && adventureId) {
    const adventure = await db.adventure.findUnique({
      where: { id: adventureId, status: 'ACTIVE' },
      select: { id: true },
    })
    if (adventure) {
      redirect(`/adventure/${adventureId}/play`)
    }
  }

  // Fallback: campaign lobby when we have campaign context, else game-map
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const activeInstance = await getActiveInstance()
  const campaignRef = activeInstance?.campaignRef ?? DEFAULT_CAMPAIGN_REF
  redirect(`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`)
}
