'use client'

import { useState, useTransition } from 'react'
import { completeQuest } from '@/actions/quest-engine'
import { CastingRitual } from './CastingRitual'
import { generateQuestFromReading } from '@/actions/generate-quest'
import { useRouter } from 'next/navigation'
import { JOURNEY_SEQUENCE } from '@/lib/bars'

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

    if (!isOpen) return null

    const handleComplete = () => {
        if (isPending) return
        startTransition(async () => {
            const result = await completeQuest(quest.id, { response }, context)
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
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

                {/* Flow Violation Check */}
                {quest.moveType && completedMoveTypes && !isCompleted && (() => {
                    const currentIdx = JOURNEY_SEQUENCE.indexOf(quest.moveType)
                    if (currentIdx > 0) {
                        const previousMove = JOURNEY_SEQUENCE[currentIdx - 1]
                        if (!completedMoveTypes.includes(previousMove)) {
                            return (
                                <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3">
                                    <span className="text-xl">⚠️</span>
                                    <div className="text-xs text-red-200">
                                        <p className="font-bold uppercase tracking-tight">Sequence Warning</p>
                                        <p className="opacity-80">This is a <span className="text-red-400 font-bold">{quest.moveType.replace(/([A-Z])/g, ' $1').trim()}</span> move. It is recommended to complete a <span className="text-white font-bold">{previousMove.replace(/([A-Z])/g, ' $1').trim()}</span> quest first.</p>
                                    </div>
                                </div>
                            )
                        }
                    }
                    return null
                })()}

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Description */}
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

                    {/* Special Handling for Meet Your Archetype */}
                    {quest.id === 'orientation-quest-2' && !isCompleted && (
                        <div className="bg-blue-900/20 border border-blue-900/50 rounded-xl p-4 text-center">
                            <p className="text-blue-300 text-sm mb-3">
                                This quest will complete automatically once you've explored your Archetype's handbook page.
                            </p>
                            <a
                                href="/archetype"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-transform hover:scale-105"
                            >
                                📖 Open Handbook Page ↗
                            </a>
                        </div>
                    )}

                    {/* Input (if not completed and not locked) */}
                    {!isCompleted && !isLocked && (
                        <div className="space-y-3">
                            {/* Check for Trigger in inputs */}
                            {quest.inputs?.includes('"trigger":"ICHING_CAST"') || quest.id === 'orientation-quest-3' ? (
                                <div className="bg-black/50 rounded-xl border border-zinc-800 p-4">
                                    <h4 className="text-center text-yellow-500 font-bold mb-4">Consult the Oracle</h4>
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
                            ) : quest.inputs?.includes('"trigger":"ARCHETYPE_VIEWED"') ? (
                                <div className="bg-zinc-800/50 rounded-xl p-4 text-center text-zinc-400 italic text-sm">
                                    Awaiting archetype synchronization...
                                </div>
                            ) : (
                                <>
                                    <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">
                                        Your Response
                                    </label>
                                    <textarea
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        placeholder="Reflect on your experience..."
                                        rows={3}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:border-purple-500 outline-none transition-colors"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Feedback */}
                    {feedback && (
                        <div className={`text-center text-sm font-bold p-2 rounded ${feedback.includes('❌') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                            {feedback}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Close
                    </button>

                    {!isCompleted && !isLocked && (
                        <button
                            onClick={handleComplete}
                            // Disable for triggered quests
                            hidden={quest.inputs?.includes('"trigger":"ICHING_CAST"') ||
                                quest.inputs?.includes('"trigger":"ARCHETYPE_VIEWED"') ||
                                quest.id === 'orientation-quest-3'}
                            disabled={isPending || !response.trim()}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-purple-900/20"
                        >
                            {isPending ? 'Completing...' : 'Complete Quest'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
