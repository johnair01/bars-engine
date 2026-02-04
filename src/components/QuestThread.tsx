'use client'

import { startThread, advanceThread } from '@/actions/quest-thread'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

type ThreadQuest = {
    id: string
    questId: string
    position: number
}

type ThreadProgress = {
    id: string
    currentPosition: number
    completedAt: Date | null
}

type QuestThreadData = {
    id: string
    title: string
    description: string | null
    threadType: string
    completionReward: number
    quests: ThreadQuest[]
    playerProgress: ThreadProgress | null
    totalQuests: number
    currentQuest?: ThreadQuest | null  // Allow undefined
}

export function QuestThread({ thread }: { thread: QuestThreadData }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const progress = thread.playerProgress
    const currentPos = progress?.currentPosition || 0
    const isComplete = progress?.completedAt !== null && progress?.completedAt !== undefined
    const isStarted = currentPos > 0

    const handleStart = () => {
        startTransition(async () => {
            await startThread(thread.id)
            router.refresh()
        })
    }

    const progressPercent = isComplete
        ? 100
        : thread.totalQuests > 0
            ? Math.round(((currentPos - 1) / thread.totalQuests) * 100)
            : 0

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-white">{thread.title}</h3>
                    {thread.description && (
                        <p className="text-sm text-zinc-400">{thread.description}</p>
                    )}
                </div>
                {thread.completionReward > 0 && (
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full">
                        +{thread.completionReward} ⓥ
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-500">
                    <span>{isComplete ? 'Complete!' : `${currentPos}/${thread.totalQuests}`}</span>
                    <span>{progressPercent}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Quest Steps */}
            <div className="space-y-1">
                {thread.quests.slice(0, 5).map((quest, idx) => {
                    const pos = idx + 1
                    const isDone = pos < currentPos
                    const isCurrent = pos === currentPos
                    const isLocked = pos > currentPos

                    return (
                        <div
                            key={quest.id}
                            className={`flex items-center gap-2 text-sm py-1 px-2 rounded ${isCurrent ? 'bg-purple-900/30 text-purple-300' :
                                isDone ? 'text-zinc-500 line-through' :
                                    'text-zinc-600'
                                }`}
                        >
                            <span className="w-5 text-center">
                                {isDone ? '✓' : isCurrent ? '→' : isLocked ? '🔒' : '○'}
                            </span>
                            <span>Step {pos}</span>
                        </div>
                    )
                })}
                {thread.totalQuests > 5 && (
                    <div className="text-xs text-zinc-600 pl-7">
                        +{thread.totalQuests - 5} more steps
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isStarted && !isComplete && (
                <button
                    onClick={handleStart}
                    disabled={isPending}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                    {isPending ? 'Starting...' : 'Start Journey'}
                </button>
            )}

            {isComplete && (
                <div className="text-center text-green-400 text-sm font-medium py-2">
                    ✓ Journey Complete
                </div>
            )}
        </div>
    )
}
