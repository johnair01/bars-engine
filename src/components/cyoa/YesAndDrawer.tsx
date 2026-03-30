'use client'

import { useState, useEffect } from 'react'
import { SeedCard } from './SeedCard'
import { useSpokeQuest } from '@/hooks/useSpokeQuest'
import { listMyBars } from '@/actions/bars'
import type { PersonalMoveType } from '@/lib/quest-grammar/types'

interface YesAndDrawerProps {
    runId: string
    nodeId: string
    moveType: PersonalMoveType
    campaignRef?: string
    spokeIndex?: number
    onSuccess: (newRunId: string) => void
    onClose: () => void
}

export function YesAndDrawer({
    runId,
    nodeId,
    moveType,
    campaignRef,
    spokeIndex,
    onSuccess,
    onClose,
}: YesAndDrawerProps) {
    const { seeds, isLoading: seedsLoading, fetchSeedsForMove, handleYesAnd } = useSpokeQuest({
        runId,
        campaignRef,
        spokeIndex,
    })

    const [myBars, setMyBars] = useState<any[]>([])
    const [selectedSeed, setSelectedSeed] = useState<string | null>(null)
    const [selectedMyBar, setSelectedMyBar] = useState<string | null>(null)
    const [isBranching, setIsBranching] = useState(false)

    useEffect(() => {
        fetchSeedsForMove(moveType)
        // Fetch player's personal BARs
        listMyBars().then(setMyBars)
    }, [moveType, fetchSeedsForMove])

    const handleBranch = async () => {
        const barId = selectedMyBar || selectedSeed
        if (!barId) return

        setIsBranching(true)
        const isNewSeed = !!selectedMyBar
        const newRunId = await handleYesAnd(nodeId, barId, isNewSeed, moveType)
        if (newRunId) {
            onSuccess(newRunId)
        }
        setIsBranching(false)
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 pb-12 shadow-2xl shadow-purple-500/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Yes-And Branch</h3>
                        <p className="text-xs text-zinc-500 font-medium">Add your perspective to this narrative thread.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500">
                        <span className="sr-only">Close</span>
                        ×
                    </button>
                </div>

                {/* Nursery Seeds */}
                <div className="space-y-4 mb-8">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">Nursery Seeds (Potential)</h4>
                    {seedsLoading ? (
                        <div className="grid grid-cols-2 gap-3 animate-pulse">
                            <div className="h-24 bg-zinc-900 rounded-xl" />
                            <div className="h-24 bg-zinc-900 rounded-xl" />
                        </div>
                    ) : seeds.length === 0 ? (
                        <p className="text-sm text-zinc-700 italic py-4">No seeds yet. Be the first mover.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {seeds.map((seed) => (
                                <SeedCard
                                    key={seed.id}
                                    seed={seed}
                                    selected={selectedSeed === seed.id}
                                    onClick={() => {
                                        setSelectedSeed(seed.id)
                                        setSelectedMyBar(null)
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Your BARs */}
                <div className="space-y-4 mb-8">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">Your Vault (Personal Reflection)</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {myBars.length === 0 ? (
                            <div className="p-4 border border-zinc-900 rounded-xl w-full text-center">
                                <p className="text-xs text-zinc-700">No active BARs in your vault.</p>
                            </div>
                        ) : myBars.map((bar) => (
                            <button
                                key={bar.id}
                                onClick={() => {
                                    setSelectedMyBar(bar.id)
                                    setSelectedSeed(null)
                                }}
                                className={`flex-none w-32 p-3 bg-zinc-900 border text-left transition-all ${selectedMyBar === bar.id ? 'border-purple-500 ring-1 ring-purple-500' : 'border-zinc-800'
                                    } rounded-xl`}
                            >
                                <div className="text-[10px] font-bold text-zinc-300 line-clamp-2">{bar.title}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action */}
                <button
                    disabled={isBranching || (!selectedSeed && !selectedMyBar)}
                    onClick={handleBranch}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-xl shadow-purple-900/40 uppercase tracking-widest text-sm disabled:opacity-50"
                >
                    {isBranching ? 'Bridging Worlds...' : 'Confirm Yes-And'}
                </button>
            </div>
        </div>
    )
}
