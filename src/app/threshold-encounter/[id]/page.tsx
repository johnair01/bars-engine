import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'

/**
 * @page /threshold-encounter/:id
 * @entity QUEST
 * @description Threshold encounter viewer - displays GM face encounter passages with twee export
 * @permissions authenticated, owner_only
 * @params id:string (path, required) - ThresholdEncounter identifier
 * @relationships loads ThresholdEncounter (playerId must match), parses twee passages, exports .twee file
 * @energyCost 0 (encounter viewing)
 * @dimensions WHO:playerId, WHAT:QUEST, WHERE:threshold_encounter, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /threshold-encounter/enc_123
 * @agentDiscoverable false
 */
export default async function ThresholdEncounterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  const { id } = await params
  const encounter = await db.thresholdEncounter.findUnique({
    where: { id },
  })
  if (!encounter || encounter.playerId !== playerId) notFound()

  // Parse passages from twee source
  const passages = encounter.tweeSource
    .split(/^:: /m)
    .filter(Boolean)
    .map((block) => {
      const newlineIdx = block.indexOf('\n')
      const name = block.slice(0, newlineIdx).trim()
      const content = block.slice(newlineIdx + 1).trim()
      return { name, content }
    })
    .filter((p) => p.name !== 'StoryData')

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <header className="space-y-1">
        <div className="text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-400">Home</Link> / Threshold Encounter
        </div>
        <h1 className="text-xl font-bold text-white capitalize">{encounter.gmFace} Encounter</h1>
        <p className="text-xs text-zinc-500 font-mono">{encounter.vector}</p>
      </header>

      <div className="space-y-4">
        {passages.map((p, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{p.name.replace(/_/g, ' ')}</p>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{p.content}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <a
          href={`/api/threshold-encounter/${encounter.id}/export`}
          className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
        >
          Export .twee
        </a>
        <Link href="/" className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition">
          Return home
        </Link>
      </div>
    </div>
  )
}
