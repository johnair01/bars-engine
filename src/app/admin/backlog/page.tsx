import { getBacklogItemsByOwner } from '@/actions/backlog'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'
import Link from 'next/link'
import { BacklogListClient } from './BacklogListClient'

export default async function AdminBacklogPage(props: {
  searchParams: Promise<{ ownerFace?: string }>
}) {
  const { ownerFace } = await props.searchParams
  const face = ownerFace && GAME_MASTER_FACES.includes(ownerFace as any) ? (ownerFace as any) : undefined
  const items = await getBacklogItemsByOwner(face)

  return (
    <div className="space-y-8 ml-0 sm:ml-64">
      <header>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← Control Center
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Backlog</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Spec Kit backlog items. Assign owner face for agent-domain ownership.
        </p>
      </header>

      <BacklogListClient items={items} initialOwnerFace={face ?? undefined} />
    </div>
  )
}
