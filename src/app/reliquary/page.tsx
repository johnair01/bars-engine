import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBlessedObjectsForPlayer, getBlessedObjectDisplayName } from '@/lib/blessed-objects'
import { db } from '@/lib/db'

/**
 * @page /reliquary
 * @entity PLAYER
 * @description Reliquary - blessed objects earned through inner work (EFA, 321, quests, campaign completion)
 * @permissions authenticated
 * @relationships displays player's BlessedObject collection with provenance (instance, Kotter stage, earned date)
 * @energyCost 0 (read-only collection view)
 * @dimensions WHO:playerId, WHAT:PLAYER, WHERE:reliquary, ENERGY:blessed_objects, PERSONAL_THROUGHPUT:reflect
 * @example /reliquary
 * @agentDiscoverable false
 */
export default async function ReliquaryPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const objects = await getBlessedObjectsForPlayer(player.id)

  // Resolve instance names for provenance
  const instanceIds = [...new Set(objects.map((o) => o.instanceId).filter(Boolean))] as string[]
  const instances = await db.instance.findMany({
    where: { id: { in: instanceIds } },
    select: { id: true, name: true },
  })
  const instanceMap = Object.fromEntries(instances.map((i) => [i.id, i.name]))

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition text-xs uppercase tracking-widest flex items-center gap-2 mb-8"
        >
          ← Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reliquary</h1>
          <p className="text-zinc-400 text-sm">
            Blessed objects earned through inner work — EFA, 321, quest completion, campaign participation.
          </p>
        </div>

        {objects.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-500">
            <p className="text-sm">No blessed objects yet.</p>
            <p className="text-xs mt-2">
              Complete Emotional First Aid, the 321 Shadow Process, or quests on the gameboard to earn collectibles.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {objects.map((obj) => {
              const name = getBlessedObjectDisplayName(
                obj.source as 'efa' | '321' | 'stage_talisman' | 'campaign_completion' | 'personal',
                obj.kotterStage
              )
              const instanceName = obj.instanceId ? instanceMap[obj.instanceId] : null
              const earnedDate = new Date(obj.earnedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })

              return (
                <li
                  key={obj.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-400 text-xl">
                    ◆
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {instanceName && <span>{instanceName}</span>}
                      {instanceName && obj.kotterStage != null && ' · '}
                      {obj.kotterStage != null && `Stage ${obj.kotterStage}`}
                      {(instanceName || obj.kotterStage != null) && ' · '}
                      {earnedDate}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
