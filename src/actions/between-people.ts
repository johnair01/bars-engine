'use server'

/**
 * npc-from-321, Madi's demo: the player page /between/people. Her raised 3-2-1 parts (a spirit until the need is met,
 * then a person), each part's quest tied to one of her goals, and "News from outside" that lets her outer life steer
 * the game: a win can count as a spirit's life step, a setback becomes a charge she takes into a 3-2-1.
 * Every read and write here is the signed-in player's own; the need in her words is never shown to anyone else.
 */
import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { readPart, withPart } from '@/lib/npc-from-321/part-quest'
import { checkNews, needFromSnapshot, partStage, setbackChargeTitle, winCountsForPart, type NewsInput } from '@/lib/npc-from-321/outer-news'

const PAGE = '/between/people'

export type PersonCard = {
  daemonId: string
  name: string
  partName: string
  need: string
  stage: 'spirit' | 'person'
  questId: string | null
  lensGoalId: string | null
  steps: { life: boolean; land: boolean }
  met: { whatWasDone: string; at: string } | null
}
export type GoalChip = { id: string; title: string; cadence: string }
export type NewsLine = { id: string; kind: 'win' | 'setback'; line: string; lensGoalId: string | null; countedFor: string | null; chargeBarId: string | null; at: string }

function parseInputs(raw: string | null | undefined): Record<string, unknown> {
  try {
    const v = JSON.parse(raw ?? '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/** Everything the page shows, for the signed-in player only. Works with no parts and no goals. */
export async function getMyPeople(): Promise<{ people: PersonCard[]; goals: GoalChip[]; news: NewsLine[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const [daemons, goals, newsBars] = await Promise.all([
    db.daemon.findMany({
      where: { playerId: player.id, source: '321_raised' },
      orderBy: { discoveredAt: 'desc' },
      select: { id: true, name: true, promotedToPlayerId: true, innerWorkDigest: true, shadow321Session: { select: { phase2Snapshot: true, finalShadowName: true } } },
    }),
    db.lensGoal.findMany({
      where: { playerId: player.id, status: 'active' },
      orderBy: [{ keepOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, title: true, cadence: true },
    }),
    db.customBar.findMany({
      where: { creatorId: player.id, type: 'outer_news' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, title: true, lensGoalId: true, inputs: true, createdAt: true },
    }),
  ])

  const questIds = daemons.map((d) => readPart(d.innerWorkDigest).questId).filter((x): x is string => !!x)
  const quests = questIds.length
    ? await db.customBar.findMany({ where: { id: { in: questIds }, creatorId: player.id }, select: { id: true, lensGoalId: true } })
    : []
  const goalOfQuest = new Map(quests.map((q) => [q.id, q.lensGoalId]))

  const people: PersonCard[] = daemons.map((d) => {
    const part = readPart(d.innerWorkDigest)
    const digest = (d.innerWorkDigest ?? {}) as { finalShadowName?: string }
    return {
      daemonId: d.id,
      name: d.name,
      partName: digest.finalShadowName ?? d.shadow321Session?.finalShadowName ?? d.name,
      need: needFromSnapshot(d.shadow321Session?.phase2Snapshot),
      stage: partStage(part, d.promotedToPlayerId),
      questId: part.questId ?? null,
      lensGoalId: part.questId ? goalOfQuest.get(part.questId) ?? null : null,
      steps: { life: part.steps.life === true, land: part.steps.land === true },
      met: part.met ? { whatWasDone: part.met.whatWasDone, at: part.met.at } : null,
    }
  })

  const news: NewsLine[] = newsBars.map((b) => {
    const inp = parseInputs(b.inputs)
    return {
      id: b.id,
      kind: inp.kind === 'setback' ? 'setback' : 'win',
      line: b.title,
      lensGoalId: b.lensGoalId,
      countedFor: typeof inp.countedFor === 'string' ? inp.countedFor : null,
      chargeBarId: typeof inp.chargeBarId === 'string' ? inp.chargeBarId : null,
      at: b.createdAt.toISOString(),
    }
  })

  return { people, goals, news }
}

async function ownGoal(playerId: string, lensGoalId: string) {
  const goal = await db.lensGoal.findUnique({ where: { id: lensGoalId }, select: { id: true, playerId: true, status: true } })
  return goal && goal.playerId === playerId && goal.status === 'active' ? goal : null
}

/** Tie a part's quest to one of her active goals (or untie it with null). The quest must already be taken. */
export async function tiePartQuestToGoal(daemonId: string, lensGoalId: string | null): Promise<{ ok?: true; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  const daemon = await db.daemon.findUnique({ where: { id: daemonId }, select: { playerId: true, source: true, innerWorkDigest: true } })
  if (!daemon || daemon.source !== '321_raised' || daemon.playerId !== player.id) return { error: 'Part not found' }
  const questId = readPart(daemon.innerWorkDigest).questId
  if (!questId) return { error: 'Take the quest first' }
  if (lensGoalId && !(await ownGoal(player.id, lensGoalId))) return { error: 'Goal not found' }
  await db.customBar.update({ where: { id: questId }, data: { lensGoalId } })
  revalidatePath(PAGE)
  return { ok: true }
}

/**
 * One line from her outer life. A win is recorded, and when she names a spirit whose quest serves the same goal it
 * counts as that spirit's life step. A setback is recorded and saved as a charge; the answer carries the 3-2-1 link.
 */
export async function recordOuterNews(input: NewsInput): Promise<{ newsId?: string; countedFor?: string; redirectUrl?: string; error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  const checked = checkNews(input)
  if ('error' in checked) return { error: checked.error }
  const lensGoalId = input.lensGoalId || null
  if (lensGoalId && !(await ownGoal(player.id, lensGoalId))) return { error: 'Goal not found' }

  let countedFor: string | undefined
  if (checked.kind === 'win' && input.daemonId) {
    const daemon = await db.daemon.findUnique({ where: { id: input.daemonId }, select: { id: true, playerId: true, source: true, name: true, innerWorkDigest: true } })
    if (!daemon || daemon.source !== '321_raised' || daemon.playerId !== player.id) return { error: 'Part not found' }
    const part = readPart(daemon.innerWorkDigest)
    const quest = part.questId ? await db.customBar.findUnique({ where: { id: part.questId }, select: { lensGoalId: true } }) : null
    if (!winCountsForPart(part, quest?.lensGoalId, lensGoalId)) return { error: `This win does not count for ${daemon.name}: their quest serves another goal, or the step is done` }
    await db.daemon.update({
      where: { id: daemon.id },
      data: { innerWorkDigest: withPart(daemon.innerWorkDigest, { ...part, steps: { ...part.steps, life: true } }) as Prisma.InputJsonValue },
    })
    countedFor = daemon.name
  }

  let chargeBarId: string | undefined
  if (checked.kind === 'setback') {
    // Written straight, not through createChargeBar: news from outside is not the once-a-day charge, so a setback is
    // never turned away because she already captured today.
    const charge = await db.customBar.create({
      data: {
        creatorId: player.id,
        title: setbackChargeTitle(checked.line),
        description: checked.line,
        type: 'charge_capture',
        reward: 0,
        inputs: JSON.stringify({ source: 'outer_news', kind: 'setback', sceneType: 'transcend', personal_move: 'cleanUp' }),
        visibility: 'private',
        status: 'active',
        moveType: 'cleanUp',
        lensGoalId,
      },
    })
    chargeBarId = charge.id
  }

  const news = await db.customBar.create({
    data: {
      creatorId: player.id,
      title: checked.line,
      description: checked.line,
      type: 'outer_news',
      reward: 0,
      inputs: JSON.stringify({ kind: checked.kind, countedFor: countedFor ?? null, chargeBarId: chargeBarId ?? null }),
      visibility: 'private',
      status: 'completed',
      lensGoalId,
    },
  })
  revalidatePath(PAGE)
  return {
    newsId: news.id,
    countedFor,
    redirectUrl: chargeBarId ? `/shadow/321?chargeBarId=${chargeBarId}&personalMove=cleanUp&returnTo=${encodeURIComponent(PAGE)}` : undefined,
  }
}
