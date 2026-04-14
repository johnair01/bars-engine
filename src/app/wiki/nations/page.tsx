import Link from 'next/link'
import { db } from '@/lib/db'

/**
 * @page /wiki/nations
 * @entity WIKI
 * @description Wiki page - Nations - all nations with element/channel mapping and four move tunings
 * @permissions public
 * @relationships lists Nation entries with element, emotional channel, and wakeUp/cleanUp/growUp/showUp moves
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+nations, ENERGY:elements+channels, PERSONAL_THROUGHPUT:wake_up+clean_up+grow_up+show_up
 * @example /wiki/nations
 * @agentDiscoverable true
 */
export default async function NationsPage() {
  const nations = await db.nation.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true, element: true, wakeUp: true, cleanUp: true, growUp: true, showUp: true },
  })

  const ELEMENT_CHANNEL: Record<string, string> = {
    metal: 'Fear — risk or opportunity',
    fire: 'Anger — boundary, breakthrough',
    water: 'Sadness — value, meaning',
    wood: 'Joy — vitality, growth',
    earth: 'Neutrality — clarity, coherence',
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Nations</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Nations</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Each nation has all 4 moves (Wake Up, Clean Up, Grow Up, Show Up) tuned to its element and channel.
          See also <Link href="/wiki/emotional-alchemy" className="text-indigo-400 hover:text-indigo-300">Emotional Alchemy</Link> and <Link href="/wiki/moves" className="text-indigo-400 hover:text-indigo-300">The 4 Moves</Link>.
        </p>
      </header>

      <section className="space-y-6">
        {nations.map((nation) => (
          <div key={nation.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h2 id={nation.name.toLowerCase()} className="text-lg font-bold text-white">
              {nation.name}
            </h2>
            <p className="text-zinc-400 text-sm">{nation.description}</p>
            <p className="text-xs text-zinc-500">
              Element: {nation.element ?? '—'} — {ELEMENT_CHANNEL[nation.element ?? ''] ?? '—'}
            </p>
            <div className="grid gap-2 text-sm border-t border-zinc-800 pt-3">
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Wake Up</span><span className="text-zinc-300">{nation.wakeUp ?? '—'}</span></div>
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Clean Up</span><span className="text-zinc-300">{nation.cleanUp ?? '—'}</span></div>
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Grow Up</span><span className="text-zinc-300">{nation.growUp ?? '—'}</span></div>
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Show Up</span><span className="text-zinc-300">{nation.showUp ?? '—'}</span></div>
            </div>
          </div>
        ))}
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/wiki/emotional-alchemy" className="hover:text-zinc-300">Emotional Alchemy</Link>
        <Link href="/wiki/moves" className="hover:text-zinc-300">The 4 Moves</Link>
        <Link href="/wiki/archetypes" className="hover:text-zinc-300">Archetypes</Link>
      </div>

      {/* Every nation has one. You just have to find yours. */}
      <p className="text-[9px] text-zinc-900/40 hover:text-zinc-500 transition-colors duration-1000 mt-6 text-center">
        <Link href="/wiki/hidden/grill-master">There was someone at the grill who knew.</Link>
      </p>
    </div>
  )
}
