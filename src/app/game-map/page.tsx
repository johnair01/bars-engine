import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { NARRATIVE_META_LINKS, NARRATIVE_SPACE_SECTIONS } from '@/lib/narrative-os/baseline-map'
import { SpaceCard } from '@/components/narrative-os/SpaceCard'

/**
 * Game map — Narrative OS v0: four spaces (Library, Dojo, Forest, Forge).
 * Optional WCGS move tags on links; throughput moves are cross-cutting (see narrative-os spec).
 * Vault stays in global nav (/hand); Forge space links there for integration work.
 * Deep link: /game-map#space-library (etc.)
 */

export default async function GameMapPage() {
  const player = await getCurrentPlayer()
  if (!player || !isGameAccountReady(player)) {
    redirect('/conclave/guided')
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-10">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition inline-block">
            ← Now (dashboard)
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Game map</h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Four spaces of the Narrative OS — Library, Dojo, Forest, Forge. Move tags (Wake Up / Clean Up / Grow Up / Show Up) hint at throughput; your{' '}
            <Link href="/hand" className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline">
              Vault
            </Link>{' '}
            stays in the top nav. API:{' '}
            <code className="text-zinc-500 text-xs">GET /api/world/map</code>
            .
          </p>
        </header>

        <div className="space-y-10">
          {NARRATIVE_SPACE_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={`space-${section.id}`}
              className="space-y-4 scroll-mt-24"
              aria-labelledby={`heading-${section.id}`}
            >
              <div className={`h-px w-24 bg-gradient-to-r ${section.accentBar} rounded-full`} aria-hidden />
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p id={`heading-${section.id}`} className="text-lg font-bold text-white">
                    {section.title}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">{section.subtitle}</p>
                  <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">{section.narrativeDescription}</p>
                  <p className="text-xs text-zinc-600 mt-1 max-w-xl">{section.mechanicalDescription}</p>
                </div>
                <Link
                  href={`/narrative/${section.id}`}
                  className="text-xs text-emerald-500/90 hover:text-emerald-400 transition shrink-0"
                >
                  Space home →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((zone) => (
                  <SpaceCard key={zone.id} link={zone} />
                ))}
              </div>
            </section>
          ))}

          <section className="space-y-4 pt-2 border-t border-zinc-800/80">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Meta</p>
            <p className="text-xs text-zinc-600 max-w-xl">Lower-traffic tools — not a fifth space.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NARRATIVE_META_LINKS.map((zone) => (
                <SpaceCard key={zone.id} link={zone} variant="muted" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
