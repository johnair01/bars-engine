'use client'

import React from 'react'

export type FilterState = {
    type: string | null
    phase: string | null
}

interface LibraryFilterPillsProps {
    filters: FilterState
    setFilters: (filters: FilterState) => void
}

const TYPES = ['perception', 'identity', 'relational', 'systemic']
const PHASES = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

const TYPE_LABELS: Record<string, string> = {
    perception: 'Perception (Shaman/Sage)',
    identity: 'Identity (Challenger)',
    relational: 'Relational (Diplomat)',
    systemic: 'Systemic (Architect/Regent)',
}

const PHASE_LABELS: Record<string, string> = {
    wakeUp: 'Wake Up',
    cleanUp: 'Clean Up',
    growUp: 'Grow Up',
    showUp: 'Show Up',
}

export function LibraryFilterPills({ filters, setFilters }: LibraryFilterPillsProps) {
    const toggleType = (type: string) => {
        setFilters({ ...filters, type: filters.type === type ? null : type })
    }

    const togglePhase = (phase: string) => {
        setFilters({ ...filters, phase: filters.phase === phase ? null : phase })
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Classification</h3>
                <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                        <button
                            key={t}
                            onClick={() => toggleType(t)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                filters.type === t
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                        >
                            {TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Phase</h3>
                <div className="flex flex-wrap gap-2">
                    {PHASES.map((p) => (
                        <button
                            key={p}
                            onClick={() => togglePhase(p)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                filters.phase === p
                                    ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/40'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                        >
                            {PHASE_LABELS[p]}
                        </button>
                    ))}
                </div>
            </div>

            {(filters.type || filters.phase) && (
                <button
                    onClick={() => setFilters({ type: null, phase: null })}
                    className="text-[10px] text-zinc-500 hover:text-white underline underline-offset-4 uppercase tracking-widest"
                >
                    Clear Filters
                </button>
            )}
        </div>
    )
}
