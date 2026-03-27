import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CampaignReader } from '@/app/campaign/components/CampaignReader'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  eventInitiationAdventureSlug,
  isAllowedEventInviteSlug,
} from '@/lib/event-invite-party'

/**
 * @page /campaign/event/:eventSlug/initiation
 * @entity CAMPAIGN
 * @description Event-scoped campaign initiation flow for players or sponsors joining specific campaign events
 * @permissions authenticated
 * @params eventSlug:string (event slug, required)
 * @searchParams segment:string ('player' or 'sponsor', optional, defaults to 'player')
 * @searchParams shareToken:string (share token for external invites, optional)
 * @searchParams ref:string (campaign reference, optional, defaults to 'bruised-banana')
 * @relationships CAMPAIGN (event, adventure), EVENT (event invite)
 * @dimensions WHO:player, WHAT:event initiation, WHERE:campaign_event, ENERGY:segment
 * @example /campaign/event/launch-party/initiation?segment=sponsor&ref=bruised-banana
 * @agentDiscoverable false
 */

const VALID_SEGMENTS = ['player', 'sponsor'] as const
type Segment = (typeof VALID_SEGMENTS)[number]

type Props = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ segment?: string; shareToken?: string; ref?: string }>
}

export default async function EventScopedInitiationPage({ params, searchParams }: Props) {
  const { eventSlug } = await params
  const { segment: rawSegment, shareToken, ref: refRaw } = await searchParams

  if (!isAllowedEventInviteSlug(eventSlug)) {
    notFound()
  }

  const segment: Segment =
    rawSegment && VALID_SEGMENTS.includes(rawSegment as Segment) ? (rawSegment as Segment) : 'player'

  const campaignRef = refRaw?.trim() || 'bruised-banana'
  const adventureSlug = eventInitiationAdventureSlug(campaignRef, eventSlug, segment)

  const adventure = await db.adventure.findUnique({
    where: { slug: adventureSlug },
  })

  if (!adventure || adventure.status !== 'ACTIVE' || !adventure.startNodeId) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-zinc-400 text-center max-w-md">
          Initiation for this event isn&apos;t published yet. Campaign owner: compile and publish an Adventure
          with slug{' '}
          <code className="text-zinc-300 text-sm">{adventureSlug}</code> (Admin → Quest Grammar).
        </p>
        <Link href="/event" className="mt-6 text-green-400/90 hover:text-green-300 text-sm">
          ← Campaign / events
        </Link>
        <Link href={`/campaign?ref=${encodeURIComponent(campaignRef)}`} className="mt-3 text-purple-400 hover:text-purple-300 text-sm">
          ← Back to campaign
        </Link>
      </div>
    )
  }

  const player = await getCurrentPlayer()
  const isAdmin = !!player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col items-center font-sans tracking-tight">
      <div className="w-full max-w-2xl flex justify-between gap-4 mb-4 flex-wrap">
        <Link
          href={`/event#${eventSlug === 'apr-4-dance' ? 'apr-4' : 'apr-5'}`}
          className="text-sm text-zinc-500 hover:text-fuchsia-400 transition-colors"
        >
          ← Event context
        </Link>
        <Link href="/event" className="text-sm text-zinc-500 hover:text-green-400 transition-colors">
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
          campaignRef={campaignRef}
          isAdmin={isAdmin}
          flowId={campaignRef}
          shareToken={shareToken ?? undefined}
        />
      </div>
    </div>
  )
}
