'use client'

import { useState, useEffect, useActionState } from 'react'
import { createCustomBar, getActivePlayers } from '@/actions/create-bar'
import { useRouter } from 'next/navigation'

type Player = { id: string; name: string }

export function CreateBarForm({ setup }: { setup?: boolean }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(setup || false)
    const [players, setPlayers] = useState<Player[]>([])
    const [visibility, setVisibility] = useState<'public' | 'private'>('public')
    const [moveType, setMoveType] = useState<'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | null>(null)
    const [showStory, setShowStory] = useState(false)
    const [storyMood, setStoryMood] = useState<string | null>(null)
    const [state, formAction, isPending] = useActionState(createCustomBar, null)

    useEffect(() => {
        if (isOpen && players.length === 0) {
            getActivePlayers().then(setPlayers)
        }
    }, [isOpen, players.length])

    useEffect(() => {
        if (state?.success) {
            setIsOpen(false)
            if (visibility === 'private') {
                router.push('/hand')
            } else {
                router.push('/bars/available')
            }
        }
    }, [state, router, visibility])

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
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-white text-lg">
                        {setup ? 'The Setup' : 'Create a new Bar'}
                    </h3>
                    {setup && (
                        <p className="text-amber-500 font-serif italic max-w-md">
                            "The stakes are infinite. The cost to you is zero. What is your first high-stakes move?"
                        </p>
                    )}
                </div>
                {!setup && <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>}
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

                {/* Story Section */}
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setShowStory(!showStory)}
                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2"
                    >
                        <span>{showStory ? '▼' : '▶'}</span>
                        <span>🎭 Add Story (Optional)</span>
                    </button>

                    {showStory && (
                        <div className="space-y-3 pl-4 border-l-2 border-purple-800">
                            <textarea
                                name="storyContent"
                                placeholder="Write the narrative for this quest... (Markdown supported)"
                                rows={4}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base font-mono text-sm"
                            />
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { key: 'dramatic', emoji: '🎭', label: 'Dramatic' },
                                    { key: 'playful', emoji: '✨', label: 'Playful' },
                                    { key: 'serious', emoji: '⚔️', label: 'Serious' },
                                    { key: 'mysterious', emoji: '🌙', label: 'Mysterious' },
                                ].map((mood) => (
                                    <button
                                        key={mood.key}
                                        type="button"
                                        onClick={() => setStoryMood(storyMood === mood.key ? null : mood.key)}
                                        className={`px-3 py-1 rounded-full text-xs transition ${storyMood === mood.key
                                            ? 'bg-purple-900/50 border border-purple-600 text-purple-300'
                                            : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                            }`}
                                    >
                                        {mood.emoji} {mood.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="storyMood" value={storyMood || ''} />
                        </div>
                    )}
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
                            onClick={() => {
                                setVisibility('public')
                                const select = document.querySelector('select[name="targetPlayerId"]') as HTMLSelectElement
                                if (select) select.value = ""
                            }}
                            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition ${visibility === 'public'
                                ? 'bg-green-900/30 border-green-600 text-green-400'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            <div className="flex flex-col items-center">
                                <span>🌍 Public</span>
                                <span className="text-[10px] text-green-500/80 font-mono">Cost: 1v Stake</span>
                            </div>
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
                </div>

                {/* Assign To Player */}
                <div className="space-y-2 pt-4 border-t border-zinc-800">
                    <label className="text-xs uppercase text-zinc-500">
                        🎯 Assign To Player (Optional)
                    </label>
                    <select
                        name="targetPlayerId"
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                        onChange={(e) => {
                            if (e.target.value) {
                                setVisibility('private')
                            }
                        }}
                    >
                        <option value="">Anyone can claim (unassigned)</option>
                        {players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-zinc-600">
                        {visibility === 'public'
                            ? 'Public quests go to the "Salad Bowl" for anyone to claim.'
                            : 'Private assigned quests go directly to the player. They can release it later.'}
                    </p>
                    {players.length === 0 && (
                        <p className="text-xs text-zinc-600 italic">Loading players...</p>
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
