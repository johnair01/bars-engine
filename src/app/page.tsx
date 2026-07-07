import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ensureWallet } from '@/actions/economy'
import Link from 'next/link'
import { getActiveInstance } from '@/actions/instance'
import { parseCampaignDomainPreference, ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
// DashboardAvatarWithModal is now internal to DashboardHeader
import { AppreciationsReceived } from '@/components/AppreciationsReceived'
import { getAppreciationFeed } from '@/actions/appreciation'
import { getTodayCharge, getChargeArchive } from '@/actions/charge-capture'
import { RecentChargeSection } from '@/components/charge-capture/RecentChargeSection'
import { getTodayCheckIn } from '@/actions/alchemy'
import { SetupRequired } from '@/components/SetupRequired'
import { DatabaseUnreachable } from '@/components/DatabaseUnreachable'
import { NowHome } from '@/components/now/NowHome'

function isPrismaConnectionError(err: unknown): boolean {
  const e = err as { code?: string; name?: string; message?: string }
  if (e?.code === 'P1001' || e?.code === 'P1000') return true
  if (e?.name === 'PrismaClientInitializationError') return true
  if (typeof e?.message === 'string' && e.message.includes("Can't reach database server")) return true
  return false
}

export default async function Home(props: { searchParams: Promise<{ ritualComplete?: string; focusQuest?: string; ref?: string }> }) {
  await props.searchParams
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  // Safe DB calls — run before auth check, must not crash the page
  let activeInstance: any = null
  try {
    activeInstance = await getActiveInstance()
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Home] DB unreachable for instance lookup:', (err as any)?.message)
    }
  }

  const formatUsdCents = (cents: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
  const eventGoal = activeInstance?.goalAmountCents ?? 0
  const eventCurrent = activeInstance?.currentAmountCents ?? 0
  const eventPct = eventGoal > 0 ? Math.max(0, Math.min(1, eventCurrent / eventGoal)) : 0

  // ── Unauthenticated landing ───────────────────────────────────────────────
  if (!playerId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black text-white font-mono flex-col gap-8 p-8">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl tracking-tighter font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Mastering the Game of Allyship
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg">
            Allyship is hard, lonely work that rarely comes with a map. A book, a 120-move deck, and a
            living practice that turn showing up — together — into a game you can actually play.
          </p>
          <p className="text-zinc-500 text-sm">Two ways in. Pick the one that fits you right now.</p>
        </div>

        {/* ── Two clear doors ───────────────────────────────────────────────── */}
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {/* Door A — Discover the game */}
          <div className="flex flex-col rounded-2xl border border-emerald-600/40 bg-gradient-to-b from-emerald-950/40 to-zinc-950 p-6">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-2">
              Curious? Start here
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">Discover the game</h2>
            <p className="mt-2 flex-1 text-sm text-zinc-300 leading-relaxed">
              See what the deck and the game actually are — 120 allyship moves you can draw, play, and
              turn into real action. Most of it is free, no account needed.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/deck/sales"
                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-center transition-all shadow-lg shadow-green-900/30"
              >
                Explore the deck &amp; game →
              </Link>
              <Link
                href="/deck/preview"
                className="w-full py-2 px-4 text-emerald-200/90 hover:text-white font-semibold rounded-lg text-center transition-all text-xs"
              >
                Browse all 120 cards free →
              </Link>
            </div>
          </div>

          {/* Door B — Help right now (The Crossing) */}
          <div className="flex flex-col rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/40 to-zinc-950 p-6">
            <div className="text-[10px] uppercase tracking-widest text-amber-400/80 mb-2">
              Ready to help · The Crossing
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">Help right now</h2>
            <p className="mt-2 flex-1 text-sm text-zinc-300 leading-relaxed">
              The work is in motion and needs a reliable car to keep moving. Money helps — and so do
              car leads, intros, and signal boosts. Pick the move that fits what you can offer.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/campaign/the-crossing"
                className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-lg text-center transition-all shadow-lg shadow-amber-900/30"
              >
                Find your move →
              </Link>
              <Link
                href="/awaken"
                className="w-full py-2 px-4 text-amber-100/90 hover:text-white font-semibold rounded-lg text-center transition-all text-xs"
              >
                Or join the July 17–19 launch weekend →
              </Link>
            </div>
          </div>
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

        {/* ── Secondary row ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/launch" className="text-zinc-300 hover:text-white font-semibold transition-colors">
            See all the ways to support →
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-white font-semibold transition-colors">
            Log in
          </Link>
        </div>

        <div className="text-xs text-zinc-600 mt-2 text-center max-w-md">
          New here? Most of it is free, no account needed. Existing players can log in to continue.
        </div>
      </div>
    )
  }

  // ── Player fetch ──────────────────────────────────────────────────────────
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
      include: { ...commonPlayerInclude, archetype: true },
    })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2021' || code === 'P2022') return <SetupRequired />
    if (isPrismaConnectionError(err)) return <DatabaseUnreachable />
    try {
      player = await db.player.findUnique({
        where: { id: playerId },
        include: {
          ...commonPlayerInclude,
          archetype: {
            select: {
              id: true, name: true, description: true, moves: true, content: true,
              centralConflict: true, primaryQuestion: true, vibe: true, energy: true,
              shadowSignposts: true, lightSignposts: true, examples: true,
              wakeUp: true, cleanUp: true, growUp: true, showUp: true, createdAt: true,
            },
          },
        },
      })
    } catch (innerErr: unknown) {
      if (isPrismaConnectionError(innerErr) || isPrismaConnectionError(err)) return <DatabaseUnreachable />
      throw err
    }
  }

  if (!player) {
    const cookieStore2 = await cookies()
    cookieStore2.delete('bars_player_id')
    redirect('/login')
  }

  // ── Orientation thread logic ──────────────────────────────────────────────
  const orientationInclude = {
    thread: {
      include: {
        quests: { orderBy: { position: 'asc' as const }, include: { quest: true } },
      },
    },
  } as const
  const orientationWhere = { playerId, completedAt: null, thread: { threadType: 'orientation' as const } }

  let hasActiveOrientationThread: Awaited<ReturnType<typeof db.threadProgress.findFirst>> = null
  try {
    hasActiveOrientationThread = await db.threadProgress.findFirst({
      where: orientationWhere,
      include: orientationInclude,
    })

    if (!hasActiveOrientationThread) {
      const { assignOrientationThreads } = await import('@/actions/quest-thread')
      await assignOrientationThreads(playerId)
      hasActiveOrientationThread = await db.threadProgress.findFirst({
        where: orientationWhere,
        include: orientationInclude,
      })
    }

    if (!player.hasSeenWelcome) {
      const { fireTrigger } = await import('@/actions/quest-engine')
      await fireTrigger('SIGN_IN', { skipRevalidate: true })
      await db.player.update({ where: { id: playerId }, data: { hasSeenWelcome: true } })
      hasActiveOrientationThread = await db.threadProgress.findFirst({
        where: orientationWhere,
        include: orientationInclude,
      })
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Home] Orientation block failed:', (err as Error)?.message)
    }
  }

  // ── Profile gates ─────────────────────────────────────────────────────────
  if (!player.nationId && !hasActiveOrientationThread) {
    redirect('/conclave/guided?step=nation_select')
  }
  if (!player.archetypeId && !hasActiveOrientationThread) {
    redirect('/conclave/guided?step=playbook_select')
  }

  // ── Vibulon count ─────────────────────────────────────────────────────────
  let vibulons = 0
  try {
    await ensureWallet(playerId)
    vibulons = await db.vibulon.count({ where: { ownerId: playerId } })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Home] Wallet/vibulon query failed:', (err as Error)?.message)
    }
  }

  return <NowHome playerId={playerId} vibulons={vibulons} />
}
