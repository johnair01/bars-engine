'use client'

import React, { useState } from 'react'
import { LibraryFilterPills, FilterState } from './LibraryFilterPills'
import { ArtifactProvenance } from '@/actions/library-provenance'
import { Package, CheckCircle2, Search, Info } from 'lucide-react'

interface LibraryViewProps {
    provenance: ArtifactProvenance[]
}

export function LibraryView({ provenance }: LibraryViewProps) {
    const [filters, setFilters] = useState<FilterState>({ type: null, phase: null })

    const filtered = provenance.filter((item) => {
        if (filters.type && item.classification.type !== filters.type) return false
        if (filters.phase && item.classification.phase !== filters.phase) return false
        return true
    })

    return (
        <div className="space-y-10">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                        <Search className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">The Library</h1>
                        <p className="text-zinc-500 text-sm">Review the provenance of your metabolized artifacts.</p>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <LibraryFilterPills filters={filters} setFilters={setFilters} />
                </div>
            </header>

            <main className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Historical Ledger ({filtered.length})
                    </h2>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl space-y-4">
                        <div className="text-4xl text-zinc-700">📜</div>
                        <p className="text-zinc-500 font-medium">No artifacts matching these resonant frequencies found.</p>
                        <button 
                            onClick={() => setFilters({ type: null, phase: null })}
                            className="text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-widest"
                        >
                            Reset Patterns
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((item, i) => (
                            <div
                                key={item.id}
                                className="group relative flex items-start gap-4 p-5 bg-zinc-900/40 border border-zinc-800 rounded-3xl hover:border-amber-500/50 hover:bg-zinc-800/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:bg-amber-900/30 group-hover:border-amber-500/50 transition-colors">
                                    <Package className="w-5 h-5 text-zinc-500 group-hover:text-amber-400" />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">
                                                {item.classification.type}
                                            </span>
                                            <span className="text-zinc-700">•</span>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                {item.classification.phase}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-zinc-600 font-mono">
                                            {new Date(item.acquiredAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="text-white font-bold group-hover:text-amber-200 transition-colors leading-tight">
                                        {item.title}
                                    </h3>
                                    
                                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 italic">
                                        "{item.description}"
                                    </p>

                                    {item.storyName && (
                                        <div className="pt-2 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Info className="w-3 h-3 text-zinc-500" />
                                            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">
                                                Provenance: {item.storyName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
