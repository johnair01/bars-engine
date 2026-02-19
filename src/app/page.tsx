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
import { AlchemyCaster } from '@/components/AlchemyCaster'
import { KotterGauge } from '@/components/KotterGauge'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { getOnboardingStatus } from '@/actions/onboarding'
import { getActiveInstance } from '@/actions/instance'

export default async function Home() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  // Get app config for dynamic content
  const appConfig = await getAppConfig()
  const heroTitle = appConfig.heroTitle || 'BARS ENGINE'
  const heroSubtitle = appConfig.heroSubtitle || 'A quest system for the vibrational convergence'

  const activeInstance = await getActiveInstance()
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
      <div className="flex h-screen w-full items-center justify-center bg-black text-white font-mono flex-col gap-8 p-8">
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
          <a
            href="/conclave/guided"
            className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-center transition-all shadow-lg shadow-green-900/30"
          >
            Sign Up
          </a>

          <a
            href="/login"
            className="w-full py-3 px-6 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-200 font-bold rounded-lg text-center transition-all"
          >
            Log In
          </a>

        </div>

        <div className="text-xs text-zinc-700 mt-8 text-center max-w-md">
          New players can sign up directly. Existing players can sign in to continue their journey.
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
  } as const

  let player = null
  try {
    player = await db.player.findUnique({
      where: { id: playerId },
      include: {
        ...commonPlayerInclude,
        playbook: true,
      }
    })
  } catch {
    // Fallback for temporary schema drift during deployment rollout.
    player = await db.player.findUnique({
      where: { id: playerId },
      include: {
        ...commonPlayerInclude,
        playbook: {
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
      }
    })
  }

  if (!player) {
    return <div className="p-8 text-white">Error: Identity corrupted. Clear cookies.</div>
  }

  // Force incomplete profiles through the guided setup steps.
  if (!player.nationId) {
    redirect('/conclave/guided?step=nation_select')
  }
  if (!player.playbookId) {
    redirect('/conclave/guided?step=playbook_select')
  }

  await ensureWallet(playerId)
  const vibulons = await db.vibulon.count({ where: { ownerId: playerId } })

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

  // Extract player's Intention from completed orientation quest
  const intentionQuest = completedBars.find(b => b.id === 'orientation-quest-1')
  const intention = intentionQuest?.inputs?.intention as string | undefined

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
      return player.playbook && allowed.includes(player.playbook.name)
    } catch {
      return true // Fallback to visible if error
    }
  })

  // Fetch Quest Threads and Packs
  const threads = await getPlayerThreads()
  const packs = await getPlayerPacks()

  // Derive completed move types for flow checking
  const completedMoveTypes = Array.from(new Set(
    player.quests
      .filter(q => q.status === 'completed' && q.quest.moveType)
      .map(q => q.quest.moveType as string)
  ))

  const isSetupIncomplete = !player.nationId || !player.playbookId

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-12 max-w-4xl mx-auto">

      {/* 1. HEADER & IDENTITY */}
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{player.name}</h1>
            <div className="text-zinc-400 text-sm font-mono">{player.contactValue}</div>
          </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* CLOCK WIDGET */}
            <div className="flex flex-col gap-2">
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 text-center min-w-[70px]">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Act</div>
                <div className="text-xl sm:text-2xl font-mono text-purple-400">{globalState.currentAct}/2</div>
              </div>

              {/* KOTTER GAUGE (Small) */}
              <Link href="/story-clock" className="block">
                <KotterGauge currentStage={globalStage} label="Global Phase" />
              </Link>
            </div>

            <Link href="/wallet" className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 block hover:bg-zinc-800 transition min-w-[90px] max-w-[120px]">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Vibeulons</div>
              <div className="text-xl sm:text-2xl font-mono text-green-400 truncate">{vibulons} ♦</div>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4">
          {player.nation && (
            <Link href="/nation" className="block cursor-pointer hover:opacity-80 transition">
              <div className="px-4 py-2 bg-purple-900/20 border border-purple-900/50 rounded-lg">
                <div className="text-[10px] uppercase tracking-widest text-purple-400 mb-1">Nation</div>
                <div className="text-purple-100 font-bold">{player.nation.name}</div>
              </div>
            </Link>
          )}
          {player.playbook && (
            <Link href="/archetype" className="block cursor-pointer hover:opacity-80 transition">
              <div className="px-4 py-2 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-1">Archetype</div>
                <div className="text-blue-100 font-bold">{player.playbook.name}</div>
              </div>
            </Link>
          )}
          {player.roles.length > 0 && (
            <div className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Roles</div>
              <div className="flex gap-2">
                {player.roles.map(r => (
                  <span key={r.id} className="text-zinc-300 font-medium">{r.role.key}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player Intention */}
        {intention && (
          <div className="w-full px-4 py-3 bg-emerald-900/15 border border-emerald-900/40 rounded-lg">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">My Intention</div>
            <p className="text-emerald-100/90 text-sm italic leading-relaxed">{intention}</p>
          </div>
        )}
      </header >

      {/* EVENT MODE BANNER (Active Instance) */}
      {activeInstance?.isEventMode && (
        <section className="bg-green-950/20 border border-green-900/40 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-green-400 font-bold mb-1">Live Instance</div>
              <div className="text-xl font-bold text-white truncate">{activeInstance.name}</div>
              {activeInstance.targetDescription && (
                <div className="text-sm text-zinc-400 mt-1">
                  {activeInstance.targetDescription}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Link
                href="/event"
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-green-600/60 text-zinc-200 text-xs font-bold"
              >
                Event Page →
              </Link>
              {activeInstance.stripeOneTimeUrl && (
                <a
                  href={activeInstance.stripeOneTimeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold"
                >
                  Sponsor
                </a>
              )}
            </div>
          </div>

          {eventGoal > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
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
              <p className="text-yellow-200/60 text-sm">Your character profile is missing its Nation or Archetype resonance.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/onboarding"
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              Quick Setup →
            </Link>
            <Link
              href="/conclave/guided?reset=true"
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition-colors whitespace-nowrap text-sm"
            >
              Guided Story
            </Link>
          </div>
        </section>
      )}

      {/* QUEST JOURNEYS (Threads & Packs) */}
      {(threads.length > 0 || packs.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-zinc-800 flex-1"></div>
            <h2 className="text-purple-500/70 uppercase tracking-widest text-sm font-bold">Journeys</h2>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threads.filter(t => !(t.playerProgress as any)?.isArchived).map(thread => (
              <QuestThread
                key={thread.id}
                thread={thread as any}
                completedMoveTypes={completedMoveTypes}
                isSetupIncomplete={isSetupIncomplete}
              />
            ))}
            {packs.map(pack => (
              <QuestPack key={pack.id} pack={pack as any} completedMoveTypes={completedMoveTypes} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-10">
          {/* 2. ACTIVE BARS (Current) */}
          <section>
            <div className="flex items-center gap-3 mb-6" id="active-quests">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <h2 className="text-yellow-500/70 uppercase tracking-widest text-sm font-bold">Active Quests</h2>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>

            <StarterQuestBoard
              completedBars={completedBars}
              activeBars={activeBars}
              // Filter out 'inspiration' type for the main list
              customBars={visibleCustomBars.filter(b => b.type !== 'inspiration')}
              ichingBars={ichingReadings}
              potentialDelegates={potentialDelegates}
              playerId={playerId}
              userRoles={player.roles.map(r => r.role.key)}
              view="active"
            />
          </section>

          {/* 3. BARS WALLET (Inspiration) */}
          {visibleCustomBars.some(b => b.type === 'inspiration') && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <h2 className="text-pink-500/70 uppercase tracking-widest text-sm font-bold">Bars Wallet</h2>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <div className="space-y-4">
                <p className="text-zinc-500 text-sm italic text-center">Inspirations collected. Forge them into quests for the collective.</p>
                <StarterQuestBoard
                  completedBars={completedBars}
                  activeBars={activeBars}
                  customBars={visibleCustomBars.filter(b => b.type === 'inspiration')}
                  ichingBars={ichingReadings}
                  potentialDelegates={potentialDelegates}
                  view="active"
                />
              </div>
            </section>
          )}

          {/* 3. AVAILABLE BARS LINK */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <h2 className="text-green-600/70 uppercase tracking-widest text-sm font-bold">Available Quests</h2>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/bars" className="block group">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex justify-between items-center group-hover:border-purple-500/50 transition-all">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">My BARs</h3>
                    <p className="text-zinc-500 text-sm">Create &amp; share BARs</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-purple-900 group-hover:text-purple-400 transition-colors">
                    →
                  </div>
                </div>
              </Link>
              <Link href="/bars/available" className="block group">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex justify-between items-center group-hover:border-green-500/50 transition-all">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">The Market</h3>
                    <p className="text-zinc-500 text-sm">Browse &amp; accept collective quests</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-green-900 group-hover:text-green-400 transition-colors">
                    →
                  </div>
                </div>
              </Link>
            </div>

            {/* CREATE ACTIONS */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/bars/create"
                className="group relative block p-6 border border-dashed border-zinc-700 rounded-xl hover:border-green-500/50 hover:bg-zinc-900/30 transition-all text-center"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📜</div>
                <div className="font-bold text-white mb-1">Create BAR</div>
                <div className="text-sm text-zinc-500">Share an insight or story</div>
              </Link>
              <Link
                href="/quest/create"
                className="group relative block p-6 border border-dashed border-zinc-700 rounded-xl hover:border-purple-500/50 hover:bg-zinc-900/30 transition-all text-center"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">✨</div>
                <div className="font-bold text-white mb-1">Create Quest</div>
                <div className="text-sm text-zinc-500">Use a template</div>
              </Link>
              <Link
                href="/create-bar"
                className="group relative block p-6 border border-dashed border-zinc-700 rounded-xl hover:border-zinc-500/50 hover:bg-zinc-900/30 transition-all text-center"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">+</div>
                <div className="font-bold text-white mb-1">Quick Quest</div>
                <div className="text-sm text-zinc-500">Simple form</div>
              </Link>

              <Link
                href="/create-bar"
                className="mt-4 w-full group relative block p-4 border border-dashed border-zinc-800 rounded-xl hover:border-cyan-500/50 hover:bg-zinc-900/30 transition-all text-center"
              >
                <div className="font-bold text-white mb-1">Create a BAR</div>
                <div className="text-xs text-zinc-500">Optional: link it to an existing quest</div>
              </Link>
            </div>

            {/* I CHING */}
            <DashboardCaster />
          </section>
        </div>

        <div className="space-y-10">
          {/* 4. CHARACTER MOVES */}
          {(player.playbook || player.nation) && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Your Moves</h2>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <Link
                href="/emotional-first-aid"
                className="mb-4 block rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4 hover:border-cyan-500/60 hover:bg-cyan-900/20 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Medbay Access</div>
                <div className="text-white font-semibold">Emotional First Aid Kit</div>
                <div className="text-xs text-cyan-100/70 mt-1">
                  Feeling stuck? Run a quick vibes emergency protocol.
                </div>
              </Link>

              {/* Basic Moves Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <AlchemyCaster
                  moveName="Wake Up"
                  icon="👁"
                  description={player.playbook?.wakeUp?.split(':')[0] || player.nation?.wakeUp?.split(':')[0]}
                />
                <AlchemyCaster
                  moveName="Clean Up"
                  icon="🧹"
                  description={player.playbook?.cleanUp?.split(':')[0] || player.nation?.cleanUp?.split(':')[0]}
                />
                <AlchemyCaster
                  moveName="Grow Up"
                  icon="🌱"
                  description={player.playbook?.growUp?.split(':')[0] || player.nation?.growUp?.split(':')[0]}
                />
                <AlchemyCaster
                  moveName="Show Up"
                  icon="🎯"
                  description={player.playbook?.showUp?.split(':')[0] || player.nation?.showUp?.split(':')[0]}
                />
              </div>

              {/* Special Moves */}
              {player.playbook && (
                <div className="bg-zinc-900/20 border border-zinc-800 p-3 rounded-lg mb-4">
                  <div className="text-xs uppercase text-zinc-500 font-bold mb-2">Special Moves ({player.playbook.name.split(' ')[0]})</div>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(player.playbook.moves).map((move: string, i: number) => (
                      <AlchemyCaster key={i} moveName={move} isSpecial={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Elemental Moves (Nation Affinity) */}
              {player.nation && (() => {
                const { ELEMENTAL_MOVES, hasAffinity, NATION_AFFINITIES } = require('@/lib/elemental-moves')
                const nationAffinities = NATION_AFFINITIES[player.nation.name] || []
                const availableElementalMoves = Object.entries(ELEMENTAL_MOVES)
                  .filter(([_, move]: [any, any]) => nationAffinities.includes(move.affinity))

                if (availableElementalMoves.length === 0) return null

                return (
                  <div className="bg-cyan-900/10 border border-cyan-900/40 p-3 rounded-lg">
                    <div className="text-xs uppercase text-cyan-500 font-bold mb-2">Elemental Moves ({player.nation.name})</div>
                    <div className="flex flex-wrap gap-2">
                      {availableElementalMoves.map(([name, move]: [any, any]) => (
                        <AlchemyCaster
                          key={name}
                          moveName={name}
                          isSpecial={true}
                          description={move.description}
                          icon={move.icon}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}
            </section>
          )}

          {/* 5. GRAVEYARD (Completed Bars & Journeys) */}
          <section className="opacity-60 hover:opacity-100 transition duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <h2 className="text-zinc-700 uppercase tracking-widest text-sm font-bold">💀 Graveyard</h2>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>

            {/* Completed Journeys (Threads & Packs) */}
            {(threads.some(t => t.playerProgress?.completedAt && !(t.playerProgress as any)?.isArchived) || packs.some(p => p.status === 'completed' && !(p.playerProgress as any)?.isArchived)) && (
              <div className="mb-6">
                <h3 className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Completed Journeys</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {threads
                    .filter(t => t.playerProgress?.completedAt && !(t.playerProgress as any)?.isArchived)
                    .map(thread => (
                      <QuestThread key={thread.id} thread={thread as any} />
                    ))}
                  {packs
                    .filter(p => p.status === 'completed' && !(p.playerProgress as any)?.isArchived)
                    .map(pack => (
                      <QuestPack key={pack.id} pack={pack as any} />
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
          </section>
        </div>
      </div>
    </div >
  )
}
