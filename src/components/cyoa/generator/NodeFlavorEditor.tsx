'use client'

import React, { useState } from 'react'
import { CmaNode } from '@/lib/modular-cyoa-graph/types'
import { generateNodeTextDeterministically } from '@/actions/cyoa-generator'

interface NodeFlavorEditorProps {
    node: CmaNode
    draftId: string
    onUpdate: (nodeId: string, updates: Partial<CmaNode['metadata']>) => void
}

export function NodeFlavorEditor({ node, draftId, onUpdate }: NodeFlavorEditorProps) {
    const metadata = node.metadata as any
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            const text = await generateNodeTextDeterministically(draftId, node.id)
            onUpdate(node.id, { renderedText: text, prompt: text })
        } catch (error) {
            console.error(error)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-300 text-xs font-mono uppercase tracking-widest">{node.title}</h4>
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="px-2 py-1 text-[9px] bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 rounded border border-emerald-700/50 shadow-sm transition uppercase font-mono"
                    >
                        {isGenerating ? 'Refining...' : '✨ Refine (Deterministic)'}
                    </button>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[9px] font-mono border border-zinc-700 uppercase">
                        {metadata?.moveId || 'No Move'}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-tighter mb-1 font-mono">Prompt Text</label>
                    <textarea
                        value={metadata?.renderedText || ''}
                        onChange={(e) => onUpdate(node.id, { renderedText: e.target.value, prompt: e.target.value })}
                        className="w-full h-32 bg-zinc-950/50 border border-zinc-800 rounded p-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all resize-none font-serif leading-relaxed"
                        placeholder="The story content goes here..."
                    />
                </div>

                <div className="p-3 rounded bg-zinc-950/30 border border-zinc-900/50">
                    <p className="text-[10px] text-zinc-600 font-mono leading-tight">
                        <span className="text-zinc-500 uppercase mr-2 italic">Coaster Tag:</span>
                        {metadata?.coasterTag || 'NONE'}
                    </p>
                </div>
            </div>
        </div>
    )
}
