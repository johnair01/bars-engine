'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { redeemLaunchCode } from '@/actions/entitlements'

type Result = Awaited<ReturnType<typeof redeemLaunchCode>>

export function RedeemForm({ initialCode, next }: { initialCode: string; next?: string }) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [result, setResult] = useState<Result | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || pending) return
    startTransition(async () => {
      const r = await redeemLaunchCode(code)
      setResult(r)
      // When the entry point asked to return somewhere (e.g. the reader),
      // route straight there on success — parity with the old unlock form.
      if (r.ok && next) {
        router.push(next)
        router.refresh()
      }
    })
  }

  const ok = result?.ok === true

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label htmlFor="redeem-code" className="block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Code or license key
        </span>
        <input
          id="redeem-code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="MAL-XXXX-XXXX or your Gumroad key"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={ok}
          className="min-h-11 w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 font-bold tracking-widest text-[#e8e6e0] placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none disabled:opacity-60"
        />
      </label>

      {!ok && (
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908] disabled:opacity-50"
        >
          {pending ? 'Redeeming…' : 'Redeem'}
        </button>
      )}

      {result && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            ok
              ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-200'
              : 'border-amber-700/60 bg-amber-950/40 text-amber-200'
          }`}
        >
          <p className={result.ok ? 'font-semibold' : undefined}>{result.message}</p>
          {result.ok && (
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href={next || result.nextStep.href}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 font-bold text-white transition-colors hover:bg-emerald-500"
              >
                {next ? 'Continue →' : `${result.nextStep.label} →`}
              </Link>
              {!next && result.nextStep.href !== '/dashboard' && (
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-emerald-300/80 underline-offset-2 hover:text-emerald-200 hover:underline"
                >
                  Or go to your dashboard →
                </Link>
              )}
            </div>
          )}
          {!ok && 'needsAuth' in result && result.needsAuth && (
            <Link
              href={`/login?returnTo=${encodeURIComponent(
                `/redeem?${new URLSearchParams({ code, ...(next ? { next } : {}) }).toString()}`,
              )}`}
              className="mt-2 inline-block font-bold text-amber-100 underline-offset-2 hover:underline"
            >
              Sign in →
            </Link>
          )}
        </div>
      )}
    </form>
  )
}
