'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    advanceClock,
    pauseStoryClock,
    resumeStoryClock,
    resetStoryClock,
    setStoryClockRolloverPolicy,
    startStoryClock,
    type StoryClockRolloverPolicy
} from '@/actions/world'

interface AdminClockControlsProps {
    isPaused: boolean
    rolloverPolicy: StoryClockRolloverPolicy
}

export function AdminClockControls({ isPaused, rolloverPolicy: initialRolloverPolicy }: AdminClockControlsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)
    const [rolloverPolicy, setRolloverPolicy] = useState<StoryClockRolloverPolicy>(initialRolloverPolicy)

    const handleAdvance = () => {
        startTransition(async () => {
            const res = await advanceClock(1)
            if ('error' in res) {
                setFeedback(res.error || 'Failed to advance')
            } else {
                setFeedback(`Advanced to Clock ${res.clock}, Period ${res.period}`)
                router.refresh()
                setTimeout(() => setFeedback(null), 3000)
            }
        })
    }

    const handlePauseResume = () => {
        startTransition(async () => {
            const res = isPaused ? await resumeStoryClock() : await pauseStoryClock()
            setFeedback(isPaused ? 'Clock resumed' : 'Clock paused')
            router.refresh()
            setTimeout(() => setFeedback(null), 2000)
        })
    }

    const handleReset = () => {
        if (!confirm('⚠️ WARNING: Resetting the Story Clock will archive all current story quests and generate a new 64-hexagram sequence. This action is IRREVERSIBLE. Continue?')) {
            return
        }

        startTransition(async () => {
            const res = await resetStoryClock()
            if ('error' in res) {
                setFeedback(res.error || 'Failed to reset')
            } else {
                setFeedback('Story Clock has been reset!')
                router.refresh()
                setTimeout(() => setFeedback(null), 3000)
            }
        })
    }

    const handleStart = () => {
        if (!confirm('Start the Story Clock? This will generate 8 new quests for Period 1.')) {
            return
        }

        startTransition(async () => {
            const res = await startStoryClock()
            if ('error' in res) {
                setFeedback(res.error || 'Failed to start')
            } else {
                setFeedback('Story Clock started!')
                router.refresh()
                setTimeout(() => setFeedback(null), 3000)
            }
        })
    }

    const handleSetRolloverPolicy = (policy: StoryClockRolloverPolicy) => {
        startTransition(async () => {
            const res = await setStoryClockRolloverPolicy(policy)
            if ('error' in res) {
                setFeedback(res.error || 'Failed to update rollover policy')
            } else {
                setRolloverPolicy(res.policy)
                setFeedback(
                    res.policy === 'archive_unfinished'
                        ? 'Rollover policy set: archive unfinished quests on period advance.'
                        : 'Rollover policy set: carry unfinished quests into later periods.'
                )
                router.refresh()
                setTimeout(() => setFeedback(null), 3000)
            }
        })
    }

    return (
        <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-900/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚙️</span>
                <div>
                    <h3 className="text-white font-bold">Admin Controls</h3>
                    <p className="text-sm text-zinc-400">Manage the Story Clock progression</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleAdvance}
                    disabled={isPending || isPaused}
                    className="flex-1 min-w-[150px] py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Processing...' : '⏩ Advance Clock'}
                </button>

                <button
                    onClick={handlePauseResume}
                    disabled={isPending}
                    className="flex-1 min-w-[150px] py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded transition disabled:opacity-50"
                >
                    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>

                <button
                    onClick={handleReset}
                    disabled={isPending}
                    className="flex-1 min-w-[150px] py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition disabled:opacity-50"
                >
                    🔄 Reset Clock
                </button>

                <button
                    onClick={handleStart}
                    disabled={isPending}
                    className="flex-1 min-w-[150px] py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition disabled:opacity-50"
                >
                    🚀 Start Clock
                </button>
            </div>

            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                <p className="text-xs text-zinc-400 mb-2">
                    Period rollover policy for unfinished story quests
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleSetRolloverPolicy('carry_unfinished')}
                        disabled={isPending}
                        className={`px-3 py-2 rounded text-sm font-bold transition disabled:opacity-50 ${
                            rolloverPolicy === 'carry_unfinished'
                                ? 'bg-emerald-900/60 border border-emerald-700 text-emerald-200'
                                : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                    >
                        Carry unfinished forward
                    </button>
                    <button
                        onClick={() => handleSetRolloverPolicy('archive_unfinished')}
                        disabled={isPending}
                        className={`px-3 py-2 rounded text-sm font-bold transition disabled:opacity-50 ${
                            rolloverPolicy === 'archive_unfinished'
                                ? 'bg-amber-900/60 border border-amber-700 text-amber-200'
                                : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                    >
                        Archive unfinished on advance
                    </button>
                </div>
            </div>

            {feedback && (
                <div className="mt-4 text-center text-sm font-bold text-purple-300 animate-pulse">
                    {feedback}
                </div>
            )}

            <div className="mt-4 text-xs text-zinc-600 italic">
                Note: Admin controls will only work if you have admin or engineer role.
            </div>
        </div>
    )
}
