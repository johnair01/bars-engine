'use client'

import { getAdminNation, updateNation } from '@/actions/admin'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export default function NationEditorPage() {
    const params = useParams()
    const router = useRouter()
    const [id, setId] = useState<string>(params.id as string)
    const [data, setData] = useState<any>(null)
    const [isPending, startTransition] = useTransition()
    const [isSaving, startSaving] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const nation = await getAdminNation(id)
            if (nation) {
                setData(nation)
            } else {
                alert('Nation not found')
                router.push('/admin/world')
            }
        })
    }, [id])

    const handleSave = () => {
        startSaving(async () => {
            try {
                await updateNation(id, data)
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
                        <span className="text-orange-400">🏛️</span>
                        {data.name}
                    </h1>
                    <div className="text-xs font-mono text-zinc-600 mt-1">ID: {data.id}</div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div className="grid gap-8">
                {/* READ-ONLY INFO */}
                <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 opacity-75">
                    <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold mb-4 flex items-center gap-2">
                        <span className="text-lg">🔒</span> System Info (Read-Only)
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Nation Name</label>
                            <input
                                type="text"
                                value={data.name}
                                disabled
                                className="w-full bg-black/50 border border-zinc-800 rounded px-4 py-2 text-zinc-500 font-mono cursor-not-allowed"
                            />
                        </div>
                    </div>
                </section>

                {/* EDITABLE NARRATIVE */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-orange-400 uppercase tracking-widest text-sm font-bold mb-6 flex items-center gap-2">
                        <span className="text-lg">📝</span> Narrative & Flavor
                    </h2>

                    <div className="space-y-6">
                        {/* Image URL */}
                        <div>
                            <label className="block text-white text-sm font-bold mb-2">Image URL</label>
                            <input
                                type="text"
                                value={data.imgUrl || ''}
                                onChange={e => setData({ ...data, imgUrl: e.target.value })}
                                className="w-full bg-black border border-zinc-700 rounded px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-white text-sm font-bold mb-2">Description</label>
                            <textarea
                                value={data.description}
                                onChange={e => setData({ ...data, description: e.target.value })}
                                className="w-full bg-black border border-zinc-700 rounded px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                                rows={3}
                            />
                        </div>

                        {/* Flavor Cycles */}
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
