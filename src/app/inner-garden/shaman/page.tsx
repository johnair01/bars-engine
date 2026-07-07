/**
 * @page /inner-garden/shaman
 * @entity BAR
 * @description Shaman bridge loop: turns one eligible raw BAR into an Inner Garden harvested insight BAR
 * @permissions authenticated
 * @searchParams barId:string (required source BAR), error:string (optional)
 * @relationships PLAYER (auth), BAR (source and returned insight)
 * @dimensions WHO:player, WHAT:shaman_cultivation, WHERE:inner_garden, ENERGY:emotional_charge
 * @example /inner-garden/shaman?barId=bar_123
 * @agentDiscoverable false
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { buildInnerGardenImportPayload, completeInnerGardenShamanRun } from '@/actions/inner-garden'

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

export default async function InnerGardenShamanPage({
  searchParams,
}: {
  searchParams: Promise<{ barId?: string; error?: string }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const { barId, error } = await searchParams
  if (!barId) redirect('/inner-garden?error=missing-bar')

  const result = await buildInnerGardenImportPayload(barId)
  if ('error' in result) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-zinc-200 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <Link href="/inner-garden" className="text-sm text-zinc-500 transition hover:text-zinc-300">
            ← Inner Garden
          </Link>
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-6">
            <h1 className="text-xl font-bold text-amber-200">This BAR cannot enter the Shaman loop</h1>
            <p className="mt-2 text-sm text-amber-300/80">{result.error}</p>
          </div>
        </div>
      </main>
    )
  }

  const payload = result.payload
  const defaultEmotion = payload.bar.emotionHint ?? 'neutrality'

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-zinc-200 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <Link href="/inner-garden" className="text-sm text-zinc-500 transition hover:text-zinc-300">
            ← Inner Garden
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-400">Shaman Guide</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Tend the seed</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              This MVP slice uses the Inner Garden cultivation shape: the BAR enters as raw material,
              receives attention, and returns as a harvested insight in your Vault.
            </p>
          </div>
        </header>

        {error === 'missing' && (
          <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-sm text-amber-300">
            Complete each field before harvesting the insight.
          </div>
        )}

        <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-600">
            <span>{payload.location.kind === 'hand' ? `Hand slot ${payload.location.slotIndex + 1}` : 'Vault'}</span>
            <span>·</span>
            <span>{payload.bar.type === 'charge_capture' ? 'Charge capture' : 'BAR'}</span>
            {payload.bar.elementHint ? (
              <>
                <span>·</span>
                <span>{payload.bar.elementHint}</span>
              </>
            ) : null}
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">{payload.bar.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
            {payload.bar.description}
          </p>
        </section>

        <form action={completeInnerGardenShamanRun} className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
          <input type="hidden" name="sourceBarId" value={payload.bar.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="block text-zinc-300">Seed emotion</span>
              <select
                name="emotionId"
                defaultValue={defaultEmotion}
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
              defaultValue="55"
              className="w-full accent-emerald-500"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="block text-zinc-300">Harvested insight</span>
            <textarea
              name="harvestedInsight"
              required
              minLength={3}
              rows={6}
              placeholder="What can this charge become when it is tended instead of carried alone?"
              className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100 placeholder:text-zinc-700"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-xs leading-relaxed text-zinc-600">
              The result will be saved as a new Shaman BAR in your Vault and linked back to the original.
            </p>
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              Harvest insight
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

