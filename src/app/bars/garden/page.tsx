import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { listMyBarsForGarden, type BarGardenFilters } from '@/actions/bars'
import { BarListThumb } from '@/components/bars/BarListThumb'
import {
  MATURITY_PHASES,
  SOIL_KINDS,
  bsmCopy,
  effectiveMaturity,
  maturityLabel,
  parseSeedMetabolization,
  type MaturityPhase,
  type SoilKind,
} from '@/lib/bar-seed-metabolization'

function parseSoil(v: string | undefined): BarGardenFilters['soil'] {
  if (!v || v === 'all') return 'all'
  if ((SOIL_KINDS as readonly string[]).includes(v)) return v as SoilKind
  return 'all'
}

function parseMaturity(v: string | undefined): BarGardenFilters['maturity'] {
  if (!v || v === 'all') return 'all'
  if ((MATURITY_PHASES as readonly string[]).includes(v)) return v as MaturityPhase
  return 'all'
}

export default async function BarsGardenPage({
  searchParams,
}: {
  searchParams: Promise<{ soil?: string; maturity?: string; composted?: string }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const sp = await searchParams
  const soil = parseSoil(sp.soil)
  const maturity = parseMaturity(sp.maturity)
  const includeComposted = sp.composted === '1' || sp.composted === 'true'

  const seeds = await listMyBarsForGarden({
    soil,
    maturity,
    includeComposted,
  })

  const qs = (
    patch: Partial<{ soil: BarGardenFilters['soil']; maturity: BarGardenFilters['maturity']; showComposted: boolean }> = {}
  ) => {
    const p = new URLSearchParams()
    const nextSoil = patch.soil !== undefined ? patch.soil : soil
    const nextMat = patch.maturity !== undefined ? patch.maturity : maturity
    const nextShow = patch.showComposted !== undefined ? patch.showComposted : includeComposted
    if (nextSoil && nextSoil !== 'all') p.set('soil', nextSoil)
    if (nextMat && nextMat !== 'all') p.set('maturity', nextMat)
    if (nextShow) p.set('composted', '1')
    const s = p.toString()
    return s ? `/bars/garden?${s}` : '/bars/garden'
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Link href="/bars" className="text-sm text-zinc-500 hover:text-white transition">
              ← Inspirations
            </Link>
            <h1 className="text-3xl font-bold text-white mt-2">{bsmCopy.gardenTitle}</h1>
            <p className="text-zinc-500 text-sm mt-1 max-w-xl">{bsmCopy.gardenSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center text-xs">
          <span className="text-zinc-600 uppercase tracking-wider">{bsmCopy.gardenFiltersSoil}:</span>
          <Link
            href={qs({ soil: 'all' })}
            className={`px-2 py-1 rounded-md border ${soil === 'all' ? 'border-teal-600 text-teal-300' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
          >
            All
          </Link>
          {SOIL_KINDS.map((k) => (
            <Link
              key={k}
              href={qs({ soil: k })}
              className={`px-2 py-1 rounded-md border ${soil === k ? 'border-teal-600 text-teal-300' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
            >
              {k === 'campaign' ? bsmCopy.soilCampaign : k === 'thread' ? bsmCopy.soilThread : bsmCopy.soilHolding}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center text-xs">
          <span className="text-zinc-600 uppercase tracking-wider">{bsmCopy.gardenFiltersMaturity}:</span>
          <Link
            href={qs({ maturity: 'all' })}
            className={`px-2 py-1 rounded-md border ${maturity === 'all' ? 'border-teal-600 text-teal-300' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
          >
            All
          </Link>
          {MATURITY_PHASES.map((p) => (
            <Link
              key={p}
              href={qs({ maturity: p })}
              className={`px-2 py-1 rounded-md border ${maturity === p ? 'border-teal-600 text-teal-300' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
            >
              {maturityLabel(p)}
            </Link>
          ))}
        </div>

        <div className="text-sm text-zinc-400">
          {includeComposted ? (
            <Link href={qs({ showComposted: false })} className="text-teal-500 hover:text-teal-400 underline">
              Hide composted
            </Link>
          ) : (
            <Link href={qs({ showComposted: true })} className="text-teal-500 hover:text-teal-400 underline">
              {bsmCopy.gardenShowComposted}
            </Link>
          )}
        </div>

        {seeds.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            {bsmCopy.gardenEmpty}
          </div>
        ) : (
          <div className="space-y-3">
            {seeds.map((bar) => {
              const meta = parseSeedMetabolization(bar.seedMetabolization)
              const mat = effectiveMaturity(meta)
              const composted = bar.archivedAt != null
              return (
                <Link key={bar.id} href={`/bars/${bar.id}`} className="block group">
                  <div
                    className={`rounded-xl p-4 transition-colors border ${
                      composted
                        ? 'bg-zinc-950/80 border-zinc-800 opacity-80'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-teal-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <BarListThumb assets={bar.assets ?? []} />
                      <div className="min-w-0 flex-1">
                        <p className="text-zinc-200 text-sm line-clamp-2 group-hover:text-teal-300 transition-colors font-mono">
                          {bar.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                          {meta.soilKind ? (
                            <span className="text-teal-600/90">
                              {meta.soilKind === 'campaign'
                                ? bsmCopy.soilCampaign
                                : meta.soilKind === 'thread'
                                  ? bsmCopy.soilThread
                                  : bsmCopy.soilHolding}
                            </span>
                          ) : (
                            <span>{bsmCopy.soilUnset}</span>
                          )}
                          <span className="text-zinc-600">·</span>
                          <span>{maturityLabel(mat)}</span>
                          {composted ? (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="text-amber-600/90">Composted</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs text-zinc-600">
                        {new Date(bar.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
