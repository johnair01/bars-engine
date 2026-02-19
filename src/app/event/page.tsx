import Link from 'next/link'
import { getActiveInstance } from '@/actions/instance'
import { getCurrentPlayer } from '@/lib/auth'

function formatUsdCents(cents: number) {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars)
}

export default async function EventPage() {
  const instance = await getActiveInstance()
  const player = await getCurrentPlayer()

  if (!instance) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full space-y-6 text-center">
          <div className="text-4xl">🧩</div>
          <h1 className="text-2xl font-bold text-white">No active instance</h1>
          <p className="text-zinc-500">
            The event page isn’t configured yet.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/" className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200">
              Back to app
            </Link>
            <Link href="/conclave" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Join
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const goal = instance.goalAmountCents ?? 0
  const current = instance.currentAmountCents ?? 0
  const pct = goal > 0 ? Math.max(0, Math.min(1, current / goal)) : 0

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back</Link>
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            {instance.domainType}
          </div>
          <h1 className="text-4xl font-bold text-white">{instance.name}</h1>
          {instance.theme && (
            <div className="text-lg text-purple-300">{instance.theme}</div>
          )}
          {instance.targetDescription && (
            <p className="text-zinc-400">{instance.targetDescription}</p>
          )}
        </header>

        {goal > 0 && instance.isEventMode && (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Fundraiser progress</div>
                <div className="text-2xl font-bold text-white">
                  {formatUsdCents(current)} <span className="text-zinc-500 font-mono">/</span> {formatUsdCents(goal)}
                </div>
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                {Math.round(pct * 100)}%
              </div>
            </div>

            <div className="h-3 rounded-full bg-black border border-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {instance.stripeOneTimeUrl && (
                <a
                  href={instance.stripeOneTimeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold"
                >
                  Sponsor the Heist (One-time)
                </a>
              )}
              {instance.patreonUrl && (
                <a
                  href={instance.patreonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Join Patreon (Recurring)
                </a>
              )}
            </div>
          </section>
        )}

        <section className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Enter the engine</h2>
          <p className="text-zinc-500">
            This instance runs on the same core mechanics: quests, BARs, vibeulons, and story clock —
            wrapped in a domain-specific event context.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {player ? (
              <Link href="/" className="flex-1 text-center px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/conclave/guided" className="flex-1 text-center px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  Sign Up
                </Link>
                <Link href="/login" className="flex-1 text-center px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-bold">
                  Log In
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

