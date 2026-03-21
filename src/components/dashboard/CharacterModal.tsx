'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { NationCardWithModal } from './NationCardWithModal'
import { ArchetypeCardWithModal } from './ArchetypeCardWithModal'

type CharacterModalProps = {
    open: boolean
    onClose: () => void
    player: {
        nation?: { id: string; name: string; description: string; element?: string } | null
        archetype?: { name: string; description?: string | null; wakeUp?: string | null } | null
        roles: { id: string; role: { key: string } }[]
    }
}

export function CharacterModal({ open, onClose, player }: CharacterModalProps) {
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
            aria-label="Character"
        >
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>
                <h2 className="text-xl font-bold text-white mb-4">Character</h2>
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
                    {player.nation && (
                        <NationCardWithModal nation={{ id: player.nation.id, name: player.nation.name, description: player.nation.description }} element={player.nation.element} />
                    )}
                    {player.archetype && (
                        <ArchetypeCardWithModal archetype={{ name: player.archetype.name, description: player.archetype.description, wakeUp: player.archetype.wakeUp }} />
                    )}
                    {player.roles.length > 0 && (
                        <div className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                            <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Roles</div>
                            <div className="flex gap-2">
                                {player.roles.map(r => (
                                    <span key={r.id} className="text-zinc-300 font-medium">{r.role.key}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <Link
                        href="/campaign"
                        onClick={onClose}
                        className="px-4 py-2 bg-emerald-900/20 border border-emerald-800/50 rounded-lg hover:border-emerald-600/60 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Story</div>
                        <div className="text-emerald-100 font-bold">Begin the Journey</div>
                    </Link>
                    <Link
                        href="/reliquary"
                        onClick={onClose}
                        className="px-4 py-2 bg-amber-900/20 border border-amber-800/50 rounded-lg hover:border-amber-600/60 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">Reliquary</div>
                        <div className="text-amber-100 font-bold">Blessed Objects</div>
                    </Link>
                </div>
                <div className="flex flex-col gap-2">
                    <Link
                        href="/character/create"
                        onClick={onClose}
                        className="block w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-lg transition-colors"
                    >
                        Ouroboros Interview
                    </Link>
                    <Link
                        href="/campaign"
                        onClick={onClose}
                        className="block w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-medium rounded-lg transition-colors"
                    >
                        View full page →
                    </Link>
                </div>
            </div>
        </div>
    )
}
