'use client'

import { useMemo, useState, useTransition } from 'react'
import { assistStoryQuest, pickUpBar } from '@/actions/pick-up-bar'
import { generateStoryClockQuestText } from '@/actions/story-clock'

type StoryClockQuestView = {
    id: string
    title: string
    description: string
    creatorName: string
    canClaim: boolean
    cubeState: string | null
    cubeRequirementLabel: string | null
    completionFraming: string | null
    requiresAssist: boolean
    hexagramId: number | null
    hexagramName: string | null
    upperTrigram: string | null
    lowerTrigram: string | null
    eligibleArchetypes: string[]
    nationTonePrimary: string | null
    nationToneSecondary: string | null
    faceContext: string | null
    status: string
    claimWindowExpiry: string | null
    aiBody: string | null
    aiFallback: boolean
    questSource?: string | null
    phaseId?: number | null
    kotterStage?: number | null
}

interface StoryClockQuestSurfaceProps {
    quests: StoryClockQuestView[]
    showActions?: boolean
}

type GeneratedBodyState = {
    aiBody: string
    isFallback: boolean
}

type PlayerFacingQuestView = {
    title?: string
    action: string
    done_when: string
    ally_help?: string
    debug: {
        parseStatus: 'short_schema' | 'story_payload' | 'legacy_payload' | 'plain_text' | 'fallback'
        questSource: string | null
        hexagramId: number | null
        cubeState: string | null
        phaseId: number | null
        kotterStage: number | null
        aiBodyLength: number
        rawAiPreview: string
    }
}

function humanizeCubeState(raw: string | null) {
    if (!raw) return null
    const parts = raw.split('_').filter(Boolean)
    if (parts.length !== 3) return raw
    return parts
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
        .join(' • ')
}

function clampText(value: string, limit: number) {
    const normalized = value.trim()
    if (normalized.length <= limit) return normalized
    return normalized.slice(0, limit).trim()
}

function tryParseJson(raw: string | null) {
    if (!raw) return null
    try {
        return JSON.parse(raw) as unknown
    } catch {
        return null
    }
}

function pickFirstNonEmpty(values: Array<unknown>) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim()
        }
    }
    return null
}

function toPlayerFacingQuest(quest: StoryClockQuestView, rawAiBody: string | null): PlayerFacingQuestView {
    const aiBody = typeof rawAiBody === 'string' ? rawAiBody : ''
    const baseDebug = {
        questSource: quest.questSource || null,
        hexagramId: quest.hexagramId ?? null,
        cubeState: quest.cubeState || null,
        phaseId: quest.phaseId ?? null,
        kotterStage: quest.kotterStage ?? null,
        aiBodyLength: aiBody.length,
        rawAiPreview: clampText(aiBody, 500),
    }

    const parsed = tryParseJson(aiBody)
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, any>

        if (typeof obj.action === 'string' && typeof obj.done_when === 'string') {
            return {
                title: typeof obj.title === 'string' ? clampText(obj.title, 40) : undefined,
                action: clampText(obj.action, 140),
                done_when: clampText(obj.done_when, 90),
                ally_help: typeof obj.ally_help === 'string' ? clampText(obj.ally_help, 90) : undefined,
                debug: { ...baseDebug, parseStatus: 'short_schema' }
            }
        }

        const questBlock = obj.quest
        if (questBlock && typeof questBlock === 'object') {
            const action = pickFirstNonEmpty([
                questBlock?.main_character_move?.do,
                questBlock?.pitch,
                quest.description
            ])
            const doneWhen = pickFirstNonEmpty([
                questBlock?.main_character_move?.done_when,
                'Marked complete in the app.'
            ])
            const allyHelp = pickFirstNonEmpty([
                Array.isArray(questBlock?.ally_moves) ? questBlock.ally_moves?.[0]?.ask : null,
                'Allies can back you with a vibulon or BAR.'
            ])

            if (action && doneWhen) {
                return {
                    title: clampText(questBlock?.title || quest.title, 40),
                    action: clampText(action, 140),
                    done_when: clampText(doneWhen, 90),
                    ally_help: allyHelp ? clampText(allyHelp, 90) : undefined,
                    debug: { ...baseDebug, parseStatus: 'story_payload' }
                }
            }
        }

        const legacyAction = pickFirstNonEmpty([
            Array.isArray(obj.moves) ? obj.moves[0] : null,
            Array.isArray(obj.paragraphs) ? obj.paragraphs[0] : null,
            obj.description,
            obj.omen
        ])
        if (legacyAction) {
            return {
                title: typeof obj.title === 'string' ? clampText(obj.title, 40) : clampText(quest.title, 40),
                action: clampText(legacyAction, 140),
                done_when: 'Marked complete in the app.',
                ally_help: 'Allies can back you with a vibulon or BAR.',
                debug: { ...baseDebug, parseStatus: 'legacy_payload' }
            }
        }
    }

    if (aiBody.trim().length > 0) {
        const plainLine = aiBody
            .split('\n')
            .map((line) => line.trim())
            .find((line) => line.length > 0 && !line.toLowerCase().startsWith('title:'))

        if (plainLine) {
            return {
                title: clampText(quest.title, 40),
                action: clampText(plainLine, 140),
                done_when: 'Marked complete in the app.',
                ally_help: 'Allies can back you with a vibulon or BAR.',
                debug: { ...baseDebug, parseStatus: 'plain_text' }
            }
        }
    }

    return {
        title: clampText(quest.title, 40),
        action: "Complete this quest's next concrete step.",
        done_when: 'Marked complete in the app.',
        ally_help: 'Allies can back you with a vibulon or BAR.',
        debug: { ...baseDebug, parseStatus: 'fallback' }
    }
}

export function StoryClockQuestSurface({ quests, showActions = true }: StoryClockQuestSurfaceProps) {
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null)
    const [isGenerating, startGenerating] = useTransition()
    const [generatedById, setGeneratedById] = useState<Record<string, GeneratedBodyState>>({})

    const selectedQuest = useMemo(
        () => quests.find((quest) => quest.id === selectedQuestId) || null,
        [quests, selectedQuestId]
    )

    const openQuestModal = (quest: StoryClockQuestView) => {
        setSelectedQuestId(quest.id)
        const existingBody = generatedById[quest.id]?.aiBody || quest.aiBody
        if (existingBody && existingBody.trim().length > 0) return

        startGenerating(async () => {
            const result = await generateStoryClockQuestText(quest.id)
            if ('error' in result) {
                setGeneratedById((prev) => ({
                    ...prev,
                    [quest.id]: {
                        aiBody: '',
                        isFallback: true,
                    }
                }))
                return
            }

            setGeneratedById((prev) => ({
                ...prev,
                [quest.id]: {
                    aiBody: result.aiBody,
                    isFallback: result.isFallback,
                }
            }))
        })
    }

    const handlePickUp = async (formData: FormData) => {
        await pickUpBar(formData)
    }

    const handleAssist = async (formData: FormData) => {
        await assistStoryQuest(formData)
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quests.map((quest) => {
                    const generated = generatedById[quest.id]
                    const aiBody = generated?.aiBody || quest.aiBody
                    const display = toPlayerFacingQuest(quest, aiBody)

                    return (
                        <div
                            key={quest.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openQuestModal(quest)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    openQuestModal(quest)
                                }
                            }}
                            className="bg-zinc-900 border border-cyan-900/60 rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                        >
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-bold text-white text-lg">{display.title || quest.title}</h3>
                                    <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded uppercase tracking-widest">
                                        Story
                                    </span>
                                </div>

                                <div className="text-xs text-zinc-500">
                                    From {quest.creatorName}
                                </div>

                                <p className="text-sm text-zinc-300 line-clamp-2">{display.action}</p>
                                <p className="text-xs text-zinc-400 line-clamp-1">Done when: {display.done_when}</p>
                                {display.ally_help ? <p className="text-xs text-zinc-500 line-clamp-1">Ally help: {display.ally_help}</p> : null}

                                {quest.requiresAssist ? (
                                    <div className="rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
                                        Requires at least one Assist Signal before completion.
                                    </div>
                                ) : null}

                                <div className="text-[11px] text-zinc-500 uppercase tracking-widest">Tap card to open details</div>

                                {showActions ? (
                                    quest.canClaim ? (
                                        <form
                                            action={handlePickUp}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <input type="hidden" name="barId" value={quest.id} />
                                            <button
                                                type="submit"
                                                className="w-full py-2 rounded-lg font-bold transition-all bg-cyan-900/40 border border-cyan-700 text-cyan-200 hover:bg-cyan-900/60"
                                            >
                                                Accept Story Quest
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
                                            <form action={handleAssist}>
                                                <input type="hidden" name="barId" value={quest.id} />
                                                <input type="hidden" name="assistNote" value={`Assist volunteered for ${quest.title}`} />
                                                <button
                                                    type="submit"
                                                    className="w-full py-2 rounded-lg font-bold transition-all bg-zinc-900 border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                                                >
                                                    Send Assist Signal
                                                </button>
                                            </form>
                                            <div className="w-full py-2 rounded-lg font-bold text-center bg-zinc-900 border border-zinc-700 text-zinc-400">
                                                Assist Only (archetype not eligible to claim)
                                            </div>
                                        </div>
                                    )
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedQuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedQuestId(null)} />
                    <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-3">
                            <div>
                                {(() => {
                                    const generated = generatedById[selectedQuest.id]
                                    const body = generated?.aiBody || selectedQuest.aiBody
                                    const display = toPlayerFacingQuest(selectedQuest, body)
                                    return (
                                        <>
                                            <h3 className="text-lg font-bold text-white">{display.title || selectedQuest.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-1">Hexagram #{selectedQuest.hexagramId ?? '?'}</p>
                                        </>
                                    )
                                })()}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedQuestId(null)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            {(() => {
                                const generated = generatedById[selectedQuest.id]
                                const body = generated?.aiBody || selectedQuest.aiBody
                                const display = toPlayerFacingQuest(selectedQuest, body)

                                return (
                                    <section className="space-y-4">
                                        {(!body || body.trim().length === 0) && isGenerating ? (
                                            <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-sm text-zinc-400">
                                                Generating...
                                            </div>
                                        ) : null}

                                        <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-4">
                                            <p className="text-sm text-zinc-200 leading-relaxed">{display.action}</p>
                                            <p className="text-xs text-zinc-400">Done when: {display.done_when}</p>
                                            {display.ally_help ? (
                                                <p className="text-xs text-zinc-500">Ally help: {display.ally_help}</p>
                                            ) : null}
                                        </div>

                                        <details className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3">
                                            <summary className="cursor-pointer text-xs uppercase tracking-widest text-zinc-400">Debug</summary>
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                <Detail label="questSource" value={display.debug.questSource || 'N/A'} />
                                                <Detail label="hexagram_id" value={display.debug.hexagramId != null ? String(display.debug.hexagramId) : 'N/A'} />
                                                <Detail label="cube_signature" value={humanizeCubeState(display.debug.cubeState) || 'N/A'} />
                                                <Detail label="phase" value={display.debug.phaseId != null ? String(display.debug.phaseId) : 'N/A'} />
                                                <Detail label="kotter" value={display.debug.kotterStage != null ? String(display.debug.kotterStage) : 'N/A'} />
                                                <Detail label="parse_status" value={display.debug.parseStatus} />
                                                <Detail label="ai_body_length" value={String(display.debug.aiBodyLength)} />
                                                <Detail label="raw_ai_preview" value={display.debug.rawAiPreview || 'N/A'} />
                                            </div>
                                        </details>
                                    </section>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950/70 p-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
            <p className="text-zinc-200 mt-1 break-words">{value}</p>
        </div>
    )
}
