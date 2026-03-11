'use client'

import { useState } from 'react'
import { NationModal } from './NationModal'

type NationCardWithModalProps = {
    nation: { id: string; name: string; description: string }
}

export function NationCardWithModal({ nation }: NationCardWithModalProps) {
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-purple-900/20 border border-purple-900/50 rounded-lg hover:opacity-80 transition text-left"
            >
                <div className="text-[10px] uppercase tracking-widest text-purple-400 mb-1">Nation</div>
                <div className="text-purple-100 font-bold">{nation.name}</div>
            </button>
            <NationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                nation={nation}
            />
        </>
    )
}
