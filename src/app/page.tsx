import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { StarterQuestBoard } from '@/components/StarterQuestBoard'
import { CreateBarForm } from '@/components/CreateBarForm'
import { DashboardCaster } from '@/components/DashboardCaster'
import { ensureWallet } from '@/actions/economy'
import { getGlobalState } from '@/actions/world'
import Link from 'next/link'

export default async function Home() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white font-mono flex-col gap-8 p-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl tracking-tighter font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            BARS ENGINE
          </h1>
          <p className="text-zinc-400 text-lg">A quest system for the vibrational convergence</p>
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
  const starterPackData = player.starterPack
    ? JSON.parse(player.starterPack.data) as {
      completedBars: { id: string; inputs: Record<string, any> }[],
      activeBars?: string[]
    }
    : { completedBars: [], activeBars: [] }

  // Fetch user-created bars (collective ones available to everyone)
  const customBars = await db.customBar.findMany({
    where: {
      status: 'active',
      storyPath: 'collective'  // Only collective bars for now
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

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 space-y-12 max-w-4xl mx-auto">

      {/* 1. HEADER & IDENTITY */}
      <header className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight">{player.name}</h1>
            <div className="text-zinc-400 text-sm font-mono">{player.contactValue}</div>
          </div>

          <div className="flex gap-4">
            {/* CLOCK WIDGET */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center min-w-[100px]">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Act</div>
              <div className="text-4xl font-mono text-purple-400">{globalState.currentAct}</div>
            </div>

            <Link href="/wallet" className="text-right bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 block hover:bg-zinc-800 transition">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Vibeulons</div>
              <div className="text-4xl font-mono text-green-400">{vibulons} ♦</div>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {player.nation && (
            <div className="px-4 py-2 bg-purple-900/20 border border-purple-900/50 rounded-lg">
              <div className="text-[10px] uppercase tracking-widest text-purple-400 mb-1">Nation</div>
              <div className="text-purple-100 font-bold">{player.nation.name}</div>
            </div>
          )}
          {player.playbook && (
            <div className="px-4 py-2 bg-blue-900/20 border border-blue-900/50 rounded-lg">
              <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-1">Playbook</div>
              <div className="text-blue-100 font-bold">{player.playbook.name}</div>
            </div>
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

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-10">
          {/* 2. ACTIVE BARS (Current) */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <h2 className="text-yellow-500/70 uppercase tracking-widest text-sm font-bold">Active Bars</h2>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>

            <StarterQuestBoard
              completedBars={starterPackData.completedBars}
              activeBars={starterPackData.activeBars || []}
              customBars={visibleCustomBars}
              ichingBars={ichingReadings}
              potentialDelegates={potentialDelegates}
              view="active"
            />
          </section>

          {/* 3. AVAILABLE BARS (Starter) */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <h2 className="text-green-600/70 uppercase tracking-widest text-sm font-bold">Available Bars</h2>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>
            <StarterQuestBoard
              completedBars={starterPackData.completedBars}
              activeBars={starterPackData.activeBars || []}
              customBars={visibleCustomBars}
              ichingBars={ichingReadings}
              potentialDelegates={potentialDelegates}
              view="available"
            />

            {/* CREATE BAR */}
            <div className="mt-6">
              <CreateBarForm />
            </div>

            {/* I CHING */}
            <DashboardCaster />
          </section>
        </div>

        <div className="space-y-10">
          {/* 4. CHARACTER MOVES */}
          {player.playbook && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Moves</h2>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>
              <div className="space-y-3">
                {JSON.parse(player.playbook.moves).map((move: { name: string; type: string; desc: string }, i: number) => (
                  <div key={i} className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-zinc-200 text-sm">{move.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${move.type === 'at_will' ? 'bg-green-900/20 text-green-400' :
                        move.type === 'per_hour' ? 'bg-yellow-900/20 text-yellow-400' :
                          'bg-red-900/20 text-red-400'
                        }`}>
                        {move.type === 'at_will' ? '∞' : move.type === 'per_hour' ? '1/HR' : '1x'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 leading-snug">{move.desc}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. GRAVEYARD (Completed Bars) */}
          <section className="opacity-60 hover:opacity-100 transition duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <h2 className="text-zinc-700 uppercase tracking-widest text-sm font-bold">💀 Graveyard</h2>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>
            <StarterQuestBoard completedBars={starterPackData.completedBars} activeBars={starterPackData.activeBars || []} view="completed" />
          </section>
        </div>
      </div>
    </div >
  )
}
