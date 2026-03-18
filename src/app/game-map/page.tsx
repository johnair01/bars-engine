import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'

const ZONES = [
  {
    label: 'Campaign',
    description: 'The active board — what\'s happening now.',
    href: '/campaign/board',
    accent: 'border-purple-700/50 hover:border-purple-600/60',
    tag: 'text-purple-500',
  },
  {
    label: 'Campaign Lobby',
    description: '8 I Ching portals — choose your path into the campaign.',
    href: '/campaign/lobby?ref=bruised-banana',
    accent: 'border-purple-600/50 hover:border-purple-500/60',
    tag: 'text-purple-400',
  },
  {
    label: 'Daily Alchemy',
    description: 'Check in with your emotional state and enter a scene.',
    href: '/',
    accent: 'border-emerald-700/50 hover:border-emerald-600/60',
    tag: 'text-emerald-500',
  },
  {
    label: 'Quest Wallet',
    description: 'Your active quests, private drafts, and face moves.',
    href: '/hand',
    accent: 'border-amber-700/50 hover:border-amber-600/60',
    tag: 'text-amber-500',
  },
  {
    label: 'Quest Library',
    description: 'Browse available quests and request new ones.',
    href: '/library',
    accent: 'border-indigo-700/50 hover:border-indigo-600/60',
    tag: 'text-indigo-400',
  },
  {
    label: 'Emotional First Aid',
    description: 'Support tools for stuck or overwhelmed states.',
    href: '/emotional-first-aid',
    accent: 'border-rose-700/50 hover:border-rose-600/60',
    tag: 'text-rose-400',
  },
  {
    label: 'Reliquary',
    description: 'Blessed objects and collectibles you\'ve earned.',
    href: '/reliquary',
    accent: 'border-yellow-700/50 hover:border-yellow-600/60',
    tag: 'text-yellow-500',
  },
  {
    label: 'Nations',
    description: 'The five elemental nations and their archetypes.',
    href: '/nation',
    accent: 'border-zinc-600/50 hover:border-zinc-500/60',
    tag: 'text-zinc-400',
  },
  {
    label: 'World Wiki',
    description: 'Emotional Alchemy, moves, domains, and lore.',
    href: '/wiki',
    accent: 'border-zinc-600/50 hover:border-zinc-500/60',
    tag: 'text-zinc-400',
  },
  {
    label: 'Fork This Game',
    description: 'Deploy your own copy of the BARs Engine on your own server.',
    href: '/fork-game',
    accent: 'border-teal-700/50 hover:border-teal-600/60',
    tag: 'text-teal-400',
  },
  {
    label: 'Lobby',
    description: 'Global lobby — walk around, meet others, join or create a campaign.',
    href: '/lobby',
    accent: 'border-teal-600/50 hover:border-teal-500/60',
    tag: 'text-teal-400',
  },
  {
    label: 'World',
    description: 'Instance world — enter your campaign\'s spatial map.',
    href: '/world',
    accent: 'border-teal-600/50 hover:border-teal-500/60',
    tag: 'text-teal-400',
  },
]

export default async function GameMapPage() {
  const player = await getCurrentPlayer()
  if (!player || !isGameAccountReady(player)) {
    redirect('/conclave/guided')
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        <header className="space-y-2">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition">← Dashboard</Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Game Map</h1>
          <p className="text-zinc-500 text-sm max-w-lg">
            Navigate the world. Each zone is a different facet of the game.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ZONES.map((zone) => (
            <Link
              key={zone.href}
              href={zone.href}
              className={`block rounded-xl border bg-zinc-900/40 p-4 transition-colors ${zone.accent}`}
            >
              <p className={`text-[10px] uppercase tracking-widest mb-1 ${zone.tag}`}>
                {zone.label}
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {zone.description}
              </p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
