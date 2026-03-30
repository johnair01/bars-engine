'use client'

import { useState } from 'react'
import { ArchetypeModal } from './ArchetypeModal'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { lookupCardArt, QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'
import { useNation } from '@/lib/ui/nation-provider'
import { STAGE_TOKENS, ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

type ArchetypeCardWithModalProps = {
    archetype: { name: string; description?: string | null; wakeUp?: string | null }
}

export function ArchetypeCardWithModal({ archetype }: ArchetypeCardWithModalProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const { element: contextElement } = useNation()
    const resolvedElement = contextElement ?? 'earth'

    const artEntry = lookupCardArt(archetype.name, resolvedElement)
    const isQuarantined = artEntry ? QUARANTINED_CARD_KEYS.has(artEntry.key) : false

    const st = STAGE_TOKENS['seed']
    const textAccent = ELEMENT_TOKENS[resolvedElement].textAccent

    return (
        <>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="hover:opacity-80 transition text-left h-24 w-40 block relative"
            >
                <CultivationCard stage="seed" altitude="neutral" element={resolvedElement} className="w-full h-full p-0 flex flex-col justify-end overflow-hidden pb-2 px-3 shadow-lg">
                    {/* Art Window */}
                    <div className={`card-art-window absolute top-0 left-0 right-0 overflow-hidden ${st.artWindowHeight} rounded-t-xl bg-black/40`}>
                        {isQuarantined && <div className="absolute inset-0 skeleton-shimmer bg-black/40" />}
                        {artEntry && !isQuarantined && (
                            <img src={artEntry.publicPath} className={`w-full h-full object-cover object-[center_30%] ${st.artOpacity}`} alt="" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    </div>
                    {/* Content */}
                    <div className="relative z-10 mt-auto">
                        <div className={`text-[10px] uppercase tracking-widest ${textAccent} mb-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]`}>Archetype</div>
                        <div className={`font-bold ${textAccent} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate leading-tight`}>{archetype.name}</div>
                    </div>
                </CultivationCard>
            </button>
            <ArchetypeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                archetype={archetype}
            />
        </>
    )
}
