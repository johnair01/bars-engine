'use client'

import { getAdminPlaybook, updatePlaybook } from '@/actions/admin'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export default function EditPlaybookPage({ params }: { params: { name: string } }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [loading, setLoading] = useState(true)

    // Form Fields
    const [description, setDescription] = useState('')
    const [wakeUp, setWakeUp] = useState('')
    const [cleanUp, setCleanUp] = useState('')
    const [growUp, setGrowUp] = useState('')
    const [showUp, setShowUp] = useState('')
    const [moves, setMoves] = useState('[]')

    const playbookName = decodeURIComponent(params.name)

    useEffect(() => {
        startTransition(async () => {
            const data = await getAdminPlaybook(playbookName)
            if (data) {
                setDescription(data.description || '')
                setWakeUp(data.wakeUp || '')
                setCleanUp(data.cleanUp || '')
                setGrowUp(data.growUp || '')
                setShowUp(data.showUp || '')
                try {
                    setMoves(JSON.stringify(data.moves, null, 2))
                } catch (e) { setMoves('[]') }
            }
            setLoading(false)
        })
    }, [playbookName])

    const handleSave = async () => {
        let parsedMoves
        try {
            parsedMoves = JSON.parse(moves)
        } catch (e) {
            alert('Invalid JSON in Moves field')
            return
        }

        startTransition(async () => {
            await updatePlaybook(playbookName, {
                description,
                wakeUp,
                cleanUp,
                growUp,
                showUp,
                moves: parsedMoves
            })
            router.push('/admin/world')
            router.refresh()
        })
    }

    if (loading) return <div className="p-8 text-zinc-500">Loading...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <button
                    onClick={() => router.back()}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    ← Back
                </button>
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-white tracking-widest uppercase">{playbookName}</h1>
                    <p className="text-sm text-cyan-400">Playbook Editor</p>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Protocol Details */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                        <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Protocols</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white h-32"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Wake Up</label>
                                <textarea
                                    value={wakeUp}
                                    onChange={e => setWakeUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Clean Up</label>
                                <textarea
                                    value={cleanUp}
                                    onChange={e => setCleanUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Grow Up</label>
                                <textarea
                                    value={growUp}
                                    onChange={e => setGrowUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase">Show Up</label>
                                <textarea
                                    value={showUp}
                                    onChange={e => setShowUp(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Moves (JSON) */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Moves (JSON)</h2>
                            <span className="text-xs text-zinc-600 font-mono">Advanced Edit</span>
                        </div>

                        <textarea
                            value={moves}
                            onChange={e => setMoves(e.target.value)}
                            className="w-full flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white font-mono text-xs leading-relaxed min-h-[500px]"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold"
                >
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
