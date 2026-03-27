import Link from 'next/link'
import { CampaignDonateButton } from '@/components/campaign/CampaignDonateButton'
import { CampaignOutlineNavButton } from '@/components/campaign/CampaignOutlineNavButton'
import { KOTTER_STAGES } from '@/lib/kotter'
import type { PortalData } from '@/actions/campaign-portals'
import { CampaignMilestoneStrip } from '@/components/campaign/CampaignMilestoneStrip'
import { ResidencyEventsCallout } from '@/components/campaign/ResidencyEventsCallout'
import { GmFaceMovesPanel } from '@/components/campaign/GmFaceMovesPanel'
import type { CampaignMilestoneGuidance } from '@/lib/bruised-banana-milestone'
import type { GmFaceStageMove } from '@/lib/gm-face-stage-moves'

export type CampaignHubPayload = {
  portals: PortalData[]
  campaignName: string
  kotterStage: number
  portalAdventureId: string | null
  portalStartNodeIds: string[]
  campaignRefResolved: string
  faceMoves: readonly GmFaceStageMove[]
  /** Primary donate button label when configured on Instance */
  donateButtonLabel?: string | null
}

type RecentCapture = {
  id: string
  title: string
  description: string
  rootId: string | null
  createdAt: Date
}

type Props = {
  campaignRef: string
  data: CampaignHubPayload
  /** BBMT — optional; from server when active instance matches */
  milestoneGuidance?: CampaignMilestoneGuidance | null
  /** Most recent BAR emitted from a portal passage this session */
  recentCapture?: RecentCapture
  /** CYOA_INTAKE adventure id for this campaign, if seeded */
  intakeAdventureId?: string | null
  /** Show link to `/campaign/[ref]/fundraising` for owners/stewards/admins */
  showFundraisingSettings?: boolean
}

const MOVE_LABEL: Record<string, string> = {
  passage_WakeUp_Emit: 'Wake Up',
  passage_CleanUp_Emit: 'Clean Up',
  passage_ShowUp_Emit: 'Show Up',
}

/**
 * Campaign residency hub — 8 spokes (portals) into CYOA + landing cards.
 * @see .specify/specs/campaign-hub-spoke-landing-architecture/spec.md
 */
export function CampaignHubView({
  campaignRef,
  data,
  milestoneGuidance,
  recentCapture,
  intakeAdventureId,
  showFundraisingSettings,
}: Props) {
  const {
    portals,
    campaignName,
    kotterStage,
    portalAdventureId,
    portalStartNodeIds,
    campaignRefResolved,
    faceMoves,
    donateButtonLabel,
  } = data
  const stageInfo = KOTTER_STAGES[kotterStage as keyof typeof KOTTER_STAGES]

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <Link
              href="/game-map"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition min-h-[44px] inline-flex items-center"
            >
              ← Game Map
            </Link>
            <nav
              aria-label="Campaign shortcuts"
              className="flex flex-wrap justify-end gap-2 max-w-full lg:max-w-[40rem]"
            >
              <CampaignOutlineNavButton href={`/campaign/board?ref=${encodeURIComponent(campaignRef)}`}>
                Featured field
              </CampaignOutlineNavButton>
              <CampaignOutlineNavButton
                href={`/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}`}
              >
                Stalls
              </CampaignOutlineNavButton>
              <CampaignDonateButton campaignRef={campaignRef}>
                {donateButtonLabel?.trim() ? donateButtonLabel.trim() : 'Donate'}
              </CampaignDonateButton>
              {showFundraisingSettings ? (
                <CampaignOutlineNavButton
                  href={`/campaign/${encodeURIComponent(campaignRef)}/fundraising`}
                >
                  Fundraising settings
                </CampaignOutlineNavButton>
              ) : null}
              <CampaignOutlineNavButton href={`/campaign/twine?ref=${campaignRef}`}>
                Campaign story
              </CampaignOutlineNavButton>
              <CampaignOutlineNavButton href="/event">Residency events</CampaignOutlineNavButton>
            </nav>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">Campaign hub</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">{campaignName}</h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            {stageInfo?.emoji} Kotter stage {kotterStage}: {stageInfo?.name ?? 'Urgency'}. This hub is for{' '}
            <strong className="text-zinc-200">exploration</strong> — eight spokes through CYOA into landing
            cards (wild-grass pacing: go where you want). When you have something to share publicly, list it in{' '}
            <Link
              href={`/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}`}
              className="text-teal-400/90 hover:text-teal-300 underline-offset-2 hover:underline"
            >
              campaign stalls
            </Link>
            .
          </p>
        </header>

        {milestoneGuidance && (
          <CampaignMilestoneStrip data={milestoneGuidance} variant="hub" />
        )}

        {campaignRef === 'bruised-banana' && <ResidencyEventsCallout />}

        <GmFaceMovesPanel
          kotterStage={kotterStage}
          campaignRef={campaignRef}
          moves={faceMoves}
          pickConfig={{ campaignRef, hexagramId: undefined }}
        />

        {recentCapture && (
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-5 py-4 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-emerald-500">
              {MOVE_LABEL[recentCapture.rootId ?? ''] ?? 'Named'} — most recent capture
            </p>
            <p className="text-sm font-semibold text-emerald-200">{recentCapture.title}</p>
            {recentCapture.description && (
              <p className="text-xs text-zinc-400 line-clamp-2">{recentCapture.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
              <Link
                href="/hand"
                className="text-[10px] text-emerald-600 hover:text-emerald-400 transition"
              >
                See all your BARs →
              </Link>
              <Link
                href={`/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}&attach=${encodeURIComponent(recentCapture.id)}`}
                className="text-[10px] text-teal-500 hover:text-teal-400 transition font-semibold"
              >
                Add to your campaign stall →
              </Link>
            </div>
          </div>
        )}

        {intakeAdventureId && (
          <Link
            href={`/cyoa-intake/${intakeAdventureId}`}
            className="group block rounded-xl border border-amber-800/50 bg-amber-950/20 hover:bg-amber-950/35 px-5 py-4 transition-colors space-y-1"
          >
            <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Adventure path — Wake Up</p>
            <p className="text-sm font-semibold text-amber-200 group-hover:text-amber-100">
              Where are you arriving from? →
            </p>
            <p className="text-xs text-zinc-500">
              A short branching story that reads your current state and routes you into a personalized adventure.
              Takes under 3 minutes.
            </p>
          </Link>
        )}

        <section>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">8 spokes</h2>
          <p className="text-sm text-zinc-400 max-w-3xl mb-4 leading-relaxed">
            Each spoke is a short choose-your-own path. Inside, you&apos;ll pick a move (Wake Up, Clean Up, or Show
            Up), optionally leave a BAR, then return to this hub or open your landing card for this spoke.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {portals.map((portal, idx) => {
              const startNodeId = portalStartNodeIds[idx] ?? `Portal_${idx + 1}`
              const enterHref = portalAdventureId
                ? `/adventure/${portalAdventureId}/play?start=${encodeURIComponent(startNodeId)}&ref=${encodeURIComponent(campaignRefResolved)}&spoke=${idx}&kotterStage=${kotterStage}${portal.hexagramId ? `&hexagram=${portal.hexagramId}` : ''}${portal.primaryFace ? `&face=${portal.primaryFace}` : ''}`
                : null
              const landingHref = `/campaign/landing?ref=${encodeURIComponent(campaignRef)}&spoke=${idx}`
              return (
                <div
                  key={`${portal.hexagramId}-${idx}`}
                  className="rounded-xl border border-purple-800/50 bg-zinc-900/40 p-4 hover:border-purple-600/60 transition-colors flex flex-col gap-2"
                >
                  <p className="text-[10px] uppercase tracking-widest text-purple-400/90">Spoke {idx + 1} of 8</p>
                  <p className="text-base font-semibold text-zinc-100 leading-snug">{portal.name}</p>
                  {portal.flavor ? (
                    <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">{portal.flavor}</p>
                  ) : null}
                  {portal.pathHint ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Path hint</p>
                      <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">{portal.pathHint}</p>
                    </div>
                  ) : null}
                  <div className="mt-auto pt-2 flex flex-col gap-2">
                    {enterHref ? (
                      <Link
                        href={enterHref}
                        className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg border border-purple-600/70 bg-purple-950/50 text-sm font-semibold text-purple-100 hover:border-purple-500 hover:bg-purple-950/70 transition-colors text-center"
                      >
                        Step into spoke {idx + 1} →
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-600 italic min-h-[44px] inline-flex items-center">
                        CYOA not linked — seed:portal-adventure
                      </span>
                    )}
                    <Link
                      href={landingHref}
                      className="inline-flex items-center justify-center min-h-[44px] text-xs font-medium text-amber-400/90 hover:text-amber-300 transition-colors"
                    >
                      Visit landing card (skip CYOA) →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
