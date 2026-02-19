'use client'

import { useState, useTransition, useEffect, useRef, useActionState } from 'react'
import { completeQuest, getArchetypeHandbookData } from '@/actions/quest-engine'
import { CastingRitual } from './CastingRitual'
import { generateQuestFromReading } from '@/actions/generate-quest'
import { useRouter } from 'next/navigation'
import { JOURNEY_SEQUENCE } from '@/lib/bars'
import { ArchetypeHandbookContent } from './conclave/ArchetypeHandbookContent'
import { VibulonTransfer } from './VibulonTransfer'
import { getTransferContext } from '@/actions/economy'
import { QuestInputs, BarInput } from './QuestInputs'
import { QuestTwinePlayer } from './QuestTwinePlayer'
import { TwineQuestModal } from './TwineQuestModal'
import { TwineLogic } from '@/lib/twine-engine'
import { DEFAULT_INTENTION_INPUTS, INTENTION_GUIDED_TWINE_LOGIC } from '@/lib/intention-guided-journey'
import Link from 'next/link'
import { applyNationMoveWithState, getNationMovePanelData, moveQuestToGraveyard, type NationMovePanelData, type ApplyNationMoveState } from '@/actions/nation-moves'

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
        twineLogic?: string | null // JSON string of TwineLogic
        twineStoryId?: string | null // Reference to uploaded TwineStory
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

function parseQuestInputs(inputs?: string): BarInput[] {
    if (!inputs) return []
    try {
        const parsed = JSON.parse(inputs)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function parseTwineLogic(twineLogic?: string | null): TwineLogic | null {
    if (!twineLogic) return null
    try {
        return JSON.parse(twineLogic) as TwineLogic
    } catch {
        return null
    }
}

export function QuestDetailModal({ isOpen, onClose, quest, context, isCompleted, isLocked, completedMoveTypes }: QuestDetailModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [intentionMode, setIntentionMode] = useState<'direct' | 'guided'>('direct')

    // Nation moves / graveyard state
    const [movePanel, setMovePanel] = useState<NationMovePanelData | null>(null)
    const [selectedMoveKey, setSelectedMoveKey] = useState<string>('')
    const [moveApplyState, moveApplyAction, isApplyingMove] = useActionState<ApplyNationMoveState | null, FormData>(
        applyNationMoveWithState,
        null
    )

    // Archetype Quest State
    const [archetypeData, setArchetypeData] = useState<any>(null)
    const [archetypeError, setArchetypeError] = useState<string | null>(null)
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Transfer Quest State
    const [transferContext, setTransferContext] = useState<any>(null)

    // Handle initial data for specialized quests
    useEffect(() => {
        if (isOpen && quest.id === 'orientation-quest-2' && !isCompleted) {
            getArchetypeHandbookData().then(res => {
                if (res.success) {
                    setArchetypeData(res.playbook)
                } else {
                    console.error('[QuestDetailModal] Archetype fetch failed:', res.error)
                    setArchetypeError(res.error || 'Failed to load archetype')
                }
            }).catch(err => {
                console.error('[QuestDetailModal] Archetype fetch exception:', err)
                setArchetypeError('Network error loading archetype')
            })
        }
        if (isOpen && quest.id === 'orientation-quest-4' && !isCompleted) {
            getTransferContext().then(res => {
                if (res.success) setTransferContext(res)
            })
        }

        if (isOpen) {
            // Best-effort: if nation move tables haven't been pushed yet, this returns an error payload.
            getNationMovePanelData(quest.id).then((res) => {
                setMovePanel(res)
                if ('success' in res && res.success) {
                    const firstUsable = res.moves.find(m => m.unlocked && m.applicable)
                    setSelectedMoveKey(firstUsable?.key || '')
                }
            }).catch(() => {
                setMovePanel({ error: 'Failed to load nation moves' })
            })
        }

        // Cleanup if closed
        if (!isOpen) {
            setHasScrolledToBottom(false)
            setArchetypeData(null)
            setArchetypeError(null)
            setTransferContext(null)
            setMovePanel(null)
            setSelectedMoveKey('')
        }
    }, [isOpen, quest.id, isCompleted])

    useEffect(() => {
        if (!moveApplyState) return
        if ('ok' in moveApplyState && moveApplyState.ok) {
            setFeedback('✨ Move applied!')
            setTimeout(() => {
                setFeedback(null)
                router.refresh()
            }, 1200)
            return
        }
        if ('error' in moveApplyState && moveApplyState.error) {
            setFeedback(`❌ ${moveApplyState.error}`)
        }
    }, [moveApplyState, router])

    useEffect(() => {
        if (!isOpen) {
            setResponses({})
            setFeedback(null)
            setIntentionMode('direct')
        }
    }, [isOpen, quest.id])

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

    // If quest is backed by an uploaded TwineStory, render the dedicated modal
    if (quest.twineStoryId) {
        return (
            <TwineQuestModal
                isOpen={isOpen}
                onClose={onClose}
                questId={quest.id}
                questTitle={quest.title}
                twineStoryId={quest.twineStoryId}
                isCompleted={isCompleted}
            />
        )
    }

    const handleComplete = () => {
        if (isPending) return
        startTransition(async () => {
            const result = await completeQuest(quest.id, { ...responses, autoTriggered: archetypeData ? true : false }, context)
            if ('success' in result && result.success) {
                setFeedback('✨ Quest Complete!')
                setTimeout(() => {
                    setFeedback(null)
                    onClose()
                }, 1500)
            } else {
                setFeedback(`❌ ${'error' in result ? result.error : 'Failed to complete quest'}`)
            }
        })
    }

    const isArchetypeQuest = quest.id === 'orientation-quest-2'
    const isTransferQuest = quest.id === 'orientation-quest-4'
    const isIntentionQuest = quest.id === 'orientation-quest-1'

    const parsedInputs = parseQuestInputs(quest.inputs)
    const effectiveInputs: BarInput[] = isIntentionQuest && parsedInputs.length === 0
        ? [...DEFAULT_INTENTION_INPUTS] as unknown as BarInput[]
        : parsedInputs

    const parsedTwineLogic = parseTwineLogic(quest.twineLogic)
    const effectiveTwineLogic: TwineLogic | null = isIntentionQuest
        ? parsedTwineLogic || INTENTION_GUIDED_TWINE_LOGIC
        : parsedTwineLogic

    const showingGuidedIntention = isIntentionQuest && intentionMode === 'guided'
    const shouldRenderTwine = !!effectiveTwineLogic
        && !isCompleted
        && !isLocked
        && !isArchetypeQuest
        && !isTransferQuest
        && (!isIntentionQuest || showingGuidedIntention)

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

                    {!isCompleted && !isLocked && (
                        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Vibes Emergency</p>
                                <p className="text-xs text-cyan-100/80">Blocked emotionally? Run a first-aid protocol and come back.</p>
                            </div>
                            <Link
                                href={`/emotional-first-aid?questId=${encodeURIComponent(quest.id)}&returnTo=%2F`}
                                className="shrink-0 rounded-lg border border-cyan-700/60 bg-cyan-900/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-800/40 transition-colors"
                            >
                                Open Kit →
                            </Link>
                        </div>
                    )}

                    {/* Intention Quest: Direct vs Guided Path */}
                    {isIntentionQuest && !isCompleted && !isLocked && (
                        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Choose your path</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIntentionMode('direct')}
                                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${intentionMode === 'direct'
                                        ? 'border-purple-500 bg-purple-900/30 text-purple-100'
                                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-semibold">Write intention directly</div>
                                    <div className="text-xs text-zinc-500 mt-1">I already know what I want to commit to.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIntentionMode('guided')}
                                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${intentionMode === 'guided'
                                        ? 'border-emerald-500 bg-emerald-900/20 text-emerald-100'
                                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-semibold">Need help figuring it out?</div>
                                    <div className="text-xs text-zinc-500 mt-1">Use a guided journey to discover an intention.</div>
                                </button>
                            </div>
                        </div>
                    )}

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

                    {/* NATION MOVES + GRAVEYARD (MVP) */}
                    {movePanel && (
                        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                            {'error' in movePanel ? (
                                <div className="text-xs text-zinc-500">
                                    Nation moves unavailable: {movePanel.error}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Nation Moves</div>
                                            <div className="text-sm text-zinc-200 font-semibold">
                                                {movePanel.nation.name} (Quest status: {movePanel.quest.status})
                                            </div>
                                        </div>

                                        {movePanel.canMoveToGraveyard && movePanel.quest.status === 'active' && !isCompleted && (
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                onClick={() => startTransition(async () => {
                                                    const ok = confirm('Move this quest to the Graveyard (DORMANT)?')
                                                    if (!ok) return
                                                    const res = await moveQuestToGraveyard(quest.id, true)
                                                    if ('success' in res) {
                                                        setFeedback('🪦 Moved to Graveyard')
                                                        setTimeout(() => {
                                                            onClose()
                                                            router.refresh()
                                                        }, 800)
                                                    } else {
                                                        setFeedback(`❌ ${res.error}`)
                                                    }
                                                })}
                                                className="shrink-0 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-red-300 hover:border-red-900/50 transition-colors disabled:opacity-50"
                                            >
                                                Graveyard
                                            </button>
                                        )}
                                    </div>

                                    {movePanel.moves.length === 0 ? (
                                        <div className="text-xs text-zinc-500 italic">
                                            No nation moves available for this nation yet.
                                        </div>
                                    ) : (
                                        <form action={moveApplyAction} className="space-y-3">
                                            <input type="hidden" name="questId" value={quest.id} />

                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Move</label>
                                                <select
                                                    name="moveKey"
                                                    value={selectedMoveKey}
                                                    onChange={(e) => setSelectedMoveKey(e.target.value)}
                                                    className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                                                >
                                                    <option value="">Select a move...</option>
                                                    {movePanel.moves.map((m) => (
                                                        <option key={m.key} value={m.key} disabled={!m.unlocked}>
                                                            {m.unlocked ? '' : '[LOCKED] '} {m.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedMoveKey && (() => {
                                                const move = movePanel.moves.find(m => m.key === selectedMoveKey)
                                                if (!move) return null

                                                return (
                                                    <div className="space-y-3">
                                                        <div className="text-xs text-zinc-400">
                                                            {move.description}
                                                        </div>

                                                        {!move.unlocked && (
                                                            <div className="text-xs text-red-300">
                                                                This move is locked.
                                                            </div>
                                                        )}

                                                        {!move.applicable && (
                                                            <div className="text-xs text-amber-300">
                                                                Not applicable to status "{movePanel.quest.status}". Applies to: {move.appliesToStatus.join(', ') || '(any)'}.
                                                            </div>
                                                        )}

                                                        {move.requirements.fields.map((f) => (
                                                            <div key={f.key} className="space-y-1">
                                                                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                                                    {f.label || f.key}
                                                                </label>
                                                                {f.type === 'player_id' ? (
                                                                    <select
                                                                        name={f.key}
                                                                        className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                                                                        required={f.required !== false}
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {movePanel.collaborators.map((p) => (
                                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        name={f.key}
                                                                        type="text"
                                                                        required={f.required !== false}
                                                                        maxLength={f.maxLength}
                                                                        className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}

                                                        <button
                                                            type="submit"
                                                            disabled={!move.unlocked || !move.applicable || isApplyingMove}
                                                            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 font-bold text-white text-sm disabled:opacity-50"
                                                        >
                                                            {isApplyingMove ? 'Applying...' : 'Apply Move'}
                                                        </button>
                                                    </div>
                                                )
                                            })()}
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* TWINE NARRATIVE ENGINE */}
                    {shouldRenderTwine && effectiveTwineLogic && (
                        <QuestTwinePlayer
                            logic={effectiveTwineLogic}
                            onComplete={(vars) => {
                                const mergedResponses = { ...responses, ...vars }

                                if (isIntentionQuest && !mergedResponses.intention) {
                                    setFeedback('❌ Guided journey completed but intention was not captured. Please try again.')
                                    return
                                }

                                setResponses(mergedResponses)
                                startTransition(async () => {
                                    const result = await completeQuest(quest.id, mergedResponses, context)
                                    if ('success' in result && result.success) {
                                        setFeedback('✨ Quest Complete!')
                                        setTimeout(() => {
                                            setFeedback(null)
                                            onClose()
                                        }, 1500)
                                    } else {
                                        setFeedback(`❌ ${'error' in result ? result.error : 'Failed to complete quest'}`)
                                    }
                                })
                            }}
                        />
                    )}

                    {/* INTERACTIVE ARCHETYPE READER */}
                    {isArchetypeQuest && !isCompleted && (
                        <div className="animate-in fade-in duration-700">
                            {archetypeData ? (
                                <ArchetypeHandbookContent playbook={archetypeData} />
                            ) : archetypeError ? (
                                <div className="py-20 text-center space-y-4">
                                    <div className="text-3xl">⚠️</div>
                                    <p className="text-red-400 font-mono text-xs uppercase tracking-widest">
                                        {archetypeError}
                                    </p>
                                    <p className="text-zinc-600 text-xs">
                                        Your playbook may not be assigned yet. Try completing character setup first.
                                    </p>
                                </div>
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
                    {!isCompleted && !isLocked && !isArchetypeQuest && !isTransferQuest && !shouldRenderTwine && (
                        <div className="space-y-3">
                            {/* Check for Trigger in inputs */}
                            {effectiveInputs.some(input => input.trigger === 'ICHING_CAST') || quest.id === 'orientation-quest-3' ? (
                                <div className="bg-black/50 rounded-xl border border-zinc-800 p-4">
                                    <h4 className="text-center text-yellow-500 font-bold mb-4 uppercase tracking-[0.2em] text-xs">Consult the Oracle</h4>
                                    <CastingRitual
                                        mode="modal"
                                        onComplete={async (hexagramId) => {
                                            const result = await generateQuestFromReading(hexagramId)
                                            // Quest completes regardless; AI generation is bonus
                                            setFeedback(result.success
                                                ? '✨ Wisdom Received & Quest Generated!'
                                                : '✨ Reading Accepted! (Quest generation unavailable)')
                                            setTimeout(() => {
                                                onClose()
                                                router.refresh()
                                            }, 2000)
                                        }}
                                    />
                                </div>
                            ) : (
                                <QuestInputs
                                    inputs={effectiveInputs}
                                    values={responses}
                                    onChange={(key, value) => setResponses(prev => ({ ...prev, [key]: value }))}
                                />
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

                        {!isCompleted && !isLocked && !shouldRenderTwine && (
                            <button
                                onClick={handleComplete}
                                // Disable for triggered quests (except archetype reader)
                                hidden={effectiveInputs.some(input => input.trigger === 'ICHING_CAST') ||
                                    quest.id === 'orientation-quest-3'}
                                disabled={isPending || (isArchetypeQuest && !hasScrolledToBottom) || (!isArchetypeQuest && (() => {
                                    const requiredMissing = effectiveInputs.some(input => input.required && !responses[input.key])
                                    return requiredMissing
                                })())}
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
