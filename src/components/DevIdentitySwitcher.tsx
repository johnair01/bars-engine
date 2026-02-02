'use client'

import { useState, useEffect } from 'react'
import { getAllPlayers, switchIdentity } from '@/actions/dev'
import { useRouter } from 'next/navigation'

export function DevIdentitySwitcher() {
    const [players, setPlayers] = useState<{ id: string, name: string }[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Only fetch on client mount
        getAllPlayers().then(setPlayers)
    }, [])

    if (players.length === 0) return null

    const handleSwitch = async (id: string) => {
        await switchIdentity(id)
        setIsOpen(false)
        router.refresh()
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
            {isOpen ? (
                <div className="bg-black border border-zinc-800 rounded-lg shadow-2xl p-2 w-64 max-h-96 overflow-y-auto mb-2">
                    <div className="flex justify-between items-center mb-2 px-2 pb-2 border-b border-zinc-900">
                        <span className="text-zinc-500 font-bold">DEV SWITCHER</span>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
                    </div>
                    <div className="space-y-1">
                        {players.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleSwitch(p.id)}
                                className="w-full text-left px-2 py-2 hover:bg-zinc-900 rounded text-zinc-300 hover:text-white truncate"
                            >
                                {p.name} <span className="text-zinc-600 opacity-50">({p.id.slice(-4)})</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white hover:border-zinc-700 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-all"
                    title="Switch Identity"
                >
                    🕵️
                </button>
            )}
        </div>
    )
}
