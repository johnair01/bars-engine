import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { AdventurePlayer } from './AdventurePlayer'

/**
 * Adventure-based play (Passage → Quest completion).
 * Used when a quest's thread has adventureId (e.g. from .twee import).
 * Reaching a completion passage (linkedQuestId + no choices) calls completeQuest.
 */
export default async function AdventurePlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ questId?: string; threadId?: string; ritual?: string }>
}) {
  const { id: adventureId } = await params
  const { questId, threadId, ritual } = await searchParams
  const isRitual = ritual === 'true'
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const adventure = await db.adventure.findUnique({
    where: { id: adventureId, status: 'ACTIVE' },
    include: { passages: true },
  })

  if (!adventure) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Adventure not found or inactive.</p>
          <Link href="/conclave/onboarding" className="text-zinc-500 hover:text-white text-sm">
            ← Back to onboarding
          </Link>
        </div>
      </div>
    )
  }

  // Resolve start node: if questId provided, find passage linked to that quest
  let startNodeId = adventure.startNodeId
  if (questId) {
    const linkedPassage = adventure.passages.find((p) => p.linkedQuestId === questId)
    if (linkedPassage) {
      startNodeId = linkedPassage.nodeId
    }
  }
  if (!startNodeId) {
    startNodeId = adventure.passages[0]?.nodeId ?? 'Start'
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link
            href="/conclave/onboarding"
            className="text-sm text-zinc-500 hover:text-white transition"
          >
            ← Back
          </Link>
          <span className="text-xs text-zinc-600 font-mono">{adventure.title}</span>
        </div>

        <AdventurePlayer
          adventureSlug={adventure.slug}
          startNodeId={startNodeId}
          questId={questId ?? undefined}
          threadId={threadId ?? undefined}
          isRitual={isRitual}
        />
      </div>
    </div>
  )
}
