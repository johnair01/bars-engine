'use client'

import { getAdminPack, upsertQuestPack, deletePack, getAdminQuests, updatePackQuests, upsertQuest } from '@/actions/admin'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

const PLAYBOOKS = [
    'Heaven (Qian)', 'Earth (Kun)', 'Thunder (Zhen)', 'Water (Kan)',
    'Mountain (Gen)', 'Wind (Xun)', 'Fire (Li)', 'Lake (Dui)'
]

export default function EditPackPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // State
    const [loading, setLoading] = useState(true)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [allowedPlaybooks, setAllowedPlaybooks] = useState<string[]>([])

    // Quest Management
    const [packQuests, setPackQuests] = useState<any[]>([]) // { questId, title }
    const [availableQuests, setAvailableQuests] = useState<any[]>([])
    const [selectedQuestId, setSelectedQuestId] = useState('')
    const [newQuestTitle, setNewQuestTitle] = useState('')
    const [newQuestReward, setNewQuestReward] = useState(1)

    const id = params.id
    const isNew = id === 'new-pack'

    useEffect(() => {
        if (!id) {
            setLoading(false)
            return
        }
        startTransition(async () => {
            // Load available quests
            const quests = await getAdminQuests()
            setAvailableQuests(quests)

            if (!isNew) {
                const data = await getAdminPack(id)
                if (data) {
                    setTitle(data.title)
                    setDescription(data.description || '')
                    try {
                        setAllowedPlaybooks(data.allowedPlaybooks ? JSON.parse(data.allowedPlaybooks) : [])
                    } catch (e) { setAllowedPlaybooks([]) }

                    // Enrich quests
                    const enriched = (data.quests || []).map((pq: any) => {
                        const fullQuest = quests.find(q => q.id === pq.questId)
                        return {
                            questId: pq.questId,
                            title: fullQuest ? fullQuest.title : 'Unknown Quest'
                        }
                    })
                    setPackQuests(enriched)
                }
            }
            setLoading(false)
        })
    }, [id, isNew])

    // Handlers
    const handleSave = async () => {
        startTransition(async () => {
            const savedPack = await upsertQuestPack({
                id: isNew ? undefined : id,
                title,
                description,
                allowedPlaybooks: allowedPlaybooks.length > 0 ? allowedPlaybooks : undefined
            })
            await updatePackQuests(savedPack.id, packQuests.map(q => q.questId))

            router.push('/admin/journeys')
            router.refresh()
        })
    }

    const createAndAddQuest = () => {
        startTransition(async () => {
            const title = newQuestTitle.trim()
            if (!title) return
            const { id: newQuestId } = await upsertQuest({
                title,
                description: '',
                type: 'standard',
                reward: newQuestReward || 0,
                inputs: '[]'
            })
            const quests = await getAdminQuests()
            setAvailableQuests(quests)
            const quest = quests.find(q => q.id === newQuestId)
            if (quest && !packQuests.some(pq => pq.questId === quest.id)) {
                setPackQuests(prev => [...prev, { questId: quest.id, title: quest.title }])
            }
            setNewQuestTitle('')
            setNewQuestReward(1)
        })
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this pack?')) return
        startTransition(async () => {
            await deletePack(id)
            router.push('/admin/journeys')
            router.refresh()
        })
    }

    const togglePlaybook = (pb: string) => {
        if (allowedPlaybooks.includes(pb)) {
            setAllowedPlaybooks(allowedPlaybooks.filter(p => p !== pb))
        } else {
            setAllowedPlaybooks([...allowedPlaybooks, pb])
        }
    }

    // Quest Manipulations
    const addQuest = () => {
        if (!selectedQuestId) return

        // Prevent duplicates in packs? Usually packs are unique sets.
        if (packQuests.find(pq => pq.questId === selectedQuestId)) {
            alert('Quest already in pack')
            return
        }

        const quest = availableQuests.find(q => q.id === selectedQuestId)
        if (quest) {
            setPackQuests([...packQuests, { questId: quest.id, title: quest.title }])
            setSelectedQuestId('')
        }
    }

    const removeQuest = (index: number) => {
        const newQuests = [...packQuests]
        newQuests.splice(index, 1)
        setPackQuests(newQuests)
    }

    if (loading) return <div className="p-8 text-zinc-500">Loading...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <button
                    onClick={() => router.back()}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    ← Back
                </button>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-white">
                        {isNew ? 'Create Pack' : 'Edit Pack'}
                    </h1>
                    {isNew && <p className="text-xs text-orange-400">Save pack to add quests</p>}
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* LEFT: Metadata */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                        <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Settings</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                placeholder="e.g. Starter Pack"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white h-24"
                                placeholder="Describe the pack..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-400">
                                Restrict to Playbooks
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {PLAYBOOKS.map(pb => (
                                    <button
                                        key={pb}
                                        onClick={() => togglePlaybook(pb)}
                                        className={`text-left px-3 py-2 rounded-lg text-xs transition-colors border ${allowedPlaybooks.includes(pb)
                                                ? 'bg-purple-900/30 border-purple-500 text-purple-200'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                    >
                                        {allowedPlaybooks.includes(pb) ? '✓ ' : '○ '}
                                        {pb.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Quests */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 h-full flex flex-col">
                        <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Pack Contents</h2>

                        {(
                            <>
                                <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                                    {packQuests.map((q, idx) => (
                                        <div key={`${q.questId}-${idx}`} className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-lg group">
                                            <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-zinc-500 text-xs rounded">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 truncate text-sm font-medium text-zinc-300">
                                                {q.title}
                                            </div>
                                            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => removeQuest(idx)} className="p-1 text-red-500 hover:text-red-400">×</button>
                                            </div>
                                        </div>
                                    ))}
                                    {packQuests.length === 0 && (
                                        <div className="text-center py-8 text-zinc-600 text-sm border-2 border-dashed border-zinc-800 rounded-lg">
                                            No quests added yet.
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-zinc-800 flex gap-2">
                                    <select
                                        value={selectedQuestId}
                                        onChange={e => setSelectedQuestId(e.target.value)}
                                        className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                                    >
                                        <option value="">Select a quest to add...</option>
                                        {availableQuests.map(q => (
                                            <option key={q.id} value={q.id}>{q.title}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={addQuest}
                                        disabled={!selectedQuestId}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newQuestTitle}
                                        onChange={e => setNewQuestTitle(e.target.value)}
                                        placeholder="Create new quest title..."
                                        className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                    <input
                                        type="number"
                                        value={newQuestReward}
                                        onChange={e => setNewQuestReward(parseInt(e.target.value || '0'))}
                                        className="w-24 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                    <button
                                        onClick={createAndAddQuest}
                                        disabled={!newQuestTitle.trim()}
                                        className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                                    >
                                        Create + Add
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-800 flex justify-between">
                {!isNew && (
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-sm"
                    >
                        Delete Pack
                    </button>
                )}
                <div className="flex-1 flex justify-end gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
                    >
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
