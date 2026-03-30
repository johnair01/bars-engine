'use client'

import { startPack, archivePack } from '@/actions/quest-pack'
import { useRouter } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { QuestDetailModal } from './QuestDetailModal'

type PackQuest = {
    id: string
    questId: string
    quest?: {
        id: string
        title: string
        description: string | null
        reward: number
        inputs?: string | null
        moveType?: string | null
        twineLogic?: string | null
        twineStoryId?: string | null
        microTwine?: {
            htmlArtifact: string | null
            isDraft: boolean
        } | null
    }
}

import { CultivationCard } from '@/components/ui/CultivationCard'

type PackProgress = {
    id: string
    completed: string // JSON array
    completedAt: Date | null
    isArchived: boolean
}

type QuestPackData = {
    id: string
    title: string
    description: string | null
    creatorType: string
    quests: PackQuest[]
    playerProgress: PackProgress | null
    totalQuests: number
    completedCount: number
    completedQuestIds: string[]
}

export function QuestPack({ pack, completedMoveTypes, focusQuest, isAdmin }: { pack: QuestPackData, completedMoveTypes?: string[], focusQuest?: string, isAdmin?: boolean }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedQuest, setSelectedQuest] = useState<PackQuest | null>(null)
    const [expanded, setExpanded] = useState(false)

    // AUTO-OPEN: If focusQuest matches a quest in this pack, expand and open modal (defense in depth for refresh)
    useEffect(() => {
        if (focusQuest) {
            const match = pack.quests.find(pq => pq.questId === focusQuest)
            if (match) {
                setExpanded(true)
                setSelectedQuest(match)
            }
        }
    }, [focusQuest, pack.quests])

    const isComplete = pack.playerProgress?.completedAt !== null && pack.playerProgress?.completedAt !== undefined
    const isStarted = pack.playerProgress !== null
    const progressPercent = pack.totalQuests > 0
        ? Math.round((pack.completedCount / pack.totalQuests) * 100)
        : 0

    const handleStart = () => {
        startTransition(async () => {
            await startPack(pack.id)
            router.refresh()
        })
    }

    const handleArchive = () => {
        startTransition(async () => {
            await archivePack(pack.id)
            router.refresh()
        })
    }

    return (
        <CultivationCard stage="growing" altitude="neutral" className="p-4 space-y-3 relative overflow-hidden transition-all duration-300">
            {/* Collapsed header - click to expand */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left flex flex-col gap-2 focus:outline-none"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-white shadow-black drop-shadow-sm">{pack.title}</h3>
                        {pack.description && !expanded && (
                            <p className="text-sm text-zinc-300 line-clamp-1 opacity-90">{pack.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest bg-black/40 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                            Pack
                        </span>
                        <span className="text-zinc-400 text-sm ml-1">{expanded ? '▼' : '▶'}</span>
                    </div>
                </div>
                <div className="flex justify-between text-xs text-zinc-400 font-mono tracking-widest">
                    <span>{isComplete ? 'Complete!' : `${pack.completedCount}/${pack.totalQuests}`}</span>
                    <span>{progressPercent}%</span>
                </div>
                <div className="h-2 bg-black/40 border border-zinc-800 rounded-full overflow-hidden w-full relative">
                    <div
                        className={`absolute inset-y-0 left-0 transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </button>

            {/* Celebration Overlay */}
            {isComplete && !pack.playerProgress?.isArchived && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 fade-in duration-500">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                        <div className="relative text-5xl mb-2">💎</div>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Pack Complete</h3>
                    <p className="text-zinc-400 text-sm max-w-[200px] mx-auto leading-relaxed">
                        You have successfully collected all vibes in <span className="text-blue-400 font-bold">{pack.title}</span>.
                    </p>
                    <button
                        onClick={handleArchive}
                        disabled={isPending}
                        className="mt-6 px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? 'Archiving...' : 'Archive Pack'}
                    </button>
                </div>
            )}

            {/* Expanded content */}
            {expanded && (
                <>
                    {pack.description && (
                        <p className="text-sm text-zinc-300 pt-3 mt-1 border-t border-white/10">{pack.description}</p>
                    )}

                    {/* Quest Grid */}
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        {pack.quests.map((pq) => {
                            const isDone = pack.completedQuestIds.includes(pq.questId)
                            return (
                                <div
                                    key={pq.id}
                                    onClick={() => setSelectedQuest(pq)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isDone
                                        ? 'bg-green-900/20 border-green-500/30 opacity-70'
                                        : 'bg-black/30 border-white/10 hover:border-blue-500/30 hover:bg-black/50 shadow-sm shadow-black/20'
                                        }`}
                                >
                                    <div className={`w-6 h-6 shrink-0 rounded flex items-center justify-center text-xs border ${isDone
                                        ? 'bg-green-600/30 text-green-400 border-green-500/50'
                                        : 'bg-black/50 text-zinc-500 border-zinc-700'
                                        }`}>
                                        {isDone ? '✓' : '○'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center text-sm gap-2">
                                            <span className={`font-bold truncate leading-tight mt-0.5 ${isDone ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                                {/* @ts-ignore */}
                                                {pq.quest?.title || 'Unknown Quest'}
                                            </span>
                                            {/* @ts-ignore */}
                                            {!isDone && pq.quest?.reward > 0 && (
                                                <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-black/40 text-yellow-500/80 border border-yellow-900/30 shrink-0">
                                                    {/* @ts-ignore */}
                                                    +{pq.quest.reward}♦
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Actions */}
                    {!isStarted && !isComplete && (
                        <button
                            onClick={handleStart}
                            disabled={isPending}
                            className="w-full mt-4 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-lg shadow-white/5 active:scale-95"
                        >
                            {isPending ? 'Starting...' : 'Open Pack'}
                        </button>
                    )}

                    <div className="space-y-2 pt-3 mt-1 border-t border-white/10">
                        {/* @ts-ignore */}
                        {pack.isCreator && (
                            <button
                                onClick={() => {
                                    // Dynamic import or pass action props?
                                    // Better to import at top, but for now assuming we can add it.
                                    // We'll add the import in a separate edit or let auto-import handle it?
                                    // No, must be explicit.
                                    // We will add the import 'recyclePack' from '@/actions/market'
                                    import('@/actions/market').then(({ recyclePack }) => {
                                        startTransition(async () => {
                                            await recyclePack(pack.id)
                                            // Feedback?
                                            alert('Pack recycled to Town Square!')
                                        })
                                    })
                                }}
                                className="w-full bg-black/40 hover:bg-black/60 text-zinc-400 py-2.5 rounded-xl text-xs font-bold font-mono tracking-widest uppercase border border-zinc-800 transition-colors"
                            >
                                ♻ Recycle to Market
                            </button>
                        )}
                    </div>
                </>
            )}

            {selectedQuest?.quest && (
                <QuestDetailModal
                    isOpen={!!selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    quest={{
                        id: selectedQuest.quest.id,
                        title: selectedQuest.quest.title,
                        description: selectedQuest.quest.description,
                        reward: selectedQuest.quest.reward || 1,
                        inputs: selectedQuest.quest.inputs || '[]',
                        moveType: selectedQuest.quest.moveType || null,
                        twineLogic: selectedQuest.quest.twineLogic || null,
                        twineStoryId: selectedQuest.quest.twineStoryId || null,
                        microTwine: selectedQuest.quest.microTwine || null,
                        status: (selectedQuest.quest as { status?: string }).status ?? null,
                        blockedKeyQuestTitle: (selectedQuest.quest as { blockedKeyQuestTitle?: string }).blockedKeyQuestTitle ?? null,
                    }}
                    context={{ packId: pack.id }}
                    isCompleted={pack.completedQuestIds.includes(selectedQuest.questId)}
                    completedMoveTypes={completedMoveTypes}
                    isAdmin={isAdmin}
                />
            )}
        </CultivationCard>
    )
}
