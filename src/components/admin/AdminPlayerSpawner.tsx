'use client'

import { useState, useTransition } from 'react'
import { spawnTestPlayer } from '@/actions/admin'

export function AdminPlayerSpawner() {
    const [isPending, startTransition] = useTransition()
    const [credentials, setCredentials] = useState<{ email: string, password: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSpawn = () => {
        setError(null)
        setCredentials(null)
        startTransition(async () => {
            const result = await spawnTestPlayer()
            if ('success' in result && result.success && 'credentials' in result) {
                setCredentials(result.credentials)
            } else if ('error' in result) {
                setError(result.error || 'Failed to spawn player')
            } else {
                setError('Failed to spawn player')
            }
        })
    }

    return (
        <div className="space-y-4">
            <button
                onClick={handleSpawn}
                disabled={isPending}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-lg font-bold transition-all shadow-lg shadow-purple-900/40 text-sm whitespace-nowrap"
            >
                {isPending ? '✨ Spawning...' : '👥 Spawn Test Player'}
            </button>

            {error && (
                <div className="text-red-400 text-xs font-mono bg-red-900/20 p-2 rounded border border-red-900/50">
                    {error}
                </div>
            )}

            {credentials && (
                <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Credentials Generated</span>
                        <button
                            onClick={() => setCredentials(null)}
                            className="text-zinc-500 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <div className="text-[10px] text-zinc-500 mb-0.5">Email</div>
                            <div className="bg-black/40 p-2 rounded border border-zinc-800 font-mono text-sm text-purple-300 flex justify-between items-center group">
                                <span>{credentials.email}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(credentials.email)}
                                    className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-white transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] text-zinc-500 mb-0.5">Password</div>
                            <div className="bg-black/40 p-2 rounded border border-zinc-800 font-mono text-sm text-purple-300 flex justify-between items-center group">
                                <span>{credentials.password}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(credentials.password)}
                                    className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-white transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-zinc-500 italic">
                        Use these to log in via an incognito window to test the Orientation Ritual.
                    </p>
                </div>
            )}
        </div>
    )
}
