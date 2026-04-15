import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getPlayerThreads } from '@/actions/quest-thread'
import { getPlayerPacks } from '@/actions/quest-pack'
import { QuestThread } from '@/components/QuestThread'
import { QuestPack } from '@/components/QuestPack'
import { parseCampaignDomainPreference } from '@/lib/allyship-domains'

export default async function JourneysPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const threads = await getPlayerThreads()
  const packs = await getPlayerPacks()
  const visibleThreads = threads.filter((t: { playerProgress?: { isArchived?: boolean } }) => !t.playerProgress?.isArchived)

  const completedQuests = await db.playerQuest.findMany({
    where: { playerId: player.id, status: 'completed' },
    include: { quest: true },
  })
  const completedMoveTypes = Array.from(
    new Set(completedQuests.filter((q) => q.quest?.moveType).map((q) => q.quest!.moveType as string))
  )
  const isSetupIncomplete = !player.nationId || !player.archetypeId
  const isAdmin = !!player.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">
            ← Dashboard
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
            Journeys
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            All Journeys
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Your quest threads and packs. Continue where you left off.
          </p>
        </header>

        {(visibleThreads.length > 0 || packs.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleThreads.map((thread: object) => (
              <QuestThread
                key={(thread as { id: string }).id}
                thread={thread as any}
                completedMoveTypes={completedMoveTypes}
                isSetupIncomplete={isSetupIncomplete}
                campaignDomainPreference={parseCampaignDomainPreference(player.campaignDomainPreference)}
                isAdmin={isAdmin}
              />
            ))}
            {packs.map((pack: object) => (
              <QuestPack
                key={(pack as { id: string }).id}
                pack={pack as any}
                completedMoveTypes={completedMoveTypes}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-500 mb-4">No journeys yet.</p>
            <Link href="/" className="text-purple-400 hover:text-purple-300 font-medium">
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
