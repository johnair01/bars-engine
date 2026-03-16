import { getDiscoveryQuests } from '@/actions/quest-pools'
import Link from 'next/link'
import { DiscoveryQueue } from './DiscoveryQueue'

export default async function AdminDiscoveryPage() {
  const result = await getDiscoveryQuests()
  const quests = 'quests' in result ? result.quests : []

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-white transition">
          ← Back to Admin Control
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Discovery Queue</h1>
        <p className="text-zinc-400">
          Wake Up quests from book analysis. Review, reassign to another pool, or reject.
        </p>
      </div>

      {'error' in result && result.error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-300 text-sm">{result.error}</p>
        </div>
      ) : quests.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-500">No quests in discovery pool.</p>
          <p className="text-zinc-600 text-sm mt-2">
            Approve book-derived quests with moveType Wake Up to add them here.
          </p>
        </div>
      ) : (
        <DiscoveryQueue quests={quests} />
      )}
    </div>
  )
}
