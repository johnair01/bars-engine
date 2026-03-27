import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import type { CustomBar } from '@prisma/client'
import { QuestForm } from '../QuestForm'
import Link from 'next/link'

/**
 * @page /quest/:questId
 * @entity QUEST
 * @description Quest detail and play page with gating logic (nation/trigram restrictions), thread position, and completion flow
 * @permissions authenticated
 * @params questId:string (quest ID, required)
 * @relationships QUEST (quest details), PLAYER (assignments, gating), THREAD (position tracking)
 * @dimensions WHO:player, WHAT:quest play, WHERE:quest, ENERGY:quest_progress, PERSONAL_THROUGHPUT:thread_position
 * @example /quest/quest-123
 * @agentDiscoverable false
 */

function questPassesGating(
  q: { allowedNations: string | null; allowedTrigrams: string | null },
  player: NonNullable<Awaited<ReturnType<typeof getCurrentPlayer>>>
): boolean {
  if (q.allowedNations) {
    try {
      const allowed = JSON.parse(q.allowedNations) as string[]
      if (allowed.length > 0 && player.nation && !allowed.includes(player.nation.name)) return false
    } catch {
      /* ignore */
    }
  }
  if (q.allowedTrigrams) {
    try {
      const allowed = JSON.parse(q.allowedTrigrams) as string[]
      if (allowed.length > 0 && player.archetype) {
        const playerTrigram = player.archetype.name.split(' ')[0]
        if (!allowed.includes(playerTrigram)) return false
      }
    } catch {
      /* ignore */
    }
  }
  return true
}

function effectiveThreadPosition(currentPosition: number): number {
  return currentPosition > 0 ? currentPosition : 1
}

/**
 * Resolve quest play access:
 * 1) `PlayerQuest` with status `assigned` (wallet / picked-up quests)
 * 2) Current step in an active `QuestThread` (orientation journeys often have no `PlayerQuest` row)
 */
async function resolvePlayableQuest(
  playerId: string,
  questId: string
): Promise<CustomBar | null> {
  const assignment = await db.playerQuest.findUnique({
    where: { playerId_questId: { playerId, questId } },
    include: { quest: { include: { creator: true } } },
  })
  if (assignment?.status === 'assigned' && assignment.quest) {
    return assignment.quest
  }

  const threadLinks = await db.threadQuest.findMany({
    where: { questId },
    include: {
      thread: {
        include: {
          progress: { where: { playerId } },
        },
      },
    },
  })

  for (const link of threadLinks) {
    const tp = link.thread.progress[0]
    if (!tp || tp.completedAt) continue
    const pos = effectiveThreadPosition(tp.currentPosition)
    if (link.position === pos) {
      const quest = await db.customBar.findUnique({
        where: { id: questId },
        include: { creator: true },
      })
      return quest
    }
  }

  return null
}

/**
 * Per-quest play page (linked from /adventures and deep links).
 * `/quest` without an id still resolves the first eligible assigned quest.
 */
export default async function QuestByIdPage(props: { params: Promise<{ questId: string }> }) {
  const { questId } = await props.params

  const player = await getCurrentPlayer()
  if (!player) return redirect('/conclave/guided')
  if (!isGameAccountReady(player)) return redirect('/conclave/guided')

  const q = await resolvePlayableQuest(player.id, questId)
  if (!q) {
    notFound()
  }

  if (!questPassesGating(q, player)) {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-zinc-500 uppercase tracking-widest text-sm max-w-md">
          This quest isn&apos;t available for your current profile (nation / playbook gating).
        </p>
        <div className="mt-8 flex flex-col gap-4">
          <Link
            href="/wallet"
            className="text-zinc-400 hover:text-white border-b border-zinc-700 pb-1 uppercase text-xs tracking-widest"
          >
            Return to Wallet
          </Link>
          <Link href="/adventures" className="text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest">
            Adventures
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="max-w-md w-full space-y-12">
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest text-zinc-100">{q.title}</h1>
          {q.description && (
            <p className="text-zinc-400 text-lg leading-relaxed font-light">{q.description}</p>
          )}
        </div>

        <QuestForm questId={q.id} inputs={JSON.parse(q.inputs || '[]')} />

        <div className="pt-4">
          <Link href="/wallet" className="text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest">
            ← Wallet
          </Link>
        </div>
      </div>
    </div>
  )
}
