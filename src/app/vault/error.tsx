'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function HandError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[hand]', error)
  }, [error])

  return (
    <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-lg mx-auto space-y-6 flex flex-col justify-center">
      <h1 className="text-2xl font-bold text-white">Vault couldn&apos;t load</h1>
      <p className="text-zinc-400 text-sm leading-relaxed">
        Something went wrong while opening your vault. You can try again, or go back to the home screen.
      </p>
      {error.digest ? (
        <p className="text-[10px] font-mono text-zinc-600">digest: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40"
        >
          Home
        </Link>
      </div>
    </div>
  )
}
