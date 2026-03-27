import { getCurrentPlayer } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdventureHubData } from '@/lib/quest-adventure'
import { db } from '@/lib/db'

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

/**
 * @page /adventure/hub/:questId
 * @entity QUEST
 * @description Hub for quests with multiple adventures - player chooses which adventure path (by move type) to start
 * @permissions authenticated
 * @params questId:string (quest ID, required)
 * @searchParams ref:string (campaign reference, optional)
 * @relationships QUEST (quest), ADVENTURE (multiple linked by moveType)
 * @dimensions WHO:player, WHAT:adventure selection, WHERE:quest hub, ENERGY:moveType
 * @example /adventure/hub/quest-123?ref=bruised-banana
 * @agentDiscoverable false
 *
 * Hub for quests with multiple adventures.
 * Player chooses which adventure (by move type) to start.
 */
export default async function AdventureHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ questId: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { questId } = await params
  const { ref: campaignRef } = await searchParams
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const quest = await db.customBar.findUnique({
    where: { id: questId },
    select: { id: true, title: true },
  })
  if (!quest) notFound()

  const adventures = await getAdventureHubData(questId)
  if (adventures.length === 0) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-400">No adventures linked to this quest yet.</p>
          <Link
            href={campaignRef ? `/campaign/board?ref=${campaignRef}` : '/campaign/board'}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            ← Back to gameboard
          </Link>
        </div>
      </div>
    )
  }

  if (adventures.length === 1) {
    const a = adventures[0]
    const playHref = `/adventure/${a.adventureId}/play?questId=${questId}&start=${encodeURIComponent(a.startNodeId ?? '')}${campaignRef ? `&ref=${encodeURIComponent(campaignRef)}` : ''}`
    redirect(playHref)
  }

  const backHref = campaignRef ? `/campaign/board?ref=${campaignRef}` : '/campaign/board'

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <Link href={backHref} className="text-sm text-zinc-500 hover:text-white">
          ← Back to gameboard
        </Link>
        <h1 className="text-2xl font-bold text-white">{quest.title}</h1>
        <p className="text-zinc-400 text-sm">
          Choose a path to begin your adventure:
        </p>
        <div className="space-y-3">
          {adventures.map((a) => {
            const label = a.moveType ? MOVE_LABELS[a.moveType] ?? a.moveType : a.title
            const playHref = `/adventure/${a.adventureId}/play?questId=${questId}&start=${encodeURIComponent(a.startNodeId ?? '')}${campaignRef ? `&ref=${encodeURIComponent(campaignRef)}` : ''}`
            return (
              <Link
                key={a.adventureId}
                href={playHref}
                className="block p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:border-purple-600/60 hover:bg-zinc-900/80 transition-colors"
              >
                <span className="font-medium text-white">{label}</span>
                {a.title !== label && (
                  <span className="block text-xs text-zinc-500 mt-1">{a.title}</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
