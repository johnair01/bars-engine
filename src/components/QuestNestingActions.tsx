'use client'

import { useState, useTransition, useEffect } from 'react'
import { createSubQuest, appendExistingQuest } from '@/actions/quest-nesting'
import { useRouter } from 'next/navigation'

interface Quest {
    id: string
    title: string
    parentId: string | null
}

interface Props {
    parentQuestId: string
    onNestingComplete?: () => void
}

export function QuestNestingActions({ parentQuestId, onNestingComplete }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [mode, setMode] = useState<'none' | 'create' | 'append'>('none')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form states for creation
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    // Available quests for appending
    const [availableQuests, setAvailableQuests] = useState<Quest[]>([])
    const [selectedQuestId, setSelectedQuestId] = useState('')

    useEffect(() => {
        if (mode === 'append') {
            // Fetch own active quests that aren't already sub-quests
            fetch('/api/my-quests?nestable=true')
                .then(res => res.json())
                .then(data => {
                    setAvailableQuests(data.quests || [])
                })
        }
    }, [mode])

    const handleCreateSubQuest = () => {
        if (!title) return setError('Title is required')
        startTransition(async () => {
            const res = await createSubQuest(parentQuestId, { title, description })
            if (res && 'error' in res) {
                setError(res.error as string)
            } else {
                setSuccess('✨ Sub-quest created!')
                setMode('none')
                setTitle('')
                setDescription('')
                router.refresh()
                onNestingComplete?.()
            }
        })
    }

    const handleAppendQuest = () => {
        if (!selectedQuestId) return setError('Please select a quest to nest')
        startTransition(async () => {
            const res = await appendExistingQuest(parentQuestId, selectedQuestId)
            if (res && 'error' in res) {
                setError(res.error as string)
            } else {
                setSuccess('✨ Quest nested!')
                setMode('none')
                setSelectedQuestId('')
                router.refresh()
                onNestingComplete?.()
            }
        })
    }

    return (
        <div className="space-y-4 border-t border-zinc-800 pt-6 mt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🧬</span>
                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Nesting & Layers</h3>
                </div>
                <div className="text-[10px] text-yellow-500 font-mono bg-yellow-900/20 px-2 py-0.5 rounded-full">
                    Cost: 1 ♦
                </div>
            </div>

            {mode === 'none' ? (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setMode('create')}
                        className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition text-left space-y-1"
                    >
                        <div className="text-xs font-bold text-white">Create Sub-Quest</div>
                        <div className="text-[10px] text-zinc-500">Add a new layer under this one</div>
                    </button>
                    <button
                        onClick={() => setMode('append')}
                        className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition text-left space-y-1"
                    >
                        <div className="text-xs font-bold text-white">Nest Existing</div>
                        <div className="text-[10px] text-zinc-500">Group an existing quest here</div>
                    </button>
                </div>
            ) : (
                <div className="space-y-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 animate-in slide-in-from-top-2">
                    {mode === 'create' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-zinc-500 font-bold">New Quest Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g., Gather the power crystals"
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-zinc-500 font-bold">Instructions (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Describe what needs to be done..."
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white h-20 focus:border-purple-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'append' && (
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase text-zinc-500 font-bold">Select Quest to Nest</label>
                            {availableQuests.length > 0 ? (
                                <select
                                    value={selectedQuestId}
                                    onChange={e => setSelectedQuestId(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none"
                                >
                                    <option value="">Choose a quest...</option>
                                    {availableQuests.map(q => (
                                        <option key={q.id} value={q.id}>{q.title}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-xs text-zinc-500 italic p-2 border border-dashed border-zinc-800 rounded-lg bg-black/30">
                                    No independent quests found in your hand.
                                </div>
                            )}
                        </div>
                    )}

                    {error && <div className="text-[10px] text-red-400 font-bold">{error}</div>}

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setMode('none')
                                setError(null)
                            }}
                            className="flex-1 py-2 text-xs font-bold text-zinc-500 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isPending}
                            onClick={mode === 'create' ? handleCreateSubQuest : handleAppendQuest}
                            className="flex-1 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-lg text-white text-xs font-bold shadow-lg shadow-yellow-900/20 disabled:opacity-50"
                        >
                            {isPending ? 'Processing...' : (mode === 'create' ? 'Create & Link' : 'Nest Quest')}
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="text-center text-[10px] text-green-400 font-bold animate-pulse">
                    {success}
                </div>
            )}
        </div>
    )
}
