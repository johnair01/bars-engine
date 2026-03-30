'use client'

import { CyoaRunState } from '@/lib/cyoa-state'
import { promptsForBlueprintKey } from '@/lib/cyoa/blueprint-prompt-library'
import { CheckCircle2, Package, Sparkles, MoveRight } from 'lucide-react'
import { useState, useEffect } from 'react'

function TimeDisplay({ dateString }: { dateString: string }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted) return <div className="w-12 h-2 bg-zinc-800 rounded animate-pulse" />

    return (
        <span className="text-[10px] text-zinc-600 font-mono">
            {new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
    )
}

interface CyoaRecapViewProps {
    runState?: Partial<CyoaRunState>
    onContinue: () => void
    isPending?: boolean
}

export function CyoaRecapView({ runState, onContinue, isPending }: CyoaRecapViewProps) {
    const ledger = runState?.artifactLedger || []

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/50 mb-4 animate-bounce">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Quest Complete</h2>
                <p className="text-zinc-500 text-lg">You have successfully metabolized this journey.</p>
            </div>

            <div className="w-full space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Artifact Ledger</h3>
                <div className="space-y-3">
                    {ledger.map((artifact, i) => {
                        const prompts = promptsForBlueprintKey(artifact.blueprintKey)
                        const prompt = prompts[0] || 'Unknown Artifact'
                        const meta = (artifact as any).metadata

                        return (
                            <div
                                key={i}
                                className="group relative flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all duration-300"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:bg-purple-900/30 group-hover:border-purple-500/50 transition-colors">
                                    {artifact.kind === 'bar' ? (
                                        <Package className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                                    )}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest">
                                            {artifact.kind} {meta ? `• ${meta.type} / ${meta.phase}` : ''}
                                        </span>
                                        <TimeDisplay dateString={artifact.createdAt} />
                                    </div>
                                    <p className="text-zinc-200 text-sm italic leading-relaxed">
                                        "{prompt}"
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="pt-8 w-full">
                <button
                    onClick={onContinue}
                    disabled={isPending}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-900/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isPending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Advancing...</span>
                        </>
                    ) : (
                        <>
                            <span>Integrate & Continue</span>
                            <MoveRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
