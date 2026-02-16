'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithState, type LoginState } from '@/actions/conclave-auth'

const initialState: LoginState = {}

export function LoginForm() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(loginWithState, initialState)

    useEffect(() => {
        if (state.success) {
            router.push(state.redirectTo || '/')
            router.refresh()
        }
    }, [state.success, state.redirectTo, router])

    return (
        <div className="w-full max-w-md mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8">
            <div className="text-center mb-8">
                <div className="text-5xl mb-4">🔐</div>
                <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
                <p className="text-zinc-400 text-sm">Use your email and password to continue your journey.</p>
            </div>

            <form action={formAction} className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="Your password"
                        required
                    />
                </div>

                {state.error && (
                    <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg text-center">
                        {state.error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                    {isPending ? 'Signing In...' : 'Sign In →'}
                </button>

                <div className="text-center pt-4 text-xs text-zinc-500">
                    New here?{' '}
                    <Link href="/conclave/guided" className="hover:text-white transition">
                        Create an account
                    </Link>
                </div>
            </form>
        </div>
    )
}
