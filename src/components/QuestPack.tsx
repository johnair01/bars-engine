'use client'

import { startPack, archivePack } from '@/actions/quest-pack'
import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { QuestDetailModal } from './QuestDetailModal'

type PackQuest = {
    id: string
    questId: string
    quest?: { title: string, reward: number }
}

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

export function QuestPack({ pack, completedMoveTypes, ichingEnabled = true }: { pack: QuestPackData, completedMoveTypes?: string[], ichingEnabled?: boolean }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedQuest, setSelectedQuest] = useState<PackQuest | null>(null)

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
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3 relative overflow-hidden">
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

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-white">{pack.title}</h3>
                    {pack.description && (
                        <p className="text-sm text-zinc-400">{pack.description}</p>
                    )}
                </div>
                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">
                    Pack
                </span>
            </div>

            {/* Progress */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-500">
                    <span>{isComplete ? 'Complete!' : `${pack.completedCount}/${pack.totalQuests}`}</span>
                    <span>{progressPercent}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Quest Grid */}
            <div className="grid grid-cols-1 gap-2">
                {pack.quests.map((pq) => {
                    const isDone = pack.completedQuestIds.includes(pq.questId)
                    return (
                        <div
                            key={pq.id}
                            onClick={() => setSelectedQuest(pq)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isDone
                                ? 'bg-green-900/10 border-green-900/30 opacity-70'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30 hover:bg-zinc-800'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs border ${isDone
                                ? 'bg-green-900 text-green-400 border-green-700'
                                : 'bg-zinc-800 text-zinc-600 border-zinc-700'
                                }`}>
                                {isDone ? '✓' : '○'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center text-sm">
                                    <span className={`font-medium truncate text-zinc-300 ${isDone && 'line-through text-zinc-500'}`}>
                                        {/* @ts-ignore */}
                                        {pq.quest?.title || 'Unknown Quest'}
                                    </span>
                                    {/* @ts-ignore */}
                                    {!isDone && pq.quest?.reward > 0 && (
                                        <span className="text-xs text-yellow-500 font-mono">
                                            {/* @ts-ignore */}
                                            +{pq.quest.reward}ⓥ
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
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                    {isPending ? 'Starting...' : 'Open Pack'}
                </button>
            )}

            <div className="space-y-2">
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
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-2 rounded-lg text-xs"
                    >
                        ♻ Recycle to Market
                    </button>
                )}
            </div>

            {selectedQuest?.quest && (
                <QuestDetailModal
                    isOpen={!!selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    quest={{
                        // @ts-ignore
                        id: selectedQuest.quest!.id,
                        // @ts-ignore
                        title: selectedQuest.quest!.title,
                        // @ts-ignore
                        description: selectedQuest.quest!.description,
                        // @ts-ignore
                        reward: selectedQuest.quest!.reward || 1,
                    }}
                    context={{ packId: pack.id }}
                    isCompleted={pack.completedQuestIds.includes(selectedQuest.questId)}
                    completedMoveTypes={completedMoveTypes}
                    ichingEnabled={ichingEnabled}
                />
            )}
        </div>
    )
}
