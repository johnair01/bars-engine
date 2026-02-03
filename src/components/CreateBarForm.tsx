'use client'

import { useState, useEffect, useActionState } from 'react'
import { createCustomBar, getActivePlayers } from '@/actions/create-bar'
import { useRouter } from 'next/navigation'

type Player = { id: string; name: string }

export function CreateBarForm() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [players, setPlayers] = useState<Player[]>([])
    const [visibility, setVisibility] = useState<'public' | 'private'>('public')
    const [moveType, setMoveType] = useState<'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | null>(null)
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
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase text-zinc-500">Description / Prompt</label>
                    <textarea
                        name="description"
                        placeholder="What should the player do?"
                        required
                        rows={2}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase text-zinc-500">Response Type</label>
                        <select
                            name="inputType"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
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
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                        />
                    </div>
                </div>

                {/* Visibility Selection */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <label className="text-xs uppercase text-zinc-500">Quest Visibility</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setVisibility('public')}
                            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition ${visibility === 'public'
                                ? 'bg-green-900/30 border-green-600 text-green-400'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            🌍 Public
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisibility('private')}
                            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition ${visibility === 'private'
                                ? 'bg-purple-900/30 border-purple-600 text-purple-400'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            🔒 Private
                        </button>
                    </div>
                    <p className="text-xs text-zinc-600">
                        {visibility === 'public'
                            ? 'Anyone can pick up and complete this quest.'
                            : 'Only you can see this. Share it with a specific player.'}
                    </p>
                    <input type="hidden" name="visibility" value={visibility} />
                </div>

                {/* Move Type Selection */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <label className="text-xs uppercase text-zinc-500">Quest Type (Optional)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { key: 'wakeUp', label: '👁 Wake Up', desc: 'Awareness' },
                            { key: 'cleanUp', label: '🧹 Clean Up', desc: 'Shadow Work' },
                            { key: 'growUp', label: '🌱 Grow Up', desc: 'Development' },
                            { key: 'showUp', label: '🎯 Show Up', desc: 'Action' },
                        ].map((mt) => (
                            <button
                                key={mt.key}
                                type="button"
                                onClick={() => setMoveType(moveType === mt.key ? null : mt.key as any)}
                                className={`py-2 px-3 rounded-lg border text-sm transition ${moveType === mt.key
                                    ? 'bg-amber-900/30 border-amber-600 text-amber-400'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                            >
                                <span className="font-medium">{mt.label}</span>
                                <span className="block text-xs text-zinc-500">{mt.desc}</span>
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="moveType" value={moveType || ''} />
                    {visibility === 'private' && (
                        <div className="space-y-2 mt-3">
                            <label className="text-xs uppercase text-zinc-500">Send To Player</label>
                            <select
                                name="targetPlayerId"
                                required={visibility === 'private'}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
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
                        className="px-6 py-3 text-zinc-400 hover:text-white min-h-[44px]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50 min-h-[44px]"
                    >
                        {isPending ? 'Creating...' : 'Create Bar'}
                    </button>
                </div>
            </form>
        </div>
    )
}
