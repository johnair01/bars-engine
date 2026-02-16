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
}

interface StoryClockQuestSurfaceProps {
    quests: StoryClockQuestView[]
}

type GeneratedBodyState = {
    aiBody: string
    isFallback: boolean
}

type StoryClockQuestPayload = {
    reading: {
        hexagram_id: number
        hexagram_name: string
        upper_trigram: {
            id: string
            name: string
            archetype: string
            keywords: string[]
        }
        lower_trigram: {
            id: string
            name: string
            archetype: string
            keywords: string[]
        }
        brief: string
    }
    cube: {
        proximity: 'HIDE' | 'SEEK'
        risk: 'TRUTH' | 'DARE'
        direction: 'INTERIOR' | 'EXTERIOR'
        signature_display: string
    }
    quest: {
        title: string
        pitch: string
        template_id: string
        constraints: string[]
        main_character_move: {
            do: string
            done_when: string
        }
        ally_moves: Array<{
            type: 'VIBEULON' | 'BAR'
            ask: string
        }>
        rewards: {
            completion_vibeulons: 1
            first_completion_bonus: 1
        }
    }
}

function parseQuestPayload(raw: string | null): StoryClockQuestPayload | null {
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return null
        if (!('reading' in parsed) || !('cube' in parsed) || !('quest' in parsed)) return null
        const payload = parsed as StoryClockQuestPayload
        if (!payload.reading?.brief || !payload.quest?.title || !payload.quest?.template_id || !payload.cube?.signature_display) return null
        if (!Array.isArray(payload.quest?.ally_moves) || payload.quest.ally_moves.length < 1) return null
        return payload
    } catch {
        return null
    }
}

export function StoryClockQuestSurface({ quests }: StoryClockQuestSurfaceProps) {
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
        const existingPayload = parseQuestPayload(existingBody)
        if (existingPayload) return

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
                    const parsedPayload = parseQuestPayload(aiBody)

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
                                    <h3 className="font-bold text-white text-lg">{quest.title}</h3>
                                    <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded uppercase tracking-widest">
                                        Story
                                    </span>
                                </div>

                                <div className="text-xs text-zinc-500">
                                    From {quest.creatorName}
                                    {quest.cubeState ? <span className="ml-2 text-zinc-400">• {quest.cubeState}</span> : null}
                                </div>

                                {quest.cubeRequirementLabel ? (
                                    <div className="text-[11px] uppercase tracking-widest text-cyan-300/80">
                                        {quest.cubeRequirementLabel}
                                    </div>
                                ) : null}

                                {quest.completionFraming ? (
                                    <p className="text-xs text-zinc-500 leading-relaxed">{quest.completionFraming}</p>
                                ) : null}

                                <p className="text-sm text-zinc-400 line-clamp-4">{quest.description}</p>

                                {quest.requiresAssist ? (
                                    <div className="rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
                                        Requires at least one Assist Signal before completion.
                                    </div>
                                ) : null}

                                {parsedPayload ? (
                                    <div className="text-[11px] text-emerald-300/80 uppercase tracking-widest">
                                        Quest text ready
                                    </div>
                                ) : (
                                    <div className="text-[11px] text-zinc-500 uppercase tracking-widest">
                                        Tap card to open details
                                    </div>
                                )}

                                {quest.canClaim ? (
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
                                )}
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
                                <h3 className="text-lg font-bold text-white">{selectedQuest.title}</h3>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {selectedQuest.hexagramName
                                        ? `Hexagram #${selectedQuest.hexagramId ?? '?'} • ${selectedQuest.hexagramName}`
                                        : `Hexagram #${selectedQuest.hexagramId ?? '?'}`}
                                </p>
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
                            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <Detail label="hexagram_id" value={selectedQuest.hexagramId != null ? String(selectedQuest.hexagramId) : 'N/A'} />
                                <Detail label="hexagram_name" value={selectedQuest.hexagramName || 'N/A'} />
                                <Detail label="upper_trigram" value={selectedQuest.upperTrigram || 'N/A'} />
                                <Detail label="lower_trigram" value={selectedQuest.lowerTrigram || 'N/A'} />
                                <Detail
                                    label="eligible_archetypes"
                                    value={
                                        selectedQuest.eligibleArchetypes.length > 0
                                            ? `[${selectedQuest.eligibleArchetypes.join(', ')}]`
                                            : '[]'
                                    }
                                />
                                <Detail label="nation_tone_primary" value={selectedQuest.nationTonePrimary || 'N/A'} />
                                <Detail label="nation_tone_secondary" value={selectedQuest.nationToneSecondary || 'N/A'} />
                                <Detail label="cube_state" value={selectedQuest.cubeState || 'N/A'} />
                                <Detail label="face_context" value={selectedQuest.faceContext || 'N/A'} />
                                <Detail label="status" value={selectedQuest.status} />
                                <Detail label="claim_window_expiry" value={selectedQuest.claimWindowExpiry || 'not set'} />
                            </section>

                            <section className="space-y-2">
                                <p className="text-[11px] uppercase tracking-widest text-zinc-500">AI quest text</p>
                                {(() => {
                                    const generated = generatedById[selectedQuest.id]
                                    const body = generated?.aiBody || selectedQuest.aiBody
                                    const payload = parseQuestPayload(body)
                                    const isFallback = generated?.isFallback ?? selectedQuest.aiFallback
                                    if (!payload && isGenerating) {
                                        return (
                                            <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                                                Generating...
                                            </div>
                                        )
                                    }
                                    if (!payload) {
                                        return (
                                            <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 p-4 text-sm text-zinc-500">
                                                AI quest JSON unavailable. Open this quest to trigger generation.
                                            </div>
                                        )
                                    }
                                    return (
                                        <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-4 space-y-4">
                                            {isFallback ? (
                                                <p className="text-[11px] uppercase tracking-widest text-amber-300 mb-2">Oracle stub</p>
                                            ) : null}
                                            <div className="space-y-2">
                                                <p className="text-[11px] uppercase tracking-widest text-zinc-500">Reading</p>
                                                <p className="text-sm text-zinc-200 leading-relaxed">{payload.reading.brief}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                    <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2">
                                                        <p className="uppercase tracking-widest text-zinc-500 text-[10px]">Upper trigram</p>
                                                        <p className="text-zinc-100 mt-1">{payload.reading.upper_trigram.name} • {payload.reading.upper_trigram.archetype}</p>
                                                        <p className="text-zinc-400 mt-1">{payload.reading.upper_trigram.keywords.join(', ')}</p>
                                                    </div>
                                                    <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2">
                                                        <p className="uppercase tracking-widest text-zinc-500 text-[10px]">Lower trigram</p>
                                                        <p className="text-zinc-100 mt-1">{payload.reading.lower_trigram.name} • {payload.reading.lower_trigram.archetype}</p>
                                                        <p className="text-zinc-400 mt-1">{payload.reading.lower_trigram.keywords.join(', ')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[11px] uppercase tracking-widest text-zinc-500">Quest</p>
                                                <p className="text-sm font-semibold text-white">{payload.quest.title}</p>
                                                <p className="text-sm text-zinc-300">{payload.quest.pitch}</p>
                                                <div className="flex flex-wrap gap-2 text-[11px]">
                                                    <span className="px-2 py-1 rounded border border-cyan-700/50 bg-cyan-900/20 text-cyan-200">
                                                        {payload.cube.signature_display}
                                                    </span>
                                                    <span className="px-2 py-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300">
                                                        {payload.quest.template_id}
                                                    </span>
                                                </div>
                                                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3 text-sm space-y-1">
                                                    <p className="text-zinc-400 text-xs uppercase tracking-widest">Main character move</p>
                                                    <p className="text-zinc-100">{payload.quest.main_character_move.do}</p>
                                                    <p className="text-zinc-400 text-xs">Done when: {payload.quest.main_character_move.done_when}</p>
                                                </div>
                                                <div>
                                                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Constraints</p>
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                                                        {payload.quest.constraints.map((constraint, idx) => (
                                                            <li key={`${selectedQuest.id}-constraint-${idx}`}>{constraint}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Ally moves</p>
                                                    <ul className="space-y-1">
                                                        {payload.quest.ally_moves.map((move, idx) => (
                                                            <li key={`${selectedQuest.id}-ally-${idx}`} className="text-sm text-zinc-300 flex items-start gap-2">
                                                                <span className="text-[10px] mt-0.5 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">{move.type}</span>
                                                                <span>{move.ask}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </section>
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
