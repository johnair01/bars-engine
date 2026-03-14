'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Avatar } from './Avatar'

type AvatarModalProps = {
    open: boolean
    onClose: () => void
    player: { name: string; avatarConfig?: string | null; pronouns?: string | null }
}

export function AvatarModal({ open, onClose, player }: AvatarModalProps) {
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
            aria-label="Avatar preview"
        >
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
                <Avatar player={player} size="xl" />
                <p className="text-lg font-medium text-white">{player.name}</p>
                <Link
                    href="/reliquary"
                    onClick={onClose}
                    className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                    Reliquary →
                </Link>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
