'use client'

import { useActionState, useState, useEffect } from 'react'
import { createGuidedPlayer } from '@/actions/conclave'
import { useRouter } from 'next/navigation'

export function GuidedAuthForm() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const [state, formAction, isPending] = useActionState(createGuidedPlayer, null)

    useEffect(() => {
        if (state?.success) {
            router.refresh()
        }
        if (state?.error) {
            setError(state.error)
        }
    }, [state, router])

    return (
        <div className="w-full max-w-md mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8">
            <div className="text-center mb-8">
                <div className="text-5xl mb-4">📖</div>
                <h1 className="text-2xl font-bold text-white mb-2">Begin Your Story</h1>
                <p className="text-zinc-400 text-sm">Create a temporary identity to start your guided journey.</p>
            </div>

            <form action={formAction} className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="Traveler Name"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Email (for saving progress)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
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
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="Secure password..."
                        required
                        minLength={6}
                    />
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
                    {isPending ? 'Forging Identity...' : 'Enter the Story →'}
                </button>

                <div className="text-center pt-4">
                    <a href="/login" className="text-xs text-zinc-500 hover:text-white transition">
                        Already have an account? Log In
                    </a>
                </div>
            </form>
        </div>
    )
}
