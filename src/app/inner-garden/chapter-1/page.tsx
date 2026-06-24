/**
 * @page /inner-garden/chapter-1
 * @entity BAR
 * @description Playable MTGOA Chapter 1 Inner Garden threshold: Answer the Call
 * @permissions authenticated
 * @searchParams error:string (optional)
 * @relationships PLAYER (auth), BAR (optional source and returned Chapter 1 result)
 * @dimensions WHO:player, WHAT:mtgoa_chapter_1, WHERE:inner_garden, ENERGY:call_to_play
 * @example /inner-garden/chapter-1
 * @agentDiscoverable true
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { completeInnerGardenChapterOneRun, listInnerGardenEligibleBars } from '@/actions/inner-garden'
import { getCurrentPlayer } from '@/lib/auth'
import type { InnerGardenEligibleBar } from '@/lib/inner-garden/bridge'

const EMOTIONS = [
  ['fear', 'Fear'],
  ['anger', 'Anger'],
  ['sadness', 'Sadness'],
  ['joy', 'Joy'],
  ['neutrality', 'Neutrality'],
] as const

const ACTIONS = [
  ['name_the_charge', 'Name the charge'],
  ['sit_with_seed', 'Sit with the seed'],
  ['compost_projection', 'Compost projection'],
  ['harvest_witness', 'Harvest witness'],
] as const

function SourceOption({ bar }: { bar: InnerGardenEligibleBar }) {
  const location =
    bar.location.kind === 'hand' ? `Hand slot ${bar.location.slotIndex + 1}` : 'Vault'

  return (
    <label className="block cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 transition hover:border-emerald-700/70">
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="sourceBarId"
          value={bar.id}
          className="mt-1 accent-emerald-500"
          aria-label={`Use ${bar.title}`}
        />
        <span className="min-w-0">
          <span className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
              {location}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">
              raw {bar.type === 'charge_capture' ? 'charge' : 'BAR'}
            </span>
          </span>
          <span className="block truncate text-sm font-semibold text-zinc-100">{bar.title}</span>
          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-zinc-500">
            {bar.description}
          </span>
        </span>
      </div>
    </label>
  )
}

export default async function InnerGardenChapterOnePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const [{ error }, result] = await Promise.all([searchParams, listInnerGardenEligibleBars()])
  if ('error' in result) redirect('/login')

  const eligibleBars = [...result.hand, ...result.vault]

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-zinc-200 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link href="/inner-garden" className="transition hover:text-zinc-300">
              Inner Garden
            </Link>
            <span>›</span>
            <Link href="/mastering-allyship/hub" className="transition hover:text-zinc-300">
              Mastering Allyship
            </Link>
          </nav>
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-400">
              Chapter 1 · Answer the Call
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">The Call to Play</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              You have already heard it: the signal that something could be better. Cross the
              threshold by naming what brought you here, tending the charge around it, and choosing
              one first move you can make outside the app.
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-sm text-amber-300">
            Chapter 1 could not be completed: {error}.
          </div>
        )}

        <form action={completeInnerGardenChapterOneRun} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Starting material
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                Use something raw you are already carrying, or let Chapter 1 create the source BAR
                from the signal you name here.
              </p>
            </div>

            <label className="block cursor-pointer rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="sourceBarId"
                  value=""
                  defaultChecked
                  className="mt-1 accent-emerald-500"
                  aria-label="Create a new Chapter 1 source BAR"
                />
                <span>
                  <span className="block text-sm font-semibold text-emerald-100">Name a new call</span>
                  <span className="mt-1 block text-xs leading-relaxed text-emerald-300/75">
                    Chapter 1 will create the raw source BAR and the completed result BAR.
                  </span>
                </span>
              </div>
            </label>

            {eligibleBars.length > 0 && (
              <div className="space-y-3">
                {eligibleBars.map((bar) => (
                  <SourceOption key={bar.id} bar={bar} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
            <label className="space-y-2 text-sm">
              <span className="block text-zinc-300">Signal</span>
              <textarea
                name="signal"
                required
                minLength={3}
                rows={3}
                placeholder="What signal brought you to allyship work?"
                className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100 placeholder:text-zinc-700"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="block text-zinc-300">Charge or resistance</span>
              <textarea
                name="resistance"
                required
                minLength={3}
                rows={3}
                placeholder="What part of this feels charged, tender, doubtful, or alive?"
                className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100 placeholder:text-zinc-700"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="block text-zinc-300">Seed emotion</span>
                <select
                  name="emotionId"
                  defaultValue="fear"
                  className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100"
                >
                  {EMOTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="block text-zinc-300">Cultivation action</span>
                <select
                  name="cultivationAction"
                  defaultValue="name_the_charge"
                  className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100"
                >
                  {ACTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span className="block text-zinc-300">Seed quality</span>
              <input
                name="seedQuality"
                type="range"
                min="1"
                max="100"
                defaultValue="60"
                className="w-full accent-emerald-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="block text-zinc-300">Harvested insight</span>
              <textarea
                name="harvestedInsight"
                required
                minLength={3}
                rows={4}
                placeholder="What becomes clearer when you tend the charge instead of carrying it alone?"
                className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100 placeholder:text-zinc-700"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="block text-zinc-300">First outer-world move</span>
              <textarea
                name="firstMove"
                required
                minLength={3}
                rows={3}
                placeholder="What is one honest move you are willing to make now?"
                className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100 placeholder:text-zinc-700"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900 pt-4">
              <p className="max-w-md text-xs leading-relaxed text-zinc-600">
                Completion saves a Chapter 1 Shaman BAR in your Vault and keeps the source traceable.
              </p>
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                Answer the call
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}
