'use client'

import { useActionState, useState, useEffect } from 'react'
import { createCharacter } from '@/actions/conclave'
import { useRouter } from 'next/navigation'

type Nation = { id: string; name: string; description?: string }
type Archetype = { id: string; name: string; description?: string }

export function InviteSignupForm({
    token,
    nations,
    archetypes,
    prefillNationId = '',
    prefillArchetypeId = '',
    forgerName = null,
    pendingBar = null,
    invitationMessage = null,
}: {
    token: string
    nations: Nation[]
    archetypes: Archetype[]
    prefillNationId?: string
    prefillArchetypeId?: string
    forgerName?: string | null
    pendingBar?: { id: string; title: string; description: string } | null
    invitationMessage?: string | null
}) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [selectedNationId, setSelectedNationId] = useState(prefillNationId)
    const [selectedArchetypeId, setSelectedArchetypeId] = useState(prefillArchetypeId)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const [state, formAction, isPending] = useActionState(createCharacter, null)

    useEffect(() => {
        if (state?.success) {
            router.push('/arrival')
            router.refresh()
        }
        if (state?.error) {
            setError(state.error)
        }
    }, [state, router])

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            {/* INV-1: Forger's personal message — prominent above form */}
            {(invitationMessage || forgerName) && (
                <div className="bg-purple-950/40 border border-purple-800/60 rounded-2xl p-5 space-y-3">
                    <div className="text-center">
                        <div className="text-5xl mb-3">✨</div>
                        <h1 className="text-xl font-bold text-white mb-1">Accept Your Invitation</h1>
                        {forgerName && (
                            <p className="text-zinc-300 text-sm">
                                <span className="text-purple-400 font-medium">{forgerName}</span>
                                {invitationMessage ? ' called you here because...' : ' called you here.'}
                            </p>
                        )}
                    </div>
                    {invitationMessage && (
                        <blockquote className="pl-4 border-l-2 border-purple-600/60 text-zinc-300 text-sm italic">
                            {invitationMessage}
                        </blockquote>
                    )}
                </div>
            )}

            {/* Pending BAR card (when no personal message but BAR exists) */}
            {pendingBar && !invitationMessage && (
                <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-5 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-indigo-400">
                        {forgerName ? `${forgerName} sent you a BAR` : 'A BAR awaits you'}
                    </p>
                    <h2 className="text-white font-bold">{pendingBar.title}</h2>
                    <p className="text-zinc-400 text-sm line-clamp-3">{pendingBar.description}</p>
                    <p className="text-xs text-indigo-300/70">Sign up below to receive it.</p>
                </div>
            )}

        <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
            <div className="text-center mb-8">
                {!(invitationMessage || forgerName) && <div className="text-5xl mb-4">✨</div>}
                <h2 className="text-xl font-bold text-white mb-2">
                    {(invitationMessage || forgerName) ? 'Create your character' : 'Accept Your Invitation'}
                </h2>
                {!(invitationMessage || forgerName) && (
                    <p className="text-zinc-400 text-sm">Create your character to join the game.</p>
                )}
            </div>

            <form action={formAction} className="space-y-4">
                <input type="hidden" name="token" value={token} />

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="Your character name"
                        required
                        minLength={2}
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="Secure password..."
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Nation</label>
                    <select
                        name="nationId"
                        required
                        value={selectedNationId}
                        onChange={(e) => setSelectedNationId(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                    >
                        <option value="">Select a nation</option>
                        {nations.map((n) => (
                            <option key={n.id} value={n.id}>
                                {n.name}
                            </option>
                        ))}
                    </select>
                    {selectedNationId && (() => {
                        const d = nations.find((n) => n.id === selectedNationId)?.description
                        const first = d ? d.split(/[.!?]/)[0]?.trim() : ''
                        return first ? <p className="mt-1.5 text-sm text-zinc-400 italic">{first}{first.endsWith('.') ? '' : '.'}</p> : null
                    })()}
                </div>

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Archetype</label>
                    <select
                        name="playbookId"
                        required
                        value={selectedArchetypeId}
                        onChange={(e) => setSelectedArchetypeId(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                    >
                        <option value="">Select an archetype</option>
                        {archetypes.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                    {selectedArchetypeId && (() => {
                        const d = archetypes.find((a) => a.id === selectedArchetypeId)?.description
                        const first = d ? d.split(/[.!?]/)[0]?.trim() : ''
                        return first ? <p className="mt-1.5 text-sm text-zinc-400 italic">{first}{first.endsWith('.') ? '' : '.'}</p> : null
                    })()}
                </div>

                <input
                    type="hidden"
                    name="identity"
                    value={JSON.stringify({ name, contact: email, password })}
                />

                {error && (
                    <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                    {isPending ? 'Creating Character...' : 'Enter the Game →'}
                </button>

                <div className="text-center pt-4">
                    <a href="/conclave/guided" className="text-xs text-zinc-500 hover:text-white transition">
                        Already have an account? Log In
                    </a>
                </div>
            </form>
        </div>
        </div>
    )
}
