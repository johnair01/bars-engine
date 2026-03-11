'use client'

import { useState } from 'react'
import { KOTTER_STAGES, type KotterStage } from '@/lib/kotter'
import { CampaignStageModal } from './CampaignStageModal'

type CampaignStageCardProps = {
    currentStage: number
}

export function CampaignStageCard({ currentStage }: CampaignStageCardProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const stage = Math.max(1, Math.min(8, currentStage)) as KotterStage
    const info = KOTTER_STAGES[stage] || KOTTER_STAGES[1]

    return (
        <>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/50 transition text-left min-w-[140px]"
            >
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Campaign Stage</div>
                <div className="font-bold text-white flex items-center gap-2">
                    <span>{info.emoji}</span>
                    <span>Stage {stage}: {info.name}</span>
                </div>
                <div className="text-xs text-purple-400 font-mono mt-0.5">{info.move}</div>
            </button>
            <CampaignStageModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                currentStage={currentStage}
            />
        </>
    )
}
