'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { KOTTER_STAGES, type KotterStage } from '@/lib/kotter'

type CampaignStageModalProps = {
    open: boolean
    onClose: () => void
    currentStage: number
}

export function CampaignStageModal({ open, onClose, currentStage }: CampaignStageModalProps) {
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        },
        [onClose]
    )

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [open, handleEscape])

    if (!open) return null

    const stage = Math.max(1, Math.min(8, currentStage)) as KotterStage
    const info = KOTTER_STAGES[stage] || KOTTER_STAGES[1]
    const pct = (stage / 8) * 100

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            aria-label="Campaign stage details"
        >
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
                        {info.emoji}
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Global Phase</div>
                        <h2 className="text-xl font-bold text-white">
                            Stage {stage}: {info.name}
                        </h2>
                        <div className="text-sm text-purple-400 font-mono">{info.move}</div>
                    </div>
                </div>
                <div className="mb-4">
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                        Active players with the <strong>{info.trigram}</strong> nature can invoke <strong>{info.move}</strong> to advance this stage.
                    </div>
                </div>
                <Link
                    href="/story-clock"
                    className="block w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-lg transition-colors"
                >
                    View Story Clock →
                </Link>
            </div>
        </div>
    )
}
