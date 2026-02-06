'use client'

import { useState, useTransition } from 'react'
import {
    toggleAdminRole,
    updatePlayerProfile,
    adminMintVibulons,
    adminTransferVibulons
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
                </div>

                {/* Footer */}
                <footer className="px-6 py-6 border-t border-zinc-800 bg-zinc-900/20">
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
