'use client'

import { getAdminThread, upsertQuestThread, deleteThread, getAdminQuests, updateThreadQuests } from '@/actions/admin'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

const PLAYBOOKS = [
    'Heaven (Qian)', 'Earth (Kun)', 'Thunder (Zhen)', 'Water (Kan)',
    'Mountain (Gen)', 'Wind (Xun)', 'Fire (Li)', 'Lake (Dui)'
]

export default function EditThreadPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // State
    const [loading, setLoading] = useState(true)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [threadType, setThreadType] = useState('standard')
    const [completionReward, setCompletionReward] = useState(0)
    const [allowedPlaybooks, setAllowedPlaybooks] = useState<string[]>([])

    // Quest Management
    const [threadQuests, setThreadQuests] = useState<any[]>([]) // { questId, quest: { title } }
    const [availableQuests, setAvailableQuests] = useState<any[]>([])
    const [selectedQuestId, setSelectedQuestId] = useState('')

    const isNew = params.id === 'new-thread'

    useEffect(() => {
        startTransition(async () => {
            // Load available quests for dropdown
            const quests = await getAdminQuests()
            setAvailableQuests(quests)

            if (!isNew) {
                const data = await getAdminThread(params.id)
                if (data) {
                    setTitle(data.title)
                    setDescription(data.description || '')
                    setThreadType(data.threadType)
                    setCompletionReward(data.completionReward)
                    try {
                        setAllowedPlaybooks(data.allowedPlaybooks ? JSON.parse(data.allowedPlaybooks) : [])
                    } catch (e) { setAllowedPlaybooks([]) }

                    // Sort quests by position
                    const sorted = (data.quests || []).sort((a: any, b: any) => a.position - b.position)

                    // Hydrate with full quest details from available list if needed
                    // But simpler: we need to join this data. 
                    // Prisma include quests in getAdminThread only includes the ThreadQuest relation.
                    // We need the actual Quest info.
                    // Let's manually map it efficiently on client for now or improved backend query.
                    // The backend query `getAdminThread` needs deeper include.
                    // Actually let's just rely on what we have.
                    // Limitation: `getAdminThread` currently includes `quests: true` (ThreadQuest).
                    // We need `quests: { include: { quest: true } }`? No, schema says `ThreadQuest` has `questId`.
                    // It doesn't relationally link to `CustomBar` (Quest) in the defined schema properly?
                    // Schema: `ThreadQuest` has `questId String`. It does NOT have `@relation` to `CustomBar`.
                    // Ah, `ThreadQuest` definition:
                    // model ThreadQuest { ... questId String ... }
                    // It's missing the relation to `CustomBar`? 
                    // Let's check schema.

                    // If missing relation, we match manually.
                    const enriched = sorted.map((tq: any) => {
                        const fullQuest = quests.find(q => q.id === tq.questId)
                        return {
                            questId: tq.questId,
                            title: fullQuest ? fullQuest.title : 'Unknown Quest'
                        }
                    })
                    setThreadQuests(enriched)
                }
            }
            setLoading(false)
        })
    }, [params.id, isNew])

    // Handlers
    const handleSave = async () => {
        startTransition(async () => {
            // 1. Save Metadata
            await upsertQuestThread({
                id: isNew ? undefined : params.id,
                title,
                description,
                threadType,
                completionReward,
                allowedPlaybooks: allowedPlaybooks.length > 0 ? allowedPlaybooks : undefined
            })

            // 2. Save Quests (only if not new, or need to handle new ID return)
            // Current upsertQuestThread doesn't return ID.
            // Limitation: Creating new thread and adding quests in one go is tricky without ID.
            // Workaround: If new, we save metadata first, get redirected. 
            // User has to edit adding quests after creation.
            // OR we fix upsert to return ID.

            if (!isNew) {
                await updateThreadQuests(params.id, threadQuests.map(q => q.questId))
            }

            router.push('/admin/journeys')
            router.refresh()
        })
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this thread?')) return
        startTransition(async () => {
            await deleteThread(params.id)
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
        const quest = availableQuests.find(q => q.id === selectedQuestId)
        if (quest) {
            setThreadQuests([...threadQuests, { questId: quest.id, title: quest.title }])
            setSelectedQuestId('')
        }
    }

    const removeQuest = (index: number) => {
        const newQuests = [...threadQuests]
        newQuests.splice(index, 1)
        setThreadQuests(newQuests)
    }

    const moveQuest = (index: number, direction: -1 | 1) => {
        const newQuests = [...threadQuests]
        if (index + direction < 0 || index + direction >= newQuests.length) return

        const temp = newQuests[index]
        newQuests[index] = newQuests[index + direction]
        newQuests[index + direction] = temp
        setThreadQuests(newQuests)
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
                        {isNew ? 'Create Thread' : 'Edit Thread'}
                    </h1>
                    {isNew && <p className="text-xs text-orange-400">Save thread to add quests</p>}
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
                                placeholder="e.g. Mountain Ascent"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white h-24"
                                placeholder="Describe the journey..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-400">Type</label>
                                <select
                                    value={threadType}
                                    onChange={e => setThreadType(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                >
                                    <option value="standard">Standard</option>
                                    <option value="orientation">Orientation</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-400">Reward (ⓥ)</label>
                                <input
                                    type="number"
                                    value={completionReward}
                                    onChange={e => setCompletionReward(parseInt(e.target.value))}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
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
                        <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Quest Steps</h2>

                        {!isNew ? (
                            <>
                                <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                                    {threadQuests.map((q, idx) => (
                                        <div key={`${q.questId}-${idx}`} className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-lg group">
                                            <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-zinc-500 text-xs rounded">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 truncate text-sm font-medium text-zinc-300">
                                                {q.title}
                                            </div>
                                            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveQuest(idx, -1)} disabled={idx === 0} className="p-1 hover:text-white disabled:opacity-20">↑</button>
                                                <button onClick={() => moveQuest(idx, 1)} disabled={idx === threadQuests.length - 1} className="p-1 hover:text-white disabled:opacity-20">↓</button>
                                                <button onClick={() => removeQuest(idx)} className="p-1 text-red-500 hover:text-red-400">×</button>
                                            </div>
                                        </div>
                                    ))}
                                    {threadQuests.length === 0 && (
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
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm text-center px-8">
                                Save the thread first to start adding quests.
                            </div>
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
                        Delete Thread
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
