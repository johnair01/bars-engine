'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'

type ArchetypeModalProps = {
    open: boolean
    onClose: () => void
    archetype: { name: string; description?: string | null; wakeUp?: string | null }
}

export function ArchetypeModal({ open, onClose, archetype }: ArchetypeModalProps) {
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

    const desc = (archetype.description || archetype.wakeUp || '').trim().slice(0, 300)
    const fullDesc = archetype.description || archetype.wakeUp || ''
    const truncated = fullDesc.length > 300

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            aria-label="Archetype details"
        >
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative max-w-md w-full rounded-2xl border border-blue-900/50 bg-zinc-950 p-6 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>
                <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-2">Archetype</div>
                <h2 className="text-xl font-bold text-blue-100 mb-3">{archetype.name}</h2>
                {desc && (
                    <p className="text-sm text-zinc-400 mb-4">
                        {desc}
                        {truncated && '…'}
                    </p>
                )}
                <Link
                    href="/archetype"
                    className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-center font-medium rounded-lg transition-colors"
                >
                    View full page →
                </Link>
            </div>
        </div>
    )
}
