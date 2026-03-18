import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { get8PortalsForCampaign } from '@/actions/campaign-portals'
import { KOTTER_STAGES } from '@/lib/kotter'

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

export default async function CampaignLobbyPage(props: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref: urlRef } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_CAMPAIGN_REF

  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const result = await get8PortalsForCampaign(campaignRef)

  if ('error' in result) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-red-400">{result.error}</p>
        <div className="flex gap-4 mt-4">
          <Link href="/game-map" className="text-purple-400 hover:text-purple-300">
            ← Game Map
          </Link>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { portals, campaignName, kotterStage, portalAdventureId, portalStartNodeIds } = result
  const stageInfo = KOTTER_STAGES[kotterStage as keyof typeof KOTTER_STAGES]

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <Link
              href="/game-map"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition"
            >
              ← Game Map
            </Link>
            <div className="flex gap-4">
              <Link
                href={`/campaign/board?ref=${encodeURIComponent(campaignRef)}`}
                className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
              >
                Gameboard
              </Link>
              <Link
                href={`/campaign/twine?ref=${campaignRef}`}
                className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
              >
                Campaign story
              </Link>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {campaignName}
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg">
            {stageInfo?.emoji} Stage {kotterStage}: {stageInfo?.name ?? 'Urgency'}. Choose a portal
            that speaks to you—each path offers wisdom for this moment in our shared journey.
          </p>
          <p className="text-zinc-500 text-sm italic">
            What draws you in?
          </p>
        </header>

        <section>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
            8 Portals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {portals.map((portal, idx) => {
              const startNodeId = portalStartNodeIds[idx] ?? `Portal_${idx + 1}`
              const enterHref = portalAdventureId
                ? `/adventure/${portalAdventureId}/play?start=${encodeURIComponent(startNodeId)}&ref=${encodeURIComponent(campaignRef)}`
                : null
              return (
                <div
                  key={`${portal.hexagramId}-${idx}`}
                  className="rounded-xl border border-purple-800/50 bg-zinc-900/40 p-4 hover:border-purple-600/60 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-widest text-purple-400 mb-1">
                    {portal.name}
                  </p>
                  <p className="text-sm text-zinc-300 line-clamp-2 mb-3">
                    {portal.flavor}
                  </p>
                  <p className="text-xs text-zinc-500 mb-3 line-clamp-4">{portal.pathHint}</p>
                  {enterHref ? (
                    <Link
                      href={enterHref}
                      className="inline-block text-xs font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Enter →
                    </Link>
                  ) : (
                    <span className="text-xs text-zinc-600 italic">
                      Campaign not ready — run seed:portal-adventure
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
