'use client'

/**
 * One email field, one button, one disclosed promise.
 *
 * `promise` is required rather than optional on purpose: the handoff's rule is
 * that an ask is visible before it is made, and a capture form with no stated
 * promise is exactly the ask that gets revealed at the end. Making the prop
 * required moves that from a review note to a compile error.
 */

import { useState, useTransition } from 'react'

export type EmailCaptureFormProps = {
  /** What arrives, in the sentence a person would say out loud. Shown above the field. */
  promise: string
  submitLabel: string
  onSubmit: (input: { email: string; name?: string | null }) => Promise<
    { ok: true; message: string } | { ok: false; error: string }
  >
  /** Collect a name alongside the address. */
  askName?: boolean
  className?: string
}

export function EmailCaptureForm({
  promise,
  submitLabel,
  onSubmit,
  askName = false,
  className = '',
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const res = await onSubmit({ email, name: askName ? name : null })
      setResult(res.ok ? { ok: true, message: res.message } : { ok: false, message: res.error })
      if (res.ok) {
        setEmail('')
        setName('')
      }
    })
  }

  if (result?.ok) {
    return (
      <p className={`text-sm text-emerald-300 ${className}`} role="status">
        {result.message}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-2 ${className}`}>
      <p className="text-sm leading-relaxed text-zinc-400">{promise}</p>
      {askName && (
        <label className="sr-only" htmlFor="lead-name">
          Your name
        </label>
      )}
      {askName && (
        <input
          id="lead-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
      )}
      <label className="sr-only" htmlFor="lead-email">
        Your email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="lead-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-h-[44px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-bold text-white transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
      {result && !result.ok && (
        <p className="text-sm text-red-400" role="alert">
          {result.message}
        </p>
      )}
    </form>
  )
}
