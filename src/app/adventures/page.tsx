import { getCurrentPlayer } from '@/lib/auth'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { redirect } from 'next/navigation'
import { listPublishedStories } from '@/actions/twine'
import { getPlayerThreads } from '@/actions/quest-thread'
import { getPlayerDaemons } from '@/actions/daemons'
import { db } from '@/lib/db'
import Link from 'next/link'
import type { CustomBar, PlayerQuest } from '@prisma/client'
import { AdventureRestartButton } from '@/components/AdventureRestartButton'
import { derivePlayerMoveContext, MOVE_LABELS, MOVE_COLORS, type MoveType } from '@/lib/player-move-context'

function MoveBadge({ move, recommended, label }: { move: MoveType; recommended: boolean; label: string }) {
  const c = MOVE_COLORS[move]
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded ${c.badge}`}>
        {MOVE_LABELS[move]}
      </span>
      <span className={`text-[10px] uppercase tracking-widest ${recommended ? c.text : 'text-zinc-500'}`}>
        {label}
        {recommended ? ' ←' : ''}
      </span>
    </div>
  )
}

export default async function PlayPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const { isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })

  const [threads, daemons, stories] = await Promise.all([
    getPlayerThreads(),
    getPlayerDaemons(player.id),
    listPublishedStories(),
  ])

  // Campaigns: check if player is in any active campaign instance
  const campaignMembership = await db.instanceMembership.findFirst({
    where: { playerId: player.id },
    include: { instance: { select: { id: true, name: true, campaignRef: true } } },
  })
  const activeCampaign = campaignMembership?.instance ?? null

  // Active threads (not archived, not completed)
  const activeThreads = threads.filter(
    t => !t.playerProgress?.completedAt && !(t.playerProgress as { isArchived?: boolean } | null)?.isArchived
  )

  // Today's charge + completed move types (lightweight — for move context only)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const [todayCharge, completedQuestMoves] = await Promise.all([
    db.customBar.findFirst({
      where: { creatorId: player.id, type: 'charge_capture', createdAt: { gte: todayStart } },
      select: { id: true },
    }),
    db.playerQuest.findMany({
      where: { playerId: player.id, status: 'completed' },
      select: { quest: { select: { moveType: true } } },
    }),
  ])

  // Derive recommended move to promote contextually relevant container (G12, G17)
  const moveCtx = derivePlayerMoveContext({
    quests: completedQuestMoves.map((pq) => ({ status: 'completed', quest: { moveType: pq.quest.moveType } })),
    hasChargeToday: !!todayCharge,
    activeQuestCount: activeThreads.length,
    nationId: player.nation?.id ?? null,
    archetypeId: player.archetype?.id ?? null,
  })

  // Daemons that have been summoned (active summon) or are in progress
  const activeDaemons = daemons.filter(d => d.summons.length > 0)

  // Adventures (Twine stories)
  const storyQuests = await db.customBar.findMany({
    where: { twineStoryId: { in: stories.map(s => s.id) } },
    include: { assignments: { where: { playerId: player.id } } },
  })
  const certStoryIds = new Set(
    storyQuests.filter((q: CustomBar) => q.isSystem).map((q: CustomBar) => q.twineStoryId)
  )
  const visibleStories = isAdmin ? stories : stories.filter(s => !certStoryIds.has(s.id))


  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-10">

        <header>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Play</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Moves you can make right now</h1>
          <p className="text-sm text-zinc-500 mt-1">Shadow work, quest arcs, I Ching — pick a container and go.</p>
          {moveCtx.recommendedMoveType !== 'wakeUp' && (
            <p className="text-[11px] text-zinc-600 mt-1.5">
              Your current move:{' '}
              <span className={MOVE_COLORS[moveCtx.recommendedMoveType].text}>
                {MOVE_LABELS[moveCtx.recommendedMoveType]}
              </span>
              {' '}— relevant container highlighted below.
            </p>
          )}
        </header>

        {/* ── Shadow Work (Clean Up) ───────────────────────────────── */}
        <section className="space-y-3">
          <MoveBadge move="cleanUp" recommended={moveCtx.recommendedMoveType === 'cleanUp'} label="Shadow Work" />
          <Link
            href="/shadow/321"
            className={`flex items-center justify-between w-full bg-zinc-900/60 border hover:bg-zinc-900 rounded-2xl px-5 py-4 transition-all group ${moveCtx.recommendedMoveType === 'cleanUp' ? 'border-sky-800/60 hover:border-sky-600/70' : 'border-zinc-800 hover:border-purple-600/60'}`}
          >
            <div>
              <div className="font-semibold text-white group-hover:text-purple-200 transition-colors">321 Process</div>
              <div className="text-sm text-zinc-500 mt-0.5">Face it. Talk to it. Be it.</div>
            </div>
            <div className="text-zinc-600 group-hover:text-purple-400 transition-colors text-lg">→</div>
          </Link>
        </section>

        {/* ── Active Journeys (Show Up) ────────────────────────────── */}
        {activeThreads.length > 0 && (
          <section className="space-y-3">
            <MoveBadge move="showUp" recommended={moveCtx.recommendedMoveType === 'showUp'} label="Journeys" />
            <div className="space-y-2">
              {activeThreads.map(thread => {
                const currentQuest = thread.currentQuest
                const progress = thread.playerProgress
                const position = (progress?.currentPosition ?? 1)
                const total = thread.totalQuests

                return (
                  <Link
                    key={thread.id}
                    href={currentQuest ? `/quest/${currentQuest.quest.id}` : `/hand`}
                    className="flex items-center justify-between w-full bg-zinc-900/60 border border-zinc-800 hover:border-amber-600/40 hover:bg-zinc-900 rounded-2xl px-5 py-4 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-amber-200 transition-colors truncate">
                        {thread.title}
                      </div>
                      {currentQuest && (
                        <div className="text-sm text-zinc-500 mt-0.5 truncate">
                          Next: {currentQuest.quest.title}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {total > 1 && (
                        <div className="text-xs text-zinc-600 font-mono">{position}/{total}</div>
                      )}
                      <div className="text-zinc-600 group-hover:text-amber-400 transition-colors text-lg">→</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Daemon Work (Grow Up) ────────────────────────────────── */}
        {activeDaemons.length > 0 && (
          <section className="space-y-3">
            <MoveBadge move="growUp" recommended={moveCtx.recommendedMoveType === 'growUp'} label="Daemon Work" />
            <div className="space-y-2">
              {activeDaemons.map(daemon => (
                <Link
                  key={daemon.id}
                  href={`/daemons/${daemon.id}`}
                  className="flex items-center justify-between w-full bg-zinc-900/60 border border-zinc-800 hover:border-emerald-600/40 hover:bg-zinc-900 rounded-2xl px-5 py-4 transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white group-hover:text-emerald-200 transition-colors truncate">
                      {daemon.name}
                    </div>
                    <div className="text-sm text-zinc-500 mt-0.5">
                      {daemon.summons.length > 0 ? 'Summoned — work in progress' : 'Awaiting attention'}
                    </div>
                  </div>
                  <div className="text-zinc-600 group-hover:text-emerald-400 transition-colors text-lg ml-4">→</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Campaign field + stalls (Show Up) ─────────────────── */}
        {activeCampaign && (
          <section className="space-y-3">
            <MoveBadge move="showUp" recommended={false} label="Campaign" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={`/campaign/board?ref=${activeCampaign.campaignRef ?? ''}`}
                className="flex items-center justify-between w-full bg-zinc-900/60 border border-zinc-800 hover:border-teal-600/40 hover:bg-zinc-900 rounded-2xl px-5 py-4 transition-all group"
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-teal-200 transition-colors">
                    {activeCampaign.name}
                  </div>
                  <div className="text-sm text-zinc-500 mt-0.5">Featured field (deck)</div>
                </div>
                <div className="text-zinc-600 group-hover:text-teal-400 transition-colors text-lg">→</div>
              </Link>
              <Link
                href={`/campaign/marketplace?ref=${encodeURIComponent(activeCampaign.campaignRef ?? 'bruised-banana')}`}
                className="flex items-center justify-between w-full bg-zinc-900/60 border border-zinc-800 hover:border-teal-700/50 hover:bg-zinc-900 rounded-2xl px-5 py-4 transition-all group"
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-teal-200 transition-colors">
                    Campaign stalls
                  </div>
                  <div className="text-sm text-zinc-500 mt-0.5">List your BARs &amp; quests</div>
                </div>
                <div className="text-zinc-600 group-hover:text-teal-400 transition-colors text-lg">→</div>
              </Link>
            </div>
          </section>
        )}

        {/* ── Adventures — Twine (Grow Up) ─────────────────────────── */}
        {visibleStories.length > 0 && (
          <section className="space-y-3">
            <MoveBadge move="growUp" recommended={moveCtx.recommendedMoveType === 'growUp'} label="Adventures" />
            <div className="space-y-2">
              {visibleStories.map(story => {
                const quest = storyQuests.find((q: CustomBar) => q.twineStoryId === story.id)
                const assignment = quest?.assignments?.[0] as PlayerQuest | undefined
                const isCompleted = assignment?.status === 'completed'
                const isCertCompleted = quest?.isSystem && isCompleted

                const inner = (
                  <div className={`flex items-center justify-between w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 rounded-2xl px-5 py-4 transition-all group ${isCompleted ? 'opacity-40' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-zinc-100 transition-colors truncate">
                        {story.title}
                      </div>
                      <div className="text-sm text-zinc-500 mt-0.5 flex items-center gap-2">
                        {quest?.isSystem && (
                          <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">Certification</span>
                        )}
                        {isCompleted && <span className="text-green-600 text-[10px] uppercase font-bold">Complete</span>}
                        {!isCompleted && <span>Interactive story</span>}
                      </div>
                    </div>
                    <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-lg ml-4">→</div>
                  </div>
                )

                if (isCertCompleted && isAdmin) {
                  return (
                    <AdventureRestartButton key={story.id} questId={quest!.id} storyId={story.id} className="block w-full">
                      {inner}
                    </AdventureRestartButton>
                  )
                }
                return (
                  <Link
                    key={story.id}
                    href={quest ? `/adventures/${story.id}/play?questId=${quest.id}` : `/adventures/${story.id}/play`}
                    className="block"
                  >
                    {inner}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Empty state ──────────────────────────────────────────── */}
        {activeThreads.length === 0 && activeDaemons.length === 0 && !activeCampaign && visibleStories.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl space-y-3">
            <div className="text-3xl text-zinc-700">◯</div>
            <p className="text-zinc-500">No active moves yet.</p>
            <p className="text-zinc-600 text-sm">Start with the 321 process above — it will generate your first quest.</p>
          </div>
        )}

      </div>
    </div>
  )
}
