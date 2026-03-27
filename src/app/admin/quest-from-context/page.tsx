import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { QuestFromContextForm } from './QuestFromContextForm'

const ALLYSHIP_DOMAINS = [
  'GATHERING_RESOURCES',
  'DIRECT_ACTION',
  'RAISE_AWARENESS',
  'SKILLFUL_ORGANIZING',
] as const

/**
 * @page /admin/quest-from-context
 * @entity QUEST
 * @description Generate quests from campaign context (instance, Kotter stage, allyship domain)
 * @permissions admin
 * @relationships LINKED_TO (instance with campaign context)
 * @dimensions WHO:admin, WHAT:QUEST, WHERE:allyshipDomain+kotterStage, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/quest-from-context
 * @agentDiscoverable false
 */
export default async function AdminQuestFromContextPage() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) redirect('/')

  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { roles: { include: { role: true } } },
  })

  const isAdmin = player?.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) redirect('/')

  const instances = await db.instance.findMany({
    where: {},
    select: { id: true, campaignRef: true, kotterStage: true },
    take: 5,
  })

  const slots = await db.gameboardSlot.findMany({
    where: { questId: { not: null } },
    include: { quest: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-8 max-w-2xl mx-auto space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Generate Quest from Context</h1>
        <p className="text-zinc-500 mt-1">
          One-click grammatical quest generation. Uses unified API per{' '}
          <code className="text-amber-400">generateQuestFromContext</code>.
        </p>
      </header>

      <QuestFromContextForm
        allyshipDomains={[...ALLYSHIP_DOMAINS]}
        slots={slots.map((s) => ({
          id: s.id,
          questId: s.questId!,
          title: s.quest?.title ?? `Slot ${s.slotIndex}`,
          campaignRef: s.campaignRef,
        }))}
        defaultCampaignRef={instances[0]?.campaignRef ?? 'bruised-banana'}
      />
    </div>
  )
}
