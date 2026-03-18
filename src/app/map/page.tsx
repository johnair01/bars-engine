import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getActiveInstance } from '@/actions/instance'
import { db } from '@/lib/db'

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

/**
 * Map router — fixes /map 404s (Phase 5.2).
 * Redirects based on type param or falls back to campaign lobby / game-map.
 * @see .specify/specs/game-map-path-generation-audit/IMPLEMENTATION_PLAN.md
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
  redirect(`/campaign/lobby?ref=${encodeURIComponent(campaignRef)}`)
}
