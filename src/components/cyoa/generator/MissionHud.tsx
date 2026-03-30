'use client'

import React from 'react'

interface MissionHudProps {
    mission?: string
    stage?: string
}

export function MissionHud({ mission, stage }: MissionHudProps) {
    return (
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-zinc-400 text-xs font-mono uppercase tracking-widest">
                        Mission: <span className="text-zinc-100">{mission || 'Unassigned'}</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono">Stage:</span>
                    <div className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-400 text-[10px] font-mono">
                        {stage || 'WAKE UP'}
                    </div>
                </div>
            </div>
        </div>
    )
}
