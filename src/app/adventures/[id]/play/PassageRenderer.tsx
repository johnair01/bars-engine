'use client'

import { useTransition, useState } from 'react'
import { advanceRun } from '@/actions/twine'
import { useRouter } from 'next/navigation'
import type { ParsedPassage } from '@/lib/twine-parser'
import { OnboardingRecommendation } from '@/components/onboarding/OnboardingRecommendation'
import { QuestInputs } from '@/components/QuestInputs'

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
    isRitual
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [emitted, setEmitted] = useState<string[]>([])
    const [inputValues, setInputValues] = useState<Record<string, any>>({})
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    function handleEnd() {
        if (!questId) {
            router.push('/adventures')
            return
        }

        setError(null)

        // Validation: Check for required inputs
        if (quest?.inputs) {
            const inputList = typeof quest.inputs === 'string' ? JSON.parse(quest.inputs) : quest.inputs
            for (const input of inputList) {
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
            }, { threadId })

            if (result && 'error' in result) {
                setError(result.error)
            } else {
                setIsSuccess(true)
                // AUTO-ADVANCE: Instead of just refreshing, push to the controller
                // to evaluate the next step and transition immediately.
                if (questId) {
                    const ritualParam = isRitual ? '?ritual=true' : ''
                    router.push(isRitual ? `/conclave/onboarding${ritualParam}` : '/')
                } else {
                    router.refresh()
                }
            }
        })
    }

    function handleContinue() {
        const ritualParam = isRitual ? '?ritual=true' : ''
        router.push(isRitual ? `/conclave/onboarding${ritualParam}` : '/')
    }

    function handleChoice(targetPassageName: string) {
        setError(null)
        setEmitted([])
        startTransition(async () => {
            const result = await advanceRun(storyId, targetPassageName, questId)
            if (result.error) {
                setError(result.error)
            } else {
                if (result.emitted && result.emitted.length > 0) {
                    setEmitted(result.emitted)
                }
                if (result.questCompleted) {
                    // Quest auto-completed! Redirect after brief pause
                    setTimeout(() => {
                        if (result.redirect) {
                            router.push(result.redirect)
                        } else if (isRitual) {
                            router.push('/conclave/onboarding?ritual=true')
                        } else {
                            router.push('/')
                        }
                    }, 1500)
                } else if (result.redirect) {
                    router.push(result.redirect)
                } else {
                    router.refresh()
                }
            }
        })
    }

    // Check for inputs tag
    const showInputs = isEnd || (passage.tags && passage.tags.includes('inputs'))

    // Check for onboarding recommendation bindings if we are at an END passage
    const recommendationBinding = isEnd ? bindings.find(b =>
        (b.actionType === 'SET_NATION' || b.actionType === 'SET_ARCHETYPE') &&
        b.scopeId === passage.name
    ) : null

    const recommendationPayload = recommendationBinding ? JSON.parse(recommendationBinding.payload) : null

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Passage name */}
            <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">{passage.name}</div>

            {/* Recommendation UI or Standard Passage */}
            {recommendationBinding ? (
                <OnboardingRecommendation
                    type={recommendationBinding.actionType === 'SET_NATION' ? 'nation' : 'archetype'}
                    recommendedId={recommendationPayload.nationId || recommendationPayload.playbookId}
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
                    {/* Passage content */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8">
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-lg">
                            {passage.cleanText}
                        </p>
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
                        <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg">{error}</div>
                    )}

                    {/* Quest Inputs (Inline if tagged, or at end) */}
                    {showInputs && quest?.inputs && !isSuccess && (
                        <div className="text-left bg-zinc-900 border-2 border-purple-500/20 p-6 rounded-xl space-y-4 animate-in zoom-in-95 duration-300">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Required Action</h3>
                            <QuestInputs
                                inputs={quest.inputs}
                                values={inputValues}
                                onChange={(key, val) => setInputValues(v => ({ ...v, [key]: val }))}
                            />
                            {!isEnd && (
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
                    {isEnd ? (
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
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {passage.links.map((link, i) => (
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
                </>
            )}
        </div>
    )
}
