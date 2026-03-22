'use client'

import { InvitationBarCard } from '@/components/hand/InvitationBarCard'
import { VaultLoadMore } from '@/components/hand/VaultLoadMore'

type Bar = {
    id: string
    title: string
    invite: { token: string } | null
}

type VaultInvitationBarsListProps = {
    bars: Bar[]
    totalCount: number
    baseUrl: string
}

export function VaultInvitationBarsList({ bars, totalCount, baseUrl }: VaultInvitationBarsListProps) {
    return (
        <div className="space-y-3">
            {totalCount > bars.length ? (
                <p className="text-xs text-zinc-600">
                    Showing {bars.length} of {totalCount} invitation BARs (newest first).
                </p>
            ) : null}
            <p className="text-zinc-500 text-sm">Share these with invitees. Copy the invite or claim URL.</p>
            <VaultLoadMore total={bars.length}>
                {(visible) => (
                    <div className="space-y-3">
                        {bars.slice(0, visible).map((bar) => (
                            <InvitationBarCard
                                key={bar.id}
                                barId={bar.id}
                                title={bar.title}
                                token={bar.invite?.token ?? ''}
                                baseUrl={baseUrl}
                            />
                        ))}
                    </div>
                )}
            </VaultLoadMore>
        </div>
    )
}
