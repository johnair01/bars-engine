'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white font-mono p-8">
      <div className="text-center space-y-4 max-w-sm">
        <h2 className="text-xl font-bold text-zinc-200">Something went wrong</h2>
        <p className="text-sm text-zinc-400">
          An unexpected error occurred. This has been logged.
        </p>
        {process.env.NODE_ENV === 'development' && error?.message && (
          <pre className="text-xs text-red-400 bg-red-950/30 rounded p-3 text-left overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="px-6 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Return to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
