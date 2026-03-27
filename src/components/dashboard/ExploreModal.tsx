'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'

type ExploreModalProps = {
    open: boolean
    onClose: () => void
}

export function ExploreModal({ open, onClose }: ExploreModalProps) {
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            aria-label="Explore"
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
                <h2 className="text-xl font-bold text-white mb-4">Explore</h2>
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
                    <Link
                        href="/game-map"
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Navigation</div>
                        <div className="text-zinc-200 font-bold">Game Map</div>
                    </Link>
                    <Link
                        href="/library"
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Grow Up</div>
                        <div className="text-zinc-200 font-bold">Quest Library</div>
                    </Link>
                </div>
                <Link
                    href="/game-map"
                    onClick={onClose}
                    className="block w-full py-2 px-4 bg-zinc-700 hover:bg-zinc-600 text-white text-center font-medium rounded-lg transition-colors"
                >
                    View full page →
                </Link>
            </div>
        </div>
    )
}
