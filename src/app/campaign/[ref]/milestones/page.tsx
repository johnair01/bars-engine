import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCanEditInstanceDonation } from '@/actions/donation-cta'
import { listCampaignMilestones } from '@/actions/campaign-milestone-authoring'
import { MilestoneAuthoringPanel } from '@/components/campaign/MilestoneAuthoringPanel'

/**
 * @page /campaign/:ref/milestones
 * @entity CAMPAIGN
 * @description Steward surface for authoring well-crafted campaign milestones
 *   (propose → craft → approve) + their celebration narratives. TSG Phase 3.
 * @permissions steward+ (owner/steward of the backing instance, or global admin)
 */
export default async function CampaignMilestonesPage(props: { params: Promise<{ ref: string }> }) {
  const { ref: rawRef } = await props.params
  const campaignRef = decodeURIComponent(rawRef)

  const player = await getCurrentPlayer()
  if (!player) {
    redirect(`/login?returnTo=${encodeURIComponent(`/campaign/${rawRef}/milestones`)}`)
  }

  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { id: true, name: true },
  })
  if (!instance) notFound()

  const canManage = await assertCanEditInstanceDonation(player.id, instance.id)
  if (!canManage) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-center max-w-md">
          You don&apos;t have permission to author milestones for this campaign.
        </p>
        <Link
          href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
          className="text-purple-400 hover:text-purple-300"
        >
          ← Back to campaign hub
        </Link>
      </div>
    )
  }

  const milestones = await listCampaignMilestones(campaignRef)

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10 max-w-2xl mx-auto space-y-8">
      <header className="space-y-2">
        <Link
          href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
          className="text-sm text-zinc-500 hover:text-white inline-block"
        >
          ← Campaign hub
        </Link>
        <h1 className="text-2xl font-bold text-white">Milestones — {instance.name}</h1>
        <p className="text-zinc-500 text-sm">
          Author the reaches that matter. A milestone is a target with a reason and a celebration —
          it advances as contributions land and shows its narrative when reached.
        </p>
      </header>

      <MilestoneAuthoringPanel
        campaignRef={campaignRef}
        milestones={milestones}
        canPropose={canManage}
      />
    </div>
  )
}
