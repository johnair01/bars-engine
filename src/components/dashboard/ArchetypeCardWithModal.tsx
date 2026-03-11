'use client'

import { useState } from 'react'
import { ArchetypeModal } from './ArchetypeModal'

type ArchetypeCardWithModalProps = {
    archetype: { name: string; description?: string | null; wakeUp?: string | null }
}

export function ArchetypeCardWithModal({ archetype }: ArchetypeCardWithModalProps) {
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-blue-900/20 border border-blue-900/50 rounded-lg hover:opacity-80 transition text-left"
            >
                <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-1">Archetype</div>
                <div className="text-blue-100 font-bold">{archetype.name}</div>
            </button>
            <ArchetypeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                archetype={archetype}
            />
        </>
    )
}
