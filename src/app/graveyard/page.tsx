import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { GraveyardClient } from './GraveyardClient'

export default async function GraveyardPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const dormantQuests = await db.customBar.findMany({
    where: {
      status: 'dormant',
      isSystem: false,
      OR: [
        { creatorId: player.id },
        { claimedById: player.id },
      ]
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      creator: { select: { name: true } },
      claimedById: true,
    },
    take: 50,
  })

  const collaborators = await db.player.findMany({
    where: { id: { not: player.id } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 200,
  })

  const isMetalNation = player.nation?.name === 'Metal'

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back</Link>
        <h1 className="text-3xl font-bold text-white">Graveyard</h1>
        <p className="text-zinc-500">
          Dormant quests live here. Recycle them back into ACTIVE with a Nation move.
        </p>
      </header>

      <GraveyardClient
        isMetalNation={isMetalNation}
        dormantQuests={dormantQuests}
        collaborators={collaborators}
      />
    </div>
  )
}

