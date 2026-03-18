import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { UnpackQuestFlow } from '@/components/quest/UnpackQuestFlow'

export default async function UnpackQuestPage({
  params,
}: {
  params: Promise<{ questId: string }>
}) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  const { questId } = await params

  const quest = await db.customBar.findUnique({
    where: { id: questId },
    select: {
      id: true,
      title: true,
      description: true,
      moveType: true,
      creatorId: true,
      claimedById: true,
      sourceBarId: true,
    },
  })

  if (!quest) notFound()
  if (quest.creatorId !== playerId && quest.claimedById !== playerId) notFound()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <header className="space-y-1">
          <Link href="/hand" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
            ← Quest Wallet
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-purple-500 mt-2">Unpack</p>
          <h1 className="text-xl font-bold text-white leading-snug">{quest.title}</h1>
          {quest.description && (
            <p className="text-zinc-400 text-sm pt-1 line-clamp-3">{quest.description}</p>
          )}
        </header>

        <UnpackQuestFlow
          questId={quest.id}
          questTitle={quest.title}
          initialMoveType={quest.moveType ?? null}
        />
      </div>
    </div>
  )
}
