'use client'

import { getAdminNation, updateNation } from '@/actions/admin'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export default function EditNationPage({ params }: { params: { name: string } }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [loading, setLoading] = useState(true)

    // Form Fields
    const [description, setDescription] = useState('')
    const [imgUrl, setImgUrl] = useState('')
    const [wakeUp, setWakeUp] = useState('')
    const [cleanUp, setCleanUp] = useState('')
    const [growUp, setGrowUp] = useState('')
    const [showUp, setShowUp] = useState('')

    // Decoded name (restore spaces/special chars if encoded by URL)
    const nationName = decodeURIComponent(params.name)

    useEffect(() => {
        startTransition(async () => {
            const data = await getAdminNation(nationName)
            if (data) {
                setDescription(data.description || '')
                setImgUrl(data.imgUrl || '')
                setWakeUp(data.wakeUp || '')
                setCleanUp(data.cleanUp || '')
                setGrowUp(data.growUp || '')
                setShowUp(data.showUp || '')
            }
            setLoading(false)
        })
    }, [nationName])

    const handleSave = async () => {
        startTransition(async () => {
            await updateNation(nationName, {
                description,
                imgUrl,
                wakeUp,
                cleanUp,
                growUp,
                showUp
            })
            router.push('/admin/world')
            router.refresh()
        })
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
                    <h1 className="text-3xl font-bold text-white tracking-widest uppercase">{nationName}</h1>
                    <p className="text-sm text-orange-400">Nation Editor</p>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Core Details */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                        <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Core Details</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white h-32"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400">Image URL</label>
                            <input
                                type="text"
                                value={imgUrl}
                                onChange={e => setImgUrl(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Cultural Practices */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                        <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Social Protocols</h2>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Wake Up (Morning)</label>
                                <textarea
                                    value={wakeUp}
                                    onChange={e => setWakeUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Clean Up (Maintenance)</label>
                                <textarea
                                    value={cleanUp}
                                    onChange={e => setCleanUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Grow Up (Learning)</label>
                                <textarea
                                    value={growUp}
                                    onChange={e => setGrowUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Show Up (Presence)</label>
                                <textarea
                                    value={showUp}
                                    onChange={e => setShowUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold"
                >
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
