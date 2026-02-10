import { db } from '@/lib/db'
import { cookies } from 'next/headers'
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
import { parseFeatureFlags } from '@/lib/features'

export default async function Home() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  // Get app config for dynamic content
  const appConfig = await getAppConfig()
  const featureFlags = parseFeatureFlags(appConfig.features)
  const ichingEnabled = featureFlags.iching !== false
  const heroTitle = appConfig.heroTitle || 'BARS ENGINE'
  const heroSubtitle = appConfig.heroSubtitle || 'A quest system for the vibrational convergence'

  if (!playerId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white font-mono flex-col gap-8 p-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl tracking-tighter font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            {heroTitle}
          </h1>
          <p className="text-zinc-400 text-lg">{heroSubtitle}</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <a
            href="/conclave"
            className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-center transition-all shadow-lg shadow-green-900/30"
          >
            Sign Up / Sign In
          </a>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-4 text-zinc-600">or</span>
            </div>
          </div>

          <form action="/invite" method="get" className="flex gap-2">
            <input
              type="text"
              name="token"
              placeholder="Enter invite code..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 text-sm focus:border-zinc-600 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium text-sm transition"
            >
              Redeem
            </button>
          </form>
        </div>

        <div className="text-xs text-zinc-700 mt-8 text-center max-w-md">
          New players can sign up directly. Existing players can sign in or use an invite code for special access.
        </div>
      </div>
    )
  }

  const player = await db.player.findUnique({
    where: { id: playerId },
    include: {
      nation: true,
      playbook: true,
      roles: { include: { role: true } },
      quests: { include: { quest: true } },
      vibulonEvents: true,
      starterPack: true,
    }
  })

  if (!player) {
    return <div className="p-8 text-white">Error: Identity corrupted. Clear cookies.</div>
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

  // Get onboarding status
  const onboardingStatus = await getOnboardingStatus()

  // FILTER BARS BY TRIGRAM (Playbook Gating)
  const visibleCustomBars = customBars.filter(bar => {
    if (!bar.allowedTrigrams || bar.allowedTrigrams === '[]') return true // Public if no gating
    try {
      const allowed = JSON.parse(bar.allowedTrigrams)
      return player.playbook && allowed.includes(player.playbook.name)
    } catch (e) {
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
                <div className="text-xl sm:text-2xl font-mono text-purple-400">{globalState.currentAct}/8</div>
              </div>

              {/* KOTTER GAUGE (Small) */}
              <KotterGauge currentStage={Math.ceil(globalState.storyClock / 8)} label="Global Phase" />
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
      </header >


      {/* WELCOME SCREEN (if not seen yet) */}
      {!('error' in onboardingStatus) && !onboardingStatus.hasSeenWelcome && (
        <WelcomeScreen />
      )}

      {/* ONBOARDING CHECKLIST (if not complete) */}
      {!('error' in onboardingStatus) && !onboardingStatus.isComplete && (
        <OnboardingChecklist status={onboardingStatus} />
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
              <QuestThread key={thread.id} thread={thread as any} completedMoveTypes={completedMoveTypes} ichingEnabled={ichingEnabled} />
            ))}
            {packs.map(pack => (
              <QuestPack key={pack.id} pack={pack as any} completedMoveTypes={completedMoveTypes} ichingEnabled={ichingEnabled} />
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

            <Link href="/bars/available" className="block group">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-center group-hover:border-green-500/50 transition-all">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Available Quests</h3>
                  <p className="text-zinc-500"> Browse and accept new quests from other players.</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-green-900 group-hover:text-green-400 transition-colors">
                  →
                </div>
              </div>
            </Link>

            {/* CREATE BAR */}
            <div className="mt-8">
              <Link
                href="/quest/create"
                className="w-full group relative block p-6 border border-dashed border-zinc-700 rounded-xl hover:border-purple-500/50 hover:bg-zinc-900/30 transition-all text-center"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">✨</div>
                <div className="font-bold text-white mb-1">Create a New Quest</div>
                <div className="text-sm text-zinc-500">Design a dream, scheme, or invitation</div>
              </Link>
            </div>

            {/* I CHING */}
            {ichingEnabled && <DashboardCaster />}
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
                <div className="bg-zinc-900/20 border border-zinc-800 p-3 rounded-lg">
                  <div className="text-xs uppercase text-zinc-500 font-bold mb-2">Special Moves ({player.playbook.name.split(' ')[0]})</div>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(player.playbook.moves).map((move: string, i: number) => (
                      <AlchemyCaster key={i} moveName={move} isSpecial={true} />
                    ))}
                  </div>
                </div>
              )}
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
                      <QuestThread key={thread.id} thread={thread as any} ichingEnabled={ichingEnabled} />
                    ))}
                  {packs
                    .filter(p => p.status === 'completed' && !(p.playerProgress as any)?.isArchived)
                    .map(pack => (
                      <QuestPack key={pack.id} pack={pack as any} ichingEnabled={ichingEnabled} />
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
