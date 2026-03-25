import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { StarterQuestBoard } from '@/components/StarterQuestBoard'
import { DashboardCaster } from '@/components/DashboardCaster'
import { QuestThread } from '@/components/QuestThread'
import { QuestPack } from '@/components/QuestPack'
import { ensureWallet } from '@/actions/economy'
import { getGlobalState } from '@/actions/world'
import { getAppConfig } from '@/actions/config'
import { getPlayerThreads } from '@/actions/quest-thread'
import { getPlayerPacks } from '@/actions/quest-pack'
import Link from 'next/link'
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection'
import { DashboardActionButtons } from '@/components/dashboard/DashboardActionButtons'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { getOnboardingStatus } from '@/actions/onboarding'
import { getActiveInstance } from '@/actions/instance'
import { parseCampaignDomainPreference, ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { IntentionDisplay } from '@/components/IntentionDisplay'
// DashboardAvatarWithModal is now internal to DashboardHeader
import { AppreciationsReceived } from '@/components/AppreciationsReceived'
import { getAppreciationFeed } from '@/actions/appreciation'
import { getTodayCharge, getChargeArchive } from '@/actions/charge-capture'
import { RecentChargeSection } from '@/components/charge-capture/RecentChargeSection'
import { getTodayCheckIn } from '@/actions/alchemy'
import { SetupRequired } from '@/components/SetupRequired'
import { DatabaseUnreachable } from '@/components/DatabaseUnreachable'
import { listMyCampaignSeeds } from '@/actions/campaign-bar'
import { CampaignSeedReadyCard } from '@/components/dashboard/CampaignSeedReadyCard'
import { getCampaignsForPlayer } from '@/actions/campaign-overview'
import { CampaignsResponsibleSection } from '@/components/dashboard/CampaignsResponsibleSection'
import { ThroughputLanesSection } from '@/components/dashboard/ThroughputLanesSection'
import { OrientationCompass } from '@/components/dashboard/OrientationCompass'
import { DiscoverStrip } from '@/components/dashboard/DiscoverStrip'
import { getLibraryQuestsForMove } from '@/actions/library-discover'
import { NationProvider } from '@/lib/ui/nation-provider'
import { getCampaignMilestoneGuidance } from '@/actions/campaign-milestone-guidance'
import { CampaignMilestoneStrip } from '@/components/campaign/CampaignMilestoneStrip'
import { derivePlayerMoveContext } from '@/lib/player-move-context'
import {
  campaignHomePath,
  needsCampaignOnboardingRoute,
  resolveDefaultCampaignRef,
} from '@/lib/campaign-player-home'

function isPrismaConnectionError(err: unknown): boolean {
  const e = err as { code?: string; name?: string; message?: string }
  if (e?.code === 'P1001' || e?.code === 'P1000') return true
  if (e?.name === 'PrismaClientInitializationError') return true
  if (typeof e?.message === 'string' && e.message.includes("Can't reach database server")) return true
  return false
}

export default async function Home(props: { searchParams: Promise<{ ritualComplete?: string, focusQuest?: string, ref?: string }> }) {
  const searchParams = await props.searchParams
  const campaignRef = searchParams.ref ?? null
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  // Safe DB calls — these run before auth check and must not crash the page
  let appConfig: any = {}
  let activeInstance: any = null
  try {
    appConfig = await getAppConfig()
    activeInstance = await getActiveInstance()
  } catch (err) {
    // DB unreachable — continue with defaults
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Home] DB unreachable for config/instance lookup:', (err as any)?.message)
    }
  }

  const heroTitle = appConfig?.heroTitle || 'BARS ENGINE'
  const heroSubtitle = appConfig?.heroSubtitle || 'A quest system for the vibrational convergence'

  const formatUsdCents = (cents: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
  const eventGoal = activeInstance?.goalAmountCents ?? 0
  const eventCurrent = activeInstance?.currentAmountCents ?? 0
  const eventPct = eventGoal > 0 ? Math.max(0, Math.min(1, eventCurrent / eventGoal)) : 0

  if (!playerId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black text-white font-mono flex-col gap-8 p-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl tracking-tighter font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            {heroTitle}
          </h1>
          <p className="text-zinc-400 text-lg">{heroSubtitle}</p>
        </div>

        {activeInstance?.isEventMode && (
          <Link
            href="/event"
            className="w-full max-w-md block bg-zinc-900/40 border border-zinc-800 hover:border-green-600/60 rounded-2xl p-5 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Live Instance</div>
            <div className="flex items-center justify-between gap-3">
              <div className="font-bold text-white truncate">{activeInstance.name}</div>
              <div className="text-xs text-green-400 font-bold">View →</div>
            </div>
            {eventGoal > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{formatUsdCents(eventCurrent)}</span>
                  <span>{formatUsdCents(eventGoal)}</span>
                </div>
                <div className="h-2 rounded-full bg-black border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${Math.round(eventPct * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </Link>
        )}

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link
            href={`/event${campaignRef ? `?ref=${encodeURIComponent(campaignRef)}` : ''}`}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-center transition-all shadow-lg shadow-green-900/30"
          >
            Support the Residency
          </Link>

          <Link
            href={`/campaign${campaignRef ? `?ref=${encodeURIComponent(campaignRef)}` : ''}`}
            className="w-full py-3 px-6 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-200 font-bold rounded-lg text-center transition-all"
          >
            Play the game
          </Link>

          <Link
            href="/login"
            className="w-full py-3 px-6 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-200 font-bold rounded-lg text-center transition-all"
          >
            Log In
          </Link>
        </div>

        <div className="text-xs text-zinc-700 mt-8 text-center max-w-md">
          Learn the story and contribute at the event. Existing players can log in to continue.
        </div>
      </div>
    )
  }

  const commonPlayerInclude = {
    nation: true,
    roles: { include: { role: true } },
    quests: { include: { quest: true } },
    vibulonEvents: true,
    starterPack: true,
    invitedBy: { select: { id: true, name: true } },
  } as const

  let player = null
  try {
    player = await db.player.findUnique({
      where: { id: playerId },
      include: {
        ...commonPlayerInclude,
        archetype: true,
      }
    })
  } catch (err: unknown) {
    // P2021 = table does not exist — DB needs migrations/setup
    const code = (err as { code?: string })?.code
    if (code === 'P2021') {
      return <SetupRequired />
    }
    if (isPrismaConnectionError(err)) {
      return <DatabaseUnreachable />
    }
    // Fallback for temporary schema drift (different columns)
    try {
      player = await db.player.findUnique({
        where: { id: playerId },
        include: {
          ...commonPlayerInclude,
          archetype: {
            select: {
              id: true,
              name: true,
              description: true,
              moves: true,
              content: true,
              centralConflict: true,
              primaryQuestion: true,
              vibe: true,
              energy: true,
              shadowSignposts: true,
              lightSignposts: true,
              examples: true,
              wakeUp: true,
              cleanUp: true,
              growUp: true,
              showUp: true,
              createdAt: true,
            }
          },
        },
      })
    } catch (innerErr: unknown) {
      if (isPrismaConnectionError(innerErr) || isPrismaConnectionError(err)) {
        return <DatabaseUnreachable />
      }
      throw err
    }
  }

  if (!player) {
    return <div className="p-8 text-white">Error: Identity corrupted. Clear cookies.</div>
  }

  // Force incomplete profiles through guided setup UNLESS they have an active orientation thread.
  // If an orientation thread is assigned, the thread system handles onboarding on the dashboard.
  let hasActiveOrientationThread = await db.threadProgress.findFirst({
    where: { playerId, completedAt: null, thread: { threadType: 'orientation' } },
    include: {
      thread: {
        include: {
          quests: {
            orderBy: { position: 'asc' },
            include: { quest: true }
          }
        }
      }
    }
  })

  if (!hasActiveOrientationThread) {
    const { assignOrientationThreads } = await import('@/actions/quest-thread')
    await assignOrientationThreads(playerId)

    // Refresh the check
    hasActiveOrientationThread = await db.threadProgress.findFirst({
      where: { playerId, completedAt: null, thread: { threadType: 'orientation' } },
      include: {
        thread: {
          include: {
            quests: {
              orderBy: { position: 'asc' },
              include: { quest: true }
            }
          }
        }
      }
    })
  }

  // AUTO-TRIGGER: Complete the "Arrival" quest upon sign-in
  if (!player.hasSeenWelcome) {
    const { fireTrigger } = await import('@/actions/quest-engine')
    await fireTrigger('SIGN_IN', { skipRevalidate: true })
    await db.player.update({ where: { id: playerId }, data: { hasSeenWelcome: true } })

    // Refresh thread one more time to show updated progress
    hasActiveOrientationThread = await db.threadProgress.findFirst({
      where: { playerId, completedAt: null, thread: { threadType: 'orientation' } },
      include: {
        thread: {
          include: {
            quests: {
              orderBy: { position: 'asc' },
              include: { quest: true }
            }
          }
        }
      }
    })
  }

  /* 
  if (hasActiveOrientationThread) {
    // ENFORCE STICKY FLOW: If there's an orientation quest active, go back to onboarding controller
    // This now covers ALL orientation quests, including the final signal.
    redirect('/conclave/onboarding')
  } else {
  */
  if (!player.nationId && !hasActiveOrientationThread) {
    redirect('/conclave/guided?step=nation_select')
  }
  if (!player.archetypeId && !hasActiveOrientationThread) {
    redirect('/conclave/guided?step=playbook_select')
  }

  const ritualComplete = searchParams.ritualComplete === 'true'
  const focusQuest = searchParams.focusQuest
  const isAdmin = !!player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')

  await ensureWallet(playerId)
  const vibulons = await db.vibulon.count({ where: { ownerId: playerId } })
  const isRitualComplete = hasActiveOrientationThread === null || hasActiveOrientationThread.completedAt !== null

  const potentialDelegates = await db.player.findMany({
    where: { id: { not: playerId } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })
  // Derive quest state from PlayerQuest table
  const completedBars = player.quests
    .filter(q => q.status === 'completed')
    .map(q => ({
      id: q.questId,
      inputs: q.inputs ? JSON.parse(q.inputs) : {}
    }))

  const activeBars = player.quests
    .filter(q => q.status === 'assigned')
    .map(q => q.questId)

  // Extract player's Intention: storyProgress (updated) or completed orientation quest
  const intentionQuest = completedBars.find(b => b.id === 'orientation-quest-1')
  let intention: string | undefined
  try {
    const sp = player.storyProgress ? (JSON.parse(player.storyProgress) as Record<string, unknown>) : {}
    intention = (sp.intention as string) || (intentionQuest?.inputs?.intention as string)
  } catch {
    intention = intentionQuest?.inputs?.intention as string | undefined
  }

  // Ensure system feedback is always "active" for the player
  if (!activeBars.includes('system-feedback')) {
    activeBars.push('system-feedback')
  }

  // Fetch user-created bars:
  // - Public bars that are unclaimed
  // - Bars claimed by current player (these are in activeBars)
  // - Private bars created by current player (drafts)
  // - Explicitly include any active quests (assigned to player) regardless of visibility
  const customBars = await db.customBar.findMany({
    where: {
      OR: [
        // Public + unclaimed + active
        { visibility: 'public', claimedById: null, status: 'active' },
        // Claimed/Assigned to valid activeBars list (including private ones)
        { id: { in: activeBars } },
        // System quests (always visible)
        { isSystem: true, status: 'active' },
        // Completed by me
        { id: { in: completedBars.map(b => b.id) } },
        // My drafts
        { visibility: 'private', creatorId: playerId, claimedById: null, status: 'active' },
      ]
    },
    include: { microTwine: true },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch active I Ching readings for this player
  const ichingReadings = await db.playerBar.findMany({
    where: {
      playerId,
      source: 'iching',
    },
    include: {
      bar: true
    },
    orderBy: { acquiredAt: 'desc' }
  })

  const globalState = await getGlobalState()
  const globalStage = Math.max(1, Math.min(8, globalState.currentPeriod || Math.ceil(globalState.storyClock / 8)))

  // Get onboarding status
  const onboardingStatus = await getOnboardingStatus()

  // FILTER BARS BY TRIGRAM (Playbook Gating)
  const visibleCustomBars = customBars.filter(bar => {
    if (!bar.allowedTrigrams || bar.allowedTrigrams === '[]') return true // Public if no gating
    try {
      const allowed = JSON.parse(bar.allowedTrigrams)
      return player.archetype && allowed.includes(player.archetype.name)
    } catch {
      return true // Fallback to visible if error
    }
  })

  // Fetch Quest Threads and Packs
  const threads = await getPlayerThreads()
  const packs = await getPlayerPacks()

  // Appreciations received (Phase 2)
  const appreciationResult = await getAppreciationFeed(10)
  const appreciations = 'success' in appreciationResult ? appreciationResult.appreciations : []

  // Today's charge (strict one per day) + archive
  const chargeResult = await getTodayCharge()
  const todayCharge = 'success' in chargeResult ? chargeResult.bar : null
  const archiveResult = await getChargeArchive(10)
  const chargeArchive = 'success' in archiveResult ? archiveResult.bars : []

  // Daily alchemy check-in
  const todayCheckIn = await getTodayCheckIn(playerId).catch(() => null)

  // Campaign seeds ready to promote (creator's own, complete, unpromoted)
  const myCampaignSeeds = await listMyCampaignSeeds(playerId)

  // Campaigns where player is leader/owner (Phase 3: dashboard overview)
  const campaignsResponsible = await getCampaignsForPlayer(playerId)

  let milestoneGuidance = null as Awaited<ReturnType<typeof getCampaignMilestoneGuidance>>
  try {
    milestoneGuidance = await getCampaignMilestoneGuidance(playerId)
  } catch {
    milestoneGuidance = null
  }

  // Derive move context via shared utility (G17 — single source of truth)
  const moveCtx = derivePlayerMoveContext({
    quests: player.quests,
    hasChargeToday: !!todayCharge,
    activeQuestCount: activeBars.length,
    nationId: player.nationId,
    archetypeId: player.archetypeId,
  })

  const { completedMoveTypes, recommendedMoveType } = moveCtx

  const compassProps = {
    completedMoveTypes: moveCtx.completedMoveTypes,
    isFirstSession: moveCtx.isFirstSession,
    hasChargeToday: moveCtx.hasChargeToday,
    activeQuestCount: moveCtx.activeQuestCount,
    isSetupIncomplete: moveCtx.isSetupIncomplete,
  }

  const discoverQuests = await getLibraryQuestsForMove(recommendedMoveType)

  const isSetupIncomplete = !player.nationId || !player.archetypeId

  const defaultCampaignRef = resolveDefaultCampaignRef(activeInstance?.campaignRef)
  const useCampaignOnboarding = needsCampaignOnboardingRoute(player, hasActiveOrientationThread)
  const playerCampaignHomeHref = campaignHomePath({
    campaignRef: defaultCampaignRef,
    useOnboardingCampaignRoute: useCampaignOnboarding,
  })

  // Campaign Entry: show when player has bruised-banana thread and hasn't dismissed
  const bbThread = threads.find(
    (t: { id: string }) =>
      t.id === 'bruised-banana-orientation-thread' || t.id.startsWith('bruised-banana-orientation-')
  )
  const showCampaignEntry = bbThread && !(player as { hasSeenCampaignEntry?: boolean }).hasSeenCampaignEntry
  let intendedImpactLabels: string[] = []
  if (showCampaignEntry) {
    const LENS_LABELS: Record<string, string> = { allyship: 'Allyship', creative: 'Creative', strategic: 'Strategic', community: 'Community' }
    let state: { lens?: string; campaignDomainPreference?: unknown } | undefined
    if (player.storyProgress) {
      try {
        const parsed = JSON.parse(player.storyProgress) as { state?: Record<string, unknown> }
        state = parsed?.state
      } catch { /* ignore */ }
    }
    if (state?.lens && typeof state.lens === 'string') {
      const label = LENS_LABELS[state.lens.toLowerCase()]
      if (label) intendedImpactLabels = [label]
    }
    if (intendedImpactLabels.length === 0) {
      const domains = parseCampaignDomainPreference(player.campaignDomainPreference)
      intendedImpactLabels = domains
        .map((key) => ALLYSHIP_DOMAINS.find((d) => d.key === key)?.label ?? '')
        .filter((s) => s.length > 0)
    }
  }

  return (
    <NationProvider element={player.nation?.element ?? null} archetypeName={player.archetype?.name ?? null}>
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-12 max-w-4xl mx-auto">

      {/* 1. HEADER & IDENTITY — compass directly after identity (PMI G1 / PHOS T5.1) */}
      <header className="space-y-6">
        <DashboardHeader
          player={{
            name: player.name,
            avatarConfig: player.avatarConfig,
            pronouns: player.pronouns,
            nation: player.nation ? { name: player.nation.name, element: player.nation.element } : null,
            archetype: player.archetype ? { name: player.archetype.name } : null,
          }}
          vibulons={vibulons}
          todayCheckIn={todayCheckIn ? {
            sceneId: todayCheckIn.sceneId ?? null,
            thresholdEncounterId: todayCheckIn.thresholdEncounterId ?? null,
            channel: todayCheckIn.channel,
            altitude: todayCheckIn.altitude,
            sceneTypeChosen: todayCheckIn.sceneTypeChosen ?? null,
          } : null}
          playerId={playerId}
          questCount={completedBars.length}
        />

        {/* 2. ORIENTATION COMPASS — first structural block after identity; governs the session (PMI G1) */}
        <OrientationCompass {...compassProps} hasCheckedIn={!!todayCheckIn} />
        <DiscoverStrip moveType={recommendedMoveType} quests={discoverQuests} />

        <p className="text-xs text-zinc-600">
          Check in · capture what&apos;s charged · follow the compass to your next move ·{' '}
          <Link href="/wiki/handbook" className="text-zinc-500 hover:text-zinc-300 underline-offset-2 hover:underline">
            Player handbook
          </Link>
        </p>

        {/* Campaign leader signals (high-priority, before social) */}
        {myCampaignSeeds.some((s) => s.isComplete && !s.promotedInstance) && (
          <CampaignSeedReadyCard seeds={myCampaignSeeds} />
        )}
        {campaignsResponsible.length > 0 && (
          <CampaignsResponsibleSection
            campaigns={campaignsResponsible}
            defaultCampaignRef={defaultCampaignRef}
            needsCampaignOnboardingRoute={useCampaignOnboarding}
          />
        )}

        {/* Today's Charge + Archive */}
        <RecentChargeSection todayCharge={todayCharge} archive={chargeArchive} />

        <ThroughputLanesSection
          activeInstanceId={activeInstance?.id ?? null}
          campaignHomeHref={playerCampaignHomeHref}
        />

        {milestoneGuidance && (
          <CampaignMilestoneStrip data={milestoneGuidance} variant="dashboard" />
        )}

        {/* Appreciations received — social layer after self-orientation (G5) */}
        {appreciations.length > 0 && (
          <AppreciationsReceived items={appreciations} maxItems={5} />
        )}

        {/* Player Intention */}
        {intention && (
          <IntentionDisplay
            intention={intention}
            campaignDomainPreference={parseCampaignDomainPreference(player.campaignDomainPreference)}
          />
        )}

      </header>

      {/* RITUAL SUCCESS BANNER */}
      {ritualComplete && (
        <section className="bg-purple-900/30 border border-purple-500/50 rounded-2xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-700">
          <div className="text-4xl">🌟</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">The Ritual is Complete</h2>
          <p className="text-purple-200 text-sm max-w-md mx-auto leading-relaxed">
            You have successfully navigated the first gates of the Conclave.
            The collective field is now open to you. Go forth and weave.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-900/40">
              Enter the Flow
            </Link>
            <Link href="/game-map" className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold transition-all text-sm">
              Explore the Game Map
            </Link>
          </div>
        </section>
      )}

      {/* WELCOME SCREEN (if not seen yet) */}
      {!('error' in onboardingStatus) && !onboardingStatus.hasSeenWelcome && (
        <WelcomeScreen />
      )}

      {/* ONBOARDING CHECKLIST (if not complete) */}
      {!('error' in onboardingStatus) && !onboardingStatus.isComplete && (
        <OnboardingChecklist status={onboardingStatus} />
      )}

      {/* INCOMPLETE SETUP BANNER */}
      {isSetupIncomplete && (
        <section className="bg-yellow-900/20 border border-yellow-900/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="text-3xl">⚡</div>
            <div>
              <h3 className="text-yellow-400 font-bold">Complete Your Setup</h3>
              <p className="text-yellow-200/60 text-sm">
                {hasActiveOrientationThread
                  ? 'Continue your onboarding journey below to choose your Nation and Archetype.'
                  : 'Your character profile is missing its Nation or Archetype resonance.'
                }
              </p>
            </div>
          </div>
          {!hasActiveOrientationThread && (
            <div className="flex gap-2">
              <Link
                href="/onboarding"
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Quick Setup →
              </Link>
              <Link
                href="/conclave/onboarding?reset=true"
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition-colors whitespace-nowrap text-sm"
              >
                Guided Story
              </Link>
            </div>
          )}
        </section>
      )}

      {/* QUEST JOURNEYS (Threads & Packs) */}
      {(threads.length > 0 || packs.length > 0) && (() => {
        const activeThreads = threads.filter(t => !(t.playerProgress as any)?.isArchived)
        const journeysCount = activeThreads.length + packs.length
        return (
          <CollapsibleSection
            title="Journeys"
            count={journeysCount}
            defaultExpanded={journeysCount <= 3}
            titleClassName="text-purple-500/70"
            variant="button"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeThreads.map(thread => (
                <QuestThread
                  key={thread.id}
                  thread={thread as any}
                  completedMoveTypes={completedMoveTypes}
                  isSetupIncomplete={isSetupIncomplete}
                  focusQuest={focusQuest}
                  campaignDomainPreference={parseCampaignDomainPreference(player.campaignDomainPreference)}
                  isAdmin={isAdmin}
                />
              ))}
              {packs.map(pack => (
                <QuestPack key={pack.id} pack={pack as any} completedMoveTypes={completedMoveTypes} focusQuest={focusQuest} isAdmin={isAdmin} />
              ))}
            </div>
          </CollapsibleSection>
        )
      })()}

      {/* ACTION BUTTONS — Full width across screen */}
      <section className="mb-10">
        <DashboardActionButtons />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-10">
          {/* 2. ACTIVE BARS (Current) */}
          <CollapsibleSection
            title="Active Quests"
            count={activeBars.length}
            defaultExpanded={activeBars.length <= 5}
            titleClassName="text-yellow-500/70"
            id="active-quests"
            variant="button"
          >
            <StarterQuestBoard
              completedBars={completedBars}
              activeBars={activeBars.length > 5 ? activeBars.slice(0, 5) : activeBars}
              // Filter out 'inspiration' type for the main list; when >5 active, only pass bars for first 5
              customBars={visibleCustomBars.filter(b => b.type !== 'inspiration')}
              ichingBars={ichingReadings}
              potentialDelegates={potentialDelegates}
              playerId={playerId}
              userRoles={player.roles.map(r => r.role.key)}
              view="active"
            />
            {activeBars.length > 5 && (
              <div className="mt-4">
                <Link
                  href="/hand"
                  className="inline-flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  View Vault →
                </Link>
                <p className="text-xs text-zinc-500 mt-1">Organize and manage your active quests</p>
              </div>
            )}
          </CollapsibleSection>
        </div>

        <div className="space-y-10">
          {/* 4. GRAVEYARD (Completed Bars & Journeys) */}
          {(() => {
            const completedThreads = threads.filter(t => t.playerProgress?.completedAt && !(t.playerProgress as any)?.isArchived)
            const completedPacks = packs.filter(p => p.status === 'completed' && !(p.playerProgress as any)?.isArchived)
            const graveyardCount = completedThreads.length + completedPacks.length + completedBars.length
            return (
              <CollapsibleSection
                title="💀 Graveyard"
                count={graveyardCount}
                defaultExpanded={graveyardCount <= 3}
                titleClassName="text-zinc-400"
                variant="button"
              >
                <div className="opacity-60 hover:opacity-100 transition duration-500 space-y-6">
                  {/* Completed Journeys (Threads & Packs) */}
                  {(completedThreads.length > 0 || completedPacks.length > 0) && (
                    <div>
                      <h3 className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Completed Journeys</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedThreads.map(thread => (
                          <QuestThread key={thread.id} thread={thread as any} campaignDomainPreference={parseCampaignDomainPreference(player.campaignDomainPreference)} isAdmin={isAdmin} />
                        ))}
                        {completedPacks.map(pack => (
                          <QuestPack key={pack.id} pack={pack as any} focusQuest={focusQuest} isAdmin={isAdmin} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Individual Quests */}
                  <StarterQuestBoard
                    completedBars={completedBars}
                    activeBars={activeBars}
                    customBars={customBars as any}
                    view="completed"
                  />
                </div>
              </CollapsibleSection>
            )
          })()}
        </div>
      </div>
    </div >
    </NationProvider>
  )
}
