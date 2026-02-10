'use client'

import { startThread, advanceThread, archiveThread } from '@/actions/quest-thread'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { QuestDetailModal } from './QuestDetailModal'

type ThreadQuest = {
    id: string
    questId: string
    position: number
    quest?: {
        id: string
        title: string
        description: string | null
        reward: number
        inputs?: string | null
        moveType?: string | null
        twineLogic?: string | null
    }
}

type ThreadProgress = {
    id: string
    currentPosition: number
    completedAt: Date | null
    isArchived: boolean
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
    currentQuest?: ThreadQuest | null
}

export function QuestThread({ thread, completedMoveTypes }: { thread: QuestThreadData, completedMoveTypes?: string[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedQuest, setSelectedQuest] = useState<ThreadQuest | null>(null)

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

    const handleArchive = () => {
        startTransition(async () => {
            await archiveThread(thread.id)
            router.refresh()
        })
    }

    const progressPercent = isComplete
        ? 100
        : thread.totalQuests > 0
            ? Math.round(((currentPos - 1) / thread.totalQuests) * 100)
            : 0

    return (
        <>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3 relative overflow-hidden">
                {/* Celebration Overlay */}
                {/* Celebration Overlay */}
                {isComplete && !progress?.isArchived && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 fade-in duration-500">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse"></div>
                            <div className="relative text-5xl mb-2">🏆</div>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Journey Complete</h3>
                        <p className="text-zinc-400 text-sm max-w-[200px] mx-auto leading-relaxed">
                            You have mastered the path of <span className="text-purple-400 font-bold">{thread.title}</span>.
                        </p>
                        <button
                            onClick={handleArchive}
                            disabled={isPending}
                            className="mt-6 px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50"
                        >
                            {isPending ? 'Claiming...' : 'Claim Victory'}
                        </button>
                    </div>
                )}

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
                <div className="space-y-2">
                    {thread.quests.slice(0, 5).map((tq, idx) => {
                        const pos = idx + 1
                        const isDone = pos < currentPos
                        const isCurrent = pos === currentPos
                        const isLocked = pos > currentPos

                        return (
                            <div
                                key={tq.id}
                                onClick={() => !isLocked && setSelectedQuest(tq)}
                                className={`flex items-center gap-3 text-sm p-3 rounded-lg border transition-all cursor-pointer ${isCurrent
                                    ? 'bg-purple-900/30 border-purple-500/50 text-purple-100 hover:bg-purple-900/40'
                                    : isDone
                                        ? 'bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                        : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 opacity-70 cursor-not-allowed'
                                    }`}
                            >
                                {/* Status Icon */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${isCurrent ? 'bg-purple-600 border-purple-400 text-white' :
                                    isDone ? 'bg-green-900 border-green-700 text-green-400' :
                                        'bg-zinc-800 border-zinc-700 text-zinc-600'
                                    }`}>
                                    {isDone ? '✓' : isCurrent ? pos : '🔒'}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <span className={`font-medium truncate ${isDone && 'line-through'}`}>
                                            {/* @ts-ignore - quest is joined */}
                                            {tq.quest?.title || `Quest ${pos}`}
                                        </span>
                                        {/* @ts-ignore */}
                                        {tq.quest?.reward > 0 && !isDone && (
                                            <span className="text-xs text-yellow-500 ml-2">
                                                {/* @ts-ignore */}
                                                +{tq.quest.reward}ⓥ
                                            </span>
                                        )}
                                    </div>
                                    {/* @ts-ignore */}
                                    {isCurrent && tq.quest?.description && (
                                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                                            {/* @ts-ignore */}
                                            {tq.quest.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {thread.totalQuests > 5 && (
                        <div className="text-xs text-zinc-600 pl-11">
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
                        ✓ Journey Archivied
                    </div>
                )}
            </div>

            {/* Modal */}
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
                    }}
                    context={{ threadId: thread.id }}
                    isCompleted={selectedQuest.position < currentPos}
                    isLocked={selectedQuest.position > currentPos}
                    completedMoveTypes={completedMoveTypes}
                />
            )}
        </>
    )
}
