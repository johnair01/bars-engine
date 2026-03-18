import { listAdminMoves } from '@/actions/move-proposals'
import Link from 'next/link'
import { AdminMovesList } from './AdminMovesList'

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

const TIER_ORDER = ['CANONICAL', 'CANDIDATE', 'CUSTOM', 'EPHEMERAL'] as const

export default async function AdminMovesPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; moveType?: string; nation?: string }>
}) {
  const params = await searchParams
  const filters = {
    tier: params.tier ?? undefined,
    moveType: params.moveType ?? undefined,
    nationId: params.nation ?? undefined,
  }

  const moves = await listAdminMoves(filters)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Moves</h1>
        <p className="text-sm text-zinc-500 mt-1">
          All NationMoves by tier, moveType, nation. Book-extracted moves link to source.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-sm text-zinc-500">Filter:</span>
        <Link
          href="/admin/moves"
          className={`text-sm px-3 py-1 rounded-full transition-colors ${
            !params.tier && !params.moveType && !params.nation
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          All
        </Link>
        {TIER_ORDER.map((t) => (
          <Link
            key={t}
            href={`/admin/moves?tier=${t}${params.moveType ? `&moveType=${params.moveType}` : ''}${params.nation ? `&nation=${params.nation}` : ''}`}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              params.tier === t ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {t}
          </Link>
        ))}
        <span className="text-zinc-600">|</span>
        {(['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const).map((m) => (
          <Link
            key={m}
            href={`/admin/moves?moveType=${m}${params.tier ? `&tier=${params.tier}` : ''}${params.nation ? `&nation=${params.nation}` : ''}`}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              params.moveType === m ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {MOVE_LABELS[m]}
          </Link>
        ))}
      </div>

      <AdminMovesList moves={moves} />
    </div>
  )
}
