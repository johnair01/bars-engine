import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'

/**
 * Game map — four-move organization, highest collective impact first.
 * Vault lives in global nav (/hand); not duplicated here (matches product expectation).
 *
 * Strand consult (bars-agents `strand_run`) was attempted but the MCP hit a DB concurrency
 * error; IA follows the Vault page: clear title, short subtitle, grouped sections with labels.
 */

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

type MapItem = {
  label: string
  description: string
  href: string
  accent: string
  tag: string
}

type MapSection = {
  move: string
  moveDescription: string
  accentBar: string
  items: MapItem[]
}

const MAP_SECTIONS: MapSection[] = [
  {
    move: 'Show Up',
    moveDescription: 'Collective field — campaign, lobby, shared space.',
    accentBar: 'from-amber-500/40 to-transparent',
    items: [
      {
        label: 'Campaign hub',
        description: 'Eight portals into the residency CYOA and face moves for this Kotter stage.',
        href: `/campaign/hub?ref=${encodeURIComponent(DEFAULT_CAMPAIGN_REF)}`,
        accent: 'border-amber-700/50 hover:border-amber-500/60',
        tag: 'text-amber-400',
      },
      {
        label: 'Campaign gameboard',
        description: 'Domain board — what’s live in the campaign right now.',
        href: `/campaign/board?ref=${encodeURIComponent(DEFAULT_CAMPAIGN_REF)}`,
        accent: 'border-purple-700/50 hover:border-purple-600/60',
        tag: 'text-purple-400',
      },
      {
        label: 'Lobby',
        description: 'Walk the shared space; join or host a campaign room.',
        href: '/lobby',
        accent: 'border-teal-700/50 hover:border-teal-500/60',
        tag: 'text-teal-400',
      },
      {
        label: 'World',
        description: 'Your instance spatial map — enter the world room.',
        href: '/world',
        accent: 'border-teal-600/50 hover:border-teal-400/60',
        tag: 'text-teal-300',
      },
    ],
  },
  {
    move: 'Grow Up',
    moveDescription: 'Capacity, lore, and earned depth.',
    accentBar: 'from-emerald-500/35 to-transparent',
    items: [
      {
        label: 'Quest library',
        description: 'Browse quests, unpack moves, request new ones.',
        href: '/library',
        accent: 'border-indigo-700/50 hover:border-indigo-500/60',
        tag: 'text-indigo-400',
      },
      {
        label: 'World wiki',
        description: 'Emotional alchemy, moves, domains, player guides.',
        href: '/wiki',
        accent: 'border-zinc-600/50 hover:border-zinc-500/60',
        tag: 'text-zinc-400',
      },
      {
        label: 'Reliquary',
        description: 'Blessed objects and collectibles you’ve earned.',
        href: '/reliquary',
        accent: 'border-yellow-700/50 hover:border-yellow-500/60',
        tag: 'text-yellow-500',
      },
      {
        label: 'Nations',
        description: 'Five elemental nations and their archetypes.',
        href: '/nation',
        accent: 'border-zinc-600/50 hover:border-zinc-500/60',
        tag: 'text-zinc-400',
      },
    ],
  },
  {
    move: 'Clean Up',
    moveDescription: 'Metabolize charge and regulate when it’s too much.',
    accentBar: 'from-sky-500/35 to-transparent',
    items: [
      {
        label: '321 Shadow process',
        description: 'Face it, talk to it, be it — then turn it into a quest.',
        href: '/shadow/321',
        accent: 'border-sky-800/50 hover:border-sky-500/60',
        tag: 'text-sky-400',
      },
      {
        label: 'Emotional first aid',
        description: 'Short protocols when you’re stuck or overwhelmed.',
        href: '/emotional-first-aid',
        accent: 'border-rose-800/50 hover:border-rose-500/60',
        tag: 'text-rose-400',
      },
    ],
  },
  {
    move: 'Wake Up',
    moveDescription: 'Name what’s alive — charge, identity, daily field.',
    accentBar: 'from-emerald-500/30 to-transparent',
    items: [
      {
        label: 'Now (dashboard)',
        description: 'Daily check-in, compass, journeys — your home surface.',
        href: '/',
        accent: 'border-emerald-800/50 hover:border-emerald-500/60',
        tag: 'text-emerald-400',
      },
      {
        label: 'Capture a charge',
        description: 'Name the voltage before it dissipates.',
        href: '/capture',
        accent: 'border-emerald-900/50 hover:border-emerald-600/60',
        tag: 'text-emerald-500',
      },
    ],
  },
]

const META_ITEMS: MapItem[] = [
  {
    label: 'Fork this game',
    description: 'Deploy your own BARs Engine instance.',
    href: '/fork-game',
    accent: 'border-teal-800/40 hover:border-teal-600/50',
    tag: 'text-teal-500/80',
  },
]

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
            Four moves, ordered from highest collective impact toward personal wake-up. Your{' '}
            <Link href="/hand" className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline">
              Vault
            </Link>{' '}
            stays in the top nav — this page is for choosing where to play next.
          </p>
        </header>

        <div className="space-y-10">
          {MAP_SECTIONS.map((section) => (
            <section key={section.move} className="space-y-4">
              <div className={`h-px w-24 bg-gradient-to-r ${section.accentBar} rounded-full`} aria-hidden />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{section.move}</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xl">{section.moveDescription}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((zone) => (
                  <Link
                    key={zone.href}
                    href={zone.href}
                    className={`block rounded-xl border bg-zinc-950/50 p-4 transition-colors ${zone.accent}`}
                  >
                    <p className={`text-[10px] uppercase tracking-widest mb-1 ${zone.tag}`}>{zone.label}</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{zone.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section className="space-y-4 pt-2 border-t border-zinc-800/80">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Meta</p>
            <p className="text-xs text-zinc-600 max-w-xl">Lower-traffic tools — last on the map by design.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {META_ITEMS.map((zone) => (
                <Link
                  key={zone.href}
                  href={zone.href}
                  className={`block rounded-xl border bg-zinc-950/30 p-4 transition-colors ${zone.accent}`}
                >
                  <p className={`text-[10px] uppercase tracking-widest mb-1 ${zone.tag}`}>{zone.label}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{zone.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
