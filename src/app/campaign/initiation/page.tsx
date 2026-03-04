import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CampaignReader } from '../components/CampaignReader'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'

const VALID_SEGMENTS = ['player', 'sponsor'] as const
type Segment = (typeof VALID_SEGMENTS)[number]

export default async function CampaignInitiationPage(props: {
  searchParams: Promise<{ segment?: string }>
}) {
  const { segment: rawSegment } = await props.searchParams
  const segment: Segment =
    rawSegment && VALID_SEGMENTS.includes(rawSegment as Segment)
      ? (rawSegment as Segment)
      : 'player'

  const adventureSlug = `bruised-banana-initiation-${segment}`
  const adventure = await db.adventure.findUnique({
    where: { slug: adventureSlug, status: 'ACTIVE' },
  })

  if (!adventure?.startNodeId) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-zinc-400 text-center max-w-md">
          Initiation flow not yet published. Campaign Owner: go to{' '}
          <Link
            href="/admin/quest-grammar"
            className="text-purple-400 hover:text-purple-300"
          >
            Admin → Quest Grammar
          </Link>{' '}
          to compile and publish the {segment} variant.
        </p>
        <Link
          href="/campaign?ref=bruised-banana"
          className="mt-6 text-purple-400 hover:text-purple-300"
        >
          ← Back to campaign
        </Link>
      </div>
    )
  }

  const player = await getCurrentPlayer()
  const isAdmin = !!player?.roles?.some(
    (r: { role: { key: string } }) => r.role.key === 'admin'
  )

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col items-center font-sans tracking-tight">
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <Link
          href="/event"
          className="text-sm text-zinc-500 hover:text-green-400 transition-colors"
        >
          Support the Residency →
        </Link>
      </div>
      <div className="flex-1 w-full max-w-2xl flex items-center justify-center">
        <CampaignReader
          initialNode={{
            id: adventure.startNodeId,
            text: '',
            choices: [],
          }}
          adventureSlug={adventureSlug}
          campaignRef="bruised-banana"
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
