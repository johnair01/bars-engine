'use client'

import { getAdminQuest, upsertQuest, deleteQuest } from '@/actions/admin'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export default function EditQuestPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // State
    const [loading, setLoading] = useState(true)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('standard')
    const [reward, setReward] = useState(0)
    const [inputs, setInputs] = useState('[]')

    const isNew = params.id === 'new-quest'

    useEffect(() => {
        if (isNew) {
            setLoading(false)
            return
        }

        startTransition(async () => {
            const data = await getAdminQuest(params.id)
            if (data) {
                setTitle(data.title)
                setDescription(data.description || '')
                setType(data.type)
                setReward(data.reward)
                setInputs(data.inputs || '[]')
            }
            setLoading(false)
        })
    }, [params.id, isNew])

    // Handlers
    const handleSave = async () => {
        try {
            JSON.parse(inputs)
        } catch (e) {
            alert('Invalid JSON in Inputs field')
            return
        }

        startTransition(async () => {
            await upsertQuest({
                id: isNew ? undefined : params.id,
                title,
                description,
                type,
                reward,
                inputs
            })
            router.push('/admin/quests')
            router.refresh()
        })
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this quest?')) return
        startTransition(async () => {
            await deleteQuest(params.id)
            router.push('/admin/quests')
            router.refresh()
        })
    }

    if (loading) return <div className="p-8 text-zinc-500">Loading...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <button
                    onClick={() => router.back()}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-white">
                    {isNew ? 'Create Quest' : 'Edit Quest'}
                </h1>
            </header>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
                        placeholder="e.g. Find the Lost Item"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white h-24"
                        placeholder="Instructions for the player..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
                        >
                            <option value="standard">Standard</option>
                            <option value="vibe">Vibe Check</option>
                            <option value="location">Location</option>
                        </select>
                    </div>

                    {/* Reward */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Reward (ⓥ)</label>
                        <input
                            type="number"
                            value={reward}
                            onChange={e => setReward(parseInt(e.target.value))}
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                </div>

                {/* Inputs JSON */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 flex justify-between">
                        <span>Inputs (JSON)</span>
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            setInputs(JSON.stringify([{ key: 'response', label: 'Your Response', type: 'text' }], null, 2))
                        }} className="text-xs text-emerald-400 hover:underline">
                            Load Template
                        </a>
                    </label>
                    <textarea
                        value={inputs}
                        onChange={e => setInputs(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white font-mono text-sm h-48"
                    />
                    <p className="text-xs text-zinc-500">
                        Define inputs as an array of objects:
                        <code>{` { key: "field_name", label: "Display Label", type: "text|textarea" }`}</code>
                    </p>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-zinc-800 flex justify-between">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={isPending}
                            className="px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-sm"
                        >
                            Delete Quest
                        </button>
                    )}
                    <div className="flex-1 flex justify-end gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                        >
                            {isPending ? 'Saving...' : 'Save Quest'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
