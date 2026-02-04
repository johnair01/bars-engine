'use client'

import { KOTTER_STAGES, KotterStage } from '@/lib/kotter'

interface KotterGaugeProps {
    currentStage: number
    label?: string
}

export function KotterGauge({ currentStage, label }: KotterGaugeProps) {
    // Ensure stage is valid (clamp 1-8)
    const stage = Math.max(1, Math.min(8, currentStage)) as KotterStage
    const info = KOTTER_STAGES[stage] || KOTTER_STAGES[1]

    // Calculate percentage for a simple progress bar or rotation
    const pct = (stage / 8) * 100

    return (
        <div className="relative group p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Background Track */}
            <div className="absolute bottom-0 left-0 h-1 bg-zinc-800 w-full">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg shadow-inner">
                        {info.emoji}
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">
                            {label || 'Cycle of Change'}
                        </div>
                        <div className="font-bold text-white flex items-center gap-2">
                            <span>Stage {stage}: {info.name}</span>
                            <span className="text-xs font-normal text-zinc-600 px-1.5 py-0.5 border border-zinc-700 rounded">
                                {info.trigram}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-right text-zinc-500">
                    <div className="uppercase tracking-widest mb-1">Move</div>
                    <div className="font-mono text-purple-400">{info.move}</div>
                </div>
            </div>

            {/* Tooltip-ish description on hover */}
            <div className="h-0 group-hover:h-auto overflow-hidden transition-all">
                <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
                    Active players with the <strong>{info.trigram}</strong> nature can invoke <strong>{info.move}</strong> to advance this stage.
                </div>
            </div>
        </div>
    )
}
