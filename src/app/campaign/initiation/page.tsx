import Link from 'next/link'
import { CampaignDonateCta } from '@/components/campaign/CampaignDonateCta'
import { CampaignOutlineNavButton } from '@/components/campaign/CampaignOutlineNavButton'
import { CampaignReader } from '../components/CampaignReader'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { playerCanEditCampaignAdventure } from '@/lib/campaign-passage-permissions'

/**
 * @page /campaign/initiation
 * @entity CAMPAIGN
 * @description Campaign initiation flow for players or sponsors - interactive adventure for onboarding to Bruised Banana
 * @permissions authenticated
 * @searchParams segment:string ('player' or 'sponsor', optional, defaults to 'player')
 * @searchParams shareToken:string (share token for external invites, optional)
 * @relationships CAMPAIGN (initiation adventure)
 * @dimensions WHO:player, WHAT:campaign initiation, WHERE:campaign, ENERGY:segment
 * @example /campaign/initiation?segment=sponsor&shareToken=abc123
 * @agentDiscoverable false
 */

const VALID_SEGMENTS = ['player', 'sponsor'] as const
type Segment = (typeof VALID_SEGMENTS)[number]

export default async function CampaignInitiationPage(props: {
  searchParams: Promise<{ segment?: string; shareToken?: string }>
}) {
  const { segment: rawSegment, shareToken } = await props.searchParams
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
  const canEditPassages = player
    ? await playerCanEditCampaignAdventure(
        player.id,
        player.roles?.map((r: { role: { key: string } }) => ({ role: r.role })) ?? [],
        adventureSlug
      )
    : false

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col items-center font-sans tracking-tight">
      <div className="w-full max-w-2xl flex flex-wrap justify-end gap-2 mb-4">
        <CampaignOutlineNavButton href="/campaign/hub?ref=bruised-banana">Portals</CampaignOutlineNavButton>
        <CampaignOutlineNavButton href="/campaign/board?ref=bruised-banana">Featured field</CampaignOutlineNavButton>
        <CampaignDonateCta campaignRef="bruised-banana" />
        <CampaignOutlineNavButton href="/event">Event page</CampaignOutlineNavButton>
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
          canEditPassages={canEditPassages}
          flowId="bruised-banana"
          shareToken={shareToken ?? undefined}
        />
      </div>
    </div>
  )
}
