import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { Experiment5PlayShell } from '@/components/play/Experiment5PlayShell'

const NATIONS = ['argyra', 'lamenth', 'meridia', 'pyrakanth', 'virelune'] as const
const SAMPLE_ASSETS = [
  'exp3_farm_carrot.png',
  'exp3_farm_watering_can.png',
  'exp3_farm_wooden_crate.png',
  'exp3_forest_red_mushroom.png',
  'exp3_forest_sapling.png',
  'exp3_forest_stone_ore.png',
] as const

type RecentBar = {
  id: string
  title: string
  description: string
  type: string
  createdAt: string
}

export default async function PlayPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/conclave/guided')

  const recentBarsRaw = await db.customBar.findMany({
    where: { creatorId: player.id },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      createdAt: true,
    },
  })

  const recentBars: RecentBar[] = recentBarsRaw.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-3">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">Experiment 5: Play Shell</h1>
          <p className="text-sm text-zinc-400 max-w-3xl">
            Vertical slice: nation-skinned assets (Experiment 4), farm/forest scene shell, and BAR hub adapter calls for quest proposals.
          </p>
        </header>
        <Experiment5PlayShell
          playerId={player.id}
          nations={[...NATIONS]}
          sampleAssets={[...SAMPLE_ASSETS]}
          recentBars={recentBars}
        />
      </div>
    </div>
  )
}
