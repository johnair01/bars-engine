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
}

interface StoryClockQuestSurfaceProps {
    quests: StoryClockQuestView[]
}

type GeneratedBodyState = {
    aiBody: string
    isFallback: boolean
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
        if (existingBody) return

        startGenerating(async () => {
            const result = await generateStoryClockQuestText(quest.id)
            if ('error' in result) {
                setGeneratedById((prev) => ({
                    ...prev,
                    [quest.id]: {
                        aiBody: [
                            `Title: Hexagram ${quest.hexagramId ?? '?'} Oracle Stub`,
                            '',
                            `Unable to generate live text right now. Face context: ${quest.faceContext || 'not provided'}.`,
                            '',
                            '- Move 1: Name one concrete action for this period.',
                            '- Move 2: Invite one ally to assist this effort.',
                            '- Move 3: Define one visible completion signal.',
                            '',
                            `Omen: ${quest.cubeState || 'UNKNOWN'} marks the active pressure line.`,
                        ].join('\n'),
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

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quests.map((quest) => {
                    const generated = generatedById[quest.id]
                    const aiBody = generated?.aiBody || quest.aiBody

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

                                {aiBody ? (
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
                                        action={pickUpBar}
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
                                        <form action={assistStoryQuest}>
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
                                    const isFallback = !!generated?.isFallback
                                    if (!body && isGenerating) {
                                        return (
                                            <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                                                Generating...
                                            </div>
                                        )
                                    }
                                    if (!body) {
                                        return (
                                            <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 p-4 text-sm text-zinc-500">
                                                AI quest text unavailable. Open this quest again to retry generation.
                                            </div>
                                        )
                                    }
                                    return (
                                        <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-4">
                                            {isFallback ? (
                                                <p className="text-[11px] uppercase tracking-widest text-amber-300 mb-2">Oracle stub</p>
                                            ) : null}
                                            <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans leading-relaxed">{body}</pre>
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
