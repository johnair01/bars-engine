'use client'

import { useMemo, useState, useTransition } from 'react'
import {
    completeEmotionalFirstAidSession,
    EmotionalFirstAidContext,
    startEmotionalFirstAidSession
} from '@/actions/emotional-first-aid'
import {
    FIRST_AID_MINT_AMOUNT,
    VibesEmergencyTag,
} from '@/lib/emotional-first-aid'
import { FirstAidTwinePlayer } from './FirstAidTwinePlayer'
import { TwineLogic } from '@/lib/twine-engine'

interface EmotionalFirstAidKitProps {
    initialContext: EmotionalFirstAidContext
    contextQuestId?: string | null
}

type KitStage = 'intake' | 'protocol' | 'resolution' | 'result'

function StucknessMeter({
    label,
    value,
    onChange,
}: {
    label: string
    value: number
    onChange: (value: number) => void
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{label}</span>
                <span className="font-mono text-cyan-300">{value}/10</span>
            </div>
            <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-zinc-600">
                <span>0 = clear signal</span>
                <span>10 = full vibes emergency</span>
            </div>
        </div>
    )
}

export function EmotionalFirstAidKit({ initialContext, contextQuestId }: EmotionalFirstAidKitProps) {
    const [stage, setStage] = useState<KitStage>('intake')
    const [isPending, startTransition] = useTransition()

    const [issueTag, setIssueTag] = useState<VibesEmergencyTag>('overwhelm')
    const [issueText, setIssueText] = useState('')
    const [stuckBefore, setStuckBefore] = useState(6)
    const [stuckAfter, setStuckAfter] = useState(4)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [recommendedToolId, setRecommendedToolId] = useState<string | null>(null)
    const [selectedToolId, setSelectedToolId] = useState<string>(initialContext.tools[0]?.id || '')
    const [applyToQuesting, setApplyToQuesting] = useState(true)
    const [twineVariables, setTwineVariables] = useState<Record<string, unknown>>({})
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<{
        delta: number
        mintedAmount: number
        threshold: number
    } | null>(null)

    const selectedTool = initialContext.tools.find((tool) => tool.id === selectedToolId) || null
    const selectedToolLogic = useMemo(() => {
        if (!selectedTool) return null
        try {
            return JSON.parse(selectedTool.twineLogic) as TwineLogic
        } catch {
            return null
        }
    }, [selectedTool])

    const handleStartSession = () => {
        setError(null)
        startTransition(async () => {
            const response = await startEmotionalFirstAidSession({
                issueTag,
                issueText,
                stuckBefore,
                contextQuestId: contextQuestId || null,
            })

            if ('error' in response) {
                setError(response.error)
                return
            }

            setSessionId(response.sessionId)
            setRecommendedToolId(response.recommendedToolId)
            setSelectedToolId(response.recommendedToolId)
            setStage('protocol')
        })
    }

    const handleFinalizeSession = () => {
        if (!sessionId || !selectedToolId) return
        setError(null)

        startTransition(async () => {
            const response = await completeEmotionalFirstAidSession({
                sessionId,
                toolId: selectedToolId,
                stuckAfter,
                applyToQuesting,
                notes: issueText,
                twineVariables,
            })

            if ('error' in response) {
                setError(response.error)
                return
            }

            setResult({
                delta: response.delta,
                mintedAmount: response.mintedAmount,
                threshold: response.threshold,
            })
            setStage('result')
        })
    }

    const resetFlow = () => {
        setStage('intake')
        setError(null)
        setIssueText('')
        setSessionId(null)
        setRecommendedToolId(null)
        setTwineVariables({})
        setResult(null)
        setApplyToQuesting(true)
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-b from-cyan-950/20 to-black p-6">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-400 mb-2">EMH // VIBES MEDBAY</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    Please state the nature of your vibes emergency.
                </h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                    I am a slightly overworked but deeply committed emotional support hologram.
                    We will run a fast diagnostic, execute a protocol, and get you moving again.
                </p>
            </div>

            {initialContext.player.emotionalFirstAid && (
                <div className="rounded-xl border border-orange-900/40 bg-orange-950/20 p-4">
                    <p className="text-[11px] uppercase tracking-widest text-orange-400 font-bold mb-2">
                        Archetype Clean-Up Protocol · {initialContext.player.playbookName || 'Unassigned'}
                    </p>
                    <p className="text-sm text-orange-100/90 leading-relaxed">
                        {initialContext.player.emotionalFirstAid}
                    </p>
                </div>
            )}

            {contextQuestId && (
                <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4 text-sm text-purple-100/90">
                    Quest context detected: this first-aid run can be linked to your current quest.
                </div>
            )}

            {stage === 'intake' && (
                <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-2">Triage</h2>
                        <p className="text-sm text-zinc-400">Pick the closest signal. You can always override the recommendation.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {initialContext.quickOptions.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => setIssueTag(option.key)}
                                className={`rounded-xl border px-4 py-3 text-left transition ${issueTag === option.key
                                    ? 'border-cyan-500/60 bg-cyan-900/20'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span>{option.icon}</span>
                                    <span className="text-sm font-semibold text-zinc-100">{option.label}</span>
                                </div>
                                <p className="text-xs text-zinc-500">{option.prompt}</p>
                            </button>
                        ))}
                    </div>

                    <StucknessMeter
                        label="Insanity / stuckness check (before)"
                        value={stuckBefore}
                        onChange={setStuckBefore}
                    />

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                            Optional notes for the medbay log
                        </label>
                        <textarea
                            value={issueText}
                            onChange={(e) => setIssueText(e.target.value)}
                            placeholder="What feels stuck right now?"
                            rows={3}
                            className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleStartSession}
                        disabled={isPending}
                        className="w-full rounded-lg bg-cyan-600 px-4 py-3 font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                    >
                        {isPending ? 'Diagnosing...' : 'Run diagnostic'}
                    </button>
                </div>
            )}

            {stage === 'protocol' && selectedTool && (
                <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
                    <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4">
                        <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-bold mb-1">
                            Recommended protocol
                        </p>
                        <p className="text-sm text-cyan-100">
                            {recommendedToolId === selectedTool.id ? 'Selected by triage: ' : 'Manual override: '}
                            <span className="font-semibold">{selectedTool.name}</span>
                        </p>
                        <p className="text-xs text-cyan-200/70 mt-1">{selectedTool.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {initialContext.tools.map((tool) => (
                            <button
                                key={tool.id}
                                type="button"
                                onClick={() => setSelectedToolId(tool.id)}
                                className={`rounded-full border px-3 py-1.5 text-xs transition ${selectedToolId === tool.id
                                    ? 'border-cyan-500 bg-cyan-900/30 text-cyan-200'
                                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                                    }`}
                            >
                                {tool.icon || '🩺'} {tool.name}
                            </button>
                        ))}
                    </div>

                    {selectedToolLogic ? (
                        <FirstAidTwinePlayer
                            logic={selectedToolLogic}
                            onComplete={(variables) => {
                                setTwineVariables(variables)
                                setStage('resolution')
                            }}
                        />
                    ) : (
                        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
                            This protocol script is invalid JSON. Ask an admin to fix the tool script.
                        </div>
                    )}
                </div>
            )}

            {stage === 'resolution' && (
                <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
                    <h2 className="text-lg font-semibold text-white">Post-practice reassessment</h2>

                    <StucknessMeter
                        label="Insanity / stuckness check (after)"
                        value={stuckAfter}
                        onChange={setStuckAfter}
                    />

                    <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                        <input
                            type="checkbox"
                            checked={applyToQuesting}
                            onChange={(e) => setApplyToQuesting(e.target.checked)}
                            className="mt-1 h-4 w-4"
                        />
                        <span className="text-sm text-zinc-300">
                            Apply this first-aid session as a lens for my next quest creation/generation flow.
                        </span>
                    </label>

                    <button
                        type="button"
                        onClick={handleFinalizeSession}
                        disabled={isPending || !sessionId}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                        {isPending ? 'Finalizing...' : 'Complete emotional first aid'}
                    </button>
                </div>
            )}

            {stage === 'result' && result && (
                <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
                    <h2 className="text-xl font-bold text-white">Session complete</h2>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Stat label="Before" value={String(stuckBefore)} />
                        <Stat label="After" value={String(stuckAfter)} />
                        <Stat label="Delta" value={`${result.delta >= 0 ? '-' : '+'}${Math.abs(result.delta)}`} />
                    </div>

                    {result.mintedAmount > 0 ? (
                        <div className="rounded-xl border border-green-800/40 bg-green-950/30 p-4 text-green-200">
                            Nice shift. You reduced stuckness by at least {result.threshold} and minted{' '}
                            {result.mintedAmount === FIRST_AID_MINT_AMOUNT ? 'a' : result.mintedAmount}{' '}
                            Vibeulon.
                        </div>
                    ) : (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-zinc-300">
                            Session logged. No mint this round (need a {result.threshold}+ point stuckness drop).
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={resetFlow}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
                    >
                        Start another medbay session
                    </button>
                </div>
            )}

            {initialContext.recentSession && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                    <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Recent medbay log</p>
                    <p className="text-sm text-zinc-300">
                        {initialContext.recentSession.toolName || 'Protocol'} · Δ{initialContext.recentSession.delta ?? 0}
                        {initialContext.recentSession.mintedAmount > 0 && ` · +${initialContext.recentSession.mintedAmount}ⓥ`}
                    </p>
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
                    {error}
                </div>
            )}
        </div>
    )
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
            <div className="text-xl font-mono text-white">{value}</div>
        </div>
    )
}
