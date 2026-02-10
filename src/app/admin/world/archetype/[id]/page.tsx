'use client'

import { getAdminArchetype, updateArchetype } from '@/actions/admin'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export default function ArchetypeEditorPage() {
    const params = useParams()
    const router = useRouter()
    const [id, setId] = useState<string>(params.id as string)
    const [data, setData] = useState<any>(null)
    const [isPending, startTransition] = useTransition()
    const [isSaving, startSaving] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const archetype = await getAdminArchetype(id)
            if (archetype) {
                setData(archetype)
            } else {
                alert('Archetype not found')
                router.push('/admin/world')
            }
        })
    }, [id])

    const handleSave = () => {
        startSaving(async () => {
            try {
                await updateArchetype(id, data)
                alert('Saved successfully')
            } catch (e) {
                alert('Failed to save')
                console.error(e)
            }
        })
    }

    if (!data) return <div className="text-white p-8">Loading...</div>

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
                <div>
                    <Link href="/admin/world" className="text-zinc-500 hover:text-white transition text-sm mb-2 block">
                        ← Back to World Data
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-cyan-400">📖</span>
                        {data.name}
                    </h1>
                    <div className="text-xs font-mono text-zinc-600 mt-1">ID: {data.id}</div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div className="grid gap-8">
                {/* READ-ONLY MECHANICS */}
                <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 opacity-75">
                    <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold mb-4 flex items-center gap-2">
                        <span className="text-lg">🔒</span> Mechanics (Read-Only)
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Canonical Name</label>
                            <input
                                type="text"
                                value={data.name}
                                disabled
                                className="w-full bg-black/50 border border-zinc-800 rounded px-4 py-2 text-zinc-500 font-mono cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Moves (JSON Logic)</label>
                            <textarea
                                value={data.moves}
                                disabled
                                rows={3}
                                className="w-full bg-black/50 border border-zinc-800 rounded px-4 py-2 text-zinc-500 font-mono text-xs cursor-not-allowed resize-none"
                            />
                            <p className="text-xs text-zinc-600 mt-1">
                                Moves are hardcoded into game logic (Alchemy, Quest Generation) and cannot be edited here to prevent breakage.
                            </p>
                        </div>
                    </div>
                </section>

                {/* EDITABLE NARRATIVE */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-cyan-400 uppercase tracking-widest text-sm font-bold mb-6 flex items-center gap-2">
                        <span className="text-lg">📝</span> Narrative & Flavor
                    </h2>

                    <div className="space-y-6">
                        {/* Description */}
                        <div>
                            <label className="block text-white text-sm font-bold mb-2">Short Description</label>
                            <textarea
                                value={data.description}
                                onChange={e => setData({ ...data, description: e.target.value })}
                                className="w-full bg-black border border-zinc-700 rounded px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                rows={2}
                            />
                        </div>

                        {/* Rich Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 p-4 rounded-lg border border-cyan-900/30">
                            <div className="col-span-full md:col-span-1">
                                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Central Conflict</label>
                                <input
                                    type="text"
                                    value={data.centralConflict || ''}
                                    onChange={e => setData({ ...data, centralConflict: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-full md:col-span-1">
                                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Primary Question</label>
                                <input
                                    type="text"
                                    value={data.primaryQuestion || ''}
                                    onChange={e => setData({ ...data, primaryQuestion: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Vibe</label>
                                <input
                                    type="text"
                                    value={data.vibe || ''}
                                    onChange={e => setData({ ...data, vibe: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Energy (Quote)</label>
                                <input
                                    type="text"
                                    value={data.energy || ''}
                                    onChange={e => setData({ ...data, energy: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-cyan-200 text-sm italic focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Examples (JSON)</label>
                                <textarea
                                    value={data.examples || '[]'}
                                    onChange={e => setData({ ...data, examples: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-400 font-mono text-xs h-24 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Shadow Signposts (JSON)</label>
                                <textarea
                                    value={data.shadowSignposts || '[]'}
                                    onChange={e => setData({ ...data, shadowSignposts: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-400 font-mono text-xs h-24 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Light Signposts (JSON)</label>
                                <textarea
                                    value={data.lightSignposts || '[]'}
                                    onChange={e => setData({ ...data, lightSignposts: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-400 font-mono text-xs h-24 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        {/* Flavor Cycles */}
                        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-4 mb-2">Flavor Cycles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FlavorInput
                                label="👁 Wake Up (Awareness)"
                                value={data.wakeUp}
                                onChange={(val: string) => setData({ ...data, wakeUp: val })}
                                color="border-yellow-900/50 text-yellow-500"
                            />
                            <FlavorInput
                                label="🧹 Clean Up (Shadow Work)"
                                value={data.cleanUp}
                                onChange={(val: string) => setData({ ...data, cleanUp: val })}
                                color="border-orange-900/50 text-orange-500"
                            />
                            <FlavorInput
                                label="🌲 Grow Up (Development)"
                                value={data.growUp}
                                onChange={(val: string) => setData({ ...data, growUp: val })}
                                color="border-green-900/50 text-green-500"
                            />
                            <FlavorInput
                                label="🎯 Show Up (Action)"
                                value={data.showUp}
                                onChange={(val: string) => setData({ ...data, showUp: val })}
                                color="border-purple-900/50 text-purple-500"
                            />
                        </div>

                        <div className="pt-2">
                            <FlavorInput
                                label="🩺 Emotional First Aid (Clean-Up Lens)"
                                value={data.emotionalFirstAid}
                                onChange={(val: string) => setData({ ...data, emotionalFirstAid: val })}
                                color="border-cyan-900/50 text-cyan-400"
                            />
                            <p className="text-xs text-zinc-600 mt-2">
                                This archetype-specific protocol is used by the Emotional First Aid Kit and can influence quest generation when players opt in.
                            </p>
                        </div>

                        {/* Full Content (Markdown) */}
                        <div className="pt-6 border-t border-zinc-800">
                            <label className="block text-white text-sm font-bold mb-2 flex justify-between">
                                <span>Handbook Content (Markdown)</span>
                                <span className="text-xs text-zinc-500 font-normal">Supports standard markdown formatting</span>
                            </label>
                            <textarea
                                value={data.content || ''}
                                onChange={e => setData({ ...data, content: e.target.value })}
                                className="w-full bg-black border border-zinc-700 rounded px-4 py-4 text-zinc-300 font-mono text-sm focus:border-cyan-500 focus:outline-none transition-colors min-h-[400px]"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

function FlavorInput({ label, value, onChange, color }: any) {
    return (
        <div>
            <label className={`block text-xs uppercase font-bold mb-2 ${color.split(' ')[1]}`}>{label}</label>
            <textarea
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className={`w-full bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-opacity-100 transition-colors ${color.split(' ')[0]}`}
                rows={3}
            />
        </div>
    )
}
