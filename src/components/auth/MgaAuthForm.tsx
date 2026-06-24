'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signupMga, loginMga } from '@/actions/mga-auth'
import { PrivacyBadge } from '@/components/ui/PrivacyBadge'

/**
 * Plain MGA auth form — signup or login. No Conclave story; on success it routes
 * to the returnTo (or NOW home) and any pending deck-card BAR is claimed server-
 * side via the `bars_deck_pending` cookie.
 */
export function MgaAuthForm({ mode, returnTo }: { mode: 'signup' | 'login'; returnTo?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isSignup = mode === 'signup'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const action = isSignup ? signupMga : loginMga
      const res = await action({ email, password, returnTo })
      if ('error' in res) {
        setError(res.error)
      } else {
        router.push(res.redirectTo)
        router.refresh()
      }
    })
  }

  const otherHref = (() => {
    const base = isSignup ? '/login' : '/signup'
    return returnTo ? `${base}?returnTo=${encodeURIComponent(returnTo)}` : base
  })()

  return (
    <div className="w-full max-w-md mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">{isSignup ? '🌱' : '🔐'}</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {isSignup ? 'Create your account' : 'Sign In'}
        </h1>
        <p className="text-zinc-400 text-sm">
          {isSignup
            ? 'Email and password — pick up your first allyship move and find it waiting in your vault.'
            : 'Use your email and password to continue your journey.'}{' '}
          <PrivacyBadge />
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-zinc-500 mb-1">Email</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
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
            name="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
            placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
            minLength={isSignup ? 6 : undefined}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-purple-900/20 disabled:opacity-50"
        >
          {pending
            ? isSignup
              ? 'Creating…'
              : 'Signing In…'
            : isSignup
              ? 'Create account →'
              : 'Sign In →'}
        </button>

        <div className="text-center pt-4 text-xs text-zinc-500">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <Link href={otherHref} className="hover:text-white transition">
            {isSignup ? 'Sign in' : 'Create an account'}
          </Link>
        </div>
      </form>
    </div>
  )
}
