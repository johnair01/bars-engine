'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { advanceRun, getOrCreateRun, getTwineStoryForQuest } from '@/actions/twine'
import { useRouter } from 'next/navigation'
import type { ParsedTwineStory, ParsedPassage } from '@/lib/twine-parser'

interface TwineQuestModalProps {
    isOpen: boolean
    onClose: () => void
    questId: string
    questTitle: string
    twineStoryId: string
    isCompleted?: boolean
}

export function TwineQuestModal({ isOpen, onClose, questId, questTitle, twineStoryId, isCompleted }: TwineQuestModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [story, setStory] = useState<ParsedTwineStory | null>(null)
    const [currentPassageName, setCurrentPassageName] = useState<string | null>(null)
    const [visited, setVisited] = useState<string[]>([])
    const [emitted, setEmitted] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const [completed, setCompleted] = useState(isCompleted || false)
    const [loading, setLoading] = useState(true)

    // Load story + run on open
    const loadRun = useCallback(async () => {
        if (!isOpen || !twineStoryId) return
        setLoading(true)
        setError(null)

        try {
            const [storyData, runData] = await Promise.all([
                getTwineStoryForQuest(twineStoryId),
                getOrCreateRun(twineStoryId, questId),
            ])

            if (!storyData) {
                setError('Story not found or not published.')
                setLoading(false)
                return
            }

            if ('error' in runData) {
                setError(runData.error || 'Unknown error')
                setLoading(false)
                return
            }

            const parsed = JSON.parse(storyData.parsedJson) as ParsedTwineStory
            setStory(parsed)
            setCurrentPassageName(runData.run.currentPassageId)
            setVisited(JSON.parse(runData.run.visited))

            if (runData.run.completedAt) {
                setCompleted(true)
            }
        } catch {
            setError('Failed to load adventure.')
        }
        setLoading(false)
    }, [isOpen, twineStoryId, questId])

    useEffect(() => {
        if (isOpen) {
            loadRun()
        } else {
            // Reset on close
            setStory(null)
            setCurrentPassageName(null)
            setVisited([])
            setEmitted([])
            setError(null)
        }
    }, [isOpen, loadRun])

    if (!isOpen) return null

    const currentPassage: ParsedPassage | undefined = story?.passages.find(
        p => p.name === currentPassageName
    )

    const isEnd = currentPassage ? currentPassage.links.length === 0 : false
    const progress = story ? Math.round((visited.length / story.passages.length) * 100) : 0

    function handleChoice(targetPassageName: string) {
        setError(null)
        setEmitted([])
        startTransition(async () => {
            const result = await advanceRun(twineStoryId, targetPassageName, questId)
            if (result.error) {
                setError(result.error)
            } else {
                setCurrentPassageName(targetPassageName)
                setVisited(prev => [...prev, targetPassageName])

                if (result.emitted && result.emitted.length > 0) {
                    setEmitted(result.emitted)
                }

                if (result.questCompleted) {
                    setCompleted(true)
                    setTimeout(() => {
                        onClose()
                        router.refresh()
                    }, 2500)
                }
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
                    <div className="flex justify-between items-center gap-4">
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-white truncate">{questTitle}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full font-bold">ADVENTURE</span>
                                {completed && (
                                    <span className="text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full font-bold">COMPLETED</span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg">✕</button>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-3">
                        <div
                            className={`h-full transition-all duration-500 ${completed ? 'bg-green-500' : 'bg-purple-600'}`}
                            style={{ width: `${completed ? 100 : progress}%` }}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {loading && (
                        <div className="py-16 text-center">
                            <div className="animate-spin text-3xl mb-3">📖</div>
                            <p className="text-zinc-500 text-sm">Loading adventure...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg">{error}</div>
                    )}

                    {/* Completed state */}
                    {completed && !loading && (
                        <div className="text-center py-8 space-y-4 animate-in fade-in">
                            <div className="text-5xl">🎉</div>
                            <h3 className="text-xl font-bold text-green-400">Quest Complete!</h3>
                            <p className="text-zinc-400 text-sm">You have finished this adventure.</p>
                        </div>
                    )}

                    {/* Active passage */}
                    {currentPassage && !loading && !completed && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">
                                {currentPassage.name}
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-base">
                                    {currentPassage.cleanText}
                                </p>
                            </div>

                            {/* Emitted items */}
                            {emitted.length > 0 && (
                                <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg animate-in slide-in-from-bottom-2">
                                    <p className="text-green-400 text-sm font-bold">Unlocked:</p>
                                    {emitted.map((e, i) => (
                                        <p key={i} className="text-green-300 text-sm mt-1">+ {e}</p>
                                    ))}
                                </div>
                            )}

                            {/* Choices */}
                            {isEnd ? (
                                <div className="text-center py-4">
                                    <p className="text-zinc-500 italic">End of story.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentPassage.links.map((link, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleChoice(link.target)}
                                            disabled={isPending}
                                            className="w-full text-left p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-600/50 hover:bg-zinc-800/50 transition-all disabled:opacity-50 group"
                                        >
                                            <span className="text-white group-hover:text-purple-400 transition-colors">
                                                {link.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
                    >
                        {completed ? 'Done' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    )
}
