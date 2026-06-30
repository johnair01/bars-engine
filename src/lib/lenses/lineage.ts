import { db } from '@/lib/db'

export type LensGoalTraceSource = 'live' | 'attach_snapshot' | 'plant_snapshot'

export type LensGoalTraceNode = {
  id: string
  title: string
  domain: string
  cadence: string
  status: string
}

export type LensGoalTrace = {
  source: LensGoalTraceSource
  capturedAt: string
  goal: LensGoalTraceNode
  parentChain: LensGoalTraceNode[]
}

type GoalRow = LensGoalTraceNode & {
  parentGoalId: string | null
}

export function isLensGoalTrace(value: unknown): value is LensGoalTrace {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'source' in value &&
      'capturedAt' in value &&
      'goal' in value &&
      'parentChain' in value,
  )
}

async function loadGoalChain(goalId: string, playerId: string): Promise<GoalRow[] | null> {
  const chain: GoalRow[] = []
  let currentId: string | null = goalId
  const seen = new Set<string>()

  while (currentId) {
    if (seen.has(currentId)) return null
    seen.add(currentId)

    const goal: GoalRow | null = await db.lensGoal.findFirst({
      where: { id: currentId, playerId },
      select: {
        id: true,
        title: true,
        domain: true,
        cadence: true,
        status: true,
        parentGoalId: true,
      },
    })

    if (!goal) return null
    chain.push(goal)
    currentId = goal.parentGoalId
  }

  return chain
}

export async function buildLensGoalSnapshot(
  goalId: string,
  playerId: string,
  source: Exclude<LensGoalTraceSource, 'live'>,
): Promise<LensGoalTrace | null> {
  const chain = await loadGoalChain(goalId, playerId)
  if (!chain?.length) return null
  const [goal, ...parents] = chain

  return {
    source,
    capturedAt: new Date().toISOString(),
    goal: {
      id: goal.id,
      title: goal.title,
      domain: goal.domain,
      cadence: goal.cadence,
      status: goal.status,
    },
    parentChain: parents.map((parent) => ({
      id: parent.id,
      title: parent.title,
      domain: parent.domain,
      cadence: parent.cadence,
      status: parent.status,
    })),
  }
}

export async function resolveLensGoalTrace(input: {
  playerId: string
  lensGoalId?: string | null
  attachSnapshot?: unknown
  plantSnapshot?: unknown
}): Promise<LensGoalTrace | null> {
  if (input.lensGoalId) {
    const live = await buildLensGoalSnapshot(input.lensGoalId, input.playerId, 'attach_snapshot')
    if (live) return { ...live, source: 'live', capturedAt: new Date().toISOString() }
  }

  if (isLensGoalTrace(input.plantSnapshot)) return input.plantSnapshot
  if (isLensGoalTrace(input.attachSnapshot)) return input.attachSnapshot
  return null
}
