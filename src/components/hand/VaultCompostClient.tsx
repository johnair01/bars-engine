'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { runVaultCompost } from '@/actions/vault-compost'
import { COMPOST_MAX_SOURCES } from '@/lib/vault-compost'

export type CompostEligibleRow = {
    id: string
    title: string
    type: string
    createdAt: string
}

export function VaultCompostClient({ items }: { items: CompostEligibleRow[] }) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [salvageLines, setSalvageLines] = useState('')
    const [tags, setTags] = useState('')
    const [releaseNote, setReleaseNote] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())

    function toggle(id: string) {
        setSuccess(null)
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function selectAll() {
        setSuccess(null)
        setSelected(new Set(items.map((i) => i.id)))
    }

    function clearSelection() {
        setSuccess(null)
        setSelected(new Set())
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        startTransition(async () => {
            const res = await runVaultCompost({
                sourceIds: Array.from(selected),
                salvage: {
                    salvageLinesRaw: salvageLines,
                    tagsRaw: tags,
                    releaseNoteRaw: releaseNote,
                },
            })
            if (!res.ok) {
                setError(res.error)
                return
            }
            setSuccess('Composted. Your salvage is saved to the ledger; sources are archived.')
            setSelected(new Set())
            setSalvageLines('')
            setTags('')
            setReleaseNote('')
            router.refresh()
        })
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-400">
                Nothing eligible to compost right now — you need at least one private draft or unplaced personal quest.
                When you do, come back here to metabolize what you no longer need and keep what still matters.
            </div>
        )
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            {error ? (
                <p className="text-sm text-rose-400/90" role="alert">
                    {error}
                </p>
            ) : null}
            {success ? (
                <p className="text-sm text-emerald-400/90" role="status">
                    {success}
                </p>
            ) : null}

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-zinc-100">Select items</h2>
                    <div className="flex gap-2 text-xs">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-purple-400 hover:text-purple-300"
                        >
                            Select all
                        </button>
                        <span className="text-zinc-600">·</span>
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="text-zinc-500 hover:text-zinc-300"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <p className="text-xs text-zinc-500">
                    Up to {COMPOST_MAX_SOURCES} per session. Only your private drafts and unplaced personal quests
                    appear here.
                </p>
                <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 max-h-[min(50vh,28rem)] overflow-y-auto">
                    {items.map((row) => (
                        <li key={row.id} className="flex gap-3 p-3 hover:bg-zinc-900/40">
                            <input
                                type="checkbox"
                                checked={selected.has(row.id)}
                                onChange={() => toggle(row.id)}
                                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                                id={`compost-${row.id}`}
                            />
                            <label htmlFor={`compost-${row.id}`} className="flex-1 cursor-pointer min-w-0">
                                <span className="block text-sm text-zinc-200 truncate">{row.title}</span>
                                <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                                    {row.type === 'quest' ? 'Unplaced quest' : 'Draft / BAR'} ·{' '}
                                    {new Date(row.createdAt).toLocaleDateString()}
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-zinc-100">Salvage (keep)</h2>
                <p className="text-xs text-zinc-500">
                    What still matters? One line per beat, phrase, or commitment — this is stored for a future organizer
                    pass, not lost with the rest.
                </p>
                <textarea
                    value={salvageLines}
                    onChange={(e) => setSalvageLines(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
                    placeholder="e.g.&#10;The question I still want to ask…&#10;The move I want to try next week…"
                    required
                />
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-medium text-zinc-300">Tags (optional)</h2>
                <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                    placeholder="comma-separated, e.g. work, courage, spring"
                />
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-medium text-zinc-300">Release note (optional)</h2>
                <textarea
                    value={releaseNote}
                    onChange={(e) => setReleaseNote(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                    placeholder="A few words on what you’re letting go — no shame, just clarity."
                />
            </section>

            <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                    type="submit"
                    disabled={pending || selected.size === 0}
                    className="rounded-lg bg-emerald-900/80 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-800/90 disabled:opacity-40 disabled:pointer-events-none"
                >
                    {pending ? 'Composting…' : 'Confirm compost & archive'}
                </button>
                <p className="text-xs text-zinc-500 max-w-md">
                    Selected items will be <strong className="text-zinc-400">archived</strong> (soft) and leave your Vault
                    lists. Salvage lines are stored on your compost ledger.
                </p>
            </div>
        </form>
    )
}
