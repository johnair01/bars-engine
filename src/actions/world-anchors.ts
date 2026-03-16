'use server'
import { dbBase } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'

export async function getQuestBoardItems(linkedId: string | null | undefined) {
  const quests = await dbBase.customBar.findMany({
    where: {
      ...(linkedId ? { id: linkedId } : {}),
      status: 'active',
      visibility: 'public',
      claimedById: null,
    },
    select: { id: true, title: true, description: true, type: true, reward: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
  })
  return quests
}

export async function claimQuestFromBoard(questId: string) {
  const playerId = await requirePlayer()
  const quest = await dbBase.customBar.findUnique({ where: { id: questId } })
  if (!quest) throw new Error('Quest not found')
  if (quest.claimedById) throw new Error('Quest already claimed')
  await dbBase.customBar.update({
    where: { id: questId },
    data: { claimedById: playerId },
  })
  return { success: true }
}

export async function getPublicBarsForWorld(limit = 20) {
  return dbBase.customBar.findMany({
    where: { visibility: 'public', status: 'active', claimedById: null },
    select: { id: true, title: true, description: true, type: true, reward: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}

export async function claimPublicBar(barId: string) {
  const playerId = await requirePlayer()
  const bar = await dbBase.customBar.findUnique({ where: { id: barId } })
  if (!bar) throw new Error('BAR not found')
  if (bar.claimedById) throw new Error('BAR already claimed')
  await dbBase.customBar.update({
    where: { id: barId },
    data: { claimedById: playerId },
  })
  return { success: true }
}
