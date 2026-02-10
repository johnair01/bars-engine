'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logPersonalBar, promoteBarToQuest } from '@/actions/create-bar'

type LoggedBar = {
    id: string
    title: string
    description: string
    createdAt: Date
}

export function BarWalletManager({ bars }: { bars: LoggedBar[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [source, setSource] = useState<'party' | 'life' | 'story'>('life')
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleLogBar = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!title.trim()) return

        startTransition(async () => {
            setError(null)
            setMessage(null)

            const payload = new FormData()
            payload.set('title', title.trim())
            payload.set('description', description.trim())
            payload.set('source', source)

            const result = await logPersonalBar(payload)
            if (!result.success) {
                setError(result.error || 'Failed to log BAR')
                return
            }

            setTitle('')
            setDescription('')
            setMessage('BAR logged. Promote it when you are ready to act.')
            router.refresh()
        })
    }

    const handlePromote = (barId: string) => {
        if (!confirm('Promote this BAR into an active private quest?')) {
            return
        }

        startTransition(async () => {
            setError(null)
            setMessage(null)

            const payload = new FormData()
            payload.set('barId', barId)

            const result = await promoteBarToQuest(payload)
            if (!result.success) {
                setError(result.error || 'Failed to promote BAR')
                return
            }

            setMessage('BAR promoted to quest and assigned to your board.')
            router.refresh()
        })
    }

    return (
        <div className="space-y-5">
            <form onSubmit={handleLogBar} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="text-sm text-zinc-300 font-bold">Log a personal BAR</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What inspired you?"
                        className="bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                        required
                    />
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value as 'party' | 'life' | 'story')}
                        className="bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                    >
                        <option value="life">Life</option>
                        <option value="party">Party</option>
                        <option value="story">Story Arc</option>
                    </select>
                </div>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional note about why this BAR matters."
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white h-20"
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold disabled:opacity-50"
                    >
                        {isPending ? 'Logging…' : 'Log BAR'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/40 rounded p-3">
                    {error}
                </div>
            )}
            {message && (
                <div className="text-sm text-green-300 bg-green-900/20 border border-green-900/40 rounded p-3">
                    {message}
                </div>
            )}

            <div className="space-y-2">
                {bars.length === 0 ? (
                    <div className="text-sm text-zinc-500 italic">No logged BARs yet.</div>
                ) : (
                    bars.map((bar) => (
                        <div key={bar.id} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <div className="text-white font-bold">{bar.title}</div>
                                <div className="text-xs text-zinc-400 mt-1">{bar.description}</div>
                                <div className="text-[11px] text-zinc-600 mt-2">
                                    Logged {new Date(bar.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handlePromote(bar.id)}
                                className="px-3 py-2 rounded border border-yellow-700 text-yellow-300 hover:bg-yellow-900/20 text-xs font-bold disabled:opacity-50"
                            >
                                Promote to Quest
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
