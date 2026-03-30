'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { lookupCardArt, QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'
import { useNation } from '@/lib/ui/nation-provider'
import { STAGE_TOKENS, ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

type NationModalProps = {
    open: boolean
    onClose: () => void
    nation: { id: string; name: string; description: string }
}

export function NationModal({ open, onClose, nation }: NationModalProps) {
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

    const { element: contextElement, archetypeName } = useNation()
    const resolvedElement = contextElement ?? 'earth'

    if (!open) return null

    const desc = nation.description?.trim().slice(0, 300)
    const truncated = nation.description && nation.description.length > 300

    const artEntry = lookupCardArt(archetypeName ?? 'bold-heart', resolvedElement)
    const isQuarantined = artEntry ? QUARANTINED_CARD_KEYS.has(artEntry.key) : false

    const st = STAGE_TOKENS['seed']
    const textAccent = ELEMENT_TOKENS[resolvedElement].textAccent

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            aria-label="Nation details"
        >
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <CultivationCard stage="seed" altitude="neutral" element={resolvedElement} className="relative max-w-md w-full shadow-2xl p-0 overflow-hidden flex flex-col z-10">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors z-20 mix-blend-difference bg-black/20"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Modal Art Window */}
                <div className={`card-art-window relative overflow-hidden ${st.artWindowHeight} min-h-[140px] bg-black`}>
                    {isQuarantined && <div className="absolute inset-0 skeleton-shimmer bg-black/40" />}
                    {artEntry && !isQuarantined && (
                        <img src={artEntry.publicPath} className={`w-full h-full object-cover object-[center_30%] ${st.artOpacity}`} alt="" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-transparent to-transparent opacity-100" />
                </div>

                <div className="p-6 pt-2">
                    <div className={`text-[10px] uppercase tracking-widest ${textAccent} mb-2`}>Nation</div>
                    <h2 className={`text-xl font-bold ${textAccent} mb-3`}>{nation.name}</h2>
                    {desc && (
                        <p className="text-sm text-zinc-400 mb-4 font-mono leading-relaxed">
                            {desc}
                            {truncated && '…'}
                        </p>
                    )}
                    <Link
                        href={`/nation/${nation.id}`}
                        className="block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-center font-bold font-mono tracking-widest uppercase text-xs rounded-xl transition-colors border border-zinc-700"
                    >
                        View full page →
                    </Link>
                </div>
            </CultivationCard>
        </div>
    )
}
