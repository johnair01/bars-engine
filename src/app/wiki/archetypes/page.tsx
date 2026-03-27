import Link from 'next/link'
import { db } from '@/lib/db'

/**
 * @page /wiki/archetypes
 * @entity WIKI
 * @description Wiki page - Archetypes (playbooks) with primary WAVE stage and four moves
 * @permissions public
 * @relationships lists all Archetype entries with wakeUp/cleanUp/growUp/showUp moves
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /wiki/archetypes
 * @agentDiscoverable true
 */
export default async function ArchetypesPage() {
  const playbooks = await db.archetype.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true, primaryWaveStage: true, wakeUp: true, cleanUp: true, growUp: true, showUp: true },
  })

  const WAVE_LABELS: Record<string, string> = {
    wakeUp: 'Wake Up',
    cleanUp: 'Clean Up',
    growUp: 'Grow Up',
    showUp: 'Show Up',
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Archetypes</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Archetypes (Playbooks)</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Each archetype has a primary WAVE stage and 4 moves. Used for choice privileging in quest design.
          See also <Link href="/wiki/emotional-alchemy" className="text-indigo-400 hover:text-indigo-300">Emotional Alchemy</Link> and <Link href="/wiki/moves" className="text-indigo-400 hover:text-indigo-300">The 4 Moves</Link>.
        </p>
      </header>

      <section className="space-y-6">
        {playbooks.map((pb) => (
          <div key={pb.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h2 id={pb.name.toLowerCase().replace(/\s+/g, '-')} className="text-lg font-bold text-white">
              {pb.name}
            </h2>
            <p className="text-zinc-400 text-sm">{pb.description}</p>
            {pb.primaryWaveStage && (
              <p className="text-xs text-zinc-500">
                Primary WAVE: {WAVE_LABELS[pb.primaryWaveStage] ?? pb.primaryWaveStage}
              </p>
            )}
            <div className="grid gap-2 text-sm border-t border-zinc-800 pt-3">
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Wake Up</span><span className="text-zinc-300">{pb.wakeUp ?? '—'}</span></div>
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Clean Up</span><span className="text-zinc-300">{pb.cleanUp ?? '—'}</span></div>
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Grow Up</span><span className="text-zinc-300">{pb.growUp ?? '—'}</span></div>
              <div><span className="font-medium text-zinc-400 w-20 inline-block">Show Up</span><span className="text-zinc-300">{pb.showUp ?? '—'}</span></div>
            </div>
          </div>
        ))}
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/wiki/emotional-alchemy" className="hover:text-zinc-300">Emotional Alchemy</Link>
        <Link href="/wiki/moves" className="hover:text-zinc-300">The 4 Moves</Link>
        <Link href="/wiki/nations" className="hover:text-zinc-300">Nations</Link>
      </div>
    </div>
  )
}
