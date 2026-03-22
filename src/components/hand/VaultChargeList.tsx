'use client'

import { ChargeBarCard } from '@/components/hand/ChargeBarCard'
import { VaultLoadMore } from '@/components/hand/VaultLoadMore'

type ChargeBar = {
    id: string
    title: string
    description: string
    createdAt: Date
    assets?: { id: string; url: string; mimeType?: string | null; metadataJson?: string | null }[]
}

type VaultChargeListProps = {
    bars: ChargeBar[]
    totalCount: number
}

export function VaultChargeList({ bars, totalCount }: VaultChargeListProps) {
    return (
        <div className="space-y-2">
            {totalCount > bars.length ? (
                <p className="text-xs text-zinc-600">
                    Showing {bars.length} of {totalCount} (newest first). Older captures may be on your BAR pages.
                </p>
            ) : null}
            <VaultLoadMore total={bars.length}>
                {(visible) => (
                    <div className="space-y-2">
                        {bars.slice(0, visible).map((bar) => (
                            <ChargeBarCard key={bar.id} bar={bar} />
                        ))}
                    </div>
                )}
            </VaultLoadMore>
        </div>
    )
}
