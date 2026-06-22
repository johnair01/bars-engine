import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { listCampaignMilestonesForSteward } from '@/actions/milestone-needs-admin'
import { StewardNeedAuthor } from '@/components/superpowers/StewardNeedAuthor'

/**
 * @page /admin/campaign/[ref]/needs
 * @entity SYSTEM
 * @description Steward authoring of superpower-typed milestone needs (Mobility Quest tiered donation)
 * @permissions admin | instance owner/steward for ref
 */
type Props = { params: Promise<{ ref: string }> }

export default async function CampaignNeedsAdminPage({ params }: Props) {
  const { ref } = await params
  const campaignRef = decodeURIComponent(ref).trim()

  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?callbackUrl=/admin/campaign/${ref}/needs`)

  const result = await listCampaignMilestonesForSteward(campaignRef)

  return (
    <div className="min-h-screen bg-black p-6 text-zinc-200 sm:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/admin" className="mb-2 block text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
          <h1 className="text-2xl font-bold text-white">Milestone needs · {campaignRef}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Author the scoped, superpower-typed ways people can move this campaign&apos;s milestones forward.
          </p>
        </div>

        {!result.ok ? (
          <p className="text-sm text-amber-400">{result.error}</p>
        ) : result.milestones.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No milestones for <code>{campaignRef}</code> yet. Seed them first (e.g. <code>npm run seed:mobility-quest</code>).
          </p>
        ) : (
          <StewardNeedAuthor campaignRef={campaignRef} milestones={result.milestones} />
        )}
      </div>
    </div>
  )
}
