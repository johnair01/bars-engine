'use client'

import React, { useState, useEffect } from 'react'
import { CmaStory, CmaNode, CmaEdge } from '@/lib/modular-cyoa-graph/types'
import { EmotionChannel } from '@/lib/transformation-move-registry/types'
import { MissionHud } from './MissionHud'
import { ChargingStation } from './ChargingStation'
import { NodeFlavorEditor } from './NodeFlavorEditor'
import { BranchFlavorEditor } from './BranchFlavorEditor'
import { updateCyoaDraft, finalizeCyoaDraft, submitCyoaDraftToCampaign } from '@/actions/cyoa-generator'
import { getStageForMission } from '@/lib/quest-grammar/narrativeMapper'

interface CmaGeneratorUIProps {
    initialDraft: {
        id: string
        graphJson: string
        emotionalCharge: string | null
        gmId: string | null
        status: string
        campaignId?: string | null
        mission?: string | null
        instanceId?: string | null
    }
}

export function CmaGeneratorUI({ initialDraft }: CmaGeneratorUIProps) {
    const [story, setStory] = useState<CmaStory>(JSON.parse(initialDraft.graphJson))
    const [charge, setCharge] = useState<EmotionChannel>((initialDraft.emotionalCharge as EmotionChannel) || 'neutrality')
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(story.startId)
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isFinalizing, setIsFinalizing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showRationale, setShowRationale] = useState(false)
    const [rationale, setRationale] = useState('')
    const [finalizedSlug, setFinalizedSlug] = useState<string | null>(null)
    const [isSubmitted, setIsSubmitted] = useState(initialDraft.status === 'pending_review')
    const [error, setError] = useState<string | null>(null)

    // Auto-save on changes
    useEffect(() => {
        const save = async () => {
            setIsSaving(true)
            try {
                await updateCyoaDraft(initialDraft.id, {
                    graphJson: JSON.stringify(story),
                    emotionalCharge: charge
                })
            } catch (e) {
                console.error('Failed to auto-save draft:', e)
            } finally {
                setIsSaving(false)
            }
        }

        const timer = setTimeout(save, 1000)
        return () => clearTimeout(timer)
    }, [story, charge, initialDraft.id])

    const handleUpdateNode = (nodeId: string, updates: Partial<CmaNode['metadata']>) => {
        setStory(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, metadata: { ...(n.metadata || {}), ...updates } } : n)
        }))
    }

    const handleUpdateEdge = (edgeId: string, updates: Partial<CmaEdge>) => {
        setStory(prev => ({
            ...prev,
            edges: prev.edges.map(e => e.id === edgeId ? { ...e, ...updates } : e)
        }))
    }

    const handleFinalize = async () => {
        setIsFinalizing(true)
        setError(null)
        try {
            const result = await finalizeCyoaDraft(initialDraft.id)
            if (result.success) {
                setFinalizedSlug(result.slug!)
            }
        } catch (e: any) {
            setError(e.message || 'Finalization failed')
        } finally {
            setIsFinalizing(false)
        }
    }

    const handleSubmit = async () => {
        if (!rationale.trim()) {
            setError('Please provide a short rationale for this proposal.')
            return
        }
        setIsSubmitting(true)
        setError(null)
        try {
            await submitCyoaDraftToCampaign(initialDraft.id, rationale)
            setIsSubmitted(true)
            setShowRationale(false)
        } catch (e: any) {
            setError(e.message || 'Submission failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedNode = story.nodes.find(n => n.id === selectedNodeId)
    const selectedEdge = story.edges.find(e => e.id === selectedEdgeId)

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans pb-20">
            <MissionHud
                mission={initialDraft.mission || 'Internal Exploration'}
                stage={initialDraft.mission ? getStageForMission(initialDraft.mission) : 'WAKE UP'}
            />

            <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Workshop Workbench */}
                <div className="lg:col-span-7">
                    <ChargingStation currentCharge={charge} onChargeChange={setCharge} />

                    <div className="space-y-6">
                        <h3 className="text-zinc-500 text-[10px] uppercase font-mono tracking-[0.2em] mb-4">Story Workbench</h3>

                        <div className="relative pl-6 border-l border-zinc-800 space-y-4">
                            {story.nodes.map((node, idx) => {
                                const isSelected = selectedNodeId === node.id
                                const connectedEdge = story.edges.find(e => e.from === node.id)

                                return (
                                    <React.Fragment key={node.id}>
                                        {/* Node Card */}
                                        <div
                                            onClick={() => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
                                            className={`
                        relative group p-4 rounded-lg border cursor-pointer transition-all duration-300
                        ${isSelected ? 'bg-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'}
                      `}
                                        >
                                            <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-zinc-700 bg-zinc-900 group-hover:border-emerald-500 transition-colors" />

                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-mono text-zinc-500 uppercase">Phase {idx + 1}: {(node.metadata as any)?.coasterTag}</span>
                                                {isSelected && <span className="text-[9px] text-emerald-500 font-mono animate-pulse">EDITING</span>}
                                            </div>
                                            <h4 className="text-zinc-200 text-sm font-semibold truncate">{(node.metadata as any)?.moveId?.toUpperCase() || 'OBSERVE'}</h4>
                                            <p className="text-zinc-500 text-xs mt-1 line-clamp-2 italic">{(node.metadata as any)?.renderedText}</p>
                                        </div>

                                        {/* Edge Connector */}
                                        {connectedEdge && (
                                            <div
                                                onClick={() => { setSelectedEdgeId(connectedEdge.id); setSelectedNodeId(null); }}
                                                className={`
                          mx-auto w-fit px-3 py-1.5 rounded-full border text-[10px] font-mono cursor-pointer transition-all
                          ${selectedEdgeId === connectedEdge.id
                                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}
                        `}
                                            >
                                                Choice: {connectedEdge.label || 'Continue'} {(connectedEdge.metadata as any)?.gmId ? `[${(connectedEdge.metadata as any).gmId.toUpperCase()}]` : ''}
                                            </div>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Attribute Panels */}
                <div className="lg:col-span-5 space-y-6 sticky top-24 h-fit">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-zinc-400 text-[10px] uppercase font-mono tracking-widest italic">Attributes PANEL</h3>
                        <div className="flex items-center gap-2">
                            {isSaving && <span className="text-[9px] text-zinc-600 animate-pulse font-mono uppercase">Syncing...</span>}
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                        </div>
                    </div>

                    {selectedNode && (
                        <NodeFlavorEditor node={selectedNode} draftId={initialDraft.id} onUpdate={handleUpdateNode} />
                    )}

                    {selectedEdge && (
                        <BranchFlavorEditor edge={selectedEdge} onUpdate={handleUpdateEdge} />
                    )}

                    {!selectedNode && !selectedEdge && (
                        <div className="bg-zinc-900/30 border border-zinc-900 border-dashed rounded-lg p-12 text-center">
                            <p className="text-zinc-600 text-xs font-mono">Select a phase or choice to modify flavor.</p>
                        </div>
                    )}

                    <div className="pt-4">
                        {finalizedSlug ? (
                            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-6 space-y-4 animate-in fade-in zoom-in duration-500">
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-emerald-500 text-xl font-bold">✓</span>
                                    </div>
                                    <h4 className="text-emerald-400 font-bold">Story Published</h4>
                                    <p className="text-zinc-500 text-[10px] font-mono mt-1 italic uppercase">The system is charged.</p>
                                </div>
                                <a
                                    href={`/adventures/${finalizedSlug}`}
                                    className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
                                >
                                    Enter Adventure
                                </a>
                            </div>
                        ) : isSubmitted ? (
                            <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-6 space-y-3 animate-in fade-in zoom-in duration-500">
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-purple-500 text-xl font-bold">⌛</span>
                                    </div>
                                    <h4 className="text-purple-400 font-bold">Proposal Submitted</h4>
                                    <p className="text-zinc-500 text-[10px] font-mono mt-1 italic uppercase">Awaiting Steward Review.</p>
                                </div>
                                <p className="text-[10px] text-zinc-400 text-center italic">
                                    "Your signal has been cast into the collective waters. Patience is a move."
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {showRationale ? (
                                    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 space-y-4">
                                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Why this story?</h4>
                                        <textarea
                                            value={rationale}
                                            onChange={(e) => setRationale(e.target.value)}
                                            placeholder="Briefly explain how this aligns with the residency..."
                                            className="w-full bg-black border border-zinc-800 rounded p-3 text-xs text-zinc-200 min-h-[80px]"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowRationale(false)}
                                                className="flex-1 py-2 text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] uppercase font-bold"
                                            >
                                                {isSubmitting ? 'SENDING...' : 'Confirm Submit'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Finalize Button (Private) */}
                                        <button
                                            onClick={handleFinalize}
                                            disabled={isFinalizing || isSaving}
                                            className={`
                                                w-full font-bold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 group
                                                ${isFinalizing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}
                                            `}
                                        >
                                            <span>{isFinalizing ? 'METABOLIZING...' : 'Finalize Private Story'}</span>
                                            {!isFinalizing && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                                        </button>

                                        {/* Submit to Campaign Button (Shared) */}
                                        {(initialDraft.instanceId || initialDraft.campaignId) && (
                                            <button
                                                onClick={() => setShowRationale(true)}
                                                disabled={isSaving}
                                                className="w-full py-3 px-6 rounded-lg border border-purple-500/50 text-purple-400 font-bold hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span>Submit to Campaign</span>
                                                <span className="text-xs">✦</span>
                                            </button>
                                        )}
                                    </>
                                )}
                                {error && <p className="text-rose-500 text-[10px] font-mono mt-2 text-center uppercase">{error}</p>}
                                <p className="text-[9px] text-zinc-600 text-center mt-3 font-mono">
                                    Ensures coaster grammar is satisfied (LIFT ↔ STATION)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
