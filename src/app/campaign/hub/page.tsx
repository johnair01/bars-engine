import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db, dbBase } from '@/lib/db'
import { get8PortalsForCampaign } from '@/actions/campaign-portals'
import { CampaignHubView } from '@/components/campaign/CampaignHubView'
import { getCampaignMilestoneGuidance } from '@/actions/campaign-milestone-guidance'
import { getCampaignContributionProgress } from '@/actions/campaign-contributions'

/**
 * @page /campaign/hub
 * @entity CAMPAIGN
 * @description Campaign hub: Bruised Banana redirects to walkable octagon at `/world/{instanceSlug}/bb-campaign-clearing` when seeded (slug from instance); else 8 portals UI, milestone guidance, captures, intake
 * @permissions authenticated
 * @searchParams ref:string (campaign reference, optional, defaults to 'bruised-banana')
 * @relationships CAMPAIGN (instance), QUEST (portals), BAR (captures), ADVENTURE (intake)
 * @dimensions WHO:player, WHAT:campaign hub, WHERE:campaign, ENERGY:portal_selection
 * @example /campaign/hub?ref=bruised-banana
 * @agentDiscoverable false
 */

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'
/** Walkable octagon hub (seed: `scripts/seed-bb-campaign-octagon-room.ts`). */
const BB_SPATIAL_HUB_SLUG = 'bb-campaign-clearing'

const PASSAGE_EMIT_ROOT_IDS = ['passage_WakeUp_Emit', 'passage_CleanUp_Emit', 'passage_ShowUp_Emit']

/** HSM: tab title should reflect this surface, not the root layout default “Conclave”. */
export const metadata: Metadata = {
  title: 'Campaign hub',
}

export default async function CampaignHubPage(props: {
  searchParams: Promise<{ ref?: string; joined?: string }>
}) {
  const { ref: urlRef, joined } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_CAMPAIGN_REF
  const isNewlyJoined = joined === 'true'

  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  if (campaignRef === DEFAULT_CAMPAIGN_REF) {
    // Use dbBase: spatialMap / MapRoom reads are not reliable through Accelerate (`db`).
    const spatialBb = await dbBase.instance.findFirst({
      where: { OR: [{ campaignRef: DEFAULT_CAMPAIGN_REF }, { slug: DEFAULT_CAMPAIGN_REF }] },
      select: {
        slug: true,
        spatialMap: {
          select: {
            rooms: {
              where: { slug: BB_SPATIAL_HUB_SLUG },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    })
    if (spatialBb?.slug && (spatialBb.spatialMap?.rooms?.length ?? 0) > 0) {
      redirect(`/world/${spatialBb.slug}/${BB_SPATIAL_HUB_SLUG}`)
    }
  }

  const isAdmin = player.roles.some((r: { role: { key: string } }) => r.role.key === 'admin')
  const instanceForSteward = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { id: true },
  })
  const stewardship = instanceForSteward
    ? await db.instanceMembership.findFirst({
        where: {
          playerId: player.id,
          instanceId: instanceForSteward.id,
          roleKey: { in: ['owner', 'steward'] },
        },
      })
    : null
  const showFundraisingSettings = isAdmin || !!stewardship

  const [result, milestoneGuidance, contributionProgress, recentCapture, intakeAdventure] = await Promise.all([
    get8PortalsForCampaign(campaignRef),
    getCampaignMilestoneGuidance(player.id, { campaignRef }),
    // Sub-AC 3c: fetch player's contribution completion count for progress bar
    // Fails-soft (returns null) on any DB/auth error — hub renders without it
    getCampaignContributionProgress(campaignRef, player.id),
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
      contributionProgress={contributionProgress}
      recentCapture={recentCapture ?? undefined}
      intakeAdventureId={intakeAdventure?.id ?? null}
      showFundraisingSettings={showFundraisingSettings}
      isNewlyJoined={isNewlyJoined}
    />
  )
}
