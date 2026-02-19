'use client'

import { useEffect, useState, useTransition } from 'react'
import {
    toggleAdminRole,
    updatePlayerProfile,
    adminMintVibulons,
    adminTransferVibulons,
    getAdminQuests,
    getAdminJourneys,
    assignQuestToPlayer,
    assignThreadToPlayer,
    assignPackToPlayer,
    deleteAdminPlayer,
    getPlayerOnboardingProgress,
    resetPlayerThreadProgress
} from '@/actions/admin'

interface AdminPlayerEditorProps {
    player: any
    worldData: { nations: any[], archetypes: any[] }
    onClose: () => void
    onUpdate: () => void
}

export function AdminPlayerEditor({ player, worldData, onClose, onUpdate }: AdminPlayerEditorProps) {
    const [isPending, startTransition] = useTransition()
    const isAdmin = player.roles.some((r: any) => r.role.key === 'admin')
    const [quests, setQuests] = useState<any[]>([])
    const [threads, setThreads] = useState<any[]>([])
    const [packs, setPacks] = useState<any[]>([])
    const [selectedQuestId, setSelectedQuestId] = useState('')
    const [selectedThreadId, setSelectedThreadId] = useState('')
    const [selectedPackId, setSelectedPackId] = useState('')
    const [onboardingProgress, setOnboardingProgress] = useState<any[]>([])

    const fetchData = async () => {
        const [allQuests, journeys, obProgress] = await Promise.all([
            getAdminQuests(),
            getAdminJourneys(),
            getPlayerOnboardingProgress(player.id)
        ])
        setQuests(allQuests)
        setThreads(journeys.threads)
        setPacks(journeys.packs)
        setOnboardingProgress(obProgress)
    }

    useEffect(() => {
        startTransition(fetchData)
    }, [])

    const handleResetOnboarding = async (threadId: string) => {
        if (!confirm('Reset this player\'s onboarding progress to step 1?')) return
        startTransition(async () => {
            try {
                await resetPlayerThreadProgress(player.id, threadId)
                await fetchData()
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleAssignOnboarding = async () => {
        // Find orientation threads not yet assigned to this player
        const orientationThreads = threads.filter(t => t.threadType === 'orientation')
        if (orientationThreads.length === 0) {
            alert('No orientation threads found. Run the seed script first.')
            return
        }
        startTransition(async () => {
            try {
                for (const t of orientationThreads) {
                    await assignThreadToPlayer(player.id, t.id)
                }
                await fetchData()
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleToggleAdmin = async () => {
        if (!confirm(`${isAdmin ? 'Revoke' : 'Grant'} Admin role for ${player.name}?`)) return
        startTransition(async () => {
            try {
                await toggleAdminRole(player.id, !isAdmin)
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleUpdateProfile = async (field: 'nationId' | 'playbookId', value: string) => {
        startTransition(async () => {
            try {
                await updatePlayerProfile(player.id, { [field]: value })
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleMint = async () => {
        const amountStr = prompt(`Mint Vibeulons for ${player.name}. Enter amount:`, '1')
        if (!amountStr) return
        const amount = parseInt(amountStr)
        if (isNaN(amount) || amount <= 0) return

        startTransition(async () => {
            try {
                await adminMintVibulons(player.id, amount)
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleTransfer = async () => {
        const targetId = prompt(`Transfer Vibeulons FROM ${player.name}. Enter TARGET Player ID:`)
        if (!targetId) return

        const amountStr = prompt(`Enter amount to transfer:`, '1')
        if (!amountStr) return
        const amount = parseInt(amountStr)
        if (isNaN(amount) || amount <= 0) return

        startTransition(async () => {
            try {
                await adminTransferVibulons(player.id, targetId, amount)
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleAssign = async (type: 'quest' | 'thread' | 'pack') => {
        startTransition(async () => {
            try {
                if (type === 'quest' && selectedQuestId) await assignQuestToPlayer(player.id, selectedQuestId)
                if (type === 'thread' && selectedThreadId) await assignThreadToPlayer(player.id, selectedThreadId)
                if (type === 'pack' && selectedPackId) await assignPackToPlayer(player.id, selectedPackId)
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleDeletePlayer = async () => {
        if (!confirm(`Delete player ${player.name}? This cannot be undone.`)) return
        startTransition(async () => {
            try {
                const result = await deleteAdminPlayer(player.id)
                if ('error' in result) {
                    alert(result.error)
                    return
                }
                onClose()
                onUpdate()
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <header className="px-6 py-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{player.name}</h2>
                        <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{player.contactValue}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors p-2"
                    >
                        ✕
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Identity Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Character Identity</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-400">Nation</label>
                                <select
                                    value={player.nationId || ''}
                                    onChange={(e) => handleUpdateProfile('nationId', e.target.value)}
                                    disabled={isPending}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 transition-all"
                                >
                                    <option value="">None</option>
                                    {worldData.nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-400">Archetype</label>
                                <select
                                    value={player.playbookId || ''}
                                    onChange={(e) => handleUpdateProfile('playbookId', e.target.value)}
                                    disabled={isPending}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 transition-all"
                                >
                                    <option value="">None</option>
                                    {worldData.archetypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Onboarding Status Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Onboarding Status</h3>
                        {onboardingProgress.length === 0 ? (
                            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-zinc-400">No onboarding thread assigned</div>
                                        <div className="text-xs text-zinc-600 mt-1">Player has not been enrolled in orientation</div>
                                    </div>
                                    <button
                                        onClick={handleAssignOnboarding}
                                        disabled={isPending}
                                        className="px-4 py-2 rounded-xl bg-purple-900/30 text-purple-300 border border-purple-800/50 hover:bg-purple-900/50 text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                        Assign Onboarding
                                    </button>
                                </div>
                            </div>
                        ) : (
                            onboardingProgress.map((op: any) => (
                                <div key={op.threadId} className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white">{op.threadTitle}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">
                                                {op.isComplete
                                                    ? <span className="text-green-400">✓ Completed</span>
                                                    : `Step ${op.currentPosition} of ${op.totalQuests}`
                                                }
                                            </div>
                                        </div>
                                        {!op.isComplete && (
                                            <button
                                                onClick={() => handleResetOnboarding(op.threadId)}
                                                disabled={isPending}
                                                className="px-3 py-1.5 rounded-lg bg-amber-900/20 text-amber-400 border border-amber-800/40 hover:bg-amber-900/40 text-xs font-bold transition-all disabled:opacity-50"
                                            >
                                                Reset
                                            </button>
                                        )}
                                        {op.isComplete && (
                                            <button
                                                onClick={() => handleResetOnboarding(op.threadId)}
                                                disabled={isPending}
                                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 text-xs font-bold transition-all disabled:opacity-50"
                                            >
                                                Re-assign
                                            </button>
                                        )}
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all ${op.isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                                            style={{ width: `${op.isComplete ? 100 : ((op.currentPosition - 1) / op.totalQuests) * 100}%` }}
                                        />
                                    </div>
                                    {/* Quest checklist */}
                                    <div className="space-y-1">
                                        {op.allQuests.map((q: any) => (
                                            <div key={q.questId} className={`flex items-center gap-2 text-xs ${q.isCompleted ? 'text-zinc-500' : q.isCurrent ? 'text-white' : 'text-zinc-600'
                                                }`}>
                                                <span>{q.isCompleted ? '✓' : q.isCurrent ? '▸' : '○'}</span>
                                                <span>{q.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </section>

                    {/* Vibeulon Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Vibeulon Economy</h3>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-center sm:text-left">
                                <div className="text-xs text-zinc-500 uppercase mb-1">Current Balance</div>
                                <div className="text-4xl font-mono text-green-400 font-bold">{player._count?.vibulons || 0} ♦</div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleMint}
                                    disabled={isPending}
                                    className="flex-1 sm:flex-none bg-green-900/20 text-green-400 border border-green-800/50 hover:bg-green-900/40 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                                >
                                    Mint
                                </button>
                                {(player._count?.vibulons || 0) > 0 && (
                                    <button
                                        onClick={handleTransfer}
                                        disabled={isPending}
                                        className="flex-1 sm:flex-none bg-zinc-800 text-zinc-300 hover:bg-zinc-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                                    >
                                        Transfer
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Permissions Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Permissions</h3>
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <div className="text-sm font-bold text-white">Administrator Privileges</div>
                                <div className="text-xs text-zinc-500">Enable full system control for this user.</div>
                            </div>
                            <button
                                onClick={handleToggleAdmin}
                                disabled={isPending}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isAdmin
                                    ? 'bg-red-900/20 text-red-400 border border-red-800/50 hover:bg-red-900/40'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                                    }`}
                            >
                                {isAdmin ? 'Revoke' : 'Grant'}
                            </button>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Assignments</h3>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <select value={selectedQuestId} onChange={(e) => setSelectedQuestId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white">
                                    <option value="">Assign quest...</option>
                                    {quests.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
                                </select>
                                <button onClick={() => handleAssign('quest')} disabled={isPending || !selectedQuestId} className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-sm disabled:opacity-50">Assign</button>
                            </div>
                            <div className="flex gap-2">
                                <select value={selectedThreadId} onChange={(e) => setSelectedThreadId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white">
                                    <option value="">Assign journey...</option>
                                    {threads.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select>
                                <button onClick={() => handleAssign('thread')} disabled={isPending || !selectedThreadId} className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-sm disabled:opacity-50">Assign</button>
                            </div>
                            <div className="flex gap-2">
                                <select value={selectedPackId} onChange={(e) => setSelectedPackId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white">
                                    <option value="">Assign pack...</option>
                                    {packs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                                <button onClick={() => handleAssign('pack')} disabled={isPending || !selectedPackId} className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-sm disabled:opacity-50">Assign</button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="px-6 py-6 border-t border-zinc-800 bg-zinc-900/20">
                    <button
                        onClick={handleDeletePlayer}
                        disabled={isPending}
                        className="w-full mb-3 bg-red-900/30 text-red-300 font-bold py-3.5 rounded-2xl hover:bg-red-900/50 transition-all disabled:opacity-50"
                    >
                        Delete Player
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
                    >
                        Done
                    </button>
                </footer>
            </div>
        </div>
    )
}
