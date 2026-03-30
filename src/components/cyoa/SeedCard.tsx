'use client'

import { CultivationCard } from '@/components/ui/CultivationCard'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'
import type { SpokeSeed } from '@/lib/narrative/collaborative-quest-api'

interface SeedCardProps {
    seed: SpokeSeed
    onClick?: () => void
    selected?: boolean
}

export function SeedCard({ seed, onClick, selected }: SeedCardProps) {
    const st = STAGE_TOKENS['seed']
    const progressPercent = Math.round((seed.wateringProgress.complete / seed.wateringProgress.total) * 100)

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer transition-transform active:scale-95 ${selected ? 'ring-2 ring-purple-500 rounded-xl' : ''}`}
        >
            <CultivationCard
                altitude="neutral"
                stage="seed"
                selected={selected}
                className="w-full"
            >
                <div className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{seed.title}</h4>
                        {seed.isAnchor && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase tracking-tighter font-black">
                                Anchor
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500">
                            {seed.creatorId.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-zinc-500">by {seed.creatorId === 'system' ? 'The Conclave' : `Player ${seed.creatorId.slice(-4)}`}</span>
                    </div>

                    {/* Watering Progress */}
                    <div className="pt-1">
                        <div className="flex justify-between text-[8px] uppercase tracking-widest text-zinc-600 mb-1">
                            <span>Growth</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </CultivationCard>
        </div>
    )
}
