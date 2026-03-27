import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { get8PortalsForCampaign } from '@/actions/campaign-portals'
import { CampaignHubView } from '@/components/campaign/CampaignHubView'
import { getCampaignMilestoneGuidance } from '@/actions/campaign-milestone-guidance'

/**
 * @page /campaign/hub
 * @entity CAMPAIGN
 * @description Campaign hub showing 8 hexagram portals, milestone guidance, recent captures, and intake adventure
 * @permissions authenticated
 * @searchParams ref:string (campaign reference, optional, defaults to 'bruised-banana')
 * @relationships CAMPAIGN (instance), QUEST (portals), BAR (captures), ADVENTURE (intake)
 * @dimensions WHO:player, WHAT:campaign hub, WHERE:campaign, ENERGY:portal_selection
 * @example /campaign/hub?ref=bruised-banana
 * @agentDiscoverable false
 */

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

const PASSAGE_EMIT_ROOT_IDS = ['passage_WakeUp_Emit', 'passage_CleanUp_Emit', 'passage_ShowUp_Emit']

export default async function CampaignHubPage(props: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref: urlRef } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_CAMPAIGN_REF

  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const [result, milestoneGuidance, recentCapture, intakeAdventure] = await Promise.all([
    get8PortalsForCampaign(campaignRef),
    getCampaignMilestoneGuidance(player.id, { campaignRef }),
    db.customBar.findFirst({
      where: {
        creatorId: player.id,
        campaignRef,
        rootId: { in: PASSAGE_EMIT_ROOT_IDS },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, rootId: true, createdAt: true },
    }),
    db.adventure.findFirst({
      where: { adventureType: 'CYOA_INTAKE', campaignRef, status: 'ACTIVE' },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if ('error' in result) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-red-400">{result.error}</p>
        <div className="flex gap-4 mt-4">
          <a href="/game-map" className="text-purple-400 hover:text-purple-300">
            ← Game Map
          </a>
          <a href="/" className="text-purple-400 hover:text-purple-300">
            Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <CampaignHubView
      campaignRef={campaignRef}
      data={result}
      milestoneGuidance={milestoneGuidance}
      recentCapture={recentCapture ?? undefined}
      intakeAdventureId={intakeAdventure?.id ?? null}
    />
  )
}
