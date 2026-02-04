'use client'

import { useState, useTransition } from 'react'
import { triggerTilt } from '@/actions/world'

interface AdminTiltControlProps {
    currentAct: number
}

export function AdminTiltControl({ currentAct }: AdminTiltControlProps) {
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)

    const handleTilt = () => {
        if (!confirm('WARNING: Triggering The Tilt is irreversible. Are you sure you want to advance to Act 2?')) return

        startTransition(async () => {
            const res = await triggerTilt()
            if (res.success) {
                setFeedback('The Tilt has begun.')
            } else {
                setFeedback(res.error || 'Failed to Tilt')
            }
        })
    }

    if (currentAct >= 2) {
        return (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌪️</span>
                    <div>
                        <h3 className="text-white font-bold">Act 2: The Tilt</h3>
                        <p className="text-sm text-zinc-400">The world is currently in the Aftermath.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gradient-to-br from-red-900/20 to-black border border-red-900/50 rounded-lg space-y-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">⚖️</span>
                <div>
                    <h3 className="text-white font-bold">Act 1: Equilibrium</h3>
                    <p className="text-sm text-zinc-400">The world is stable. For now.</p>
                </div>
            </div>

            <button
                onClick={handleTilt}
                disabled={isPending}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50"
            >
                {isPending ? 'Tilting...' : '⚠️ Trigger The Tilt'}
            </button>

            {feedback && (
                <div className="text-center text-sm text-red-300 font-bold animate-pulse">
                    {feedback}
                </div>
            )}
        </div>
    )
}
