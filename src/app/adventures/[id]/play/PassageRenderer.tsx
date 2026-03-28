'use client'

import { useTransition, useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { advanceRun, revertRun } from '@/actions/twine'
import { useRouter } from 'next/navigation'
import type { ParsedPassage } from '@/lib/twine-parser'
import { OnboardingRecommendation } from '@/components/onboarding/OnboardingRecommendation'
import { QuestInputs } from '@/components/QuestInputs'
import { chunkIntoSlides } from '@/lib/slide-chunker'
import { Avatar } from '@/components/Avatar'
import { isCertificationQuestId } from '@/lib/certification-quest'
import { CopyableProse } from '@/components/ui/CopyableProse'
import { CopyTextButton } from '@/components/ui/CopyTextButton'
import { buildOnboardingUrl, isSafeAppPath } from '@/lib/safe-return-to'

interface Props {
    storyId: string
    passage: ParsedPassage
    isEnd: boolean
    bindings: any[]
    nations: any[]
    playbooks: any[]
    questId?: string
    quest?: any
    threadId?: string
    isRitual?: boolean
    /** Same-origin path to land on after onboarding when Twine step completes */
    postOnboardingReturnTo?: string
    feedbackSourceStep?: string
    player?: { name: string; avatarConfig?: string | null; pronouns?: string | null }
    avatarPreviewConfig?: string | null
    isAdmin?: boolean
}

export function PassageRenderer({
    storyId,
    passage,
    isEnd,
    bindings,
    nations,
    playbooks,
    questId,
    quest,
    threadId,
    isRitual,
    postOnboardingReturnTo,
    feedbackSourceStep,
    player,
    avatarPreviewConfig,
    isAdmin = false,
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [emitted, setEmitted] = useState<string[]>([])
    const [inputValues, setInputValues] = useState<Record<string, any>>({})
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [feedbackText, setFeedbackText] = useState('')
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const [feedbackPending, setFeedbackPending] = useState(false)
    const [slideIndex, setSlideIndex] = useState(0)
    const [overridePassage, setOverridePassage] = useState<ParsedPassage | null>(null)
    const [overrideVisited, setOverrideVisited] = useState<string[] | null>(null)
    const router = useRouter()

    function postTwineDestination(): string {
        if (postOnboardingReturnTo && isSafeAppPath(postOnboardingReturnTo)) {
            return buildOnboardingUrl({ returnTo: postOnboardingReturnTo, ritual: !!isRitual })
        }
        if (isRitual) return buildOnboardingUrl({ ritual: true })
        return '/'
    }

    const displayPassage = overridePassage ?? passage
    const isFeedbackPassage = displayPassage.name === 'FEEDBACK' || (displayPassage.tags && displayPassage.tags.includes('feedback'))
    const allowCertFeedback = isCertificationQuestId(questId) || isAdmin
    const effectiveFeedbackSourceStep =
        isFeedbackPassage && overrideVisited && overrideVisited.length >= 2
            ? overrideVisited[overrideVisited.length - 2]
            : feedbackSourceStep
    const prevPassageRef = useRef<string | null>(null)
    const feedbackStorageKey = questId ? `cert-feedback-${questId}` : null

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

    // Reset feedback form when navigating TO FEEDBACK from another passage (multi-report flow)
    // Restore feedbackText from sessionStorage if user was kicked mid-typing
    useEffect(() => {
        if (isFeedbackPassage && prevPassageRef.current !== 'FEEDBACK') {
            setFeedbackSubmitted(false)
            setError(null)
            try {
                const saved = feedbackStorageKey ? sessionStorage.getItem(feedbackStorageKey) : null
                setFeedbackText(saved ?? '')
            } catch {
                setFeedbackText('')
            }
        }
        prevPassageRef.current = displayPassage.name
    }, [displayPassage.name, isFeedbackPassage, feedbackStorageKey])

    // Reset slide index when passage changes
    useEffect(() => {
        setSlideIndex(0)
    }, [displayPassage.name])

    // Parse inputs safely
    let parsedInputs: any[] = []
    if (quest?.inputs) {
        try {
            parsedInputs = typeof quest.inputs === 'string' ? JSON.parse(quest.inputs) : quest.inputs
            if (!Array.isArray(parsedInputs)) parsedInputs = []
        } catch (e) {
            parsedInputs = []
        }
    }
    const hasActualInputs = parsedInputs.length > 0

    function handleEnd() {
        if (!questId) {
            router.push('/adventures')
            return
        }

        setError(null)

        // If there are no actual inputs, the end passage auto-completes. 
        // Do not call completeQuest again.
        if (!hasActualInputs) {
            setIsSuccess(true)
            router.push(postTwineDestination())
            return
        }

        // Validation: Check for required inputs
        if (hasActualInputs) {
            for (const input of parsedInputs) {
                if (input.required && (!inputValues[input.key] || inputValues[input.key].trim() === '')) {
                    setError(`${input.label} is required.`)
                    return
                }
            }
        }

        startTransition(async () => {
            const { completeQuest } = await import('@/actions/quest-engine')
            // Pass the input values to the completion engine
            const result = await completeQuest(questId, {
                twineCompleted: true,
                ...inputValues
            }, { threadId, source: 'twine_end' })

            if (result && 'error' in result) {
                setError(result.error)
            } else {
                setIsSuccess(true)
                // AUTO-ADVANCE: Instead of just refreshing, push to the controller
                // to evaluate the next step and transition immediately.
                if (questId) {
                    router.push(postTwineDestination())
                } else {
                    router.refresh()
                }
            }
        })
    }

    function handleContinue() {
        router.push(postTwineDestination())
    }

    function handleChoice(targetPassageName: string) {
        setError(null)
        setEmitted([])
        startTransition(async () => {
            const skipRevalidate = targetPassageName === 'FEEDBACK'
            const result = await advanceRun(storyId, targetPassageName, questId, undefined, threadId, skipRevalidate)
            if ('error' in result) {
                setError(result.error ?? null)
            } else {
                if (result.emitted && result.emitted.length > 0) {
                    setEmitted(result.emitted)
                }
                if (result.questCompleted) {
                    setOverridePassage(null)
                    setOverrideVisited(null)
                    setTimeout(() => {
                        if (result.redirect) {
                            router.push(result.redirect)
                        } else {
                            router.push(postTwineDestination())
                        }
                    }, 1500)
                } else if (result.redirect) {
                    setOverridePassage(null)
                    setOverrideVisited(null)
                    router.push(result.redirect)
                } else if (targetPassageName === 'FEEDBACK' && result.passage) {
                    setOverridePassage(result.passage as ParsedPassage)
                    if (result.visited) setOverrideVisited(result.visited)
                    // Skip router.refresh() — prevents kick-to-dashboard (report-feedback-stability)
                } else {
                    setOverridePassage(null)
                    router.refresh()
                }
            }
        })
    }

    function handleBack() {
        setError(null)
        startTransition(async () => {
            const skipRevalidate = displayPassage.name === 'FEEDBACK'
            const result = await revertRun(storyId, questId, undefined, skipRevalidate)
            if ('error' in result) {
                setError(result.error ?? null)
            } else if (skipRevalidate && result.passage) {
                setOverridePassage(result.passage as ParsedPassage)
                if (result.visited) setOverrideVisited(result.visited)
                // Skip router.refresh() — prevents kick-to-dashboard (report-feedback-stability)
            } else {
                setOverridePassage(null)
                setOverrideVisited(null)
                router.refresh()
            }
        })
    }

    const displayIsEnd = !displayPassage.links || displayPassage.links.length === 0
    const showInputs = hasActualInputs && (displayIsEnd || (displayPassage.tags && displayPassage.tags.includes('inputs')))

    // Check for onboarding recommendation bindings if we are at an END passage
    const recommendationBinding = displayIsEnd ? bindings.find(b =>
        (b.actionType === 'SET_NATION' || b.actionType === 'SET_ARCHETYPE') &&
        b.scopeId === displayPassage.name
    ) : null

    const recommendationPayload = recommendationBinding ? JSON.parse(recommendationBinding.payload) : null

    const rawContent = (displayPassage as { text?: string }).text ?? displayPassage.cleanText
    const slides = chunkIntoSlides(rawContent)
    const useSlideMode = slides.length > 1
    const displayContent = useSlideMode ? slides[slideIndex] : rawContent
    const primaryLink = displayPassage.links?.find((l) => l.target !== 'FEEDBACK')
    const secondaryLinks = useSlideMode && primaryLink ? displayPassage.links?.filter((l) => l.target === 'FEEDBACK') ?? [] : displayPassage.links ?? []

    async function handleFeedbackSubmit() {
        if (!questId || !feedbackText.trim()) return
        setError(null)
        setFeedbackPending(true)
        try {
            const res = await fetch('/api/feedback/cert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questId,
                    passageName: effectiveFeedbackSourceStep ?? displayPassage.name,
                    feedback: feedbackText.trim()
                })
            })
            const data = (await res.json()) as { success?: boolean; error?: string }
            if (!res.ok) {
                setError(data.error ?? 'Failed to submit feedback')
            } else {
                setFeedbackSubmitted(true)
                try {
                    if (feedbackStorageKey) sessionStorage.removeItem(feedbackStorageKey)
                } catch {
                    /* ignore */
                }
            }
        } catch {
            setError('Failed to submit feedback')
        } finally {
            setFeedbackPending(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Passage name */}
            <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">{displayPassage.name}</div>

            {/* Feedback passage (Report Issue branch) — certification quests + admin only */}
            {isFeedbackPassage && questId && !allowCertFeedback ? (
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8">
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Issue reporting is enabled for certification quests only. See{' '}
                            <Link href="/docs" className="text-purple-400 hover:text-purple-300 underline">
                                documentation
                            </Link>{' '}
                            for help.
                        </p>
                    </div>
                    <button
                        onClick={handleBack}
                        disabled={isPending}
                        className="w-full py-3 text-zinc-500 hover:text-white text-sm font-medium transition-colors border border-zinc-800 rounded-xl hover:border-zinc-600"
                    >
                        ← Back to Previous Step
                    </button>
                </div>
            ) : isFeedbackPassage && questId ? (
                <div className="space-y-6">
                    <CopyableProse
                        textToCopy={rawContent}
                        copyAriaLabel="Copy passage text"
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8"
                    >
                        <ReactMarkdown
                            components={{
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                                        {children}
                                    </a>
                                )
                            }}
                        >
                            {(displayPassage as { text?: string }).text ?? displayPassage.cleanText}
                        </ReactMarkdown>
                    </CopyableProse>
                    {feedbackSubmitted ? (
                        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                            <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-center space-y-2">
                                <div className="flex justify-end">
                                    <CopyTextButton
                                        text={
                                            'Thank you. Your feedback has been logged.\n\nThe team will triage this as a bug to fix.'
                                        }
                                        aria-label="Copy confirmation message"
                                    />
                                </div>
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
                                <label htmlFor="cert-feedback" className="block text-sm font-medium text-zinc-400 mb-2">
                                    Describe what isn&apos;t working
                                </label>
                                <textarea
                                    id="cert-feedback"
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="e.g. The homepage CTA didn't link to /campaign..."
                                    rows={4}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                />
                            </div>
                            {error && (
                                <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg flex justify-end items-start gap-2">
                                    <p className="flex-1 min-w-0">{error}</p>
                                    <CopyTextButton text={error} aria-label="Copy error message" />
                                </div>
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
            ) : questId === 'build-character-quest' && player && (avatarPreviewConfig || player.avatarConfig) ? (
                <>
                    {/* Avatar preview for Build Your Character */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                            <Avatar
                                player={{
                                    name: player.name,
                                    avatarConfig: avatarPreviewConfig ?? player.avatarConfig ?? undefined,
                                    pronouns: player.pronouns
                                }}
                                size="lg"
                            />
                            <div>
                                <p className="text-zinc-300 font-medium">Your character</p>
                                <p className="text-zinc-500 text-sm">Derived from your nation and archetype</p>
                            </div>
                        </div>
                        <CopyableProse
                            textToCopy={rawContent}
                            copyAriaLabel="Copy passage text"
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8 prose prose-invert prose-lg max-w-none"
                        >
                            <ReactMarkdown
                                components={{
                                    a: ({ href, children }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                                            {children}
                                        </a>
                                    )
                                }}
                            >
                                {(displayPassage as { text?: string }).text ?? displayPassage.cleanText}
                            </ReactMarkdown>
                        </CopyableProse>
                        <div className="space-y-3">
                            {displayPassage.links?.map((link, i) => (
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
                            <button
                                onClick={handleBack}
                                disabled={isPending}
                                className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors"
                            >
                                ← Back to Previous Step
                            </button>
                        </div>
                    </div>
                </>
            ) : recommendationBinding ? (
                <OnboardingRecommendation
                    type={recommendationBinding.actionType === 'SET_NATION' ? 'nation' : 'archetype'}
                    recommendedId={recommendationPayload.nationId || recommendationPayload.archetypeId}
                    options={recommendationBinding.actionType === 'SET_NATION' ? nations : playbooks}
                    questId={questId}
                    threadId={threadId}
                    isRitual={isRitual}
                    onComplete={() => {
                        // After confirmation, we can show a success state or just rely on router.refresh()
                        // which is already handled in handleConfirm
                    }}
                />
            ) : (
                <>
                    {/* Passage content — use text for markdown links, fallback to cleanText; slide mode for long text */}
                    <div className="space-y-4">
                                <CopyableProse
                                    textToCopy={displayContent}
                                    copyAriaLabel={useSlideMode ? 'Copy visible passage text' : 'Copy passage text'}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8 prose prose-invert prose-lg max-w-none"
                                >
                                    <ReactMarkdown
                                        components={{
                                            a: ({ href, children }) => (
                                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                                                    {children}
                                                </a>
                                            )
                                        }}
                                    >
                                        {displayContent}
                                    </ReactMarkdown>
                                </CopyableProse>
                                {useSlideMode && (
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                                if (slideIndex < slides.length - 1) {
                                                    setSlideIndex((i) => i + 1)
                                                } else {
                                                    const primaryLink = displayPassage.links.find((l) => l.target !== 'FEEDBACK')
                                                    if (primaryLink) handleChoice(primaryLink.target)
                                                }
                                            }}
                                            disabled={isPending}
                                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50 transition-colors"
                                        >
                                            Continue
                                        </button>
                                        {slideIndex > 0 && (
                                            <button
                                                onClick={() => setSlideIndex((i) => i - 1)}
                                                className="py-2 px-4 text-zinc-500 hover:text-white text-sm font-medium transition-colors"
                                            >
                                                ← Back
                                            </button>
                                        )}
                                    </div>
                                )}
                    </div>

                    {/* Emitted items notification (Filtered for polish) */}
                    {emitted.filter(e => !e.toLowerCase().includes('recommendation:')).length > 0 && (
                        <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg animate-in slide-in-from-bottom-2">
                            <p className="text-green-400 text-sm font-bold">Unlocked:</p>
                            {emitted
                                .filter(e => !e.toLowerCase().includes('recommendation:'))
                                .map((e, i) => (
                                    <p key={i} className="text-green-300 text-sm mt-1">+ {e}</p>
                                ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl space-y-3">
                            <div className="flex justify-end items-start gap-2">
                                <p className="text-red-400 text-sm flex-1 min-w-0">{error}</p>
                                <CopyTextButton text={error} aria-label="Copy error message" />
                            </div>
                            {error.includes('gameboard') && (
                                <Link
                                    href="/campaign/board?ref=bruised-banana"
                                    className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Complete on gameboard →
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Quest Inputs (Inline if tagged, or at end) */}
                    {showInputs && !isSuccess && (
                        <div className="text-left bg-zinc-900 border-2 border-purple-500/20 p-6 rounded-xl space-y-4 animate-in zoom-in-95 duration-300">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Required Action</h3>
                            <QuestInputs
                                inputs={parsedInputs}
                                values={inputValues}
                                onChange={(key, val) => setInputValues(v => ({ ...v, [key]: val }))}
                            />
                            {!displayIsEnd && (
                                <button
                                    onClick={handleEnd}
                                    disabled={isPending}
                                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-xl shadow-purple-900/40 uppercase tracking-widest text-sm"
                                >
                                    {isPending ? 'Advancing...' : 'Submit & Continue'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Choices or End View */}
                    {displayIsEnd ? (
                        <div className="text-center space-y-6 pt-4 border-t border-zinc-800/50">
                            <div className="space-y-4">
                                {isSuccess && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-xl text-center">
                                            <p className="text-green-400 font-bold text-lg">✨ Quest Completed!</p>
                                            <p className="text-green-300/70 text-sm mt-1">Synchronizing your path...</p>
                                        </div>
                                    </div>
                                )}
                                {!isSuccess && (
                                    <>
                                        <p className="text-zinc-500 italic">End of story.</p>
                                        <div className="flex flex-col items-center gap-4">
                                            <button
                                                onClick={handleEnd}
                                                disabled={isPending}
                                                className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition shadow-lg shadow-purple-900/40 font-bold uppercase tracking-widest text-sm disabled:opacity-50 min-w-[200px]"
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    {isPending ? (
                                                        <>
                                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            <span>Saving...</span>
                                                        </>
                                                    ) : (
                                                        <span>{questId ? 'Continue Journey' : 'Finish Story'}</span>
                                                    )}
                                                </div>
                                            </button>

                                            <button
                                                onClick={handleBack}
                                                disabled={isPending}
                                                className="text-xs text-zinc-500 hover:text-white underline underline-offset-4"
                                            >
                                                ← Back to Previous Step
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {secondaryLinks.map((link, i) => (
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

                            <button
                                onClick={handleBack}
                                disabled={isPending}
                                className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors"
                            >
                                ← Back to Previous Step
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
