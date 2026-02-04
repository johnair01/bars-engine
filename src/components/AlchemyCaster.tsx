'use client'

import { useState, useTransition } from 'react'
import { castAlchemyMove } from '@/actions/alchemy'

interface AlchemyCasterProps {
    moveName: string // e.g., "Wake Up", "Thunderclap"
    moveKey?: string // e.g. "wakeUp", "shock"
    description?: string // e.g. "Awareness"
    icon?: string
    isSpecial?: boolean
}

export function AlchemyCaster({ moveName, moveKey, description, icon, isSpecial }: AlchemyCasterProps) {
    const [isPending, startTransition] = useTransition()
    const [feedback, setFeedback] = useState<string | null>(null)

    const handleCast = () => {
        if (isPending) return
        startTransition(async () => {
            const result = await castAlchemyMove(moveName)
            if (result.success) {
                setFeedback('✨ Cast!')
                setTimeout(() => setFeedback(null), 2000)
            } else {
                setFeedback('❌ Failed')
                setTimeout(() => setFeedback(null), 2000)
            }
        })
    }

    if (isSpecial) {
        return (
            <button
                onClick={handleCast}
                disabled={isPending}
                className="group relative px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-300 hover:bg-blue-800/50 hover:border-blue-500 transition-all disabled:opacity-50"
            >
                <span className={isPending ? 'opacity-50' : ''}>{moveName}</span>
                {feedback && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-2">
                        {feedback}
                    </span>
                )}
            </button>
        )
    }

    return (
        <button
            onClick={handleCast}
            disabled={isPending}
            className={`w-full text-left group relative bg-zinc-900/30 border border-zinc-800 p-3 rounded-lg hover:border-zinc-500 hover:bg-zinc-800/50 transition-all disabled:opacity-50`}
        >
            <div className="flex items-center gap-2 mb-1">
                <span>{icon || '✨'}</span>
                <span className="text-xs uppercase text-zinc-500 font-bold group-hover:text-zinc-300 transition-colors">
                    {moveName}
                </span>
            </div>
            <div className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {description || 'Cast this move'}
            </div>

            {/* Feedback Popover */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm z-10 animate-in fade-in">
                    <span className="text-xs font-bold text-white">{feedback}</span>
                </div>
            )}

            {/* Loading Spinner Overlay */}
            {isPending && !feedback && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                </div>
            )}
        </button>
    )
}
