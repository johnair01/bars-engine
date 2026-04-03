import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getGscpWizardData } from '@/actions/generated-spoke-cyoa'
import { GeneratedSpokeCyoaWizard } from './GeneratedSpokeCyoaWizard'

const DEFAULT_REF = 'bruised-banana'

const AVAILABLE_SPOKE_INDICES = [0, 1]

/**
 * @page /campaign/spoke/[index]/generated
 * @entity CAMPAIGN
 * @description GSCP wizard — opening → move+charge → face → generate → adventure play. Requires sign-in.
 * @permissions authenticated
 * @params index:string (spoke index, 0–7)
 * @searchParams ref:string (campaign reference, optional; defaults to bruised-banana)
 * @relationships CAMPAIGN (generated spoke CYOA pipeline)
 * @see .specify/specs/generated-spoke-cyoa-pipeline/spec.md
 * @agentDiscoverable false
 */
export default async function GeneratedSpokeCyoaPage(props: {
  params: Promise<{ index: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { index: indexParam } = await props.params
  const { ref: urlRef } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_REF

  const player = await getCurrentPlayer()
  if (!player) {
    redirect(
      `/login?returnTo=${encodeURIComponent(`/campaign/spoke/${indexParam}/generated?ref=${encodeURIComponent(campaignRef)}`)}`
    )
  }

  const spokeIndex = parseInt(indexParam, 10)
  if (Number.isNaN(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
    redirect(`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`)
  }
  if (!AVAILABLE_SPOKE_INDICES.includes(spokeIndex)) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8 flex flex-col items-center justify-center">
        <p className="text-zinc-400">This spoke is not available for the generated path yet.</p>
        <Link href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`} className="mt-4 text-purple-400">
          ← Hub
        </Link>
      </div>
    )
  }

  const data = await getGscpWizardData(campaignRef, spokeIndex)
  if ('error' in data) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <p className="text-red-400">{data.error}</p>
        <Link href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`} className="mt-4 text-purple-400">
          ← Hub
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black font-sans">
      <GeneratedSpokeCyoaWizard data={data} />
    </div>
  )
}
