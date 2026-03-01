'use client'

import { useState } from 'react'
import Link from 'next/link'

const REQUEST_TYPES = [
    { value: 'rules', label: 'Rules' },
    { value: 'ux', label: 'UX' },
    { value: 'tech', label: 'Tech' },
    { value: 'lore', label: 'Lore' },
    { value: 'social', label: 'Social' },
    { value: 'other', label: 'Other' }
]

type Result = { status: 'resolved'; docSlug: string; docTitle: string } | { status: 'spawned'; docQuestId: string; docSlug: string; docTitle: string }

export function LibraryRequestModal({
    isOpen,
    onClose,
    context
}: {
    isOpen: boolean
    onClose: () => void
    context?: Record<string, unknown>
}) {
    if (!isOpen) return null
    const [requestText, setRequestText] = useState('')
    const [requestType, setRequestType] = useState('other')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<Result | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!requestText.trim()) return
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const res = await fetch('/api/library/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestText: requestText.trim(),
                    requestType,
                    privacy: 'anonymized',
                    contextJson: context ?? { path: typeof window !== 'undefined' ? window.location.pathname : '' }
                })
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? 'Failed to submit')
                return
            }
            if (data.result) {
                setResult(data.result)
            }
        } catch (err) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white">Request from Library</h2>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">
                            ×
                        </button>
                    </div>
                    <p className="text-sm text-zinc-400">
                        Ask for help. If we have an answer, you&apos;ll get a link. Otherwise, we&apos;ll create a quest for the community to help document it.
                    </p>

                    {result ? (
                        <div className="space-y-3">
                            {result.status === 'resolved' ? (
                                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4">
                                    <p className="text-emerald-200 font-medium">We found an answer!</p>
                                    <Link
                                        href={`/docs/${result.docSlug}`}
                                        className="mt-2 inline-block text-emerald-400 hover:text-emerald-300 font-bold"
                                    >
                                        {result.docTitle} →
                                    </Link>
                                </div>
                            ) : (
                                <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-4">
                                    <p className="text-purple-200 font-medium">No match yet. A DocQuest was created.</p>
                                    <Link
                                        href={`/adventures?quest=${result.docQuestId}`}
                                        className="mt-2 inline-block text-purple-400 hover:text-purple-300 font-bold"
                                    >
                                        View quest →
                                    </Link>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold text-sm"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                                    What do you need help with?
                                </label>
                                <textarea
                                    value={requestText}
                                    onChange={(e) => setRequestText(e.target.value)}
                                    rows={3}
                                    placeholder="e.g. How do I earn vibeulons?"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                                    Type
                                </label>
                                <select
                                    value={requestType}
                                    onChange={(e) => setRequestType(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    {REQUEST_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {error && (
                                <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                                    {error}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !requestText.trim()}
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
