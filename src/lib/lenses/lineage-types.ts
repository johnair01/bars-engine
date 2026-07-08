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
