'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { completeQuest, getArchetypeHandbookData } from '@/actions/quest-engine'
import { CastingRitual } from './CastingRitual'
import { generateQuestFromReading } from '@/actions/generate-quest'
import { useRouter, usePathname } from 'next/navigation'
import { pickupMarketQuest } from '@/actions/market'
import { ArchetypeHandbookContent } from './conclave/ArchetypeHandbookContent'
import { VibulonTransfer } from './VibulonTransfer'
import { getTransferContext } from '@/actions/economy'
import { QuestInputs, BarInput } from './QuestInputs'
import { QuestTwinePlayer } from './QuestTwinePlayer'
import { TwineQuestModal } from './TwineQuestModal'
import { QuestTwineIframe } from './QuestTwineIframe'
import { TwineLogic } from '@/lib/twine-engine'
import { DEFAULT_INTENTION_INPUTS, INTENTION_GUIDED_TWINE_LOGIC } from '@/lib/intention-guided-journey'
import { getIntentionOptionsForPreference } from '@/lib/intention-options'
import Link from 'next/link'
import { getNationMovePanelData, moveQuestToGraveyard, type NationMovePanelData } from '@/actions/nation-moves'
import { getPlayerMovePool, useMove, type PlayerMovePoolResult } from '@/actions/moves-library'
import { QuestNestingActions } from './QuestNestingActions'
import { createSubQuest } from '@/actions/quest-nesting'
import { sendAppreciationAction } from '@/actions/appreciation'
import { getCurrentPlayerId } from '@/actions/auth'
import { getAdventuresForQuest } from '@/lib/quest-adventure'
import { recordQuestFriction } from '@/actions/friction'
import { FRICTION_TYPES, type FrictionType } from '@/lib/friction-types'
import { getNextActionForQuest, linkBarToQuestAsNextAction } from '@/actions/next-action-bridge'
import { collapseQuestToBar } from '@/actions/bars'

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
        microTwine?: {
            htmlArtifact: string | null
            isDraft: boolean
        } | null
        creatorId?: string // When present, enables Appreciate button (hide when viewer is creator)
        status?: string | null // active | blocked; when blocked, Complete is disabled
        blockedKeyQuestTitle?: string | null // When blocked, show "Unlocked when you complete [this]"
    }
    context?: {
        packId?: string
        threadId?: string
        threadType?: string
    }
    // Pre-calculated state from parent
    isCompleted?: boolean
    isLocked?: boolean
    completedMoveTypes?: string[] // Optional: types already achieved by player
    campaignDomainPreference?: string[] // For domain-aligned intention options
    isAdmin?: boolean // When true, show edit link to /admin/quests/[id]
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

export function QuestDetailModal({ isOpen, onClose, quest, context, isCompleted, isLocked, completedMoveTypes, campaignDomainPreference = [], isAdmin }: QuestDetailModalProps) {
    const isBlocked = quest.status === 'blocked'
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [intentionMode, setIntentionMode] = useState<'direct' | 'guided' | 'options'>('direct')

    // Nation moves / graveyard state
    const [movePanel, setMovePanel] = useState<NationMovePanelData | null>(null)
    const [movePool, setMovePool] = useState<PlayerMovePoolResult | null>(null)
    const [selectedMoveKey, setSelectedMoveKey] = useState<string>('')
    const [isApplyingMove, setIsApplyingMove] = useState(false)

    // Archetype Quest State
    const [archetypeData, setArchetypeData] = useState<any>(null)
    const [archetypeError, setArchetypeError] = useState<string | null>(null)
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Transfer Quest State
    const [transferContext, setTransferContext] = useState<any>(null)

    // Phase 5d: Stuckness — always collapsed; player opens when they need unblock options
    const [stuckExpanded, setStuckExpanded] = useState(false)
    const [frictionRecorded, setFrictionRecorded] = useState<FrictionType | null>(null)
    const [isRecordingFriction, setIsRecordingFriction] = useState(false)

    // Appreciation: show when creatorId present and not own quest
    const [canAppreciate, setCanAppreciate] = useState<boolean | null>(null)
    const [appreciateExpanded, setAppreciateExpanded] = useState(false)
    const [appreciateAmount, setAppreciateAmount] = useState(2)
    const [appreciateType, setAppreciateType] = useState<string>('care')
    const [isAppreciating, setIsAppreciating] = useState(false)
    const [isSharingAsBar, setIsSharingAsBar] = useState(false)

    // View/Start Adventure (game-map-gameboard-bridge)
    const [adventures, setAdventures] = useState<Awaited<ReturnType<typeof getAdventuresForQuest>>>([])

    // Next action bridge (golden-path-next-action-bridge)
    const [nextAction, setNextAction] = useState<{ barId: string | null; nextAction: string } | null>(null)
    const [nextActionInput, setNextActionInput] = useState('')
    const [isSettingNextAction, setIsSettingNextAction] = useState(false)

    // Visible impact (golden-path-visible-impact) — completion card with campaign impact + next quest
    const [completionResult, setCompletionResult] = useState<{
        campaignImpact?: string
        nextQuestId?: string
        nextQuestTitle?: string
        reward?: number
        threadType?: string
    } | null>(null)

    // Fetch adventures when modal opens (View/Start Adventure)
    useEffect(() => {
        if (isOpen && quest.id) {
            getAdventuresForQuest(quest.id).then(setAdventures)
        } else {
            setAdventures([])
        }
    }, [isOpen, quest.id])

    // Fetch next action when modal opens (golden-path-next-action-bridge)
    useEffect(() => {
        if (isOpen && quest.id) {
            getNextActionForQuest(quest.id).then(setNextAction)
        } else {
            setNextAction(null)
            setNextActionInput('')
        }
    }, [isOpen, quest.id])

    // Handle initial data for specialized quests
    useEffect(() => {
        if (isOpen && quest.id === 'orientation-quest-2' && !isCompleted) {
            getArchetypeHandbookData().then(res => {
                if (res.success) {
                    setArchetypeData(res.archetype)
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
        if (isOpen && quest.creatorId) {
            getCurrentPlayerId().then(res => {
                setCanAppreciate(res !== null && res.playerId !== quest.creatorId)
            })
        } else {
            setCanAppreciate(null)
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
            getPlayerMovePool().then(setMovePool).catch(() => setMovePool(null))
        }

        // Cleanup if closed
        if (!isOpen) {
            setHasScrolledToBottom(false)
            setArchetypeData(null)
            setArchetypeError(null)
            setTransferContext(null)
            setMovePanel(null)
            setSelectedMoveKey('')
            setStuckExpanded(true)
            setFrictionRecorded(null)
            setCanAppreciate(null)
            setAppreciateExpanded(false)
            setCompletionResult(null)
        }
    }, [isOpen, quest.id, quest.creatorId, isCompleted])


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
                threadId={context?.threadId}
                isRitual={context?.threadType === 'orientation'}
                isAdmin={isAdmin}
            />
        )
    }

    const handleComplete = () => {
        if (isPending) return
        startTransition(async () => {
            const result = await completeQuest(quest.id, { ...responses, autoTriggered: archetypeData ? true : false }, { ...context, source: 'dashboard' })
            if ('success' in result && result.success) {
                const r = result as { campaignImpact?: string; nextQuestId?: string; nextQuestTitle?: string; reward?: number; threadType?: string | null }
                setCompletionResult({
                    campaignImpact: r.campaignImpact,
                    nextQuestId: r.nextQuestId,
                    nextQuestTitle: r.nextQuestTitle,
                    reward: r.reward,
                    threadType: r.threadType ?? undefined,
                })
                setFeedback(null)
            } else {
                setFeedback(`❌ ${'error' in result ? result.error : 'Failed to complete quest'}`)
            }
        })
    }

    const handleCompletionContinue = () => {
        setCompletionResult(null)
        if (completionResult?.threadType === 'orientation') {
            router.push('/conclave/onboarding?ritual=true')
        } else {
            onClose()
        }
    }

    const handleAccept = () => {
        if (isPending) return
        startTransition(async () => {
            const result = await pickupMarketQuest(quest.id)
            if (result.success) {
                setFeedback('✨ Quest Accepted!')
                setTimeout(() => {
                    setFeedback(null)
                    onClose()
                    router.push('/') // Redirect to dashboard to see active quest
                }, 1500)
            } else {
                setFeedback(`❌ ${result.error || 'Failed to accept quest'}`)
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

    // Hide vision, approach, kotterStage for active quests (dashboard-ui-vibe-cleanup Phase 3)
    const HIDDEN_ACTIVE_QUEST_KEYS = ['vision', 'approach', 'kotterStage']
    const displayInputs = !isCompleted
        ? effectiveInputs.filter(input => !HIDDEN_ACTIVE_QUEST_KEYS.includes(input.key))
        : effectiveInputs

    const parsedTwineLogic = parseTwineLogic(quest.twineLogic)
    const effectiveTwineLogic: TwineLogic | null = isIntentionQuest
        ? parsedTwineLogic || INTENTION_GUIDED_TWINE_LOGIC
        : parsedTwineLogic

    const showingGuidedIntention = isIntentionQuest && intentionMode === 'guided'

    // We prioritize the new Micro-Twine Ritual if one is compiled
    const hasCompiledMicroTwine = !!quest.microTwine?.htmlArtifact && !quest.microTwine.isDraft

    const shouldRenderTwine = !!effectiveTwineLogic
        && !isCompleted
        && !isLocked
        && !isBlocked
        && !isArchetypeQuest
        && !isTransferQuest
        && !hasCompiledMicroTwine // Fallback if no MicroTwine
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
                                {isBlocked && (
                                    <span className="text-amber-500/90 font-medium px-2 py-0.5 bg-amber-950/40 rounded-full">
                                        🔑 Blocked — complete the key subquest to unlock
                                    </span>
                                )}
                                {quest.moveType && (
                                    <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${quest.moveType === 'wakeUp' ? 'bg-yellow-900/30 text-yellow-400' :
                                        quest.moveType === 'cleanUp' ? 'bg-orange-900/30 text-orange-400' :
                                            quest.moveType === 'growUp' ? 'bg-green-900/30 text-green-400' :
                                                quest.moveType === 'showUp' ? 'bg-purple-900/30 text-purple-400' :
                                                    'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        {String(quest.moveType).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()}
                                    </span>
                                )}
                                <span className="text-yellow-500 font-mono px-2 py-0.5 bg-yellow-900/20 rounded-full">
                                    +{quest.reward} ⓥ
                                </span>
                            </div>
                            {adventures.length > 0 && (
                                <Link
                                    href={
                                        adventures.length === 1
                                            ? `/adventure/${adventures[0].adventureId}/play?questId=${quest.id}${adventures[0].startNodeId ? `&start=${encodeURIComponent(adventures[0].startNodeId)}` : ''}`
                                            : `/adventure/hub/${quest.id}`
                                    }
                                    className="mt-2 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-purple-700/60 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 hover:text-purple-200 text-xs font-medium transition-colors"
                                >
                                    View/Start Adventure →
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {context?.threadId && (
                                <Link
                                    href={`/map?type=thread&threadId=${context.threadId}`}
                                    className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300 transition-colors"
                                    title="View thread map"
                                >
                                    Map
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSharingAsBar(true)
                                    startTransition(async () => {
                                        const result = await collapseQuestToBar(quest.id)
                                        setIsSharingAsBar(false)
                                        if (result.barId) {
                                            onClose()
                                            router.push(`/bars/${result.barId}?share=external`)
                                            router.refresh()
                                        }
                                    })
                                }}
                                disabled={isSharingAsBar}
                                className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border border-purple-700/60 bg-purple-950/40 text-purple-400 hover:bg-purple-900/50 hover:text-purple-300 transition-colors disabled:opacity-50"
                                title="Share this quest as a BAR (talisman)"
                            >
                                {isSharingAsBar ? '…' : 'Share as BAR'}
                            </button>
                            {isAdmin && (
                                <Link
                                    href={`/admin/quests/${quest.id}`}
                                    className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 transition-colors"
                                    title="Edit quest config"
                                >
                                    Edit
                                </Link>
                            )}
                            <button
                                onClick={onClose}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div
                    ref={scrollContainerRef}
                    onScroll={isArchetypeQuest ? handleScroll : undefined}
                    className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar"
                >
                    {/* Golden Path: Visible Impact — completion card (golden-path-visible-impact) */}
                    {completionResult && (
                        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">✨</span>
                                <h3 className="text-lg font-bold text-emerald-100">Quest Complete!</h3>
                            </div>
                            {completionResult.reward != null && completionResult.reward > 0 && (
                                <p className="text-emerald-200 font-medium">+{completionResult.reward} ⓥ</p>
                            )}
                            {completionResult.campaignImpact && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">What changed</p>
                                    <p className="text-sm text-emerald-100">{completionResult.campaignImpact}</p>
                                </div>
                            )}
                            {completionResult.nextQuestId && completionResult.nextQuestTitle && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Suggested next</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextId = completionResult.nextQuestId
                                            setCompletionResult(null)
                                            onClose()
                                            if (nextId) router.push(`/?focusQuest=${nextId}`)
                                        }}
                                        className="text-sm text-emerald-300 hover:text-emerald-100 font-medium underline"
                                    >
                                        {completionResult.nextQuestTitle}
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleCompletionContinue}
                                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* Blocked: show unlock hint */}
                    {isBlocked && quest.blockedKeyQuestTitle && (
                        <p className="text-sm text-amber-400/90 bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-900/40">
                            Unlocked when you complete: {quest.blockedKeyQuestTitle}
                        </p>
                    )}
                    {isBlocked && !quest.blockedKeyQuestTitle && (
                        <p className="text-sm text-amber-400/90 bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-900/40">
                            Unlocked when you complete the key subquest.
                        </p>
                    )}

                    {/* Golden Path: Next action bridge (golden-path-next-action-bridge) */}
                    {!isCompleted && !isLocked && !isBlocked && (
                        <div className="space-y-2">
                            {nextAction ? (
                                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Your next action</p>
                                    <p className="text-sm text-emerald-100">{nextAction.nextAction}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNextActionInput(nextAction.nextAction)
                                            setNextAction(null)
                                        }}
                                        className="mt-2 text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Set your next action</p>
                                    <p className="text-xs text-zinc-400">What is the next smallest honest action?</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={nextActionInput}
                                            onChange={(e) => setNextActionInput(e.target.value)}
                                            placeholder="e.g. Send one email"
                                            className="flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                                        />
                                        <button
                                            type="button"
                                            disabled={!nextActionInput.trim() || isSettingNextAction}
                                            onClick={async () => {
                                                const text = nextActionInput.trim()
                                                if (!text) return
                                                setIsSettingNextAction(true)
                                                const res = await linkBarToQuestAsNextAction(null, quest.id, text)
                                                setIsSettingNextAction(false)
                                                if ('success' in res) {
                                                    setNextAction({ barId: null, nextAction: text })
                                                    setNextActionInput('')
                                                    setFeedback('✓ Next action set')
                                                    setTimeout(() => setFeedback(null), 1500)
                                                    router.refresh()
                                                } else {
                                                    setFeedback(`❌ ${res.error}`)
                                                }
                                            }}
                                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                        >
                                            {isSettingNextAction ? 'Setting...' : 'Set'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phase 5d: Surface "I'm stuck" prominently — friction is part of play (golden-path-friction) */}
                    {!isCompleted && !isLocked && !isBlocked && (
                        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 overflow-hidden">
                            {!stuckExpanded ? (
                                <button
                                    type="button"
                                    onClick={() => setStuckExpanded(true)}
                                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-cyan-900/20 transition-colors"
                                >
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">I&apos;m stuck</p>
                                        <p className="text-xs text-cyan-100/80">Friction is part of play. What kind of stuck?</p>
                                    </div>
                                    <span className="shrink-0 text-cyan-400 text-sm font-semibold">Unblock options →</span>
                                </button>
                            ) : (
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">I&apos;m stuck</p>
                                        <button
                                            type="button"
                                            onClick={() => setStuckExpanded(false)}
                                            className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest"
                                        >
                                            Collapse
                                        </button>
                                    </div>
                                    <p className="text-sm text-cyan-100/90">Friction is part of play. What kind of stuck?</p>
                                    <div className="flex flex-wrap gap-2">
                                        {FRICTION_TYPES.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                disabled={isRecordingFriction}
                                                onClick={async () => {
                                                    setIsRecordingFriction(true)
                                                    const res = await recordQuestFriction(quest.id, type)
                                                    setIsRecordingFriction(false)
                                                    if ('success' in res) {
                                                        setFrictionRecorded(type)
                                                        setFeedback('✓ Recorded')
                                                        setTimeout(() => setFeedback(null), 1500)
                                                        router.refresh()
                                                    } else {
                                                        setFeedback(`❌ ${res.error}`)
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                                    frictionRecorded === type
                                                        ? 'border-cyan-500 bg-cyan-900/40 text-cyan-100'
                                                        : 'border-cyan-700/50 bg-cyan-900/20 text-cyan-200 hover:bg-cyan-800/30 disabled:opacity-50'
                                                }`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-cyan-800/50">
                                        <p className="text-[10px] uppercase tracking-widest text-cyan-400/80 font-bold mb-2">Unblock yourself</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Link
                                            href={`/emotional-first-aid?questId=${encodeURIComponent(quest.id)}&returnTo=${encodeURIComponent(pathname || '/')}`}
                                            className="rounded-lg border border-cyan-700/60 bg-cyan-900/30 px-4 py-3 text-left hover:bg-cyan-800/40 transition-colors group"
                                        >
                                            <div className="text-lg mb-1">🩹</div>
                                            <div className="font-semibold text-cyan-100 text-sm">Emotional First Aid</div>
                                            <div className="text-[11px] text-cyan-200/70 mt-0.5">Work through emotional blocks (Clean Up)</div>
                                        </Link>
                                        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-3 space-y-2">
                                            <div className="text-lg mb-1">🧬</div>
                                            <div className="font-semibold text-amber-100 text-sm">Add subquest to unblock</div>
                                            <div className="text-[11px] text-amber-200/70">Quick create (costs 1 ♦ each):</div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => startTransition(async () => {
                                                        const res = await createSubQuest(quest.id, {
                                                            title: 'Learn more about this quest',
                                                            description: 'Wake Up — Orient before acting. Gather context, read, or explore.',
                                                            moveType: 'wakeUp',
                                                        })
                                                        if ('error' in res) setFeedback(`❌ ${res.error}`)
                                                        else {
                                                            setFeedback('✨ Wake Up subquest created!')
                                                            setTimeout(() => { setFeedback(null); router.refresh() }, 1500)
                                                        }
                                                    })}
                                                    className="text-[11px] px-2 py-1.5 rounded border border-amber-700/50 bg-amber-900/30 text-amber-200 hover:bg-amber-800/40 disabled:opacity-50"
                                                >
                                                    Wake Up — Learn more
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => startTransition(async () => {
                                                        const res = await createSubQuest(quest.id, {
                                                            title: 'Build capacity for this quest',
                                                            description: 'Grow Up — Increase skill, clarity, or energy before the main action.',
                                                            moveType: 'growUp',
                                                        })
                                                        if ('error' in res) setFeedback(`❌ ${res.error}`)
                                                        else {
                                                            setFeedback('✨ Grow Up subquest created!')
                                                            setTimeout(() => { setFeedback(null); router.refresh() }, 1500)
                                                        }
                                                    })}
                                                    className="text-[11px] px-2 py-1.5 rounded border border-amber-700/50 bg-amber-900/30 text-amber-200 hover:bg-amber-800/40 disabled:opacity-50"
                                                >
                                                    Grow Up — Build capacity
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <QuestNestingActions
                                        parentQuestId={quest.id}
                                        onNestingComplete={() => router.refresh()}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Intention Quest: Direct vs Guided vs Options Path */}
                    {isIntentionQuest && !isCompleted && !isLocked && !isBlocked && (
                        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Choose your path</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIntentionMode('direct')}
                                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${intentionMode === 'direct'
                                        ? 'border-purple-500 bg-purple-900/30 text-purple-100'
                                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-semibold">Write directly</div>
                                    <div className="text-xs text-zinc-500 mt-1">I already know what I want.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIntentionMode('guided')}
                                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${intentionMode === 'guided'
                                        ? 'border-emerald-500 bg-emerald-900/20 text-emerald-100'
                                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-semibold">Guided journey</div>
                                    <div className="text-xs text-zinc-500 mt-1">Help me discover an intention.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIntentionMode('options')}
                                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${intentionMode === 'options'
                                        ? 'border-teal-500 bg-teal-900/20 text-teal-100'
                                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-semibold">Choose from options</div>
                                    <div className="text-xs text-zinc-500 mt-1">Pick a predefined intention.</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Intention Quest: Options grid (when options mode) */}
                    {isIntentionQuest && intentionMode === 'options' && !isCompleted && !isLocked && !isBlocked && (
                        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Select your intention</p>
                            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                                {getIntentionOptionsForPreference(campaignDomainPreference).map((opt) => (
                                    <button
                                        key={opt.text}
                                        type="button"
                                        onClick={() => setResponses((prev) => ({ ...prev, intention: opt.text }))}
                                        className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                                            responses.intention === opt.text
                                                ? 'border-teal-500 bg-teal-900/30 text-teal-100'
                                                : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
                                        }`}
                                    >
                                        {opt.text}
                                    </button>
                                ))}
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

                                    {(() => {
                                        const equippedIds = movePool && 'success' in movePool
                                            ? new Set(movePool.equipped.filter((e) => e.move).map((e) => e.move!.id))
                                            : new Set<string>()
                                        const usableMoves = movePanel.moves.filter((m) => equippedIds.has(m.id))
                                        const usesRemaining = movePool && 'success' in movePool ? movePool.usesRemaining : {} as Record<string, number>

                                        if (movePanel.moves.length === 0) {
                                            return (
                                                <div className="text-xs text-zinc-500 italic">
                                                    No nation moves available for this nation yet.
                                                </div>
                                            )
                                        }
                                        if (usableMoves.length === 0) {
                                            return (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-amber-300">
                                                        Equip moves in your Moves Library to use them here.
                                                    </div>
                                                    <Link href="/hand/moves" className="inline-block rounded-lg border border-amber-800/50 bg-amber-900/20 px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:border-amber-700 transition-colors">
                                                        ⚔️ Open Moves Library
                                                    </Link>
                                                </div>
                                            )
                                        }
                                        return (
                                            <form
                                                className="space-y-3"
                                                onSubmit={async (e) => {
                                                    e.preventDefault()
                                                    const move = movePanel.moves.find((m) => m.key === selectedMoveKey)
                                                    if (!move || !move.unlocked || !move.applicable) return
                                                    const form = e.target as HTMLFormElement
                                                    const formData = new FormData(form)
                                                    const inputs: Record<string, unknown> = {}
                                                    for (const [k, v] of formData.entries()) {
                                                        if (k !== 'questId' && k !== 'moveKey' && v) inputs[k] = v
                                                    }
                                                    setIsApplyingMove(true)
                                                    const res = await useMove(move.id, quest.id, inputs)
                                                    setIsApplyingMove(false)
                                                    if ('success' in res) {
                                                        setFeedback('✨ Move applied!')
                                                        setTimeout(() => { setFeedback(null); router.refresh() }, 1200)
                                                    } else {
                                                        setFeedback(`❌ ${res.error}`)
                                                    }
                                                }}
                                            >
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
                                                        {usableMoves.map((m) => {
                                                            const remaining = usesRemaining[m.id] ?? 0
                                                            return (
                                                                <option key={m.key} value={m.key}>
                                                                    {m.name} ({remaining} uses left)
                                                                </option>
                                                            )
                                                        })}
                                                    </select>
                                                </div>

                                                {selectedMoveKey && (() => {
                                                    const move = movePanel.moves.find((m) => m.key === selectedMoveKey)
                                                    if (!move || !usableMoves.some((m) => m.key === selectedMoveKey)) return null

                                                    const remaining = usesRemaining[move.id] ?? 0
                                                    const outOfUses = remaining <= 0

                                                    return (
                                                        <div className="space-y-3">
                                                            <div className="text-xs text-zinc-400">
                                                                {move.description}
                                                            </div>

                                                            {outOfUses && (
                                                                <div className="text-xs text-amber-300">
                                                                    No uses remaining for today. Resets at midnight UTC.
                                                                </div>
                                                            )}

                                                            {!move.applicable && (
                                                                <div className="text-xs text-amber-300">
                                                                    Not applicable to status &quot;{movePanel.quest.status}&quot;. Applies to: {move.appliesToStatus.join(', ') || '(any)'}.
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
                                                                disabled={!move.unlocked || !move.applicable || isApplyingMove || outOfUses}
                                                                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 font-bold text-white text-sm disabled:opacity-50"
                                                            >
                                                                {isApplyingMove ? 'Applying...' : 'Apply Move'}
                                                            </button>
                                                        </div>
                                                    )
                                                })()}
                                            </form>
                                        )
                                    })()}
                                </>
                            )}
                        </div>
                    )}

                    {/* MICRO-TWINE RITUAL ENGINE */}
                    {hasCompiledMicroTwine && quest.microTwine?.htmlArtifact && !isCompleted && !isLocked && !isBlocked && (
                        <QuestTwineIframe
                            htmlArtifact={quest.microTwine.htmlArtifact}
                            onComplete={(bindPayload) => {
                                // Rite 5 preview: Handle the [BIND] message
                                console.log('[MicroTwine] Bind received:', bindPayload)
                                // For Rite 4, we just log it. Rite 5 will handle completion.
                            }}
                        />
                    )}

                    {/* TWINE NARRATIVE ENGINE (LEGACY/JSON) */}
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
                                    const result = await completeQuest(quest.id, mergedResponses, { ...context, source: 'dashboard' })
                                    if ('success' in result && result.success) {
                                        const r = result as { campaignImpact?: string; nextQuestId?: string; nextQuestTitle?: string; reward?: number; threadType?: string | null }
                                        setCompletionResult({
                                            campaignImpact: r.campaignImpact,
                                            nextQuestId: r.nextQuestId,
                                            nextQuestTitle: r.nextQuestTitle,
                                            reward: r.reward,
                                            threadType: r.threadType ?? undefined,
                                        })
                                        setFeedback(null)
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
                                        Your archetype may not be assigned yet. Try completing character setup first.
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
                    {!isCompleted && !isLocked && !isBlocked && !isArchetypeQuest && !isTransferQuest && !shouldRenderTwine && !(isIntentionQuest && intentionMode === 'options') && (
                        <div className="space-y-3">
                            {/* Check for Trigger in inputs */}
                            {effectiveInputs.some(input => input.trigger === 'ICHING_CAST') || quest.id === 'orientation-quest-3' ? (
                                <div className="bg-black/50 rounded-xl border border-zinc-800 p-4">
                                    <h4 className="text-center text-yellow-500 font-bold mb-4 uppercase tracking-[0.2em] text-xs">Consult the Oracle</h4>
                                    <CastingRitual
                                        mode="modal"
                                        onComplete={async (hexagramId) => {
                                            const result = await generateQuestFromReading(hexagramId)
                                            if ('adventureId' in result && result.adventureId && result.questId && result.threadId) {
                                                onClose()
                                                router.refresh()
                                                router.push(`/adventure/${result.adventureId}/play?questId=${result.questId}&threadId=${result.threadId}`)
                                            } else {
                                                setFeedback('error' in result
                                                    ? result.error
                                                    : '✨ Wisdom Received & Quest Generated!')
                                                setTimeout(() => {
                                                    onClose()
                                                    router.refresh()
                                                }, 2000)
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <QuestInputs
                                    inputs={displayInputs}
                                    values={responses}
                                    onChange={(key, value) => setResponses(prev => ({ ...prev, [key]: value }))}
                                />
                            )}
                        </div>
                    )}

                    {/* Appreciation: give vibeulons to quest creator */}
                    {canAppreciate && (
                        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 overflow-hidden">
                            {!appreciateExpanded ? (
                                <button
                                    type="button"
                                    onClick={() => setAppreciateExpanded(true)}
                                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-amber-900/20 transition-colors"
                                >
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">Appreciate this quest</p>
                                        <p className="text-xs text-amber-100/80">Send vibeulons to the creator</p>
                                    </div>
                                    <span className="shrink-0 text-amber-400 text-sm font-semibold">Send appreciation →</span>
                                </button>
                            ) : (
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Send appreciation</p>
                                        <button
                                            type="button"
                                            onClick={() => setAppreciateExpanded(false)}
                                            className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest"
                                        >
                                            Collapse
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Amount (ⓥ)</label>
                                            <select
                                                value={appreciateAmount}
                                                onChange={(e) => setAppreciateAmount(Number(e.target.value))}
                                                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                                    <option key={n} value={n}>{n} ⓥ</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Type</label>
                                            <select
                                                value={appreciateType}
                                                onChange={(e) => setAppreciateType(e.target.value)}
                                                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
                                            >
                                                <option value="courage">Courage</option>
                                                <option value="care">Care</option>
                                                <option value="clarity">Clarity</option>
                                                <option value="support">Support</option>
                                                <option value="creativity">Creativity</option>
                                                <option value="completion">Completion</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isAppreciating}
                                        onClick={async () => {
                                            setIsAppreciating(true)
                                            const res = await sendAppreciationAction({
                                                amount: appreciateAmount,
                                                targetQuestId: quest.id,
                                                appreciationType: appreciateType as 'courage' | 'care' | 'clarity' | 'support' | 'creativity' | 'completion',
                                            })
                                            setIsAppreciating(false)
                                            if ('error' in res) {
                                                setFeedback(`❌ ${res.error}`)
                                            } else {
                                                setFeedback(`✨ Sent ${appreciateAmount} ⓥ as ${appreciateType}!`)
                                                setAppreciateExpanded(false)
                                                setTimeout(() => { setFeedback(null); router.refresh() }, 1500)
                                            }
                                        }}
                                        className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm disabled:opacity-50"
                                    >
                                        {isAppreciating ? 'Sending...' : `Send ${appreciateAmount} ⓥ`}
                                    </button>
                                </div>
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

                        {!completionResult && !isCompleted && !isLocked && !isBlocked && !shouldRenderTwine && (
                            <button
                                onClick={isCompleted === undefined ? handleAccept : handleComplete}
                                // Disable for triggered quests (except archetype reader)
                                hidden={effectiveInputs.some(input => input.trigger === 'ICHING_CAST') ||
                                    quest.id === 'orientation-quest-3'}
                                disabled={isPending || (isArchetypeQuest && !hasScrolledToBottom) || (!isArchetypeQuest && isCompleted !== undefined && (() => {
                                    const requiredMissing = displayInputs.some(input => input.required && !responses[input.key])
                                    return requiredMissing
                                })())}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${isArchetypeQuest
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                                    } disabled:opacity-50 disabled:grayscale`}
                            >
                                {isPending ? (isCompleted === undefined ? 'Accepting...' : 'Completing...') :
                                    (isCompleted === undefined ? 'Accept Quest' : (isArchetypeQuest ? 'Acknowledge' : 'Complete Quest'))}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
