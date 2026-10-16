/**
 * @page /inner-garden
 * @entity BAR
 * @description Inner Garden entry for the Shaman bridge; lists raw Hand/Vault capture BARs eligible for cultivation
 * @permissions authenticated
 * @searchParams error:string (optional bridge error reason)
 * @relationships PLAYER (auth), BAR (Hand/Vault captures)
 * @dimensions WHO:player, WHAT:inner_garden_entry, WHERE:inner_garden, ENERGY:raw_capture
 * @example /inner-garden
 * @agentDiscoverable false
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { listInnerGardenEligibleBars } from '@/actions/inner-garden'
import type { InnerGardenEligibleBar } from '@/lib/inner-garden/bridge'

function LocationPill({ bar }: { bar: InnerGardenEligibleBar }) {
  if (bar.location.kind === 'hand') {
    return (
      <span className="rounded border border-emerald-800/60 bg-emerald-950/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
        Hand slot {bar.location.slotIndex + 1}{bar.location.isCarrying ? ' · carrying' : ''}
      </span>
    )
  }
  return (
    <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
      Vault
    </span>
  )
}

function BarRow({ bar }: { bar: InnerGardenEligibleBar }) {
  return (
    <Link
      href={`/inner-garden/play?chapter=1&barId=${encodeURIComponent(bar.id)}`}
      className="block rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 transition hover:border-emerald-700/70 hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <LocationPill bar={bar} />
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">
              raw {bar.type === 'charge_capture' ? 'charge' : 'BAR'}
            </span>
          </div>
          <h2 className="truncate text-sm font-semibold text-zinc-100">{bar.title}</h2>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{bar.description}</p>
        </div>
        <span className="shrink-0 text-xs text-emerald-400">Play</span>
      </div>
    </Link>
  )
}

export default async function InnerGardenPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const [{ error }, result] = await Promise.all([searchParams, listInnerGardenEligibleBars()])
  if ('error' in result) redirect('/login')

  const hasAny = result.hand.length > 0 || result.vault.length > 0

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-zinc-200 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <Link href="/vault" className="text-sm text-zinc-500 transition hover:text-zinc-300">
            ← Vault
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-400">Inner Garden</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Choose raw material for the Shaman loop</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Only raw personal captures can enter this first Inner Garden slice. Quests, campaign kernels,
              invitations, and already-matured BARs stay in their current systems.
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-sm text-amber-300">
            That BAR could not enter Inner Garden: {error}.
          </div>
        )}

        <section className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                Mastering Allyship · Chapter 1
              </p>
              <h2 className="mt-1 text-lg font-semibold text-emerald-50">Answer the Call</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-emerald-200/70">
                Begin the first playable Inner Garden chapter by naming the signal, tending the
                charge, and choosing one outer-world move.
              </p>
            </div>
            <Link
              href="/inner-garden/chapter-1"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              Play Chapter 1
            </Link>
          </div>
        </section>

        {!hasAny ? (
          <section className="rounded-xl border border-dashed border-zinc-800 p-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-200">No raw captures are ready</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Capture a new BAR or charge, then return here before it has been transformed into a quest,
              campaign object, or later maturity phase.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/bars/capture"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                Capture BAR
              </Link>
              <Link
                href="/vault/charges"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500"
              >
                Open charges
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Hand</h2>
                <p className="text-xs text-zinc-600">Prioritized because these are already being carried.</p>
              </div>
              {result.hand.length > 0 ? (
                <div className="space-y-3">{result.hand.map((bar) => <BarRow key={bar.id} bar={bar} />)}</div>
              ) : (
                <div className="rounded-lg border border-zinc-900 p-4 text-sm text-zinc-600">
                  No raw captures in Hand.
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Vault</h2>
                <p className="text-xs text-zinc-600">Eligible raw captures not currently in Hand.</p>
              </div>
              {result.vault.length > 0 ? (
                <div className="space-y-3">{result.vault.map((bar) => <BarRow key={bar.id} bar={bar} />)}</div>
              ) : (
                <div className="rounded-lg border border-zinc-900 p-4 text-sm text-zinc-600">
                  No raw captures in Vault.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
