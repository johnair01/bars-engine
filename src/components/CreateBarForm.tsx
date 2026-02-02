'use client'

import { useState, useEffect, useActionState } from 'react'
import { createCustomBar, getActivePlayers } from '@/actions/create-bar'
import { useRouter } from 'next/navigation'

type Player = { id: string; name: string }

export function CreateBarForm() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [players, setPlayers] = useState<Player[]>([])
    const [targetType, setTargetType] = useState<'collective' | 'player'>('collective')
    const [state, formAction, isPending] = useActionState(createCustomBar, null)

    useEffect(() => {
        if (isOpen && players.length === 0) {
            getActivePlayers().then(setPlayers)
        }
    }, [isOpen, players.length])

    useEffect(() => {
        if (state?.success) {
            setIsOpen(false)
            router.refresh()
        }
    }, [state, router])

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full p-4 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
            >
                <span className="text-xl">+</span>
                <span>Create a Bar</span>
            </button>
        )
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">Create a New Bar</h3>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs uppercase text-zinc-500">Title</label>
                    <input
                        name="title"
                        type="text"
                        placeholder="e.g. Share a Secret"
                        required
                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase text-zinc-500">Description / Prompt</label>
                    <textarea
                        name="description"
                        placeholder="What should the player do?"
                        required
                        rows={2}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase text-zinc-500">Response Type</label>
                        <select
                            name="inputType"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Text</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase text-zinc-500">Response Label</label>
                        <input
                            name="inputLabel"
                            type="text"
                            defaultValue="Response"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                </div>

                {/* Target Selection */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <label className="text-xs uppercase text-zinc-500">Who receives this Bar?</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setTargetType('collective')}
                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${targetType === 'collective'
                                    ? 'bg-green-900/30 border-green-600 text-green-400'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            🌍 Everyone (Collective)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTargetType('player')}
                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${targetType === 'player'
                                    ? 'bg-purple-900/30 border-purple-600 text-purple-400'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            👤 Specific Player
                        </button>
                    </div>
                    <input type="hidden" name="targetType" value={targetType} />

                    {targetType === 'player' && (
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-zinc-500">Select Player</label>
                            <select
                                name="targetPlayerId"
                                required={targetType === 'player'}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="">Choose a player...</option>
                                {players.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {players.length === 0 && (
                                <p className="text-xs text-zinc-600 italic">Loading players...</p>
                            )}
                        </div>
                    )}
                </div>

                {state?.error && (
                    <div className="text-red-400 text-sm">{state.error}</div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-zinc-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50"
                    >
                        {isPending ? 'Creating...' : 'Create Bar'}
                    </button>
                </div>
            </form>
        </div>
    )
}
