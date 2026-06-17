import Link from 'next/link'

/**
 * Paywall — fallback for a gated premium surface. Server component (no state).
 * Offers the two ways in: buy on /launch, or redeem a code at /redeem. When the
 * visitor isn't signed in, nudges them to sign in first (a code attaches to an
 * account).
 */
export function Paywall({
  title,
  message,
  authed,
  learnMoreHref,
  learnMoreLabel,
}: {
  title: string
  message?: string
  authed: boolean
  /** Optional top-of-funnel link (e.g. a Sales page) for visitors who want the pitch first. */
  learnMoreHref?: string
  learnMoreLabel?: string
}) {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-16">
      <div className="mx-auto max-w-md space-y-8 text-center">
        <header className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Locked
          </p>
          <h1 className="text-3xl font-bold text-[#e8e6e0]">{title}</h1>
          <p className="text-sm leading-relaxed text-[#a09e98]">
            {message ?? 'This is part of the launch. Unlock it with a purchase or a code.'}
          </p>
        </header>

        <div className="space-y-3">
          <Link
            href="/launch"
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908]"
          >
            See the offers
          </Link>
          <Link
            href="/redeem"
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-700 px-4 font-bold text-[#e8e6e0] transition-colors hover:border-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908]"
          >
            I have a code
          </Link>
        </div>

        {learnMoreHref && (
          <p className="text-xs text-[#6b6965]">
            <Link href={learnMoreHref} className="text-purple-400 underline-offset-2 hover:underline">
              {learnMoreLabel ?? 'Learn more'}
            </Link>
          </p>
        )}

        {!authed && (
          <p className="text-xs text-[#6b6965]">
            Already bought it?{' '}
            <Link href="/login" className="text-purple-400 underline-offset-2 hover:underline">
              Sign in
            </Link>{' '}
            to unlock.
          </p>
        )}
      </div>
    </main>
  )
}
