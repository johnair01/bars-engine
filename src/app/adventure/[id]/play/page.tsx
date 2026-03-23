import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { getAdventureProgress } from '@/actions/adventure-progress'
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
  searchParams: Promise<{ questId?: string; threadId?: string; ritual?: string; preview?: string; start?: string; ref?: string; returnTo?: string; hexagram?: string; face?: string }>
}) {
  const { id: adventureId } = await params
  const { questId, threadId, ritual, preview, start: startParam, ref: campaignRef, returnTo, hexagram, face: portalFace } = await searchParams
  const hexagramId = hexagram ? parseInt(hexagram, 10) || undefined : undefined
  const isRitual = ritual === 'true'
  const isPreview = preview === '1'
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const isAdmin = !!player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')
  const allowDraft = isPreview && isAdmin

  const adventure = await db.adventure.findUnique({
    where: allowDraft ? { id: adventureId } : { id: adventureId, status: 'ACTIVE' },
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

  // Resolve start node: start param (from lobby) > questId > adventure.startNodeId
  let startNodeId = startParam ?? adventure.startNodeId
  if (questId && !startParam) {
    const linkedPassage = adventure.passages.find((p) => p.linkedQuestId === questId)
    if (linkedPassage) {
      startNodeId = linkedPassage.nodeId
    }
  }
  if (!startNodeId) {
    startNodeId = adventure.passages[0]?.nodeId ?? 'Start'
  }

  // Resume from saved progress if available and node still exists
  const progress = await getAdventureProgress(adventureId)
  const nodeIds = new Set(adventure.passages.map((p) => p.nodeId))
  const effectiveStartNodeId =
    progress?.currentNodeId && nodeIds.has(progress.currentNodeId)
      ? progress.currentNodeId
      : startNodeId

  // For portal adventure: resolve schoolsAdventureId for Grow Up navigation
  let schoolsAdventureId: string | null = null
  if (campaignRef) {
    const instance = await db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { schoolsAdventureId: true },
    })
    schoolsAdventureId = instance?.schoolsAdventureId ?? null
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link
            href={returnTo ?? (campaignRef ? `/campaign/hub?ref=${encodeURIComponent(campaignRef)}` : '/conclave/onboarding')}
            className="text-sm text-zinc-500 hover:text-white transition"
          >
            ← {returnTo ? 'Back' : campaignRef ? 'Lobby' : 'Back'}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600 font-mono">{adventure.title}</span>
            <Link
              href={`/map?type=story&adventureId=${adventureId}`}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              View map
            </Link>
          </div>
        </div>

        <AdventurePlayer
          adventureId={adventureId}
          adventureSlug={adventure.slug}
          startNodeId={effectiveStartNodeId}
          questId={questId ?? undefined}
          threadId={threadId ?? undefined}
          isRitual={isRitual}
          isPreview={isPreview}
          campaignRef={campaignRef ?? adventure.campaignRef ?? undefined}
          schoolsAdventureId={schoolsAdventureId ?? undefined}
          returnTo={returnTo ?? undefined}
          portalHexagramId={hexagramId}
          portalFace={portalFace ?? undefined}
        />
      </div>
    </div>
  )
}
