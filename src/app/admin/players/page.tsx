'use client'

import {
    getAdminPlayers,
    getAdminWorldData
} from '@/actions/admin'
import { useEffect, useState, useTransition } from 'react'
import { AdminPlayerEditor } from '@/components/admin/AdminPlayerEditor'

export default function AdminPlayersPage() {
    const [players, setPlayers] = useState<any[]>([])
    const [worldData, setWorldData] = useState<{ nations: any[], archetypes: any[] }>({ nations: [], archetypes: [] })
    const [isPending, startTransition] = useTransition()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)

    const fetchData = async () => {
        startTransition(async () => {
            const [p, [n, a]] = await Promise.all([
                getAdminPlayers(),
                getAdminWorldData()
            ])
            setPlayers(p)
            setWorldData({ nations: n, archetypes: a })
        })
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contactValue.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 sm:space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Players</h1>
                    <p className="text-zinc-400 text-sm">Manage registered players and their attributes.</p>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-sm w-full sm:w-auto text-center sm:text-left">
                    <span className="text-zinc-400">Total Players: </span>
                    <span className="text-white font-bold">{players.length}</span>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative group">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-12 py-4 text-white placeholder-zinc-500 outline-none focus:border-purple-500/50 transition-all shadow-xl shadow-black/20"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">🔍</span>
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-b border-zinc-800">
                        <tr>
                            <th className="px-6 py-5">Player</th>
                            <th className="px-6 py-5">Nation</th>
                            <th className="px-6 py-5">Archetype</th>
                            <th className="px-6 py-5 text-center">Wallet</th>
                            <th className="px-6 py-5">Roles</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {filteredPlayers.map((player) => {
                            const isAdmin = player.roles.some((r: any) => r.role.key === 'admin')
                            const archetype = worldData.archetypes.find(a => a.id === player.playbookId)
                            const nation = worldData.nations.find(n => n.id === player.nationId)

                            return (
                                <tr
                                    key={player.id}
                                    className="group hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                    onClick={() => setSelectedPlayer(player)}
                                >
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors">{player.name}</div>
                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{player.contactValue}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-zinc-300 text-sm">{nation?.name || '—'}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-zinc-300 text-sm">{archetype?.name || '—'}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="font-mono text-green-400 font-bold">{player._count?.vibulons || 0} ♦</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-1 flex-wrap">
                                            {player.roles.map((pr: any) => (
                                                <span
                                                    key={pr.id}
                                                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${pr.role.key === 'admin'
                                                        ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
                                                        : 'bg-zinc-800 text-zinc-500'
                                                        }`}
                                                >
                                                    {pr.role.displayName}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right text-zinc-500 group-hover:text-zinc-200">
                                        Edit →
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlayers.map((player) => {
                    const isAdmin = player.roles.some((r: any) => r.role.key === 'admin')
                    const archetype = worldData.archetypes.find(a => a.id === player.playbookId)

                    return (
                        <div
                            key={player.id}
                            onClick={() => setSelectedPlayer(player)}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500/50 transition-all cursor-pointer shadow-lg active:scale-95 duration-200"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{player.name}</h3>
                                    <p className="text-xs text-zinc-500 font-mono">{player.contactValue}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono text-green-400 font-bold block">{player._count?.vibulons || 0} ♦</span>
                                    {isAdmin && <span className="text-[10px] text-purple-400 font-bold uppercase mt-1 block">Admin</span>}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-[10px] text-zinc-500 flex flex-col justify-center">
                                    <span className="uppercase tracking-widest font-bold mb-0.5 opacity-50">Archetype</span>
                                    <span className="text-zinc-300 font-medium truncate">{archetype?.name || 'None'}</span>
                                </div>
                                <div className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl flex items-center justify-center transition-colors">
                                    ⚙️
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredPlayers.length === 0 && !isPending && (
                <div className="p-12 text-center text-zinc-500 italic bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
                    {searchQuery ? `No players found matching "${searchQuery}"` : "No players found."}
                </div>
            )}

            {/* Player Editor Modal */}
            {selectedPlayer && (
                <AdminPlayerEditor
                    player={selectedPlayer}
                    worldData={worldData}
                    onClose={() => setSelectedPlayer(null)}
                    onUpdate={() => {
                        fetchData()
                        // Update current selected player to reflect changes immediately
                        const updated = players.find(p => p.id === selectedPlayer.id)
                        if (updated) setSelectedPlayer(updated)
                    }}
                />
            )}
        </div>
    )
}
