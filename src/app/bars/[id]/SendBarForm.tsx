'use client'

import { useActionState, useEffect, useState } from 'react'
import { sendBar } from '@/actions/bars'

interface SendBarFormProps {
    barId: string
    recipients: { id: string; name: string }[]
}

export function SendBarForm({ barId, recipients }: SendBarFormProps) {
    const [state, formAction, isPending] = useActionState(sendBar, null)
    const [mode, setMode] = useState<'dropdown' | 'manual'>('dropdown')

    useEffect(() => {
        if (state?.success) {
            // Reset form on success — the server revalidates the page
        }
    }, [state?.success])

    return (
        <div className="space-y-4">
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="barId" value={barId} />

                {/* Toggle mode */}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <button
                        type="button"
                        onClick={() => setMode('dropdown')}
                        className={`px-3 py-1 rounded-full transition ${mode === 'dropdown' ? 'bg-zinc-800 text-white' : 'hover:text-zinc-300'}`}
                    >
                        Select Player
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('manual')}
                        className={`px-3 py-1 rounded-full transition ${mode === 'manual' ? 'bg-zinc-800 text-white' : 'hover:text-zinc-300'}`}
                    >
                        By Email/Name
                    </button>
                </div>

                {mode === 'dropdown' ? (
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Recipient</label>
                        <select
                            name="recipient"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-purple-500/50 outline-none transition-all"
                            required
                            disabled={isPending}
                        >
                            <option value="">Select a player...</option>
                            {recipients.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">
                            Recipient Email or Username
                        </label>
                        <input
                            type="text"
                            name="recipient"
                            placeholder="email@example.com or username"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-purple-500/50 outline-none transition-all"
                            required
                            disabled={isPending}
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">
                        Note <span className="text-zinc-600 normal-case">(optional)</span>
                    </label>
                    <input
                        type="text"
                        name="note"
                        placeholder="A message for the recipient..."
                        maxLength={300}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-zinc-600 outline-none transition-all"
                        disabled={isPending}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-900/20"
                >
                    {isPending ? 'Sending...' : 'Send BAR'}
                </button>
            </form>

            {state?.success && (
                <div className="text-center text-sm font-bold p-3 rounded-xl animate-in slide-in-from-bottom-2 bg-green-900/30 text-green-400">
                    BAR sent successfully!
                </div>
            )}

            {state?.error && (
                <div className="text-center text-sm font-bold p-3 rounded-xl animate-in slide-in-from-bottom-2 bg-red-900/30 text-red-400">
                    {state.error}
                </div>
            )}
        </div>
    )
}
