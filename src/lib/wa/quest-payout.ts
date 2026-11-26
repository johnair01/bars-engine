/**
 * Pays a finished dojo quest's vibeulon bounty, once per player per quest. Safe to call again: a second call
 * finds the earlier payment and pays nothing. The caller decides who the player is; this module trusts it.
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import { markCoins } from '@/lib/economy/coin-marks'
import { WA_QUEST_SOURCE } from './quest-table'

type Db = PrismaClient | Prisma.TransactionClient

export type PayoutResult = { paid: true; amount: number } | { paid: false; already: true } 

export async function payQuestBounty(
  db: PrismaClient,
  input: { playerId: string; questId: string; title: string; amount: number },
): Promise<PayoutResult> {
  return db.$transaction(async (tx: Db) => {
    // One payment at a time per player and quest, so two tabs finishing together cannot both pay.
    await (tx as Prisma.TransactionClient).$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${WA_QUEST_SOURCE}:${input.questId}:${input.playerId}`}))`
    const done = await tx.vibulonEvent.findFirst({
      where: { playerId: input.playerId, source: WA_QUEST_SOURCE, questId: input.questId },
      select: { id: true },
    })
    if (done) return { paid: false as const, already: true as const }
    for (let i = 0; i < input.amount; i++) {
      const coin = await tx.vibulon.create({
        data: {
          ownerId: input.playerId,
          creatorId: input.playerId,
          originSource: WA_QUEST_SOURCE,
          originId: input.questId,
          originTitle: input.title.slice(0, 200),
        },
        select: { id: true, originSource: true, originId: true, originTitle: true, energy: true },
      })
      await markCoins(tx, [coin], 'minted', { playerId: input.playerId, place: 'wa-dojo' })
    }
    await tx.vibulonEvent.create({
      data: {
        playerId: input.playerId,
        source: WA_QUEST_SOURCE,
        amount: input.amount,
        notes: `Quest finished: ${input.title.slice(0, 120)}`,
        questId: input.questId,
      },
    })
    return { paid: true as const, amount: input.amount }
  })
}
