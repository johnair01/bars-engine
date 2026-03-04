import { db } from '@/lib/db'
import Link from 'next/link'
import { MergeAdventuresForm } from './MergeAdventuresForm'

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
