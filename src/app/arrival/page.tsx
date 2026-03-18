import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getPlayerThreads } from '@/actions/quest-thread'

/**
 * INV-3: Personalized arrival screen for players who signed up via invitation.
 * Greets by name, names who invited them, shows nation/archetype, and pins one first quest.
 */
export default async function ArrivalPage() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    redirect('/login')
  }

  const player = await db.player.findUnique({
    where: { id: playerId },
    include: {
      invitedBy: { select: { id: true, name: true } },
      nation: { select: { id: true, name: true } },
      archetype: { select: { id: true, name: true } },
    },
  })

  if (!player) {
    redirect('/login')
  }

  // Only show arrival for invite sign-ups
  if (!player.invitedByPlayerId || !player.invitedBy) {
    redirect('/')
  }

  // Get first quest from orientation thread (assigned in createCharacter)
  let firstQuest: { id: string; title: string; description: string } | null = null
  try {
    const threads = await getPlayerThreads()
    const orientationThread = threads.find(
      (t: { threadType?: string }) => t.threadType === 'orientation'
    )
    firstQuest =
      orientationThread?.currentQuest?.quest ??
      orientationThread?.quests?.[0]?.quest ??
      null
  } catch {
    // Threads may not be ready yet; show arrival without quest
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="text-5xl">✨</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome, {player.name}
          </h1>
          <p className="text-zinc-400">
            <span className="text-purple-400 font-medium">{player.invitedBy.name}</span> called you here.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            Your place in the world
          </div>
          <div className="flex flex-wrap gap-3">
            {player.nation && (
              <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm">
                {player.nation.name}
              </span>
            )}
            {player.archetype && (
              <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm">
                {player.archetype.name}
              </span>
            )}
          </div>
        </div>

        {firstQuest && (
          <div className="rounded-xl border border-green-800/60 bg-green-950/30 p-6 space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-green-400/80">
              Your first quest
            </div>
            <h2 className="font-bold text-white">{firstQuest.title}</h2>
            <p className="text-sm text-zinc-400 line-clamp-2">{firstQuest.description}</p>
            <Link
              href={`/?focusQuest=${firstQuest.id}`}
              className="block w-full py-3 px-6 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-center transition"
            >
              Start this quest →
            </Link>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-white transition"
          >
            Continue to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
