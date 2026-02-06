'use client'

import {
    getAdminPlayers,
    toggleAdminRole,
    getAdminWorldData,
    updatePlayerProfile,
    adminMintVibulons,
    adminTransferVibulons
} from '@/actions/admin'
import { useEffect, useState, useTransition } from 'react'

export default function AdminPlayersPage() {
    const [players, setPlayers] = useState<any[]>([])
    const [worldData, setWorldData] = useState<{ nations: any[], archetypes: any[] }>({ nations: [], archetypes: [] })
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const [p, [n, a]] = await Promise.all([
                getAdminPlayers(),
                getAdminWorldData()
            ])
            setPlayers(p)
            setWorldData({ nations: n, archetypes: a })
        })
    }, [])

    const handleToggleAdmin = async (id: string, currentStatus: boolean, name: string) => {
        if (!confirm(`${currentStatus ? 'Revoke' : 'Grant'} Admin role for ${name}?`)) return

        startTransition(async () => {
            try {
                await toggleAdminRole(id, !currentStatus)
                const res = await getAdminPlayers()
                setPlayers(res)
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleUpdateProfile = async (playerId: string, field: 'nationId' | 'playbookId', value: string) => {
        startTransition(async () => {
            try {
                await updatePlayerProfile(playerId, { [field]: value })
                const res = await getAdminPlayers()
                setPlayers(res)
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleMint = async (playerId: string, name: string) => {
        const amountStr = prompt(`Mint Vibeulons for ${name}. Enter amount:`, '1')
        if (!amountStr) return
        const amount = parseInt(amountStr)
        if (isNaN(amount) || amount <= 0) return

        startTransition(async () => {
            try {
                await adminMintVibulons(playerId, amount)
                const res = await getAdminPlayers()
                setPlayers(res)
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    const handleAdminTransfer = async (sourcePlayerId: string, sourceName: string) => {
        const targetId = prompt(`Transfer Vibeulons FROM ${sourceName}. Enter TARGET Player ID:`)
        if (!targetId) return

        const amountStr = prompt(`Enter amount to transfer:`, '1')
        if (!amountStr) return
        const amount = parseInt(amountStr)
        if (isNaN(amount) || amount <= 0) return

        startTransition(async () => {
            try {
                await adminTransferVibulons(sourcePlayerId, targetId, amount)
                const res = await getAdminPlayers()
                setPlayers(res)
            } catch (e: any) {
                alert(e.message)
            }
        })
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Players</h1>
                    <p className="text-zinc-400">Manage registered players, roles, and character attributes.</p>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-sm">
                    <span className="text-zinc-400">Total Players: </span>
                    <span className="text-white font-bold">{players.length}</span>
                </div>
            </header>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-950/50 text-zinc-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Player</th>
                            <th className="px-6 py-4">Nation</th>
                            <th className="px-6 py-4">Archetype</th>
                            <th className="px-6 py-4">Wallet</th>
                            <th className="px-6 py-4">Roles</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {players.map((player: any) => {
                            const isAdmin = player.roles.some((r: any) => r.role.key === 'admin')

                            return (
                                <tr key={player.id} className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{player.name}</div>
                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{player.contactValue}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={player.nationId || ''}
                                            onChange={(e) => handleUpdateProfile(player.id, 'nationId', e.target.value)}
                                            disabled={isPending}
                                            className="bg-zinc-800 border border-zinc-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-purple-500 w-32"
                                        >
                                            <option value="">None</option>
                                            {worldData.nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={player.playbookId || ''}
                                            onChange={(e) => handleUpdateProfile(player.id, 'playbookId', e.target.value)}
                                            disabled={isPending}
                                            className="bg-zinc-800 border border-zinc-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-purple-500 w-40"
                                        >
                                            <option value="">None</option>
                                            {worldData.archetypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="font-mono text-green-400 font-bold">{player._count?.vibulons || 0} ♦</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleMint(player.id, player.name)}
                                                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 transition"
                                                    title="Mint"
                                                >
                                                    +
                                                </button>
                                                {(player._count?.vibulons || 0) > 0 && (
                                                    <button
                                                        onClick={() => handleAdminTransfer(player.id, player.name)}
                                                        className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 transition"
                                                        title="Transfer From"
                                                    >
                                                        ⇆
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {player.roles.map((pr: any) => (
                                                <span
                                                    key={pr.id}
                                                    className={`text-xs px-2 py-0.5 rounded-full ${pr.role.key === 'admin'
                                                        ? 'bg-purple-900/50 text-purple-300 border border-purple-800'
                                                        : 'bg-zinc-800 text-zinc-400'
                                                        }`}
                                                >
                                                    {pr.role.displayName}
                                                </span>
                                            ))}
                                            {player.roles.length === 0 && (
                                                <span className="text-xs text-zinc-600 italic">None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggleAdmin(player.id, isAdmin, player.name)}
                                            disabled={isPending}
                                            className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${isAdmin
                                                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40'
                                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {isAdmin ? 'Revoke Admin' : 'Make Admin'}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {players.length === 0 && !isPending && (
                    <div className="p-8 text-center text-zinc-500 italic">No players found.</div>
                )}
            </div>
        </div>
    )
}
