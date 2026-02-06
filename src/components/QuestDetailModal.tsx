'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { completeQuest, getArchetypeHandbookData } from '@/actions/quest-engine'
import { CastingRitual } from './CastingRitual'
import { generateQuestFromReading } from '@/actions/generate-quest'
import { useRouter } from 'next/navigation'
import { JOURNEY_SEQUENCE } from '@/lib/bars'
import { ArchetypeHandbookContent } from './conclave/ArchetypeHandbookContent'
import { VibulonTransfer } from './VibulonTransfer'
import { getTransferContext } from '@/actions/economy'

interface QuestDetailModalProps {
    isOpen: boolean
    onClose: () => void
    quest: {
        id: string // The CustomBar ID
        title: string
        description: string | null
        reward: number
        inputs?: string // JSON definition of inputs
        moveType?: string | null
    }
    context?: {
        packId?: string
        threadId?: string
    }
    // Pre-calculated state from parent
    isCompleted?: boolean
    isLocked?: boolean
    completedMoveTypes?: string[] // Optional: types already achieved by player
}

export function QuestDetailModal({ isOpen, onClose, quest, context, isCompleted, isLocked, completedMoveTypes }: QuestDetailModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)
    const [response, setResponse] = useState('')

    // Archetype Quest State
    const [archetypeData, setArchetypeData] = useState<any>(null)
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Transfer Quest State
    const [transferContext, setTransferContext] = useState<any>(null)

    // Handle initial data for specialized quests
    useEffect(() => {
        if (isOpen && quest.id === 'orientation-quest-2' && !isCompleted) {
            getArchetypeHandbookData().then(res => {
                if (res.success) setArchetypeData(res.playbook)
            })
        }
        if (isOpen && quest.id === 'orientation-quest-4' && !isCompleted) {
            getTransferContext().then(res => {
                if (res.success) setTransferContext(res)
            })
        }
        // Cleanup if closed
        if (!isOpen) {
            setHasScrolledToBottom(false)
            setArchetypeData(null)
            setTransferContext(null)
        }
    }, [isOpen, quest.id, isCompleted])

    // Detect Scroll for specialized quests
    const handleScroll = () => {
        if (!scrollContainerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        // If we're within 20px of the bottom, call it complete
        if (scrollHeight - scrollTop - clientHeight < 20) {
            setHasScrolledToBottom(true)
        }
    }

    if (!isOpen) return null

    const handleComplete = () => {
        if (isPending) return
        startTransition(async () => {
            const result = await completeQuest(quest.id, { response, autoTriggered: archetypeData ? true : false }, context)
            if (result.success) {
                setFeedback('✨ Quest Complete!')
                setTimeout(() => {
                    setFeedback(null)
                    onClose()
                }, 1500)
            } else {
                setFeedback(`❌ ${result.error}`)
            }
        })
    }

    const isArchetypeQuest = quest.id === 'orientation-quest-2'
    const isTransferQuest = quest.id === 'orientation-quest-4'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full ${isArchetypeQuest ? 'max-w-3xl' : 'max-w-lg'} bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">{quest.title}</h2>
                            <div className="flex gap-2 text-xs">
                                {isCompleted && (
                                    <span className="text-green-400 font-medium px-2 py-0.5 bg-green-900/30 rounded-full">
                                        ✓ Completed
                                    </span>
                                )}
                                {isLocked && (
                                    <span className="text-zinc-500 font-medium px-2 py-0.5 bg-zinc-800 rounded-full">
                                        🔒 Locked
                                    </span>
                                )}
                                {quest.moveType && (
                                    <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${quest.moveType === 'wakeUp' ? 'bg-yellow-900/30 text-yellow-400' :
                                        quest.moveType === 'cleanUp' ? 'bg-orange-900/30 text-orange-400' :
                                            quest.moveType === 'growUp' ? 'bg-green-900/30 text-green-400' :
                                                quest.moveType === 'showUp' ? 'bg-purple-900/30 text-purple-400' :
                                                    'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        {quest.moveType.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                )}
                                <span className="text-yellow-500 font-mono px-2 py-0.5 bg-yellow-900/20 rounded-full">
                                    +{quest.reward} ⓥ
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div
                    ref={scrollContainerRef}
                    onScroll={isArchetypeQuest ? handleScroll : undefined}
                    className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar"
                >
                    {/* Flow Violation Check */}
                    {quest.moveType && completedMoveTypes && !isCompleted && (() => {
                        const currentIdx = JOURNEY_SEQUENCE.indexOf(quest.moveType)
                        if (currentIdx > 0) {
                            const previousMove = JOURNEY_SEQUENCE[currentIdx - 1]
                            if (!completedMoveTypes.includes(previousMove)) {
                                return (
                                    <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3">
                                        <span className="text-xl">⚠️</span>
                                        <div className="text-xs text-red-200">
                                            <p className="font-bold uppercase tracking-tight text-[10px]">Sequence Warning</p>
                                            <p className="opacity-80">This is a <span className="text-red-400 font-bold">{quest.moveType.replace(/([A-Z])/g, ' $1').trim()}</span> move. It is recommended to complete a <span className="text-white font-bold">{previousMove.replace(/([A-Z])/g, ' $1').trim()}</span> quest first.</p>
                                        </div>
                                    </div>
                                )
                            }
                        }
                        return null
                    })()}

                    {/* Description (If regular quest or if not completed archetype/transfer) */}
                    {(!isArchetypeQuest && !isTransferQuest || isCompleted) && (
                        <div className="prose prose-invert prose-sm">
                            <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">
                                {quest.description?.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                                    const match = part.match(/\[(.*?)\]\((.*?)\)/)
                                    if (match) {
                                        return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">{match[1]}</a>
                                    }
                                    return part
                                })}
                            </p>
                        </div>
                    )}

                    {/* INTERACTIVE ARCHETYPE READER */}
                    {isArchetypeQuest && !isCompleted && (
                        <div className="animate-in fade-in duration-700">
                            {archetypeData ? (
                                <ArchetypeHandbookContent playbook={archetypeData} />
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="animate-spin text-3xl">✨</div>
                                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Synchronizing Identity...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INTERACTIVE VIBEULON TRANSFER */}
                    {isTransferQuest && !isCompleted && (
                        <div className="animate-in fade-in duration-700">
                            {transferContext ? (
                                <div className="space-y-6">
                                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center space-y-2">
                                        <div className="text-4xl">💎</div>
                                        <h3 className="text-white font-bold text-lg">Send your first Vibeulon</h3>
                                        <p className="text-zinc-500 text-sm">
                                            Vibeulons are gems of attention. Sending one to another player completes your initial convergence.
                                        </p>
                                    </div>
                                    <VibulonTransfer
                                        playerId={transferContext.playerId}
                                        balance={transferContext.balance}
                                        recipients={transferContext.recipients}
                                        onSuccess={() => {
                                            // Trigger is already handled in server action,
                                            // but we might want to refresh or wait a second
                                            setTimeout(() => router.refresh(), 1000)
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="animate-pulse text-3xl">💎</div>
                                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Opening Wallet...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Input (if not completed and not locked) */}
                    {!isCompleted && !isLocked && !isArchetypeQuest && !isTransferQuest && (
                        <div className="space-y-3">
                            {/* Check for Trigger in inputs */}
                            {quest.inputs?.includes('"trigger":"ICHING_CAST"') || quest.id === 'orientation-quest-3' ? (
                                <div className="bg-black/50 rounded-xl border border-zinc-800 p-4">
                                    <h4 className="text-center text-yellow-500 font-bold mb-4 uppercase tracking-[0.2em] text-xs">Consult the Oracle</h4>
                                    <CastingRitual
                                        mode="modal"
                                        onComplete={async (hexagramId) => {
                                            const result = await generateQuestFromReading(hexagramId)
                                            if (result.success) {
                                                setFeedback('✨ Wisdom Received & Quest Completed!')
                                                setTimeout(() => {
                                                    onClose()
                                                    router.refresh()
                                                }, 2000)
                                            } else {
                                                setFeedback(`❌ ${result.error}`)
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">
                                        Your Response
                                    </label>
                                    <textarea
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        placeholder="Reflect on your experience..."
                                        rows={3}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white placeholder:text-zinc-700 focus:border-purple-500/50 outline-none transition-all"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Feedback */}
                    {feedback && (
                        <div className={`text-center text-sm font-bold p-3 rounded-xl animate-in slide-in-from-bottom-2 ${feedback.includes('❌') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                            {feedback}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center gap-3 flex-shrink-0">
                    <div className="flex-1">
                        {isArchetypeQuest && !isCompleted && !hasScrolledToBottom && (
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
                                ↓ Scroll to read Handbook
                            </p>
                        )}
                        {isArchetypeQuest && !isCompleted && hasScrolledToBottom && (
                            <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest animate-in fade-in">
                                ✓ Content consumed
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
                        >
                            {isCompleted ? 'Done' : 'Cancel'}
                        </button>

                        {!isCompleted && !isLocked && (
                            <button
                                onClick={handleComplete}
                                // Disable for triggered quests (except archetype reader)
                                hidden={quest.inputs?.includes('"trigger":"ICHING_CAST"') ||
                                    quest.id === 'orientation-quest-3'}
                                disabled={isPending || (!isArchetypeQuest && !response.trim()) || (isArchetypeQuest && !hasScrolledToBottom)}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${isArchetypeQuest
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                                    } disabled:opacity-50 disabled:grayscale`}
                            >
                                {isPending ? 'Completing...' : (isArchetypeQuest ? 'Acknowledge' : 'Complete Quest')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
