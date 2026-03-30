'use client'

import React from 'react'
import { CmaEdge } from '@/lib/modular-cyoa-graph/types'

interface BranchFlavorEditorProps {
    edge: CmaEdge
    onUpdate: (edgeId: string, updates: Partial<CmaEdge>) => void
}

const LENSES = [
    { id: 'shaman', label: 'Shaman', color: 'text-purple-400', desc: 'Internal / Intuitive' },
    { id: 'challenger', label: 'Challenger', color: 'text-red-400', desc: 'Direct / Stern' },
    { id: 'regent', label: 'Regent', color: 'text-blue-400', desc: 'Structured / Formal' },
    { id: 'architect', label: 'Architect', color: 'text-emerald-400', desc: 'Logical / Systems' },
    { id: 'diplomat', label: 'Diplomat', color: 'text-amber-400', desc: 'Relational / Soft' },
    { id: 'sage', label: 'Sage', color: 'text-zinc-400', desc: 'Objective / Distant' },
]

export function BranchFlavorEditor({ edge, onUpdate }: BranchFlavorEditorProps) {
    const currentLens = (edge.metadata as any)?.gmId || 'neutral'

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h4 className="text-zinc-300 text-xs font-mono uppercase tracking-widest mb-4">Choice Lens</h4>

            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-tighter mb-2 font-mono italic">Choice Label</label>
                    <input
                        type="text"
                        value={edge.label || ''}
                        onChange={(e) => onUpdate(edge.id, { label: e.target.value })}
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
                    />
                </div>

                <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-tighter mb-2 font-mono italic">Game Master Lens (The Branch Flavor)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {LENSES.map((lens) => (
                            <button
                                key={lens.id}
                                onClick={() => onUpdate(edge.id, {
                                    metadata: { ...(edge.metadata || {}), gmId: lens.id },
                                    label: edge.label // keep current label
                                })}
                                className={`
                  p-2 text-left rounded border transition-all duration-200
                  ${currentLens === lens.id
                                        ? `bg-zinc-800 border-zinc-600 shadow-sm`
                                        : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-700'}
                `}
                            >
                                <div className={`text-[11px] font-bold ${currentLens === lens.id ? lens.color : 'text-zinc-500'}`}>
                                    {lens.label}
                                </div>
                                <div className="text-[9px] text-zinc-600 font-mono italic truncate">{lens.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
