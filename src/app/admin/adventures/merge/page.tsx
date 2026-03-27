import { db } from '@/lib/db'
import Link from 'next/link'
import { MergeAdventuresForm } from './MergeAdventuresForm'

/**
 * @page /admin/adventures/merge
 * @entity QUEST
 * @description Combine multiple adventures into one with passage prefix to avoid ID collisions
 * @permissions admin
 * @relationships CONTAINS (merged adventure contains passages from multiple sources)
 * @dimensions WHO:admin, WHAT:QUEST, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/adventures/merge
 * @agentDiscoverable false
 */
export default async function MergeAdventuresPage() {
  const adventures = await db.adventure.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { passages: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/adventures" className="text-sm text-zinc-500 hover:text-zinc-400">
          ← Adventures
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Merge Adventures</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Combine multiple adventures into one. Passages are prefixed to avoid ID collisions. The first selected
          adventure&apos;s start node becomes the new start.
        </p>
      </div>
      <MergeAdventuresForm adventures={adventures} />
    </div>
  )
}
