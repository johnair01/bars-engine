'use client'

import { useState, useEffect, useTransition } from 'react'
import { MicroTwineConfig, MicroTwineMoment, saveMicroTwineModule, getMicroTwineConfig, compileMicroTwine } from '@/actions/micro-twine'

interface MicroTwineWizardProps {
    questId: string
    onSaved?: () => void
}

const DEFAULT_CONFIG: MicroTwineConfig = {
    prologue: 'The journey begins...',
    moments: [
        {
            id: 'moment_1',
            title: 'The First Moment',
            text: 'You stand at the threshold. What do you do?',
            options: [
                { text: 'Step forward', targetMomentId: 'moment_2' }
            ]
        }
    ],
    epilogue: 'The story reaches its end. Your choices have paved the way.',
    outcomeVarName: '$outcome'
}

const FIXED_EXITS = [
    { id: 'exit_SUCCESS', label: 'Success' },
    { id: 'exit_FAILURE', label: 'Failure' },
    { id: 'exit_CHAOS', label: 'Chaos' },
    { id: 'exit_ORDER', label: 'Order' },
    { id: 'exit_SHADOW', label: 'Shadow' },
    { id: 'exit_LIGHT', label: 'Light' },
    { id: 'exit_MERCY', label: 'Mercy' },
    { id: 'exit_JUSTICE', label: 'Justice' },
]

export function MicroTwineWizard({ questId, onSaved }: MicroTwineWizardProps) {
    const [config, setConfig] = useState<MicroTwineConfig>(DEFAULT_CONFIG)
    const [loading, setLoading] = useState(true)
    const [isCompiled, setIsCompiled] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState('')

    useEffect(() => {
        async function load() {
            const data = await getMicroTwineConfig(questId)
            if (data) {
                setConfig(data.config)
                setIsCompiled(data.isCompiled)
            }
            setLoading(false)
        }
        load()
    }, [questId])

    const handleSave = () => {
        setMessage('')
        startTransition(async () => {
            const result = await saveMicroTwineModule(questId, config)
            if ('success' in result) {
                setMessage('✅ Draft Saved')
                setIsCompiled(false) // New draft needs re-compilation
                onSaved?.()
            } else {
                setMessage('❌ Error: ' + result.error)
            }
        })
    }

    const handleCompile = () => {
        setMessage('')
        startTransition(async () => {
            const result = await compileMicroTwine(questId)
            if ('success' in result) {
                setMessage('⚡ Compiled Artifact Created')
                setIsCompiled(true)
            } else {
                setMessage('❌ Compilation Failed: ' + result.error)
            }
        })
    }

    const updateMoment = (index: number, updates: Partial<MicroTwineMoment>) => {
        const newMoments = [...config.moments]
        newMoments[index] = { ...newMoments[index], ...updates }
        setConfig({ ...config, moments: newMoments })
    }

    const addMoment = () => {
        if (config.moments.length >= 5) return
        const nextId = `moment_${config.moments.length + 1}`
        setConfig({
            ...config,
            moments: [...config.moments, { id: nextId, title: 'New Moment', text: '', options: [] }]
        })
    }

    const removeMoment = (index: number) => {
        const newMoments = config.moments.filter((_, i) => i !== index)
        setConfig({ ...config, moments: newMoments })
    }

    const updateOption = (momentIndex: number, optionIndex: number, updates: any) => {
        const newMoments = [...config.moments]
        const newOptions = [...newMoments[momentIndex].options]
        newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates }
        newMoments[momentIndex].options = newOptions
        setConfig({ ...config, moments: newMoments })
    }

    const addOption = (momentIndex: number) => {
        if (config.moments[momentIndex].options.length >= 4) return
        const newMoments = [...config.moments]
        newMoments[momentIndex].options.push({ text: 'New Option', targetMomentId: 'moment_1' })
        setConfig({ ...config, moments: newMoments })
    }

    if (loading) return <div className="text-zinc-500 text-sm">Loading Narrative Config...</div>

    return (
        <div className="space-y-8 border-t border-zinc-800 pt-8 mt-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Micro-Twine Ritual</h2>
                    <p className="text-xs text-zinc-500">Constraint: Max 5 Moments, Max 4 Options per Moment.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-zinc-400">
                        Status: {isCompiled ? (
                            <span className="text-emerald-500">Living Artifact</span>
                        ) : (
                            <span className="text-amber-500">Draft Only</span>
                        )}
                    </span>
                    <span className="text-xs text-zinc-400">{message}</span>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 text-sm"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleCompile}
                        disabled={isPending}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20"
                    >
                        {isPending ? 'Transmuting...' : 'Compile Ritual'}
                    </button>
                </div>
            </div>

            {/* Prologue */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Prologue</label>
                <textarea
                    value={config.prologue}
                    onChange={e => setConfig({ ...config, prologue: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 text-sm h-24 focus:border-purple-500 outline-none transition-all"
                    placeholder="The beginning of the story..."
                />
            </div>

            {/* Moments */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Moments ({config.moments.length}/5)</label>
                    <button
                        onClick={addMoment}
                        disabled={config.moments.length >= 5}
                        className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-30"
                    >
                        + Add Moment
                    </button>
                </div>

                <div className="space-y-4">
                    {config.moments.map((moment, mIdx) => (
                        <div key={moment.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4 relative group">
                            <button
                                onClick={() => removeMoment(mIdx)}
                                className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                ×
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase">Moment ID</label>
                                    <input
                                        type="text"
                                        value={moment.id}
                                        readOnly
                                        className="w-full bg-black/30 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-500 font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase">Title</label>
                                    <input
                                        type="text"
                                        value={moment.title}
                                        onChange={e => updateMoment(mIdx, { title: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase">Passage Text</label>
                                <textarea
                                    value={moment.text}
                                    onChange={e => updateMoment(mIdx, { text: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm h-20"
                                />
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] text-zinc-500 uppercase">Options ({moment.options.length}/4)</label>
                                    <button
                                        onClick={() => addOption(mIdx)}
                                        disabled={moment.options.length >= 4}
                                        className="text-[10px] text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                                    >
                                        + Add Option
                                    </button>
                                </div>

                                <div className="grid gap-2">
                                    {moment.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="grid grid-cols-12 gap-2 items-center">
                                            <input
                                                type="text"
                                                value={opt.text}
                                                onChange={e => updateOption(mIdx, oIdx, { text: e.target.value })}
                                                className="col-span-5 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                                                placeholder="Label"
                                            />
                                            <select
                                                value={opt.targetMomentId}
                                                onChange={e => updateOption(mIdx, oIdx, { targetMomentId: e.target.value })}
                                                className="col-span-4 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-400"
                                            >
                                                <optgroup label="Moments">
                                                    {config.moments.map(m => (
                                                        <option key={m.id} value={m.id}>{m.title || m.id}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Exits">
                                                    {FIXED_EXITS.map(ex => (
                                                        <option key={ex.id} value={ex.id}>{ex.label}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <input
                                                type="text"
                                                value={opt.outcomeValue || ''}
                                                onChange={e => updateOption(mIdx, oIdx, { outcomeValue: e.target.value })}
                                                className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-500 font-mono"
                                                placeholder="Outcome"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newMoments = [...config.moments]
                                                    newMoments[mIdx].options = newMoments[mIdx].options.filter((_, i) => i !== oIdx)
                                                    setConfig({ ...config, moments: newMoments })
                                                }}
                                                className="col-span-1 text-zinc-600 hover:text-red-400 text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Epilogue */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Epilogue (Binding Manifestation)</label>
                <textarea
                    value={config.epilogue}
                    onChange={e => setConfig({ ...config, epilogue: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-emerald-300 text-sm h-24 focus:border-emerald-500 outline-none transition-all font-mono"
                    placeholder="Binding markers will be auto-injected here..."
                />
                <p className="text-[10px] text-zinc-600">The BIND markers will be automatically appended to this text during compilation.</p>
            </div>
        </div>
    )
}
