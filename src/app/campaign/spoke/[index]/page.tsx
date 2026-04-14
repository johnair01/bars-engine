import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  isCampaignHubStateV1,
  hubStateMatchesKotter,
} from '@/lib/campaign-hub/types'
import { getSpokeBinding } from '@/lib/campaign-hub/spoke-bindings'
import Link from 'next/link'

/**
 * @page /campaign/spoke/:index
 * @entity CAMPAIGN
 * @description Spoke CYOA entry — validates spoke; **spokes 0–1** route to **GSCP** generated
 *   pipeline (`/campaign/spoke/:index/generated`). Append `?portal=1` for legacy portal adventure.
 * @permissions authenticated
 * @params index:number (spoke index 0–7)
 * @searchParams ref:string (campaign reference, optional, defaults to 'bruised-banana')
 * @searchParams portal:string (optional `1` = legacy Instance.portalAdventure)
 * @relationships CAMPAIGN (instance), ADVENTURE (portalAdventure)
 * @dimensions WHO:player, WHAT:spoke entry, WHERE:campaign, ENERGY:spoke_selection
 * @example /campaign/spoke/0?ref=bruised-banana
 * @agentDiscoverable false
 */

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

// Spokes that have fully authored CYOA content and are available to enter.
// Spokes 2–7 are locked placeholder UI cards until content is authored.
const AVAILABLE_SPOKE_INDICES = [0, 1]

const PORTAL_START_NODE_IDS = [
  'Portal_1',
  'Portal_2',
  'Portal_3',
  'Portal_4',
  'Portal_5',
  'Portal_6',
  'Portal_7',
  'Portal_8',
]

export default async function SpokeCyoaEntryPage(props: {
  params: Promise<{ index: string }>
  searchParams: Promise<{ ref?: string; portal?: string }>
}) {
  const { index: indexParam } = await props.params
  const { ref: urlRef, portal: portalLegacy } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_CAMPAIGN_REF

  const spokeIndexEarly = parseInt(indexParam, 10)
  const player = await getCurrentPlayer()
  if (!player) {
    const landingReturn =
      !isNaN(spokeIndexEarly) && spokeIndexEarly >= 0 && spokeIndexEarly <= 7
        ? `/campaign/landing?ref=${encodeURIComponent(campaignRef)}&spoke=${spokeIndexEarly}`
        : `/campaign/hub?ref=${encodeURIComponent(campaignRef)}`
    redirect(`/login?returnTo=${encodeURIComponent(landingReturn)}`)
  }

  const spokeIndex = spokeIndexEarly

  // Validate spoke index
  if (isNaN(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
    return (
      <LockedOrErrorPage
        campaignRef={campaignRef}
        title="Invalid spoke"
        body="Spoke index must be 0–7."
      />
    )
  }

  // Sub-hub binding check: if this spoke is bound to a child campaign, redirect to its hub.
  // This must run before the locked-state check so bound spokes always route to their child.
  const binding = getSpokeBinding(campaignRef, spokeIndex)
  if (binding) {
    redirect(binding.childHubPath)
  }

  // Locked state: spokes 2–7 are not yet authored
  if (!AVAILABLE_SPOKE_INDICES.includes(spokeIndex)) {
    return (
      <LockedOrErrorPage
        campaignRef={campaignRef}
        title={`Spoke ${spokeIndex + 1} is locked`}
        body="This spoke unlocks as the campaign advances. Check back after new milestones are reached."
        isLocked
      />
    )
  }

  /** Default: GSCP generated spoke pipeline (v1). Legacy portal: `?portal=1`. */
  if (portalLegacy !== '1') {
    redirect(`/campaign/spoke/${spokeIndex}/generated?ref=${encodeURIComponent(campaignRef)}`)
  }

  // ── Legacy portal adventure (Instance.portalAdventureId) ─────────────────
  const inst = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: {
      id: true,
      name: true,
      kotterStage: true,
      allyshipDomain: true,
      portalAdventureId: true,
      campaignRef: true,
      slug: true,
      campaignHubState: true,
    },
  })

  if (!inst) {
    return (
      <LockedOrErrorPage
        campaignRef={campaignRef}
        title="Campaign not found"
        body="No campaign instance found. Contact your Game Master."
      />
    )
  }

  const { portalAdventureId, kotterStage, campaignHubState } = inst

  if (!portalAdventureId) {
    return (
      <LockedOrErrorPage
        campaignRef={campaignRef}
        title="Spoke CYOA not configured"
        body="A portal adventure has not been linked to this campaign yet. Ask your GM to configure it."
      />
    )
  }

  const ks = kotterStage ?? 1
  let hexagramId: number | undefined
  let primaryFace: string | undefined

  if (isCampaignHubStateV1(campaignHubState) && hubStateMatchesKotter(campaignHubState, ks)) {
    const spokeDraw = campaignHubState.spokes[spokeIndex]
    hexagramId = spokeDraw?.hexagramId
    primaryFace = spokeDraw?.primaryFace
  }

  const startNodeId = PORTAL_START_NODE_IDS[spokeIndex] ?? `Portal_${spokeIndex + 1}`
  const refResolved = inst.campaignRef ?? inst.slug ?? campaignRef

  const params = new URLSearchParams({
    start: startNodeId,
    ref: refResolved,
    spoke: String(spokeIndex),
    kotterStage: String(ks),
    returnTo: `/campaign/hub?ref=${encodeURIComponent(campaignRef)}`,
  })
  if (hexagramId) params.set('hexagram', String(hexagramId))
  if (primaryFace) params.set('face', primaryFace)

  redirect(`/adventure/${portalAdventureId}/play?${params.toString()}`)
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared error / locked UI (no JS needed — server-rendered)
// ──────────────────────────────────────────────────────────────────────────────

function LockedOrErrorPage({
  campaignRef,
  title,
  body,
  isLocked = false,
}: {
  campaignRef: string
  title: string
  body: string
  isLocked?: boolean
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-200 p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6 text-center">
        {isLocked && (
          <p className="text-4xl" aria-hidden="true">
            🔒
          </p>
        )}
        <h1 className="text-xl font-bold text-zinc-100">{title}</h1>
        <p className="text-sm text-zinc-400">{body}</p>
        <div className="flex justify-center gap-6">
          <Link
            href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            ← Back to hub
          </Link>
        </div>
      </div>
    </div>
  )
}
