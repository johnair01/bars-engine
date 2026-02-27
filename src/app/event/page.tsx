import Link from 'next/link'
import { getActiveInstance } from '@/actions/instance'
import { getCurrentPlayer } from '@/lib/auth'
import { hasClaimedSupportToken } from '@/actions/donate'
import { KOTTER_STAGES } from '@/lib/kotter'
import { ClaimSupportTokenButton } from './ClaimSupportTokenButton'
import { InviteButton } from './InviteButton'

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
  const hasClaimed = player && instance ? await hasClaimedSupportToken(instance.id) : false

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
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs uppercase tracking-widest text-zinc-500">
              {instance.domainType}
            </span>
            <span className="text-xs text-teal-400">
              Stage {instance.kotterStage ?? 1}: {KOTTER_STAGES[(instance.kotterStage ?? 1) as keyof typeof KOTTER_STAGES]?.name ?? 'Urgency'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white">{instance.name}</h1>
          {instance.theme && (
            <div className="text-lg text-purple-300">{instance.theme}</div>
          )}
          {instance.targetDescription && (
            <p className="text-zinc-400">{instance.targetDescription}</p>
          )}
        </header>

        <section className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Wake Up: Learn the story</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers.
            Your awareness and participation help the collective thrive.
          </p>
          {(instance.theme || instance.targetDescription) && (
            <details className="mt-3">
              <summary className="text-sm text-emerald-400 cursor-pointer hover:text-emerald-300">
                Read more
              </summary>
              <div className="mt-3 space-y-2 text-zinc-400 text-sm">
                {instance.theme && <p>{instance.theme}</p>}
                {instance.targetDescription && <p>{instance.targetDescription}</p>}
              </div>
            </details>
          )}
        </section>

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

        {player && (
          <section className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Support the cause</h2>
            <p className="text-zinc-400 text-sm">
              Declare your support and receive 1 vibeulon (Energy) as a thank-you.
            </p>
            <ClaimSupportTokenButton instanceId={instance.id} hasClaimed={hasClaimed} />
          </section>
        )}

        <section className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Show Up: Contribute to the campaign</h2>
          <p className="text-zinc-500 text-sm">
            Contribute money (Sponsor above) or play the game by signing up and choosing your domains.
            This instance runs on quests, BARs, vibeulons, and story clock.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <InviteButton />
            {player ? (
              <Link href="/" className="flex-1 text-center px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/conclave/guided?ref=bruised-banana" className="flex-1 text-center px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  Play the game — Sign Up
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

