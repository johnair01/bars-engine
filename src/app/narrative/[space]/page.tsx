import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { getSpaceHomePayload } from '@/lib/narrative-os/space-home'
import { isSpaceId, SPACE_IDS, type SpaceId } from '@/lib/narrative-os/types'
import { NarrativeHeader } from '@/components/narrative-os/NarrativeHeader'
import { SpaceCard } from '@/components/narrative-os/SpaceCard'

/**
 * @page /narrative/:space
 * @entity SYSTEM
 * @description Narrative OS space home - one of four spaces (library, dojo, forest, forge) with destinations and primary CTA
 * @permissions authenticated, game_account_ready
 * @params space:string (path, required) - SpaceId: library, dojo, forest, forge
 * @relationships displays space home payload with primary CTA, transitions, and destination links
 * @energyCost 0 (navigation hub)
 * @dimensions WHO:playerId, WHAT:SYSTEM, WHERE:narrative_os+space, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up+clean_up+grow_up+show_up
 * @example /narrative/library
 * @agentDiscoverable false
 */
type Props = { params: Promise<{ space: string }> }

/** Only the four canonical SpaceId routes exist. */
export const dynamicParams = false

export function generateStaticParams(): { space: SpaceId }[] {
  return SPACE_IDS.map((space) => ({ space }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { space } = await props.params
  if (!isSpaceId(space)) return { title: 'Narrative space' }
  const p = getSpaceHomePayload(space)
  return {
    title: `${p.title} — Narrative OS`,
    description: p.narrativeDescription,
  }
}

export default async function NarrativeSpacePage(props: Props) {
  const { space } = await props.params
  if (!isSpaceId(space)) notFound()

  const player = await getCurrentPlayer()
  if (!player || !isGameAccountReady(player)) {
    redirect('/conclave/guided')
  }

  const p = getSpaceHomePayload(space)

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-10">
        <NarrativeHeader
          title={p.title}
          subtitle={p.subtitle}
          narrativeDescription={p.narrativeDescription}
          mechanicalDescription={p.mechanicalDescription}
          accentBar={p.accentBar}
          backHref="/game-map"
          backLabel="← Game map"
        />

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Primary move</h2>
          <Link
            href={p.primaryCta.href}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-600 text-sm transition-colors min-h-[44px]"
          >
            {p.primaryCta.label}
          </Link>
        </section>

        {p.recommendations.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Transitions</h2>
            <ul className="list-disc list-inside text-sm text-zinc-500 space-y-1">
              {p.recommendations.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Destinations</h2>
            <Link
              href={`/game-map#${p.gameMapHash}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              On map ↗
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.destinations.map((link) => (
              <SpaceCard key={link.id} link={link} />
            ))}
          </div>
        </section>

        <p className="text-xs text-zinc-600">
          API:{' '}
          <code className="text-zinc-500">
            GET /api/{space}/home
          </code>
        </p>
      </div>
    </div>
  )
}
