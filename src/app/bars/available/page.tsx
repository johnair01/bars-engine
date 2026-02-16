import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import Link from 'next/link'
import { assistStoryQuest, pickUpBar } from '@/actions/pick-up-bar'
import { StageIndicator } from '@/components/StageIndicator'
import { KOTTER_STAGES, KotterStage } from '@/lib/kotter'

function parseStoryMeta(raw: string | null) {
    if (!raw) {
        return {
            questSource: null as string | null,
            upperArchetypeId: null as string | null,
            lowerArchetypeId: null as string | null,
            cubeState: null as string | null,
        }
    }
    try {
        const parsed = JSON.parse(raw)
        return {
            questSource: typeof parsed.questSource === 'string' ? parsed.questSource : null,
            upperArchetypeId: typeof parsed.upperArchetypeId === 'string' ? parsed.upperArchetypeId : null,
            lowerArchetypeId: typeof parsed.lowerArchetypeId === 'string' ? parsed.lowerArchetypeId : null,
            cubeState: typeof parsed.cubeState === 'string' ? parsed.cubeState : null,
        }
    } catch {
        return {
            questSource: null as string | null,
            upperArchetypeId: null as string | null,
            lowerArchetypeId: null as string | null,
            cubeState: null as string | null,
        }
    }
}

export default async function AvailableBarsPage() {
    const currentPlayer = await getCurrentPlayer()

    if (!currentPlayer) {
        return <div className="p-8 text-center text-zinc-500">Access Denied</div>
    }

    // Get player with playbook (already have from getCurrentPlayer, but need playbook)
    const player = await db.player.findUnique({
        where: { id: currentPlayer.id },
        include: { playbook: true }
    })

    const globalState = await db.globalState.findUnique({
        where: { id: 'singleton' },
        select: { currentPeriod: true }
    })

    const alreadyAssignedOrCompleted = await db.playerQuest.findMany({
        where: {
            playerId: currentPlayer.id,
            status: { in: ['assigned', 'completed'] }
        },
        select: { questId: true }
    })
    const blockedQuestIds = alreadyAssignedOrCompleted.map(row => row.questId)

    // Get available bars
    const availableBars = await db.customBar.findMany({
        where: {
            status: 'active',
            visibility: 'public',
            claimedById: null,  // Not yet claimed (story clock quests remain null for multi-claim)
            id: { notIn: blockedQuestIds }
        },
        include: {
            creator: true
        },
        orderBy: { createdAt: 'desc' }
    })

    // Extract player's trigram from playbook name (e.g., "Heaven (Qian)" -> "Heaven")
    const playerTrigram = player?.playbook?.name.split(' ')[0] || null
    const currentPeriod = globalState?.currentPeriod || 1

    const currentStoryQuests = availableBars.filter((bar) => {
        const meta = parseStoryMeta(bar.completionEffects)
        return meta.questSource === 'story_clock' && (bar.periodGenerated || 1) === currentPeriod
    })

    const nonStoryAvailable = availableBars.filter((bar) => {
        const meta = parseStoryMeta(bar.completionEffects)
        return !(meta.questSource === 'story_clock' && (bar.periodGenerated || 1) === currentPeriod)
    })

    // Separate non-story into recommended (affinity match) and others
    const recommended: typeof nonStoryAvailable = []
    const others: typeof nonStoryAvailable = []

    nonStoryAvailable.forEach(bar => {
        const stage = bar.kotterStage as KotterStage
        const stageInfo = KOTTER_STAGES[stage]

        if (stageInfo && playerTrigram && stageInfo.trigram === playerTrigram) {
            recommended.push(bar)
        } else {
            others.push(bar)
        }
    })

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                    ←
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Available Commissions</h1>
                    <p className="text-zinc-500">
                        Quests awaiting a hero.
                        {playerTrigram && (
                            <span className="text-purple-400 ml-2">
                                ✨ Your affinity: {playerTrigram}
                            </span>
                        )}
                    </p>
                </div>
            </header>

            {/* Current Story Quests */}
            <section>
                <h2 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                    📦 Current Story Quests (Period {currentPeriod})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentStoryQuests.length === 0 ? (
                        <div className="col-span-full py-8 text-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
                            No current period story quests available to claim.
                        </div>
                    ) : (
                        currentStoryQuests.map((bar) => {
                            const meta = parseStoryMeta(bar.completionEffects)
                            const isEligible = !!player?.playbookId && (
                                meta.upperArchetypeId === player.playbookId ||
                                meta.lowerArchetypeId === player.playbookId
                            )
                            return (
                                <StoryQuestCard
                                    key={bar.id}
                                    bar={bar}
                                    canClaim={isEligible}
                                    cubeState={meta.cubeState}
                                />
                            )
                        })
                    )}
                </div>
            </section>

            {/* Recommended Section */}
            {recommended.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                        ✨ Recommended for You
                        <span className="text-xs font-normal text-zinc-500">
                            (Earn bonus Vibeulons!)
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommended.map(bar => (
                            <QuestCard key={bar.id} bar={bar} isAffinity={true} />
                        ))}
                    </div>
                </section>
            )}

            {/* All Other Quests */}
            <section>
                <h2 className="text-lg font-bold text-zinc-300 mb-4">
                    {recommended.length > 0 ? 'Other Quests' : 'All Quests'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {others.length === 0 && recommended.length === 0 ? (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                            <p className="text-zinc-500">No open commissions right now.</p>
                            <Link href="/create-bar" className="text-purple-400 hover:text-purple-300 font-bold mt-2 inline-block">
                                Post one yourself →
                            </Link>
                        </div>
                    ) : (
                        others.map(bar => (
                            <QuestCard key={bar.id} bar={bar} isAffinity={false} />
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}

interface QuestCardProps {
    bar: {
        id: string
        title: string
        description: string
        kotterStage: number
        creator: { name: string }
    }
    isAffinity: boolean
}

function QuestCard({ bar, isAffinity }: QuestCardProps) {
    const stageInfo = KOTTER_STAGES[bar.kotterStage as KotterStage]

    return (
        <div className={`
            bg-zinc-900 border rounded-xl overflow-hidden transition-colors
            ${isAffinity
                ? 'border-purple-800/50 hover:border-purple-600'
                : 'border-zinc-800 hover:border-zinc-700'
            }
        `}>
            <div className="p-5 space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white text-lg">{bar.title}</h3>
                        {isAffinity && (
                            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">
                                ✨ Affinity
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>From {bar.creator.name}</span>
                        <span>•</span>
                        <StageIndicator stage={bar.kotterStage} size="sm" showDetails={false} />
                    </div>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-3">
                    {bar.description}
                </p>

                {stageInfo && (
                    <div className="text-xs text-zinc-500">
                        {stageInfo.emoji} Stage {bar.kotterStage}: {stageInfo.name}
                    </div>
                )}

                <form action={async (formData) => {
                    'use server'
                    await pickUpBar(formData)
                }}>
                    <input type="hidden" name="barId" value={bar.id} />
                    <button className={`
                        w-full py-2 rounded-lg font-bold transition-all
                        ${isAffinity
                            ? 'bg-purple-900/40 border border-purple-700 text-purple-200 hover:bg-purple-900/60'
                            : 'bg-purple-900/30 border border-purple-800 text-purple-200 hover:bg-purple-900/50'
                        }
                    `}>
                        Accept Commission
                    </button>
                </form>
            </div>
        </div>
    )
}

function StoryQuestCard({
    bar,
    canClaim,
    cubeState,
}: {
    bar: {
        id: string
        title: string
        description: string
        creator: { name: string }
    }
    canClaim: boolean
    cubeState: string | null
}) {
    return (
        <div className="bg-zinc-900 border border-cyan-900/60 rounded-xl overflow-hidden">
            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-white text-lg">{bar.title}</h3>
                    <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded uppercase tracking-widest">
                        Story
                    </span>
                </div>

                <div className="text-xs text-zinc-500">
                    From {bar.creator.name}
                    {cubeState ? <span className="ml-2 text-zinc-400">• {cubeState}</span> : null}
                </div>

                <p className="text-sm text-zinc-400 line-clamp-4">{bar.description}</p>

                {canClaim ? (
                    <form action={async (formData) => {
                        'use server'
                        await pickUpBar(formData)
                    }}>
                        <input type="hidden" name="barId" value={bar.id} />
                        <button className="w-full py-2 rounded-lg font-bold transition-all bg-cyan-900/40 border border-cyan-700 text-cyan-200 hover:bg-cyan-900/60">
                            Accept Story Quest
                        </button>
                    </form>
                ) : (
                    <div className="space-y-2">
                        <form action={async (formData) => {
                            'use server'
                            await assistStoryQuest(formData)
                        }}>
                            <input type="hidden" name="barId" value={bar.id} />
                            <input type="hidden" name="assistNote" value={`Assist volunteered for ${bar.title}`} />
                            <button className="w-full py-2 rounded-lg font-bold transition-all bg-zinc-900 border border-zinc-600 text-zinc-200 hover:bg-zinc-800">
                                Send Assist Signal
                            </button>
                        </form>
                        <div className="w-full py-2 rounded-lg font-bold text-center bg-zinc-900 border border-zinc-700 text-zinc-400">
                            Assist Only (archetype not eligible to claim)
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
