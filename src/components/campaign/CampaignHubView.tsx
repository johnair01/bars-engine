import { Suspense } from 'react'
import Link from 'next/link'
import { PostJoinWelcomeBanner } from '@/components/campaign/PostJoinWelcomeBanner'
import { CampaignDonateCta } from '@/components/campaign/CampaignDonateCta'
import { CampaignOutlineNavButton } from '@/components/campaign/CampaignOutlineNavButton'
import { KOTTER_STAGES } from '@/lib/kotter'
import type { PortalData } from '@/actions/campaign-portals'
import { CampaignMilestoneStrip } from '@/components/campaign/CampaignMilestoneStrip'
import { ContributionProgressBar } from '@/components/campaign/ContributionProgressBar'
import { ResidencyEventsCallout } from '@/components/campaign/ResidencyEventsCallout'
import { GmFaceMovesPanel } from '@/components/campaign/GmFaceMovesPanel'
import type { CampaignMilestoneGuidance } from '@/lib/bruised-banana-milestone'
import type { CampaignContributionProgress } from '@/actions/campaign-contributions'
import type { GmFaceStageMove } from '@/lib/gm-face-stage-moves'
import { zoneBackgroundStyle } from '@/lib/ui/zone-surfaces'
import { elementCssVars, altitudeCssVars } from '@/lib/ui/card-tokens'
import { gmFaceToElement } from '@/lib/campaign-hub/gm-face-element'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'
import type { BookMilestoneRollup } from '@/actions/chapter-spoke'

export type CampaignHubPayload = {
  portals: PortalData[]
  campaignName: string
  kotterStage: number
  portalAdventureId: string | null
  portalStartNodeIds: string[]
  campaignRefResolved: string
  faceMoves: readonly GmFaceStageMove[]
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
  milestoneGuidance?: CampaignMilestoneGuidance | null
  /**
   * Player's contribution progress for the campaign.
   * Fetched by getCampaignContributionProgress() in the hub page server component.
   * Null when not available (fail-soft — hub still renders without it).
   */
  contributionProgress?: CampaignContributionProgress | null
  recentCapture?: RecentCapture
  intakeAdventureId?: string | null
  showFundraisingSettings?: boolean
  /** True when player just joined via the campaign_join NavigationContract. */
  isNewlyJoined?: boolean
  /**
   * Book/chapter milestone rollup — shown when the hub is a book hub
   * (e.g. mastering-allyship). Null/undefined → section hidden.
   */
  bookMilestoneRollup?: BookMilestoneRollup | null
}

const MOVE_LABEL: Record<string, string> = {
  passage_WakeUp_Emit: 'Wake Up',
  passage_CleanUp_Emit: 'Clean Up',
  passage_ShowUp_Emit: 'Show Up',
}

function faceBadge(face: GameMasterFace | undefined) {
  if (!face) return null
  const meta = FACE_META[face]
  return (
    <span className={`text-[9px] uppercase tracking-wider font-medium ${meta.color}`}>{meta.label}</span>
  )
}

/**
 * Campaign residency hub — spatial “forest clearing” (lobby / world room parity) with eight spoke portals.
 * @see .specify/specs/campaign-hub-spatial-map/spec.md
 * @see .specify/specs/campaign-hub-spoke-landing-architecture/spec.md
 */
export function CampaignHubView({
  campaignRef,
  data,
  milestoneGuidance,
  contributionProgress,
  recentCapture,
  intakeAdventureId,
  showFundraisingSettings,
  isNewlyJoined,
  bookMilestoneRollup,
}: Props) {
  const { portals, campaignName, kotterStage, faceMoves, donateButtonLabel } = data
  const stageInfo = KOTTER_STAGES[kotterStage as keyof typeof KOTTER_STAGES]

  return (
    <div className="min-h-screen text-zinc-200 font-sans" style={zoneBackgroundStyle('lobby')}>
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 sm:py-10 space-y-8">
        {/* Post-join welcome banner (transient, auto-dismissing) */}
        {isNewlyJoined && (
          <Suspense>
            <PostJoinWelcomeBanner campaignName={campaignName} />
          </Suspense>
        )}

        <header className="space-y-3">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <CampaignOutlineNavButton href="/game-map" className="text-xs">
              ← Game map
            </CampaignOutlineNavButton>
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
              <CampaignDonateCta campaignRef={campaignRef} donateLabel={donateButtonLabel} />
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
        </header>

        {/* Clearing: same zone texture as global /lobby + nation / Card Club rooms — one “room” frame. */}
        <section
          aria-labelledby="hub-clearing-heading"
          className="cultivation-card p-5 sm:p-6 space-y-5"
          style={{
            ...elementCssVars('wood'),
            ...altitudeCssVars('satisfied'),
          }}
        >
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600/90">Forest clearing</p>
            <h1 id="hub-clearing-heading" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {campaignName}
            </h1>
            <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
              {stageInfo?.emoji} Kotter stage {kotterStage}: {stageInfo?.name ?? 'Urgency'}. You are in a shared
              clearing — <strong className="text-zinc-100">eight portals</strong> open a <strong className="text-zinc-100">landing card</strong> first, then you can enter the spoke CYOA (like the lobby and nation rooms on the world map). When you have something to list publicly, use{' '}
              <Link
                href={`/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}`}
                className="text-teal-400/90 hover:text-teal-300 underline-offset-2 hover:underline font-medium"
              >
                campaign stalls
              </Link>
              .
            </p>
          </div>

          {/* Contribution progress bar — player's own completion ratio + milestone narrative (Sub-AC 3c) */}
          {contributionProgress && (
            <ContributionProgressBar
              progress={contributionProgress}
              campaignRef={campaignRef}
            />
          )}

          {bookMilestoneRollup && bookMilestoneRollup.chapters.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[10px] uppercase tracking-widest text-purple-400">Chapter progress</p>
                <p className="text-[10px] text-zinc-500">
                  {Math.round(bookMilestoneRollup.overallProgress * 100)}% overall
                </p>
              </div>
              <ul className="space-y-2">
                {bookMilestoneRollup.chapters.map((ch) => (
                  <li key={ch.chapterRef}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-zinc-300">{ch.title}</span>
                      <span className="text-[10px] text-zinc-500">
                        {ch.totalBarCount} BAR{ch.totalBarCount !== 1 ? 's' : ''} · {ch.totalPlayerCount} player{ch.totalPlayerCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.round(ch.progressFraction * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {milestoneGuidance ? <CampaignMilestoneStrip data={milestoneGuidance} variant="hub" /> : null}

          {campaignRef === 'bruised-banana' ? <ResidencyEventsCallout /> : null}

          <GmFaceMovesPanel
            kotterStage={kotterStage}
            campaignRef={campaignRef}
            moves={faceMoves}
            pickConfig={{ campaignRef, hexagramId: undefined }}
          />

          {recentCapture ? (
            <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-5 py-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-emerald-500">
                {MOVE_LABEL[recentCapture.rootId ?? ''] ?? 'Named'} — most recent capture
              </p>
              <p className="text-sm font-semibold text-emerald-200">{recentCapture.title}</p>
              {recentCapture.description ? (
                <p className="text-xs text-zinc-400 line-clamp-2">{recentCapture.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                <Link
                  href="/hand"
                  className="text-[10px] text-emerald-600 hover:text-emerald-400 transition min-h-[44px] inline-flex items-center"
                >
                  See all your BARs →
                </Link>
                <Link
                  href={`/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}&attach=${encodeURIComponent(recentCapture.id)}`}
                  className="text-[10px] text-teal-500 hover:text-teal-400 transition font-semibold min-h-[44px] inline-flex items-center"
                >
                  Add to your campaign stall →
                </Link>
              </div>
            </div>
          ) : null}

          {intakeAdventureId ? (
            <Link
              href={`/cyoa-intake/${intakeAdventureId}`}
              className="group block rounded-xl border border-amber-800/50 bg-amber-950/20 hover:bg-amber-950/35 px-5 py-4 transition-colors space-y-1 min-h-[44px]"
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
          ) : null}
        </section>

        {/* Eight portals — ring around the clearing; cultivation-card per portal (parity with card / nation lobby affordances). */}
        <section className="space-y-4" aria-labelledby="hub-portals-heading">
          <div className="text-center space-y-1 px-2">
            <h2 id="hub-portals-heading" className="text-lg font-bold text-white">
              Eight portals
            </h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Paths from the clearing into the campaign</p>
          </div>

          <div
            className="rounded-2xl border border-emerald-900/40 bg-black/20 p-4 sm:p-6"
            role="group"
            aria-label="Spoke portals"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {portals.map((portal, idx) => {
                const isLocked = idx > 1
                const spokeCyoaHref = `/campaign/spoke/${idx}?ref=${encodeURIComponent(campaignRef)}`
                const landingHref = `/campaign/landing?ref=${encodeURIComponent(campaignRef)}&spoke=${idx}`
                const portalLabel = `Spoke ${idx + 1} of 8 — ${portal.name}`

                if (isLocked) {
                  return (
                    <div
                      key={`${portal.hexagramId}-${idx}`}
                      className="cultivation-card cultivation-card--disabled flex flex-col gap-2 p-3 sm:p-4 min-h-[132px]"
                      style={{
                        ...elementCssVars('metal'),
                        ...altitudeCssVars('dissatisfied'),
                      }}
                      aria-label={`${portalLabel}. Locked until the campaign unlocks this spoke.`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Portal {idx + 1}</p>
                        <span className="text-zinc-600 text-xs" aria-hidden>
                          🔒
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-500 leading-snug line-clamp-2">{portal.name}</p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed mt-auto">
                        Unlocks as milestones advance.
                      </p>
                    </div>
                  )
                }

                const el = gmFaceToElement(portal.primaryFace)

                return (
                  <div key={`${portal.hexagramId}-${idx}`} className="flex flex-col gap-2">
                    <Link
                      href={landingHref}
                      className="cultivation-card block no-underline p-3 sm:p-4 flex flex-col gap-2 flex-1 min-h-[140px] sm:min-h-[152px]"
                      style={{
                        ...elementCssVars(el),
                        ...altitudeCssVars('neutral'),
                      }}
                      aria-label={`${portalLabel}. Open spoke landing — orientation before CYOA (SCL-B7).`}
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-400">Portal {idx + 1}</p>
                        {faceBadge(portal.primaryFace)}
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-zinc-100 leading-snug line-clamp-2">
                        {portal.name}
                      </p>
                      {portal.flavor ? (
                        <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {portal.flavor}
                        </p>
                      ) : null}
                      <span className="mt-auto pt-2 text-xs font-semibold text-zinc-200">Landing card first →</span>
                    </Link>
                    <Link
                      href={spokeCyoaHref}
                      className="text-center text-[11px] font-medium text-purple-400/90 hover:text-purple-300 transition-colors min-h-[44px] inline-flex items-center justify-center px-1"
                      aria-label={`${portalLabel}. Skip straight to spoke CYOA.`}
                    >
                      Enter CYOA directly →
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
