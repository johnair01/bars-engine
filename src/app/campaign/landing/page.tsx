import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getSpokeLandingContext } from '@/actions/campaign-portals'
import { GmFaceMovesPanel } from '@/components/campaign/GmFaceMovesPanel'
import { loadBruisedBananaQuestMapCard } from '@/lib/campaign-hub/bruised-banana-quest-map'
import { getAvailableFaceMovesForStage } from '@/lib/gm-face-moves-availability'
import { KOTTER_STAGES } from '@/lib/kotter'

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

export default async function CampaignLandingPage(props: {
  searchParams: Promise<{ ref?: string; spoke?: string }>
}) {
  const { ref: urlRef, spoke: spokeRaw } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_CAMPAIGN_REF
  const spokeIndex = spokeRaw !== undefined ? Number.parseInt(spokeRaw, 10) : 0
  if (Number.isNaN(spokeIndex)) redirect(`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`)

  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const ctx = await getSpokeLandingContext(campaignRef, spokeIndex)
  if ('error' in ctx) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-red-400">{ctx.error}</p>
        <Link href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`} className="mt-4 text-purple-400">
          ← Hub
        </Link>
      </div>
    )
  }

  const questCard =
    campaignRef === 'bruised-banana' || ctx.campaignRefResolved === 'bruised-banana'
      ? loadBruisedBananaQuestMapCard(spokeIndex)
      : null
  const stageInfo = KOTTER_STAGES[ctx.kotterStage as keyof typeof KOTTER_STAGES]
  const faceMoves = getAvailableFaceMovesForStage(ctx.kotterStage)

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <Link
          href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition inline-block"
        >
          ← Campaign hub
        </Link>

        <header className="space-y-2 border border-amber-900/40 rounded-2xl bg-amber-950/20 p-6">
          <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Landing card</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {questCard ? `${questCard.emoji ?? '◆'} ${questCard.title}` : `Spoke ${spokeIndex + 1}`}
          </h1>
          <p className="text-sm text-zinc-400">
            {ctx.campaignName} · {stageInfo?.emoji} Stage {ctx.kotterStage}: {ctx.stageName}
          </p>
          <p className="text-xs text-zinc-500">
            I Ching: <strong className="text-zinc-300">{ctx.hexagramName}</strong> (#{ctx.hexagramId})
            {ctx.changingLines?.length ? ` · changing lines ${ctx.changingLines.join(', ')}` : ''}
          </p>
        </header>

        {questCard ? (
          <section className="text-sm text-zinc-300 border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 whitespace-pre-wrap">
            {questCard.description}
          </section>
        ) : (
          <section className="text-sm text-zinc-400 border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
            <p className="font-medium text-zinc-200 mb-2">Field reading</p>
            <p>{ctx.flavor}</p>
            <p className="mt-3 text-zinc-500 text-xs">{ctx.pathHint}</p>
          </section>
        )}

        <GmFaceMovesPanel
          kotterStage={ctx.kotterStage}
          campaignRef={campaignRef}
          moves={faceMoves}
          pickConfig={{
            campaignRef,
            hexagramId: ctx.hexagramId,
            portalTheme: null,
          }}
        />

        <section className="text-xs text-zinc-600 border border-dashed border-zinc-800 rounded-xl p-4">
          <p className="uppercase tracking-widest mb-2 text-zinc-500">Presence</p>
          <p>Roster of others on this landing (and path NPCs) is not wired yet — see campaign-hub-spoke spec.</p>
        </section>

        <div className="flex flex-wrap gap-4">
          <Link
            href={`/campaign/board?ref=${encodeURIComponent(campaignRef)}`}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Open gameboard →
          </Link>
          <Link href="/hand" className="text-sm text-amber-400/90 hover:text-amber-300">
            Vault →
          </Link>
        </div>
      </div>
    </div>
  )
}
