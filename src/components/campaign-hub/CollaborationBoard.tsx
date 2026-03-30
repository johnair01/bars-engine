'use client'

import { useState, useEffect } from 'react'
import { getSpokeMoveBeds } from '@/actions/spoke-move-seeds'
import type { BedSnapshot } from '@/actions/spoke-move-seeds'
import { SeedGrowthCard } from './SeedGrowthCard'

interface CollaborationBoardProps {
    campaignRef: string
}

export function CollaborationBoard({ campaignRef }: CollaborationBoardProps) {
    const [bedsBySpoke, setBedsBySpoke] = useState<Record<number, BedSnapshot[]>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadAllBeds() {
            setIsLoading(true)
            const spokeIndices = [0, 1, 2, 3, 4, 5, 6, 7]
            const results: Record<number, BedSnapshot[]> = {}

            try {
                await Promise.all(
                    spokeIndices.map(async (idx) => {
                        const res = await getSpokeMoveBeds({ campaignRef, spokeIndex: idx })
                        if ('beds' in res) {
                            results[idx] = res.beds
                        }
                    })
                )
                setBedsBySpoke(results)
            } catch (e) {
                setError('Failed to load nursery beds')
            } finally {
                setIsLoading(false)
            }
        }

        loadAllBeds()
    }, [campaignRef])

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-64 bg-zinc-900/50 rounded-2xl border border-zinc-800" />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-900/10 border border-red-900/30 rounded-2xl">
                <p className="text-red-400 font-medium">{error}</p>
            </div>
        )
    }

    const hasAnySeeds = Object.values(bedsBySpoke).some(beds =>
        beds.some(bed => bed.anchorBarId || bed.kernels.length > 0)
    )

    if (!hasAnySeeds) {
        return (
            <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl border-dashed">
                <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Nursery is Empty</h3>
                <p className="text-zinc-500 mt-2">No seeds have been planted in this campaign yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            {Object.entries(bedsBySpoke).map(([spokeIdx, beds]) => {
                const activeBeds = beds.filter(bed => bed.anchorBarId || bed.kernels.length > 0)
                if (activeBeds.length === 0) return null

                return (
                    <div key={spokeIdx} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Spoke {spokeIdx}</h3>
                            <div className="h-px flex-1 bg-zinc-800" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeBeds.map((bed) => (
                                <div key={bed.moveType} className="space-y-4">
                                    <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 px-2">
                                        Move Bed: {bed.moveType}
                                    </div>

                                    {/* Anchor */}
                                    {bed.anchorBarId && (
                                        <SeedGrowthCard
                                            waterLevel={100} // Anchors are "fully grown"
                                            face="sage" // Use balanced face for anchor
                                            title={bed.anchorTitle || 'Spoke Anchor'}
                                            className="ring-2 ring-purple-500/20"
                                        />
                                    )}

                                    {/* Kernels */}
                                    {bed.kernels.map((kernel) => (
                                        <SeedGrowthCard
                                            key={kernel.id}
                                            waterLevel={(kernel.wateringComplete / kernel.wateringTotal) * 100}
                                            face="regent" // Default growth logic
                                            title={kernel.title}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
