'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { advanceStoryPeriod, startStoryClock, triggerTilt } from '@/actions/world'

interface AdminTiltControlProps {
    currentAct: number
    currentPeriod: number
    hexagramSequence: string
}

export function AdminTiltControl({ currentAct, currentPeriod, hexagramSequence }: AdminTiltControlProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)
    const sequence = safeParseSequence(hexagramSequence)
    const periods = chunkIntoPeriods(sequence, 8)
    const derivedAct = currentPeriod >= 5 ? 2 : 1

    const handleTilt = () => {
        if (!confirm('WARNING: Triggering The Tilt is irreversible. Are you sure you want to advance to Act 2?')) return

        startTransition(async () => {
            const res = await triggerTilt()
            if (res.success) {
                setFeedback('The Tilt has begun.')
                router.refresh()
            } else {
                setFeedback(res.error || 'Failed to Tilt')
            }
        })
    }

    const handleStartClock = () => {
        if (!confirm('Start Story Clock run? This creates a stable 64-hexagram order split into 8 periods.')) return

        startTransition(async () => {
            const res = await startStoryClock()
            if ('error' in res) {
                setFeedback(res.error || 'Failed to start Story Clock')
                return
            }
            setFeedback('Story Clock run started.')
            router.refresh()
        })
    }

    const handleAdvancePeriod = () => {
        startTransition(async () => {
            const res = await advanceStoryPeriod()
            if ('error' in res) {
                setFeedback(res.error || 'Failed to advance period')
                return
            }
            setFeedback(`Advanced to Period ${res.period} (Act ${res.act})`)
            router.refresh()
        })
    }

    return (
        <div className="p-6 bg-gradient-to-br from-red-900/20 to-black border border-red-900/50 rounded-lg space-y-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{derivedAct >= 2 ? '🌪️' : '⚖️'}</span>
                <div>
                    <h3 className="text-white font-bold">
                        Act {derivedAct}: {derivedAct === 1 ? 'Equilibrium' : 'The Tilt'}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        Period {currentPeriod}/8 • {derivedAct === 1 ? 'The world is stable. For now.' : 'The world is in aftermath mode.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={handleStartClock}
                    disabled={isPending}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50"
                >
                    {isPending ? 'Working...' : 'Start Story Clock'}
                </button>
                <button
                    onClick={handleAdvancePeriod}
                    disabled={isPending || currentPeriod >= 8}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50"
                >
                    {isPending ? 'Working...' : 'Advance Period'}
                </button>
                <button
                    onClick={handleTilt}
                    disabled={isPending || currentAct >= 2}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50"
                >
                    {isPending ? 'Tilting...' : '⚠️ Trigger The Tilt'}
                </button>
            </div>

            <div className="border border-zinc-800 rounded p-3 bg-black/40">
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Story Clock Run (8×8)</div>
                <div className="grid grid-cols-2 gap-2">
                    {periods.map((periodHexagrams, idx) => (
                        <div
                            key={idx}
                            className={`rounded border p-2 text-xs ${idx + 1 === currentPeriod ? 'border-purple-500 bg-purple-900/20' : 'border-zinc-800 bg-zinc-900/30'
                                }`}
                        >
                            <div className="text-zinc-300 font-bold">P{idx + 1} • Act {idx < 4 ? 1 : 2}</div>
                            <div className="text-zinc-500 truncate">{periodHexagrams.join(', ') || '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {feedback && (
                <div className="text-center text-sm text-red-300 font-bold animate-pulse">
                    {feedback}
                </div>
            )}
        </div>
    )
}

function safeParseSequence(raw: string) {
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            return parsed.filter((value): value is number => typeof value === 'number')
        }
        return []
    } catch {
        return []
    }
}

function chunkIntoPeriods(sequence: number[], periodCount: number) {
    return Array.from({ length: periodCount }, (_, periodIdx) =>
        sequence.slice(periodIdx * 8, periodIdx * 8 + 8)
    )
}
