'use client'

import React, { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { listCyoaProposals, finalizeCyoaDraft, rejectCyoaProposal } from '@/actions/cyoa-generator'

type Proposal = Awaited<ReturnType<typeof listCyoaProposals>>[number]

export default function CyoaProposalsPage() {
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [isPending, startTransition] = useTransition()
    const [actionId, setActionId] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const loadProposals = () => {
        startTransition(async () => {
            const list = await listCyoaProposals()
            setProposals(list)
        })
    }

    useEffect(() => {
        loadProposals()
    }, [])

    const handleApprove = async (id: string) => {
        setActionId(id)
        setMessage(null)
        try {
            const result = await finalizeCyoaDraft(id, { adminBypass: true })
            if (result.success) {
                setMessage(`Story approved and published! Slug: ${result.slug}`)
                loadProposals()
            }
        } catch (e: any) {
            setMessage(`Error: ${e.message}`)
        } finally {
            setActionId(null)
        }
    }

    const handleReject = async (id: string) => {
        setActionId(id)
        setMessage(null)
        try {
            await rejectCyoaProposal(id)
            setMessage('Proposal rejected.')
            loadProposals()
        } catch (e: any) {
            setMessage(`Error: ${e.message}`)
        } finally {
            setActionId(null)
        }
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <Link href="/admin" className="text-xs text-zinc-500 hover:text-white transition-colors">
                        ← Back to Admin
                    </Link>
                    <h1 className="text-3xl font-bold text-white mt-2">CYOA Proposals</h1>
                    <p className="text-zinc-400 text-sm">Review player-authored story drafts for campaign publication.</p>
                </div>
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    Stewardship: Show Up
                </div>
            </header>

            {message && (
                <div className={`p-4 rounded-lg border ${message.startsWith('Error') ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'}`}>
                    {message}
                </div>
            )}

            <div className="grid gap-6">
                {proposals.map((p) => (
                    <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col md:flex-row">
                        {/* Info Panel */}
                        <div className="p-6 flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-tight">Pending Review</span>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono">
                                    Submitted: {p.submittedAt?.toLocaleDateString()}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">{p.sourceBar?.title || 'Untitled Story'}</h3>
                                <p className="text-zinc-500 text-xs mt-1 italic">by {p.user.name || 'Anonymous Player'}</p>
                            </div>

                            <div className="bg-black/40 rounded-lg p-4 border border-zinc-800/50">
                                <h4 className="text-[10px] uppercase font-mono text-zinc-500 mb-2 tracking-widest">Rationale</h4>
                                <p className="text-sm text-zinc-300 leading-relaxed font-serif">
                                    "{p.rationale || 'No rationale provided.'}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase">
                                <span>Campaign: <span className="text-zinc-300">{p.campaignId || 'Independent'}</span></span>
                                <span>Instance: <span className="text-zinc-300">{p.instanceId || 'None'}</span></span>
                            </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="bg-zinc-950/50 border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col justify-center gap-3 md:w-48">
                            <a
                                href={`/cyoa/generate?draftId=${p.id}`}
                                target="_blank"
                                className="w-full py-2 text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded transition-colors uppercase"
                            >
                                Preview
                            </a>
                            <button
                                onClick={() => handleApprove(p.id)}
                                disabled={!!actionId}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors uppercase disabled:opacity-50"
                            >
                                {actionId === p.id ? '...' : 'Approve'}
                            </button>
                            <button
                                onClick={() => handleReject(p.id)}
                                disabled={!!actionId}
                                className="w-full py-2 border border-rose-500/50 text-rose-500 hover:bg-rose-500/10 text-xs font-bold rounded transition-colors uppercase disabled:opacity-50"
                            >
                                {actionId === p.id ? '...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                ))}

                {proposals.length === 0 && !isPending && (
                    <div className="py-20 text-center space-y-4">
                        <div className="text-4xl">🌑</div>
                        <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">The queue is empty.</p>
                        <p className="text-zinc-700 text-[10px] italic">No story signals are currently awaiting stewardship.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
