'use client'

import { startThread, archiveThread } from '@/actions/quest-thread'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCampaignRef } from '@/lib/campaign-subcampaigns'
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
        twineStoryId?: string | null
        microTwine?: {
            htmlArtifact: string | null
            isDraft: boolean
        } | null
    }
}

import { CultivationCard } from '@/components/ui/CultivationCard'

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
    adventure?: { campaignRef: string; subcampaignDomain: string | null; slug: string } | null
}

export function QuestThread({ thread, completedMoveTypes, isSetupIncomplete, focusQuest, campaignDomainPreference = [], isAdmin }: { thread: QuestThreadData, completedMoveTypes?: string[], isSetupIncomplete?: boolean, focusQuest?: string, campaignDomainPreference?: string[], isAdmin?: boolean }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedQuest, setSelectedQuest] = useState<ThreadQuest | null>(null)
    const [expanded, setExpanded] = useState(false)

    // AUTO-OPEN: If focusQuest matches a quest in this thread, expand and open modal
    useEffect(() => {
        if (focusQuest) {
            const match = thread.quests.find(tq => tq.questId === focusQuest)
            if (match) {
                const progress = thread.playerProgress
                const currentPos = progress?.currentPosition || 0
                if (match.position <= currentPos) {
                    setExpanded(true)
                    setSelectedQuest(match)
                }
            }
        }
    }, [focusQuest, thread.quests, thread.playerProgress])

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
            <CultivationCard stage="growing" altitude="neutral" className="p-4 space-y-3 relative overflow-hidden transition-all duration-300">
                {/* Collapsed header - click to expand */}
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-left flex flex-col gap-2 focus:outline-none"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {thread.threadType === 'orientation' && (
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-900 text-purple-400 border border-purple-800 rounded-full font-bold uppercase tracking-widest">
                                        Ritual
                                    </span>
                                )}
                                <h3 className="font-bold text-white shadow-black drop-shadow-sm">{thread.title}</h3>
                            </div>
                            {thread.description && !expanded && (
                                <p className="text-sm text-zinc-300 line-clamp-1 opacity-90">{thread.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href={`/map?type=thread&threadId=${thread.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-zinc-300 hover:text-white transition-colors uppercase tracking-widest font-mono font-bold px-2 py-1 bg-black/40 rounded-full"
                            >
                                Map
                            </Link>
                            {thread.completionReward > 0 && (
                                <span className="text-xs bg-black/40 text-purple-300 px-2 py-1 flex items-center gap-1 rounded-full font-bold border border-purple-500/30">
                                    +{thread.completionReward} ♦
                                </span>
                            )}
                            <span className="text-zinc-500 text-sm">{expanded ? '▼' : '▶'}</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400 font-mono tracking-widest">
                        <span>{isComplete ? 'Complete!' : `${currentPos}/${thread.totalQuests}`}</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-black/40 border border-zinc-800 rounded-full overflow-hidden w-full relative">
                        <div
                            className={`absolute inset-y-0 left-0 transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </button>

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

                {/* Expanded content */}
                {expanded && (
                    <>
                        {thread.description && (
                            <p className="text-sm text-zinc-300 pt-3 mt-1 border-t border-white/10">{thread.description}</p>
                        )}
                        {isSetupIncomplete && thread.threadType === 'orientation' && (
                            <Link
                                href="/conclave/onboarding?ritual=true"
                                className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-500 hover:text-yellow-400 transition-colors bg-yellow-900/40 px-3 py-1.5 rounded border border-yellow-500/30"
                            >
                                ⚡ Enter Ritual to Unlock →
                            </Link>
                        )}

                        {thread.adventure && thread.totalQuests === 0 && (
                            <Link
                                href={`/campaign?ref=${getCampaignRef(thread.adventure!.campaignRef, thread.adventure!.subcampaignDomain)}`}
                                className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors bg-purple-900/40 px-3 py-1.5 rounded border border-purple-500/30"
                            >
                                Enter orientation →
                            </Link>
                        )}

                        {/* Quest Steps */}
                        <div className="space-y-2 mt-4">
                            {thread.quests.slice(0, 5).map((tq, idx) => {
                                const pos = idx + 1
                                const isDone = pos < currentPos
                                const isCurrent = pos === currentPos
                                const isLocked = pos > currentPos

                                return (
                                    <div
                                        key={tq.id}
                                        onClick={() => !isLocked && setSelectedQuest(tq)}
                                        className={`flex items-start md:items-center gap-3 text-sm p-3 rounded-xl border transition-all cursor-pointer ${isCurrent
                                            ? 'bg-purple-900/40 border-purple-500/50 text-purple-100 hover:bg-purple-900/60 shadow-lg shadow-purple-900/20'
                                            : isDone
                                                ? 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
                                                : 'bg-black/20 border-transparent text-zinc-500 opacity-60 cursor-not-allowed'
                                            }`}
                                    >
                                        {/* Status Icon */}
                                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border ${isCurrent ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' :
                                            isDone ? 'bg-green-900/50 border-green-500/50 text-green-400' :
                                                'bg-zinc-900 border-zinc-700 text-zinc-600'
                                            }`}>
                                            {isDone ? '✓' : isCurrent ? pos : '🔒'}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className={`font-bold truncate leading-tight mt-0.5 ${isDone ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                                    {/* @ts-ignore - quest is joined */}
                                                    {tq.quest?.title || `Quest ${pos}`}
                                                </span>
                                                {/* @ts-ignore */}
                                                {tq.quest?.reward > 0 && !isDone && (
                                                    <span className={`text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 ${isCurrent ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' : 'bg-black/40 text-yellow-500/70'}`}>
                                                        {/* @ts-ignore */}
                                                        +{tq.quest.reward}♦
                                                    </span>
                                                )}
                                            </div>
                                            {/* @ts-ignore */}
                                            {isCurrent && tq.quest?.description && (
                                                <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                                                    {/* @ts-ignore */}
                                                    {tq.quest.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {thread.totalQuests > 5 && (
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono pl-14 pt-2">
                                    +{thread.totalQuests - 5} more steps
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {!isStarted && !isComplete && !(thread.adventure && thread.totalQuests === 0) && (
                            <button
                                onClick={handleStart}
                                disabled={isPending}
                                className="w-full mt-4 bg-white hover:bg-zinc-200 text-black py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-lg shadow-white/5 active:scale-95"
                            >
                                {isPending ? 'Starting...' : thread.threadType === 'orientation' ? 'Enter Ritual' : 'Start Journey'}
                            </button>
                        )}

                        {isComplete && (
                            <div className="text-center text-green-400 text-[10px] uppercase tracking-widest font-mono font-bold py-3 mt-2 bg-green-900/10 rounded-lg border border-green-500/20">
                                ✓ Journey Archivied
                            </div>
                        )}
                    </>
                )}
            </CultivationCard>

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
                        twineStoryId: selectedQuest.quest.twineStoryId || null,
                        microTwine: selectedQuest.quest.microTwine || null,
                        status: (selectedQuest.quest as { status?: string }).status ?? null,
                        blockedKeyQuestTitle: (selectedQuest.quest as { blockedKeyQuestTitle?: string }).blockedKeyQuestTitle ?? null,
                    }}
                    context={{ threadId: thread.id, threadType: thread.threadType }}
                    isCompleted={selectedQuest.position < currentPos}
                    isLocked={selectedQuest.position > currentPos}
                    completedMoveTypes={completedMoveTypes}
                    campaignDomainPreference={campaignDomainPreference}
                    isAdmin={isAdmin}
                />
            )}
        </>
    )
}
