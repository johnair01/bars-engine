'use client'

import { startPack } from '@/actions/quest-pack'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

type PackQuest = {
    id: string
    questId: string
}

type PackProgress = {
    id: string
    completed: string // JSON array
    completedAt: Date | null
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

export function QuestPack({ pack }: { pack: QuestPackData }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

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

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
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
            <div className="grid grid-cols-5 gap-1">
                {pack.quests.map((quest) => {
                    const isDone = pack.completedQuestIds.includes(quest.questId)
                    return (
                        <div
                            key={quest.id}
                            className={`aspect-square rounded flex items-center justify-center text-xs ${isDone
                                    ? 'bg-green-900/50 text-green-400'
                                    : 'bg-zinc-800 text-zinc-600'
                                }`}
                        >
                            {isDone ? '✓' : '○'}
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

            {isComplete && (
                <div className="text-center text-green-400 text-sm font-medium py-2">
                    ✓ Pack Complete
                </div>
            )}
        </div>
    )
}
