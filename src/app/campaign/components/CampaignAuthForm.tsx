'use client'

import { useActionState, useState, useEffect } from 'react'
import { createCampaignPlayer, loginWithCampaignState } from '../actions/campaign'
import { useRouter } from 'next/navigation'

interface CampaignAuthFormProps {
    campaignState: Record<string, any>
}

function hasShareToken(state: Record<string, unknown>): boolean {
    const t = state?.shareToken
    return typeof t === 'string' && t.trim().length > 0
}

export function CampaignAuthForm({ campaignState }: CampaignAuthFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    /** Shared BAR flows should land on login first—recipient likely already has an account. */
    const [mode, setMode] = useState<'signup' | 'login'>(() =>
        hasShareToken(campaignState as Record<string, unknown>) ? 'login' : 'signup'
    )
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const [signupState, signupAction, isSignupPending] = useActionState(createCampaignPlayer, null)
    const [loginState, loginAction, isLoginPending] = useActionState(loginWithCampaignState, null)

    const isPending = mode === 'signup' ? isSignupPending : isLoginPending
    const state = mode === 'signup' ? signupState : loginState

    useEffect(() => {
        if (state?.success) {
            router.push('redirectTo' in state && state.redirectTo ? state.redirectTo : '/conclave/onboarding')
            router.refresh()
        }
        if (state?.error) {
            setError(state.error)
        }
    }, [state, router])

    return (
        <div className="w-full max-w-md mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8">
            <div className="text-center mb-8">
                <div className="text-5xl mb-4">✨</div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    {mode === 'signup' ? 'Claim Your Destiny' : 'Welcome Back'}
                </h1>
                <p className="text-zinc-400 text-sm">
                    {mode === 'signup'
                        ? 'Create your resonance signature to lock in your path and enter the Conclave.'
                        : 'Log in to apply your campaign choices and unlock quests.'}
                </p>
            </div>

            <form action={mode === 'signup' ? signupAction : loginAction} className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-zinc-500 mb-1">Email</label>
                    <input
                        name="email"
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
                        name="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                        placeholder="Secure password..."
                        required
                        minLength={6}
                    />
                </div>

                {mode === 'signup' && (
                    <input
                        type="hidden"
                        name="identity"
                        value={JSON.stringify({ contact: email, password })}
                    />
                )}

                <input
                    type="hidden"
                    name="campaignState"
                    value={JSON.stringify(campaignState)}
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
                    {isPending
                        ? mode === 'signup'
                            ? 'Forging Signature...'
                            : 'Logging in...'
                        : mode === 'signup'
                            ? 'Enter the Conclave →'
                            : 'Log In & Continue →'}
                </button>

                <div className="text-center pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signup' ? 'login' : 'signup')
                            setError(null)
                        }}
                        className="text-xs text-zinc-500 hover:text-white transition"
                    >
                        {mode === 'signup' ? 'Already awake? Log In' : 'New here? Sign Up'}
                    </button>
                </div>
            </form>
        </div>
    )
}
