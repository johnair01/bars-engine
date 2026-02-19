'use client'

import { useState } from 'react'
import { updatePassage, bindActionToPassage } from '@/actions/story-builder'

interface Link {
    label: string
    target: string
}

interface PassageEditorProps {
    storyId: string
    passage: { name: string, text: string, links: Link[] }
    nations: { id: string, name: true }[]
    playbooks: { id: string, name: true }[]
    quests: { id: string, title: true }[]
    onSave: () => void
}

export function PassageEditor({ storyId, passage, nations, playbooks, quests, onSave }: any) {
    const [text, setText] = useState(passage.text || '')
    const [links, setLinks] = useState<Link[]>(passage.links || [])
    const [saving, setSaving] = useState(false)

    const addLink = () => setLinks([...links, { label: '', target: '' }])
    const updateLink = (index: number, field: keyof Link, value: string) => {
        const newLinks = [...links]
        newLinks[index][field] = value
        setLinks(newLinks)
    }

    const handleSave = async () => {
        setSaving(true)
        await updatePassage(storyId, passage.name, text, links)
        setSaving(false)
        onSave()
    }

    const addBinding = async (type: string, payload: any) => {
        setSaving(true)
        await bindActionToPassage(storyId, passage.name, type, payload)
        setSaving(false)
        onSave()
    }

    return (
        <div className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
            <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-mono">Passage: {passage.name}</label>
                <textarea
                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white h-32 focus:border-green-500 transition outline-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <label className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Options / Links</label>
                    <button onClick={addLink} className="text-xs text-green-400 hover:text-green-300 transition">+ Add Link</button>
                </div>
                <div className="space-y-3">
                    {links.map((link: any, i: number) => (
                        <div key={i} className="flex gap-2">
                            <input
                                className="flex-1 bg-black border border-zinc-800 rounded p-2 text-sm"
                                placeholder="Label (e.g. Go North)"
                                value={link.label}
                                onChange={(e) => updateLink(i, 'label', e.target.value)}
                            />
                            <input
                                className="flex-1 bg-black border border-zinc-800 rounded p-2 text-sm"
                                placeholder="Target Passage Name"
                                value={link.target}
                                onChange={(e) => updateLink(i, 'target', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                    disabled={saving}
                    onClick={handleSave}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Passage'}
                </button>
            </div>

            <div className="pt-6 border-t border-zinc-800">
                <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-4 font-mono">Bindings (Action on Entry)</label>
                <div className="grid grid-cols-2 gap-2">
                    <select
                        className="bg-zinc-800 border border-zinc-700 rounded p-2 text-xs"
                        onChange={(e) => {
                            const q = quests.find((q: any) => q.id === e.target.value)
                            if (q) addBinding('EMIT_QUEST', { title: q.title, id: q.id })
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Bind Quest...</option>
                        {quests.map((q: any) => <option key={q.id} value={q.id}>{q.title}</option>)}
                    </select>

                    <select
                        className="bg-zinc-800 border border-zinc-700 rounded p-2 text-xs"
                        onChange={(e) => addBinding('SET_NATION', { id: e.target.value })}
                        defaultValue=""
                    >
                        <option value="" disabled>Set Nation...</option>
                        {nations.map((n: any) => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>

                    <select
                        className="bg-zinc-800 border border-zinc-700 rounded p-2 text-xs"
                        onChange={(e) => addBinding('SET_ARCHETYPE', { id: e.target.value })}
                        defaultValue=""
                    >
                        <option value="" disabled>Set Archetype...</option>
                        {playbooks.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    )
}
