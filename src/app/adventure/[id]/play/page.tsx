import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { isSafeAppPath } from '@/lib/safe-return-to'
import Link from 'next/link'
import { getAdventureProgress } from '@/actions/adventure-progress'
import { AdventurePlayer } from './AdventurePlayer'

/**
 * @page /adventure/:id/play
 * @entity QUEST
 * @description Adventure-based play interface for passage-driven quest completion (e.g. from .twee import)
 * @permissions authenticated
 * @params id:string (adventure ID, required)
 * @searchParams questId:string (linked quest ID, optional)
 * @searchParams threadId:string (quest thread ID, optional)
 * @searchParams ritual:string ('true' for ritual mode, optional)
 * @searchParams preview:string ('1' for admin preview, optional)
 * @searchParams start:string (starting passage nodeId, optional)
 * @searchParams ref:string (campaign reference, optional)
 * @searchParams returnTo:string (return URL, optional)
 * @searchParams hexagram:string (hexagram ID for portal, optional)
 * @searchParams face:string (portal face, optional)
 * @relationships ADVENTURE (adventure), QUEST (linkedQuestId), CAMPAIGN (campaignRef)
 * @dimensions WHO:player, WHAT:adventure passage, WHERE:adventure, ENERGY:currentNodeId
 * @example /adventure/abc123/play?questId=quest-456&ref=bruised-banana&start=Node-1
 * @agentDiscoverable false
 *
 * Adventure-based play (Passage → Quest completion).
 * Used when a quest's thread has adventureId (e.g. from .twee import).
 * Reaching a completion passage (linkedQuestId + no choices) calls completeQuest.
 */
export default async function AdventurePlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    questId?: string
    threadId?: string
    ritual?: string
    preview?: string
    start?: string
    ref?: string
    returnTo?: string
    hexagram?: string
    face?: string
    spoke?: string
    kotterStage?: string
  }>
}) {
  const { id: adventureId } = await params
  const {
    questId,
    threadId,
    ritual,
    preview,
    start: startParam,
    ref: campaignRef,
    returnTo,
    hexagram,
    face: portalFace,
    spoke: spokeParam,
    kotterStage: kotterStageParam,
  } = await searchParams
  const hexagramId = hexagram ? parseInt(hexagram, 10) || undefined : undefined
  const spokeParsed =
    spokeParam !== undefined && spokeParam !== '' ? parseInt(spokeParam, 10) : NaN
  const portalSpokeIndex =
    Number.isFinite(spokeParsed) && spokeParsed >= 0 && spokeParsed <= 7
      ? spokeParsed
      : undefined
  const kotterParsed =
    kotterStageParam !== undefined && kotterStageParam !== ''
      ? parseInt(kotterStageParam, 10)
      : NaN
  const portalKotterStage = Number.isFinite(kotterParsed)
    ? Math.max(1, Math.min(8, kotterParsed))
    : undefined
  const isRitual = ritual === 'true'
  const isPreview = preview === '1'
  const player = await getCurrentPlayer()
  if (!player) {
    const u = new URLSearchParams()
    if (questId) u.set('questId', questId)
    if (threadId) u.set('threadId', threadId)
    if (ritual === 'true') u.set('ritual', 'true')
    if (preview === '1') u.set('preview', '1')
    if (startParam) u.set('start', startParam)
    if (campaignRef) u.set('ref', campaignRef)
    if (returnTo && isSafeAppPath(returnTo)) u.set('returnTo', returnTo)
    if (hexagram) u.set('hexagram', hexagram)
    if (portalFace) u.set('face', portalFace)
    if (spokeParam !== undefined && spokeParam !== '') u.set('spoke', spokeParam)
    if (kotterStageParam !== undefined && kotterStageParam !== '') u.set('kotterStage', kotterStageParam)
    const qs = u.toString()
    const back = qs ? `/adventure/${adventureId}/play?${qs}` : `/adventure/${adventureId}/play`
    redirect(`/login?returnTo=${encodeURIComponent(back)}`)
  }

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
          <Link href="/" className="text-zinc-500 hover:text-white text-sm">
            ← Back to dashboard
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

  // Resume from saved progress when the node still exists — unless this navigation is
  // CHS hub → spoke (`/campaign/spoke/:index` redirects with `spoke` + `start=Portal_N`).
  // The portal adventure shares one progress row per player; without this, finishing
  // (or idling on) a terminal / hub-only node makes every later spoke re-entry resume
  // there instead of at the correct Portal_* root.
  const progress = await getAdventureProgress(adventureId)
  const nodeIds = new Set(adventure.passages.map((p) => p.nodeId))
  const isChsHubSpokeEntry =
    portalSpokeIndex !== undefined &&
    !!startParam &&
    nodeIds.has(startParam)
  const effectiveStartNodeId = isChsHubSpokeEntry
    ? startParam
    : progress?.currentNodeId && nodeIds.has(progress.currentNodeId)
      ? progress.currentNodeId
      : startNodeId

  // Campaign instance: schools adventure + display name for hub context strip
  let schoolsAdventureId: string | null = null
  let campaignDisplayName: string | undefined
  if (campaignRef) {
    const instance = await db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { schoolsAdventureId: true, name: true },
    })
    schoolsAdventureId = instance?.schoolsAdventureId ?? null
    campaignDisplayName = instance?.name?.trim() || undefined
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link
            href={returnTo ?? (campaignRef ? `/campaign/hub?ref=${encodeURIComponent(campaignRef)}` : '/')}
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
          portalSpokeIndex={portalSpokeIndex}
          portalKotterStage={portalKotterStage}
          campaignDisplayName={campaignDisplayName}
        />
      </div>
    </div>
  )
}
