'use client'

import { useActionState, useState, useEffect } from 'react'
import { createCharacter } from '@/actions/conclave'
import { useRouter } from 'next/navigation'

type Nation = { id: string; name: string }
type Archetype = { id: string; name: string }

export function InviteSignupForm({
    token,
    nations,
    archetypes,
}: {
    token: string
    nations: Nation[]
    archetypes: Archetype[]
}) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const [state, formAction, isPending] = useActionState(createCharacter, null)

    useEffect(() => {
        if (state?.success) {
            router.push('/')
            router.refresh()
        }
        if (state?.error) {
            setError(state.error)
        }
    }, [state, router])

    return (
        <div className="w-full max-w-md mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
            <div className="text-center mb-8">
                <div className="text-5xl mb-4">✨</div>
                <h1 className="text-2xl font-bold text-white mb-2">Accept Your Invitation</h1>
                <p className="text-zinc-400 text-sm">Create your character to join the game.</p>
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
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                    >
                        <option value="">Select a nation</option>
                        {nations.map((n) => (
                            <option key={n.id} value={n.id}>
                                {n.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Archetype</label>
                    <select
                        name="playbookId"
                        required
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                    >
                        <option value="">Select an archetype</option>
                        {archetypes.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
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
    )
}
