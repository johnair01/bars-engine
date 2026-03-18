'use client'

import { useActionState, useState, useEffect } from 'react'
import { forgeInvitationBar } from '@/actions/forge-invitation-bar'

type Nation = { id: string; name: string }
type School = { id: string; name: string }

export function ForgeInvitationForm({
    nations,
    schools,
}: {
    nations: Nation[]
    schools: readonly School[]
}) {
    const [targetType, setTargetType] = useState<'nation' | 'school'>('nation')
    const [targetId, setTargetId] = useState('')
    const [title, setTitle] = useState('You are invited')
    const [description, setDescription] = useState(
        'A fellow player has invited you into the game. Accept to begin your journey.'
    )
    const [message, setMessage] = useState('')
    const [state, formAction, isPending] = useActionState(forgeInvitationBar, null)

    useEffect(() => {
        setTargetId('')
    }, [targetType])

    return (
        <div className="space-y-6">
            <form action={formAction} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        Invitation target
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="targetType"
                                value="nation"
                                checked={targetType === 'nation'}
                                onChange={() => setTargetType('nation')}
                                className="rounded border-zinc-600"
                            />
                            <span>Nation</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="targetType"
                                value="school"
                                checked={targetType === 'school'}
                                onChange={() => setTargetType('school')}
                                className="rounded border-zinc-600"
                            />
                            <span>School (Face)</span>
                        </label>
                    </div>
                </div>

                <input type="hidden" name="targetType" value={targetType} />

                {targetType === 'nation' && (
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Nation</label>
                        <select
                            name="targetId"
                            required
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        >
                            <option value="">Select a nation</option>
                            <option value="open">Open — let them choose</option>
                            {nations.map((n) => (
                                <option key={n.id} value={n.id}>
                                    {n.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-zinc-500 text-xs mt-1.5">
                            Choose &quot;Open&quot; if you don&apos;t know their alignment — they&apos;ll pick their own.
                        </p>
                    </div>
                )}

                {targetType === 'school' && (
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">School</label>
                        <select
                            name="targetId"
                            required
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        >
                            <option value="">Select a school (Game Master Face)</option>
                            {schools.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Title (optional)</label>
                    <input
                        type="text"
                        name="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        placeholder="You are invited"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        Personal message (optional)
                    </label>
                    <textarea
                        name="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white resize-none"
                        placeholder="What do you see in this person that belongs in this world?"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">
                        This message will appear on the invitation page — your invitee will see it before signing up.
                    </p>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                        Description (optional)
                    </label>
                    <textarea
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white resize-none"
                        placeholder="A fellow player has invited you..."
                    />
                </div>

                {state && 'error' in state && (
                    <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">{state.error}</div>
                )}

                {state && 'success' in state && (
                    <div className="space-y-3 p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                        <p className="text-green-300 font-medium">Invitation forged!</p>
                        <p className="text-zinc-400 text-sm">Share this link with your invitee:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={state.inviteUrl}
                                className="flex-1 rounded bg-black/50 px-3 py-2 text-xs text-zinc-300 font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const url = state.inviteUrl.startsWith('http') ? state.inviteUrl : `${window.location.origin}${state.inviteUrl}`
                                    navigator.clipboard.writeText(url)
                                }}
                                className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-sm"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending || (targetType === 'nation' && !targetId) || (targetType === 'school' && !targetId)}
                    className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 py-3 font-bold text-white transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Forging...' : 'Forge Invitation'}
                </button>
            </form>
        </div>
    )
}
