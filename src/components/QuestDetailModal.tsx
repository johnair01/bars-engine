'use client'

import { useState, useTransition } from 'react'
import { completeQuest } from '@/actions/quest-engine'

interface QuestDetailModalProps {
    isOpen: boolean
    onClose: () => void
    quest: {
        id: string // The CustomBar ID
        title: string
        description: string | null
        reward: number
        inputs?: string // JSON definition of inputs
    }
    context?: {
        packId?: string
        threadId?: string
    }
    // Pre-calculated state from parent
    isCompleted?: boolean
    isLocked?: boolean
}

export function QuestDetailModal({ isOpen, onClose, quest, context, isCompleted, isLocked }: QuestDetailModalProps) {
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

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <div className="prose prose-invert prose-sm">
                        <p className="text-zinc-300 text-base leading-relaxed">
                            {quest.description}
                        </p>
                    </div>

                    {/* Input (if not completed and not locked) */}
                    {!isCompleted && !isLocked && (
                        <div className="space-y-3">
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
