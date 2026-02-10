'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
    deleteFirstAidTool,
    getAdminFirstAidTools,
    upsertFirstAidTool,
} from '@/actions/emotional-first-aid'
import { EmotionalFirstAidToolDTO } from '@/lib/emotional-first-aid'

type EditableTool = {
    id?: string
    key: string
    name: string
    description: string
    icon: string
    moveType: string
    tags: string
    twineLogic: string
    isActive: boolean
    sortOrder: number
}

function toEditable(tool: EmotionalFirstAidToolDTO): EditableTool {
    return {
        id: tool.id,
        key: tool.key,
        name: tool.name,
        description: tool.description,
        icon: tool.icon || '',
        moveType: tool.moveType || 'cleanUp',
        tags: tool.tags.join(', '),
        twineLogic: tool.twineLogic,
        isActive: tool.isActive,
        sortOrder: tool.sortOrder,
    }
}

export function FirstAidToolsEditor() {
    const [isPending, startTransition] = useTransition()
    const [tools, setTools] = useState<EditableTool[]>([])
    const [feedback, setFeedback] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const loadTools = useCallback(() => {
        startTransition(async () => {
            setError(null)
            const data = await getAdminFirstAidTools()
            setTools(data.map(toEditable))
        })
    }, [startTransition])

    useEffect(() => {
        loadTools()
    }, [loadTools])

    const updateTool = (index: number, patch: Partial<EditableTool>) => {
        setTools((prev) => prev.map((tool, i) => i === index ? { ...tool, ...patch } : tool))
    }

    const handleSave = (index: number) => {
        const tool = tools[index]
        if (!tool) return

        startTransition(async () => {
            setFeedback(null)
            setError(null)

            const result = await upsertFirstAidTool({
                id: tool.id,
                key: tool.key,
                name: tool.name,
                description: tool.description,
                icon: tool.icon,
                moveType: tool.moveType,
                tags: tool.tags,
                twineLogic: tool.twineLogic,
                isActive: tool.isActive,
                sortOrder: tool.sortOrder,
            })

            if ('error' in result) {
                setError(result.error)
                return
            }

            setFeedback(`Saved ${tool.name}`)
            loadTools()
        })
    }

    const handleDelete = (index: number) => {
        const tool = tools[index]
        if (!tool) return

        if (!tool.id) {
            setTools((prev) => prev.filter((_, i) => i !== index))
            return
        }

        if (!confirm(`Delete tool "${tool.name}"?`)) return

        startTransition(async () => {
            setFeedback(null)
            setError(null)
            const result = await deleteFirstAidTool(tool.id!)
            if ('error' in result) {
                setError(result.error)
                return
            }
            setFeedback(`Deleted ${tool.name}`)
            loadTools()
        })
    }

    const addTool = () => {
        setTools((prev) => [
            {
                key: `new-tool-${prev.length + 1}`,
                name: 'New Tool',
                description: 'Describe the protocol intent.',
                icon: '🩺',
                moveType: 'cleanUp',
                tags: 'other',
                twineLogic: JSON.stringify({
                    startPassageId: 'start',
                    passages: [
                        {
                            id: 'start',
                            text: 'Placeholder protocol.',
                            choices: [{ text: 'Complete', targetId: 'final' }]
                        },
                        { id: 'final', text: 'Done.', choices: [], isFinal: true }
                    ]
                }, null, 2),
                isActive: true,
                sortOrder: (prev[prev.length - 1]?.sortOrder || 0) + 10,
            },
            ...prev,
        ])
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Emotional First Aid Tools</h1>
                    <p className="text-zinc-500 text-sm">Create and tune protocol scripts (Twine JSON).</p>
                </div>
                <button
                    type="button"
                    onClick={addTool}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 transition"
                >
                    + Add Tool
                </button>
            </div>

            {feedback && (
                <div className="rounded-lg border border-green-900/40 bg-green-950/20 p-3 text-sm text-green-300">
                    {feedback}
                </div>
            )}
            {error && (
                <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <div className="space-y-5">
                {tools.map((tool, index) => (
                    <div key={tool.id || `new-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <LabeledInput
                                label="Key"
                                value={tool.key}
                                onChange={(value) => updateTool(index, { key: value })}
                            />
                            <LabeledInput
                                label="Name"
                                value={tool.name}
                                onChange={(value) => updateTool(index, { name: value })}
                            />
                            <LabeledInput
                                label="Icon"
                                value={tool.icon}
                                onChange={(value) => updateTool(index, { icon: value })}
                            />
                            <LabeledInput
                                label="Move Type"
                                value={tool.moveType}
                                onChange={(value) => updateTool(index, { moveType: value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <LabeledInput
                                label="Tags (comma-separated)"
                                value={tool.tags}
                                onChange={(value) => updateTool(index, { tags: value })}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <LabeledInput
                                    label="Sort Order"
                                    value={String(tool.sortOrder)}
                                    onChange={(value) => updateTool(index, { sortOrder: Number(value) || 0 })}
                                    inputMode="numeric"
                                />
                                <label className="space-y-2">
                                    <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Status</span>
                                    <button
                                        type="button"
                                        onClick={() => updateTool(index, { isActive: !tool.isActive })}
                                        className={`w-full rounded-lg border px-3 py-2 text-sm transition ${tool.isActive
                                            ? 'border-green-700 bg-green-900/20 text-green-300'
                                            : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                                            }`}
                                    >
                                        {tool.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </label>
                            </div>
                        </div>

                        <label className="space-y-2 block">
                            <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Description</span>
                            <textarea
                                value={tool.description}
                                onChange={(e) => updateTool(index, { description: e.target.value })}
                                rows={2}
                                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                            />
                        </label>

                        <label className="space-y-2 block">
                            <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Twine Logic (JSON)</span>
                            <textarea
                                value={tool.twineLogic}
                                onChange={(e) => updateTool(index, { twineLogic: e.target.value })}
                                rows={12}
                                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-cyan-100 font-mono focus:border-cyan-500 focus:outline-none"
                            />
                        </label>

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => handleDelete(index)}
                                disabled={isPending}
                                className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900/30 disabled:opacity-50"
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(index)}
                                disabled={isPending}
                                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function LabeledInput({
    label,
    value,
    onChange,
    inputMode,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
}) {
    return (
        <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">{label}</span>
            <input
                value={value}
                inputMode={inputMode}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
        </label>
    )
}
