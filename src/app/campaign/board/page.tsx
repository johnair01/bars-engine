import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { getOrCreateGameboardSlots, getDeclinedAidOffersForOfferer } from '@/actions/gameboard'
import {
  getCampaignPhaseHeader,
  getDomainRegionCounts,
  getFieldActivityIndicators,
} from '@/lib/campaign-map'
import { CampaignMapChrome } from './CampaignMapChrome'

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

export default async function GameboardPage(props: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref: urlRef } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_CAMPAIGN_REF

  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) redirect('/login')

  const [result, declinedOffers] = await Promise.all([
    getOrCreateGameboardSlots(campaignRef),
    getDeclinedAidOffersForOfferer(playerId),
  ])
  if ('error' in result) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-red-400">{result.error}</p>
        <Link href="/" className="mt-4 text-purple-400 hover:text-purple-300">
          ← Dashboard
        </Link>
      </div>
    )
  }

  const { slots, period, message } = result

  const firstInstanceId = slots[0]?.instanceId ?? null
  const ichingParams = new URLSearchParams()
  if (firstInstanceId) ichingParams.set('instanceId', firstInstanceId)
  ichingParams.set('campaignRef', campaignRef)
  const ichingCampaignHref = `/iching?${ichingParams.toString()}`

  const [phaseHeader, domainRegions, fieldActivity] = await Promise.all([
    getCampaignPhaseHeader(campaignRef),
    getDomainRegionCounts(campaignRef, period),
    getFieldActivityIndicators(campaignRef),
  ])

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col font-sans tracking-tight">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <Link
            href="/game-map"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            ← Game Map
          </Link>
          <div className="flex gap-4">
            <Link
              href={`/campaign/lobby?ref=${encodeURIComponent(campaignRef)}`}
              className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
            >
              Portals
            </Link>
            <Link
              href="/event"
              className="text-sm text-zinc-500 hover:text-green-400 transition-colors"
            >
              Support the Residency →
            </Link>
            <Link
              href={`/campaign/twine?ref=${encodeURIComponent(campaignRef)}`}
              className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
            >
              Campaign story
            </Link>
            <Link
              href={ichingCampaignHref}
              className="text-sm text-zinc-500 hover:text-amber-400 transition-colors"
            >
              Cast I Ching for this field →
            </Link>
          </div>
        </div>

        <header className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <p className="text-[10px] uppercase tracking-widest text-purple-400 mb-1">Campaign map</p>
          <h1 className="text-2xl font-bold text-white mb-1">{phaseHeader.campaignName}</h1>
          <p className="text-sm font-medium text-zinc-300 mb-2">
            Phase: {phaseHeader.phase}
            <span className="text-zinc-600 font-normal"> · Period {period}</span>
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed">{phaseHeader.phaseDescription}</p>
        </header>

        <section
          className="mb-8 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50"
          aria-label="Field activity"
        >
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Field activity <span className="font-normal normal-case text-zinc-600">(last ~30 days)</span>
          </h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-zinc-500">Campaign BARs</span>{' '}
              <span className="text-white font-medium tabular-nums">{fieldActivity.barCount}</span>
            </div>
            <div>
              <span className="text-zinc-500">Quest completions</span>{' '}
              <span className="text-white font-medium tabular-nums">
                {fieldActivity.completionCount}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Active players</span>{' '}
              <span className="text-white font-medium tabular-nums">
                {fieldActivity.activePlayerCount}
              </span>
            </div>
            {fieldActivity.fundingProgress != null && (
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <span className="text-zinc-500 block text-xs mb-1">Funding progress</span>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/80 rounded-full transition-[width]"
                    style={{ width: `${Math.round(fieldActivity.fundingProgress * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          {fieldActivity.emergentHint && (
            <p className="mt-4 text-xs text-zinc-500 italic border-t border-zinc-800/80 pt-3">
              Signal: {fieldActivity.emergentHint}
            </p>
          )}
        </section>

        <h2 className="text-lg font-bold text-white mb-2">Campaign gameboard</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Complete campaign quests here. Each completion draws a new quest.
        </p>

        {message && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-800/50 rounded-xl text-amber-300 text-sm">
            {message}
          </div>
        )}

        <CampaignMapChrome
          campaignRef={campaignRef}
          domainRegions={domainRegions}
          slots={slots}
          isAdmin={isAdmin}
          playerId={playerId}
          declinedOffers={declinedOffers}
        />
      </div>
    </div>
  )
}
