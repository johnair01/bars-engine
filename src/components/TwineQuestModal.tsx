'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { advanceRun, revertRun, getOrCreateRun, getTwineStoryForQuest, completeTwineRunForQuest } from '@/actions/twine'
import { logCertificationFeedback } from '@/actions/certification-feedback'
import { getWorldData } from '@/actions/onboarding'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ParsedTwineStory, ParsedPassage } from '@/lib/twine-parser'
import { OnboardingRecommendation } from './onboarding/OnboardingRecommendation'
import { AdminFeedbackInput } from './AdminFeedbackInput'

interface TwineQuestModalProps {
    isOpen: boolean
    onClose: () => void
    questId: string
    questTitle: string
    twineStoryId: string
    isCompleted?: boolean
    threadId?: string
    isRitual?: boolean
    isAdmin?: boolean
}

export function TwineQuestModal({ isOpen, onClose, questId, questTitle, twineStoryId, isCompleted, threadId, isRitual, isAdmin }: TwineQuestModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [story, setStory] = useState<ParsedTwineStory | null>(null)
    const [bindings, setBindings] = useState<any[]>([])
    const [nations, setNations] = useState<any[]>([])
    const [playbooks, setPlaybooks] = useState<any[]>([])
    const [currentPassageName, setCurrentPassageName] = useState<string | null>(null)
    const [visited, setVisited] = useState<string[]>([])
    const [emitted, setEmitted] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const [completed, setCompleted] = useState(isCompleted || false)
    const [loading, setLoading] = useState(true)
    const [feedbackText, setFeedbackText] = useState('')
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const [feedbackPending, setFeedbackPending] = useState(false)

    const feedbackStorageKey = questId ? `cert-feedback-${questId}` : null
    const prevPassageRef = useRef<string | null>(null)
    const isFeedbackPassage = currentPassageName === 'FEEDBACK'

    // Persist feedback text to sessionStorage so it survives unexpected navigations
    useEffect(() => {
        if (!feedbackStorageKey || !isFeedbackPassage) return
        try {
            if (feedbackText) {
                sessionStorage.setItem(feedbackStorageKey, feedbackText)
            } else {
                sessionStorage.removeItem(feedbackStorageKey)
            }
        } catch {
            /* ignore */
        }
    }, [feedbackStorageKey, isFeedbackPassage, feedbackText])

    // Restore feedbackText from sessionStorage when navigating TO FEEDBACK (user was kicked mid-typing)
    useEffect(() => {
        if (isFeedbackPassage && currentPassageName && prevPassageRef.current !== 'FEEDBACK') {
            setFeedbackSubmitted(false)
            setError(null)
            try {
                const saved = feedbackStorageKey ? sessionStorage.getItem(feedbackStorageKey) : null
                setFeedbackText(saved ?? '')
            } catch {
                setFeedbackText('')
            }
        }
        prevPassageRef.current = currentPassageName
    }, [currentPassageName, isFeedbackPassage, feedbackStorageKey])

    // Load story + run on open
    const loadRun = useCallback(async () => {
        if (!isOpen || !twineStoryId) return
        setLoading(true)
        setError(null)

        try {
            const [storyData, runData, worldData] = await Promise.all([
                getTwineStoryForQuest(twineStoryId),
                getOrCreateRun(twineStoryId, questId),
                getWorldData()
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

            const [n, p] = worldData
            setNations(n)
            setPlaybooks(p)

            const parsed = JSON.parse(storyData.parsedJson) as ParsedTwineStory
            setStory(parsed)
            setBindings((storyData as any).bindings || [])
            setCurrentPassageName(runData.run.currentPassageId)
            setVisited(JSON.parse(runData.run.visited))

            if (runData.run.completedAt) {
                setCompleted(true)
            }
        } catch (e) {
            console.error('[TwineQuestModal] Load failed:', e)
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
            const result = await advanceRun(twineStoryId, targetPassageName, questId, undefined, threadId, true)
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
                        if (result.redirect) {
                            router.push(result.redirect)
                        } else if (isRitual) {
                            router.push('/conclave/onboarding?ritual=true')
                        } else {
                            router.refresh()
                        }
                    }, 2500)
                } else if (result.redirect) {
                    // Immediate redirect if not a completion (special target like DASHBOARD)
                    onClose()
                    router.push(result.redirect)
                }
            }
        })
    }

    function handleBack() {
        if (visited.length <= 1) return
        const newVisited = [...visited]
        newVisited.pop() // Remove current
        const prevPassage = newVisited[newVisited.length - 1]

        setError(null)
        setFeedbackSubmitted(false)
        setFeedbackText('')

        startTransition(async () => {
            const result = await revertRun(twineStoryId, questId, undefined, true)
            if (result.error) {
                setError(result.error)
            } else {
                setVisited(newVisited)
                setCurrentPassageName(prevPassage)
            }
        })
    }

    async function handleFeedbackSubmit() {
        if (!questId || !feedbackText.trim()) return
        setError(null)
        setFeedbackPending(true)
        const feedbackSourceStep = visited.length >= 2 ? visited[visited.length - 2] : currentPassageName ?? 'FEEDBACK'
        const result = await logCertificationFeedback(questId, feedbackSourceStep, feedbackText.trim())
        setFeedbackPending(false)
        if (result.error) {
            setError(result.error)
        } else {
            setFeedbackSubmitted(true)
            try {
                if (feedbackStorageKey) sessionStorage.removeItem(feedbackStorageKey)
            } catch {
                /* ignore */
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal — stopPropagation prevents backdrop click from closing when clicking inside */}
            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
                        <div className="flex items-center gap-2 shrink-0">
                            {isAdmin && (
                                <Link
                                    href={`/admin/quests/${questId}`}
                                    className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 transition-colors"
                                    title="Edit quest config"
                                >
                                    Edit
                                </Link>
                            )}
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg">✕</button>
                        </div>
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
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-zinc-400 text-sm">You have finished this adventure.</p>
                                <div className="mt-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-full animate-bounce">
                                    <span className="text-green-400 font-bold text-sm">+1 ♦ Vibeulon Minted</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active passage */}
                    {currentPassage && !loading && !completed && (() => {
                        const isFeedbackPassage = currentPassage.name === 'FEEDBACK' || (currentPassage.tags && (currentPassage.tags as string[]).includes('feedback'))

                        if (isFeedbackPassage && questId) {
                            return (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">
                                        {currentPassage.name}
                                    </div>
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-base mb-4">
                                            {(currentPassage as { text?: string }).text ?? currentPassage.cleanText}
                                        </p>
                                    </div>
                                    {feedbackSubmitted ? (
                                        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                                            <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-center">
                                                <p className="text-green-400 font-bold">Thank you. Your feedback has been logged.</p>
                                                <p className="text-zinc-400 text-sm mt-1">The team will triage this as a bug to fix.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setFeedbackSubmitted(false)
                                                        setFeedbackText('')
                                                        setError(null)
                                                    }}
                                                    className="flex-1 py-3 bg-purple-600/80 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
                                                >
                                                    Report another issue
                                                </button>
                                                <button
                                                    onClick={handleBack}
                                                    disabled={isPending}
                                                    className="flex-1 py-3 text-zinc-500 hover:text-white text-sm font-medium transition-colors border border-zinc-800 rounded-xl hover:border-zinc-600"
                                                >
                                                    ← Back to Previous Step
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="cert-feedback-modal" className="block text-sm font-medium text-zinc-400 mb-2">
                                                    Describe what isn&apos;t working
                                                </label>
                                                <textarea
                                                    id="cert-feedback-modal"
                                                    value={feedbackText}
                                                    onChange={(e) => setFeedbackText(e.target.value)}
                                                    placeholder="e.g. The avatar didn't build when I clicked create character..."
                                                    rows={4}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                                />
                                            </div>
                                            {error && (
                                                <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg">{error}</div>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleFeedbackSubmit}
                                                    disabled={feedbackPending || !feedbackText.trim()}
                                                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {feedbackPending ? 'Submitting...' : 'Submit Feedback'}
                                                </button>
                                                <button
                                                    onClick={handleBack}
                                                    disabled={feedbackPending}
                                                    className="py-3 px-4 text-zinc-500 hover:text-white text-sm font-medium transition-colors border border-zinc-800 rounded-xl"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        const recommendationBinding = isEnd ? bindings.find(b =>
                            (b.actionType === 'SET_NATION' || b.actionType === 'SET_ARCHETYPE') &&
                            b.scopeId === currentPassage.name
                        ) : null

                        const recommendationPayload = recommendationBinding ? JSON.parse(recommendationBinding.payload) : null

                        return (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">
                                    {currentPassage.name}
                                </div>

                                {recommendationBinding ? (
                                    <OnboardingRecommendation
                                        type={recommendationBinding.actionType === 'SET_NATION' ? 'nation' : 'archetype'}
                                        recommendedId={recommendationPayload.nationId || recommendationPayload.playbookId}
                                        options={recommendationBinding.actionType === 'SET_NATION' ? nations : playbooks}
                                        questId={questId}
                                        threadId={threadId}
                                        isRitual={isRitual}
                                        onComplete={() => {
                                            setCompleted(true)
                                            startTransition(async () => {
                                                await completeTwineRunForQuest(twineStoryId, questId)
                                            })
                                        }}
                                    />
                                ) : (
                                    <>
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-base">
                                                {currentPassage.cleanText}
                                            </p>
                                        </div>

                                        {currentPassage.name === 'BATTLE_REPORT' && (
                                            <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
                                                <AdminFeedbackInput context={{ questId, storyId: twineStoryId }} />
                                            </div>
                                        )}

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
                                            <div className="text-center py-4 space-y-4">
                                                <p className="text-zinc-500 italic">End of story.</p>
                                                {visited.length > 1 && (
                                                    <button
                                                        onClick={handleBack}
                                                        className="text-xs text-zinc-500 hover:text-white underline underline-offset-4"
                                                    >
                                                        ← Back to Previous Step
                                                    </button>
                                                )}
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

                                                {visited.length > 1 && (
                                                    <button
                                                        onClick={handleBack}
                                                        disabled={isPending}
                                                        className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors"
                                                    >
                                                        ← Back to Previous Step
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )
                    })()}
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
