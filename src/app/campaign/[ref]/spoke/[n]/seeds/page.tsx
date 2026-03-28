import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { SpokeNurseryBeds } from '@/components/campaign/SpokeNurseryBeds'
import {
  canAdminSpokeMoveBed,
  getSpokeMoveBeds,
  listBarsForSpokePlant,
} from '@/actions/spoke-move-seeds'
import {
  isBarEligibleSpokeAnchor,
  SPOKE_MOVE_BED_MOVE_TYPES,
  type SpokeMoveBedMoveType,
} from '@/lib/spoke-move-beds'

/**
 * @page /campaign/[ref]/spoke/[n]/seeds
 * @entity CAMPAIGN
 * @description Spoke nursery (SMB): four move beds per spoke; flagship anchor + additional campaign_kernel plants
 * @permissions authenticated
 * @params ref:string campaignRef, n:string spoke index 0–7
 * @relationships CAMPAIGN, CUSTOM_BAR (vibe anchor, kernel seeds), INSTANCE (allyship domain)
 * @dimensions WHO:player, WHAT:seed beds, WHERE:campaign spoke, ENERGY:four moves
 */

export default async function SpokeSeedsPage(props: {
  params: Promise<{ ref: string; n: string }>
}) {
  const { ref, n } = await props.params
  const campaignRef = decodeURIComponent(ref)
  const spokeIndex = Number.parseInt(n, 10)
  if (Number.isNaN(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
    redirect(`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`)
  }

  const player = await getCurrentPlayer()
  if (!player) {
    const returnTo = `/campaign/${encodeURIComponent(campaignRef)}/spoke/${spokeIndex}/seeds`
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const bedsResult = await getSpokeMoveBeds({ campaignRef, spokeIndex })
  if ('error' in bedsResult) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <p className="text-red-400">{bedsResult.error}</p>
        <Link href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`} className="text-purple-400 mt-4 inline-block">
          ← Hub
        </Link>
      </div>
    )
  }

  const barsResult = await listBarsForSpokePlant()
  const additionalChoices = 'bars' in barsResult ? barsResult.bars : []
  const showAdmin = await canAdminSpokeMoveBed(campaignRef)

  const vibeBars = await db.customBar.findMany({
    where: {
      OR: [{ creatorId: player.id }, { claimedById: player.id }],
      type: 'vibe',
      mergedIntoId: null,
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      type: true,
      agentMetadata: true,
      mergedIntoId: true,
      archivedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
  })

  const eligibleAnchors = {} as Record<SpokeMoveBedMoveType, { id: string; title: string; type: string }[]>
  for (const moveType of SPOKE_MOVE_BED_MOVE_TYPES) {
    eligibleAnchors[moveType] = vibeBars
      .filter((b) => isBarEligibleSpokeAnchor(b, campaignRef, spokeIndex, moveType))
      .map((b) => ({ id: b.id, title: b.title, type: b.type }))
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <Link
          href={`/campaign/landing?ref=${encodeURIComponent(campaignRef)}&spoke=${spokeIndex}`}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition inline-block"
        >
          ← Landing
        </Link>

        <header className="space-y-2 border border-emerald-900/40 rounded-2xl bg-emerald-950/20 p-5">
          <p className="text-[10px] uppercase tracking-widest text-emerald-500/90">Spoke nursery</p>
          <h1 className="text-xl font-bold text-white">Spoke {spokeIndex + 1} · four beds</h1>
          <p className="text-sm text-zinc-400">
            One flagship per bed (from the BAR you emitted on that path). Anyone can plant more seeds and water them
            from the vault.
          </p>
        </header>

        <SpokeNurseryBeds
          beds={bedsResult.beds}
          campaignRef={campaignRef}
          spokeIndex={spokeIndex}
          eligibleAnchors={eligibleAnchors}
          additionalChoices={additionalChoices}
          showAdmin={showAdmin}
        />

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/hand" className="text-amber-400/90 hover:text-amber-300">
            Open vault →
          </Link>
          <Link href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`} className="text-purple-400 hover:text-purple-300">
            Campaign hub →
          </Link>
        </div>
      </div>
    </div>
  )
}
